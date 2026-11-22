// Auditoria visual: captura + checagens automáticas. Só leitura de telas (sem submeter formulários).
const F = 'C:/PI - 2026/Pet/frontend/node_modules/';
const { chromium } = require(F + '@playwright/test');
const { default: AxeBuilder } = require(F + '@axe-core/playwright');
const fs = require('node:fs');
const path = require('node:path');
const SP = __dirname;
const OUT = path.join(SP, 'ux');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5173';
const fx = JSON.parse(fs.readFileSync(path.join(SP, 'ux-accounts.json'), 'utf8'));
const A = fx.accounts, I = fx.ids;
const VP = { desk: { width: 1440, height: 900 }, mob: { width: 390, height: 844 } };

const pages = [];
const add = (who, route, extra = {}) => pages.push({ who, route, ...extra });
// Públicas (anônimo)
for (const r of ['/', '/hotels', `/hotels/${I.hotel}`, '/walkers', `/walkers/${I.sitter}`, '/search', '/products', '/shopping', `/shopping/${I.product}`, `/store/${I.store}`, '/cart', '/about', '/partners', '/terms', '/privacy', '/contact', '/login', '/register', '/recuperar-senha', '/redefinir-senha', '/rota-inexistente', '/appointments'])
  add('anon', r);
// Tutor
for (const r of ['/', '/cart', '/checkout', '/tutor/perfil', '/tutor/pets', '/tutor/agendamentos', '/tutor/pedidos', `/tutor/agendar/${I.hotel}`, '/dashboard'])
  add('tutor', r);
// Admin
for (const r of ['/dashboard', '/dashboard/aprovacoes', '/dashboard/usuarios', '/dashboard/avaliacoes-sitters', '/dashboard/perfil', '/dashboard/conta', '/dashboard/settings', '/dashboard/financeiro'])
  add('admin', r);
// Parceiros
for (const r of ['/dashboard', '/dashboard/orders', '/dashboard/products', '/dashboard/customers', '/dashboard/financeiro', '/dashboard/perfil', '/dashboard/conta', '/dashboard/settings'])
  add('store', r);
for (const r of ['/dashboard', '/dashboard/orders', '/dashboard/products'])
  add('empty', r);
for (const who of ['hotel', 'sitter'])
  for (const r of ['/dashboard', '/dashboard/schedule', '/dashboard/servicos', '/dashboard/financeiro', '/dashboard/customers', '/dashboard/perfil', '/dashboard/conta', '/dashboard/settings'])
    add(who, r);
