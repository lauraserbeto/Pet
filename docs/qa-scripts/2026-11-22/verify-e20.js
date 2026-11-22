// Verificação real da E-20 (Vite + API local + PostgreSQL descartável).
const { chromium } = require('C:/PI - 2026/Pet/frontend/node_modules/@playwright/test');
const fs = require('node:fs'); const path = require('node:path');
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'ux-accounts.json'), 'utf8'));
const OUT = 'C:/PI - 2026/Pet/docs/Sprints/Sprint-5-Fechamento/evidencias-e20'; fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5173', API = 'http://localhost:3000/api/v1';
const results = [];
const rec = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(ok ? 'OK  ' : 'FALHA', name, '-', detail); };
const mask = (page) => page.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (/@petplus\.test/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/[^\s@]+@petplus\.test/g, '••••@••••'); document.querySelectorAll('input').forEach(i => { if (/@petplus\.test/.test(i.value)) i.value = '••••@••••'; }); });
const tutor = fx.accounts.tutor;
const call = async (method, url, body) => {
  const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tutor.token, 'x-forwarded-for': '10.77.20.' + Math.floor(Math.random() * 200 + 1) }, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await r.json(); } catch {}
  return { status: r.status, body: json };
};

(async () => {
  const b = await chromium.launch();

  // ---------- Contato (anônimo) ----------
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'pt-BR' });
    const page = await ctx.newPage();
    // Captura o destino mailto: sem abrir aplicativo externo.
    const cdp = await ctx.newCDPSession(page);
    let mailto = null;
    await cdp.send('Page.enable');
    cdp.on('Page.frameRequestedNavigation', e => { if (e.url.startsWith('mailto:')) mailto = e.url; });
    await page.goto(BASE + '/contact'); await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Abrir e-mail com a mensagem/ }).click();
    await page.waitForTimeout(600);
    const errToast = await page.getByText('Preencha todos os campos obrigatórios.').count();
    rec('contato-vazio-nao-abre', errToast > 0 && mailto === null, `toastErro=${errToast} mailto=${mailto}`);

    await page.getByLabel(/Nome completo/).fill('Tutora Teste');
    await page.getByLabel(/E-mail \*/).fill('tutora@petplus.test');
    await page.getByLabel(/Assunto/).click();
    await page.getByRole('option', { name: 'Sugestão' }).click();
    await page.getByLabel(/Mensagem/).fill('Dúvida sobre reserva de hospedagem');
    await mask(page);
    await page.screenshot({ path: path.join(OUT, 'contato-preenchido.png') });
    // restaura o e-mail mascarado no campo controlado
    await page.getByLabel(/E-mail \*/).fill('tutora@petplus.test');
    await page.getByRole('button', { name: /Abrir e-mail com a mensagem/ }).click();
    await page.waitForTimeout(1500);
    const decoded = mailto ? decodeURIComponent(mailto) : '';
    rec('contato-mailto-montado', decoded.startsWith('mailto:contato@petplus.com.br?') && decoded.includes('[Pet+] Sugestão') && decoded.includes('Dúvida sobre reserva'), mailto ? 'assunto e corpo presentes' : 'sem navegação mailto');
    const ready = await page.getByText('Sua mensagem está pronta').count();
    const fake = await page.getByText(/Mensagem enviada/).count();
    rec('contato-sem-falso-sucesso', ready > 0 && fake === 0 && page.url().endsWith('/contact'), `pronta=${ready} "enviada"=${fake}`);
    await page.screenshot({ path: path.join(OUT, 'contato-mensagem-pronta.png') });
    await page.getByRole('button', { name: 'Escrever outra mensagem' }).click();
    await page.waitForTimeout(800);
    rec('contato-escrever-outra', await page.getByRole('button', { name: /Abrir e-mail com a mensagem/ }).count() > 0, 'formulário de volta');
    await ctx.close();
  }

  // ---------- Limpar carrinho (tutor) ----------
  {
    const prods = (await (await fetch(API + '/products?limit=5')).json());
    const list = Array.isArray(prods) ? prods : prods.data || [];
    const prod = list.find(p => p.stock_quantity > 0);
    const add = await call('POST', '/cart/items', { product_id: prod.id, quantity: 1 });
    rec('fixture-carrinho', add.status < 300, `POST /cart/items → ${add.status}`);

    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'pt-BR' });
    await ctx.route('http://localhost:3000/**', r => r.fallback({ headers: { ...r.request().headers(), 'x-forwarded-for': '10.77.21.1' } }));
    await ctx.addInitScript(([t, u]) => { localStorage.setItem('petplus_token', t); localStorage.setItem('petplus_user', u); }, [tutor.token, JSON.stringify(tutor.user)]);
    const page = await ctx.newPage();
    await page.goto(BASE + '/cart'); await page.waitForTimeout(2500);

    // Falha simulada da API: não pode anunciar sucesso.
    let failOnce = true;
    await page.route('http://localhost:3000/api/v1/cart', r => {
      if (r.request().method() === 'DELETE' && failOnce) { failOnce = false; return r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Falha simulada ao limpar' }) }); }
      return r.fallback();
    });
    await page.getByRole('button', { name: /Limpar carrinho/ }).click();
    await page.waitForTimeout(1200);
    const okToast1 = await page.getByText('Carrinho limpo').count();
    const errToast1 = await page.getByText(/Falha simulada ao limpar|Erro ao limpar carrinho/).count();
    rec('carrinho-falha-sem-sucesso', okToast1 === 0 && errToast1 > 0, `sucesso=${okToast1} erro=${errToast1}`);
    await mask(page);
    await page.screenshot({ path: path.join(OUT, 'carrinho-falha.png') });

    await page.waitForTimeout(4500); // toasts somem
    await page.getByRole('button', { name: /Limpar carrinho/ }).click();
    await page.waitForTimeout(1500);
    const okToast2 = await page.getByText('Carrinho limpo').count();
    const after = await call('GET', '/cart');
    rec('carrinho-sucesso-apos-2xx', okToast2 > 0 && (after.body?.items?.length ?? -1) === 0, `sucesso=${okToast2} itensNaAPI=${after.body?.items?.length}`);
    await mask(page);
    await page.screenshot({ path: path.join(OUT, 'carrinho-limpo.png') });
    await ctx.close();
  }

  await b.close();
  fs.writeFileSync(path.join(OUT, 'resultado.json'), JSON.stringify({ data: '2026-11-22', resultados: results }, null, 2));
  console.log(`\n${results.filter(r => r.ok).length}/${results.length} OK`);
})().catch(e => { console.error(e); process.exit(1); });
