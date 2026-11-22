// Verificação real da E-11 (API + PostgreSQL descartável de desenvolvimento).
const { chromium } = require('C:/PI - 2026/Pet/frontend/node_modules/@playwright/test');
const fs = require('node:fs'); const path = require('node:path');
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'ux-accounts.json'), 'utf8'));
const OUT = 'C:/PI - 2026/Pet/docs/Sprints/Sprint-5-Fechamento/evidencias-e11'; fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5173', API = 'http://localhost:3000/api/v1';
const results = [];
const rec = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(ok ? 'OK  ' : 'FALHA', name, '-', detail); };
let ipN = 1;
const call = async (who, method, url, body) => {
  const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + fx.accounts[who].token, 'x-forwarded-for': `10.77.1.${ipN++}` }, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await r.json(); } catch {}
  return { status: r.status, body: json };
};
(async () => {
  // Parceiros do fixture: "pending" (Hotel PENDENTE) e "Sitter Em Revisão QA" (EM_REVISAO, avaliação PENDING).
  const list = await call('admin', 'GET', '/providers');
  const providers = Array.isArray(list.body) ? list.body : list.body?.data || [];
  const hotelPend = providers.find(p => p.business_name === 'Hotel Pendente QA');
  const sitterRev = providers.find(p => p.business_name === 'Sitter Em Revisão QA');
  rec('fixture-parceiros', !!hotelPend && !!sitterRev, `hotel=${hotelPend?.status} sitter=${sitterRev?.status}`);

  // Interface antes das mudanças de estado
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-BR' });
  await ctx.route('http://localhost:3000/**', r => r.fallback({ headers: { ...r.request().headers(), 'x-forwarded-for': '10.77.2.1' } }));
  await ctx.addInitScript(([t, u]) => { localStorage.setItem('petplus_token', t); localStorage.setItem('petplus_user', u); }, [fx.accounts.admin.token, JSON.stringify(fx.accounts.admin.user)]);
  const page = await ctx.newPage();
  await page.goto(BASE + '/dashboard/aprovacoes'); await page.waitForTimeout(3000);
  const badge = await page.getByText('Reenviado após correção').count();
  const link = await page.getByRole('link', { name: 'Avaliar candidatura' }).count();
  rec('ui-aprovacoes-reenvio-e-sitter', badge > 0 && link > 0, `selo=${badge} atalhoSitter=${link}`);
  await page.getByRole('row', { name: /Hotel Pendente QA/ }).getByRole('button', { name: /Recusar/ }).click();
  const confirm = page.getByRole('button', { name: 'Confirmar Ação' });
  const disabledEmpty = await confirm.isDisabled();
  await page.getByLabel('Motivo da recusa (obrigatório)').fill('   ');
  const disabledBlank = await confirm.isDisabled();
  rec('ui-recusa-exige-motivo', disabledEmpty && disabledBlank, `vazio=${disabledEmpty} espaços=${disabledBlank}`);
  await page.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (/@/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/[^\s@]+@[^\s@]+/g, '••••@••••'); });
  await page.screenshot({ path: path.join(OUT, 'aprovacoes-motivo-obrigatorio.png') });
  await page.getByRole('button', { name: 'Cancelar' }).click();

  // API: transições do parceiro
  rec('api-sitter-sem-avaliacao-bloqueado', (await call('admin', 'PATCH', `/providers/${sitterRev.id}/status`, { status: 'APROVADO' })).body?.error?.code === 'SITTER_APPROVAL_REQUIRES_EVALUATION', 'PATCH APROVADO em sitter com avaliação pendente');
  const ok1 = await call('admin', 'PATCH', `/providers/${hotelPend.id}/status`, { status: 'APROVADO' });
  const again = await call('admin', 'PATCH', `/providers/${hotelPend.id}/status`, { status: 'APROVADO' });
  const toRej = await call('admin', 'PATCH', `/providers/${hotelPend.id}/status`, { status: 'REJEITADO', rejection_reason: 'Teste' });
  rec('api-transicoes', ok1.status === 200 && again.status === 422 && toRej.status === 422 && toRej.body?.error?.code === 'INVALID_PROVIDER_TRANSITION', `aprovar=${ok1.status} repetir=${again.status} aprovado→recusado=${toRej.status}`);

  // Avaliação: revisão pela tela (aprovar) e revisão dupla pela API
  const pend = await call('admin', 'GET', '/users/admin/evaluations?status=PENDING');
  const evals = Array.isArray(pend.body) ? pend.body : pend.body?.data || [];
  const ev = evals[0];
  const noFb = await call('admin', 'PATCH', `/users/admin/evaluations/${ev.id}`, { status: 'REJECTED' });
  rec('api-recusa-avaliacao-exige-feedback', noFb.status === 422, `status=${noFb.status}`);
  await page.goto(BASE + '/dashboard/avaliacoes-sitters'); await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /Analisar/ }).first().click(); await page.waitForTimeout(600);
  await page.getByRole('button', { name: /Aprovar Candidato/ }).click(); await page.waitForTimeout(1500);
  const second = await call('admin', 'PATCH', `/users/admin/evaluations/${ev.id}`, { status: 'REJECTED', feedback: 'Tarde demais' });
  rec('ui-aprovar-e-revisao-dupla-409', second.status === 409 && second.body?.error?.code === 'EVALUATION_ALREADY_REVIEWED', `segunda revisão=${second.status}`);
  const after = await call('admin', 'GET', '/providers');
  const sitterAfter = (Array.isArray(after.body) ? after.body : after.body?.data || []).find(p => p.id === sitterRev.id);
  rec('coerencia-provider-aprovado', sitterAfter?.status === 'APROVADO', `provider=${sitterAfter?.status}`);

  // Candidatura única: sitter já aprovado tenta reenviar
  const dup = await call('sitter', 'POST', '/users/me/evaluations', { experience_details: 'Nova tentativa', environment_photos: [], quiz_answers: {} });
  rec('api-candidatura-unica', dup.status === 409 && dup.body?.error?.code === 'EVALUATION_ALREADY_APPROVED', `status=${dup.status} code=${dup.body?.error?.code}`);

  await page.goto(BASE + '/dashboard/aprovacoes'); await page.waitForTimeout(2500);
  await page.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (/@/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/[^\s@]+@[^\s@]+/g, '••••@••••'); });
  await page.screenshot({ path: path.join(OUT, 'aprovacoes-apos-decisoes.png') });
  fs.writeFileSync(path.join(OUT, 'resultado.json'), JSON.stringify(results, null, 1));
  console.log(`\n${results.filter(r => r.ok).length}/${results.length} aprovados`);
  await b.close();
})().catch(e => { console.error('ERRO', e.message); process.exitCode = 1; });