add('sitter', '/onboarding/sitter');
add('rejected', '/parceiro/corrigir-cadastro');
add('rejected', '/dashboard');
add('pending', '/dashboard');
// Estados especiais
add('anon', '/hotels', { mode: 'loading', tag: 'loading' });
add('anon', '/hotels', { mode: 'apierror', tag: 'erro-api' });
add('store', '/dashboard', { mode: 'loading', tag: 'loading' });
add('store', '/dashboard/products', { mode: 'apierror', tag: 'erro-api' });
add('anon', '/', { mode: 'menu', tag: 'menu', only: 'mob' });
add('store', '/dashboard', { mode: 'menu', tag: 'menu', only: 'mob' });
add('tutor', '/', { mode: 'menu', tag: 'menu', only: 'mob' });

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const slug = s => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'home';

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const p of pages) for (const [vk, vp] of Object.entries(VP)) {
    if (p.only && p.only !== vk) continue;
    const id = `${p.who}__${slug(p.route)}${p.tag ? '__' + p.tag : ''}__${vk}`;
    if (only && !only.test(id)) continue;
    const SH = process.env.SHARD ? process.env.SHARD.split('/').map(Number) : null;
    globalThis.__n = (globalThis.__n || 0) + 1;
    if (SH && (globalThis.__n % SH[1]) !== SH[0]) continue;
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: vk === 'mob', hasTouch: vk === 'mob', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    const fakeIp = `10.${results.length % 250}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
    await ctx.route('http://localhost:3000/**', r => r.fallback({ headers: { ...r.request().headers(), 'x-forwarded-for': fakeIp } }));
    const acc = A[p.who];
    if (acc) await ctx.addInitScript(([t, u]) => { localStorage.setItem('petplus_token', t); localStorage.setItem('petplus_user', u); }, [acc.token, JSON.stringify(acc.user)]);
    const page = await ctx.newPage();
    const consoleErr = [], badReq = [];
    page.on('console', m => { if (m.type() === 'error' && !/WebSocket|vite/i.test(m.text())) consoleErr.push(m.text().slice(0, 300)); });
    page.on('pageerror', e => consoleErr.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('response', r => { if (r.status() >= 400 && /\/api\//.test(r.url())) badReq.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`); });
    if (p.mode === 'loading') await page.route('**/api/v1/**', async r => { await new Promise(s => setTimeout(s, 15000)); r.continue().catch(() => {}); });
    if (p.mode === 'apierror') await page.route('**/api/v1/**', r => { const u = r.request().url(); if (/auth|users\/me|legal/.test(u)) return r.continue(); return r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Erro simulado"}' }); });
    const rec = { id, who: p.who, route: p.route, vp: vk, tag: p.tag || null };
    try {
      await page.goto(BASE + p.route, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (p.mode === 'loading') await page.waitForTimeout(1500);
      else { await page.waitForTimeout(2200); await page.waitForFunction(() => !/Carregando/i.test(document.body.innerText), null, { timeout: 6000 }).catch(() => {}); await page.waitForTimeout(500); }
      if (p.mode === 'menu') {
        const btn = page.locator('button[aria-label="Abrir menu"]:visible, button:has(svg.lucide-menu):visible').first();
        if (await btn.count()) { await btn.click(); await page.waitForTimeout(600); rec.menuOpened = true; } else rec.menuOpened = false;
      }
      rec.finalUrl = page.url().replace(BASE, '');
      rec.title = await page.title();
      rec.h1 = await page.locator('h1').allInnerTexts().catch(() => []);
      // Métricas de layout
      rec.layout = await page.evaluate(() => {
        const vw = window.innerWidth;
        const de = document.documentElement;
        const over = [];
        const cssPath = el => { const parts = []; let e = el; for (let i = 0; e && e.nodeType === 1 && i < 4; i++, e = e.parentElement) { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; else if (e.classList.length) s += '.' + [...e.classList].slice(0, 2).join('.'); parts.unshift(s); } return parts.join(' > '); };
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.width && r.right > vw + 2 && getComputedStyle(el).position !== 'fixed') {
            let clipped = false; for (let a = el.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') { if (a.getBoundingClientRect().right <= vw + 2) { clipped = true; break; } } }
            if (!clipped) over.push({ sel: cssPath(el), right: Math.round(r.right), x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), text: (el.innerText || '').trim().slice(0, 60) });
          }
        }
        const inter = [...document.querySelectorAll('a[href],button,input,select,textarea,[role=button],[tabindex]:not([tabindex="-1"])')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
        const small = inter.filter(e => { const r = e.getBoundingClientRect(); return (r.width < 24 || r.height < 24) && e.tagName !== 'INPUT' || false; }).map(e => { const r = e.getBoundingClientRect(); return { sel: cssPath(e), txt: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 40), x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; });
        const btns = {};
        for (const b of document.querySelectorAll('button, a[class*="rounded"][class*="px-"]')) { const r = b.getBoundingClientRect(); if (!r.width) continue; const cs = getComputedStyle(b); const k = `${cs.backgroundColor}|${cs.color}|r${cs.borderRadius}|h${Math.round(r.height)}|${cs.fontWeight}|${cs.fontSize}`; btns[k] = btns[k] || { n: 0, ex: (b.innerText || b.getAttribute('aria-label') || '').trim().slice(0, 30) }; btns[k].n++; }
        const fonts = {}; for (const h of document.querySelectorAll('h1,h2,h3')) { const cs = getComputedStyle(h); const k = `${h.tagName}|${cs.fontFamily.split(',')[0]}|${cs.fontSize}|${cs.fontWeight}|${cs.color}`; fonts[k] = (fonts[k] || 0) + 1; }
        return { vw, scrollW: de.scrollWidth, docH: de.scrollHeight, hOverflow: de.scrollWidth > vw + 1, over: over.slice(0, 12), overCount: over.length, small: small.slice(0, 15), smallCount: small.length, btns, fonts };
      });
      // Foco visível: percorre os 20 primeiros tabs
      if (!p.mode) {
        rec.focus = [];
        await page.locator('body').click({ position: { x: 1, y: 1 } }).catch(() => {});
        for (let i = 0; i < 14; i++) {
          await page.keyboard.press('Tab');
          const f = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none'); return { tag: e.tagName, txt: (e.innerText || e.getAttribute('aria-label') || e.getAttribute('placeholder') || '').trim().slice(0, 40), ring, outline: cs.outlineStyle + ' ' + cs.outlineWidth, shadow: cs.boxShadow.slice(0, 40), x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), inView: r.bottom > 0 && r.top < innerHeight }; });
          if (f) rec.focus.push(f);
        }
        await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });
        await page.waitForTimeout(200);
        try {
          const ax = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
          rec.axe = await Promise.all(ax.violations.map(async v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, nodes: await Promise.all(v.nodes.slice(0, 6).map(async nd => { const sel = nd.target.join(' '); let box = null; try { box = await page.locator(sel).first().boundingBox(); if (box) box.y += await page.evaluate(() => scrollY); } catch {} return { sel, box: box && { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) }, summary: (nd.failureSummary || '').split('\n').slice(0, 2).join(' ').slice(0, 200) }; })) })));
        } catch (e) { rec.axeErr = e.message; }
      }
      await page.screenshot({ path: path.join(OUT, id + '.png'), fullPage: p.mode !== 'menu', timeout: 20000 }).catch(async () => page.screenshot({ path: path.join(OUT, id + '.png') }));
    } catch (e) { rec.error = e.message.slice(0, 300); }
    rec.consoleErr = consoleErr.slice(0, 8); rec.badReq = [...new Set(badReq)].slice(0, 10);
    results.push(rec);
    console.log(id, rec.finalUrl, rec.layout ? `hOv=${rec.layout.hOverflow} over=${rec.layout.overCount} small=${rec.layout.smallCount}` : '', (rec.axe || []).map(a => a.id + ':' + a.n).join(','), rec.error || '', rec.badReq.join(' | '));
    await ctx.close();
  }
  const file = path.join(SP, only ? 'ux-results-partial.json' : `ux-results-${(process.env.SHARD || 'all').replace('/', 'of')}.json`);
  fs.writeFileSync(file, JSON.stringify(results, null, 1));
  await browser.close();
})();
