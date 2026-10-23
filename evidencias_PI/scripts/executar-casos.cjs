// Bônus da Fase 2 (Mini Projeto de Testes) — execução real dos casos CT-PI-01 a CT-PI-05
// contra o backend local do Pet+. Cada caso grava suas requisições em evidencias_PI/CT-PI-0X.log.
//
// Uso (backend e PostgreSQL locais já no ar):
//   BONUS_BACKEND_DIR=<pasta do backend do commit testado> DATABASE_URL=<banco local> \
//   node evidencias_PI/scripts/executar-casos.cjs
//
// Senhas são geradas a cada execução e ficam só em memória. Senhas, tokens e
// password_hash nunca são gravados nos logs.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BASE = process.env.BONUS_API_URL || 'http://localhost:3100/api/v1';
const BACKEND_DIR = process.env.BONUS_BACKEND_DIR;
const OUT_DIR = path.resolve(__dirname, '..');

if (!BACKEND_DIR) {
  console.error('Defina BONUS_BACKEND_DIR (pasta do backend do commit testado).');
  process.exit(1);
}

const bcrypt = require(path.join(BACKEND_DIR, 'node_modules', 'bcryptjs'));
const { PrismaClient } = require(path.join(BACKEND_DIR, 'node_modules', '@prisma', 'client'));

// ── Registro das evidências ────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set(['password', 'token', 'password_hash']);

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEYS.has(k) ? '<omitido>' : redact(v)])
    );
  }
  return value;
}

function timestamp() {
  const d = new Date();
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');
  return `${local} -03:00`;
}

class EvidenceLog {
  constructor(fileName, title) {
    this.file = path.join(OUT_DIR, fileName);
    fs.writeFileSync(
      this.file,
      `# ${title}\nInício: ${timestamp()}\nAPI: ${BASE}\n` +
        'Obs.: senhas, tokens e password_hash aparecem como <omitido>.\n\n'
    );
  }

  write(text) {
    fs.appendFileSync(this.file, `${text}\n`);
  }

  request({ at, method, url, actor, body, status, response }) {
    this.write(
      [
        `[${at}] ${method} ${url}`,
        `Autenticação: ${actor ? `Bearer <token omitido> (${actor})` : 'nenhuma'}`,
        `Corpo enviado: ${body === undefined ? '(sem corpo)' : JSON.stringify(redact(body))}`,
        `Status HTTP: ${status}`,
        `Corpo recebido: ${response === null || response === '' ? '(vazio)' : JSON.stringify(redact(response))}`,
        '---',
      ].join('\n')
    );
  }

  check(label, ok, detail) {
    this.write(`VERIFICAÇÃO ${ok ? '[OK]' : '[NÃO ATENDIDA]'} ${label}${detail ? ` — ${detail}` : ''}`);
    return ok;
  }
}

async function call(log, method, urlPath, { session, body } = {}) {
  const url = `${BASE}${urlPath}`;
  const at = timestamp();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* corpo não-JSON fica como texto */
  }
  log.request({ at, method, url, actor: session?.label, body, status: res.status, response: parsed });
  return { status: res.status, body: parsed };
}

const bodyText = (body) => JSON.stringify(body ?? '');
const randomPassword = () => `${crypto.randomBytes(12).toString('base64url')}A1`;

// ── Preparação: contas e dados de teste ────────────────────────────────────

async function login(log, label, email, password) {
  const res = await call(log, 'POST', '/auth/login', { body: { email, password } });
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Login de ${label} falhou (HTTP ${res.status})`);
  }
  return { label, token: res.body.token, user: res.body.user };
}

async function prepare() {
  const log = new EvidenceLog('00-preparacao-contas.log', 'Preparação — contas e dados de teste');
  const accounts = {
    admin: { email: 'bonus.admin@petplus.local', name: 'Admin Bônus Local' },
    tutorA: { email: 'bonus.tutor.a@petplus.local', name: 'Tutor A Bônus', role: 5 },
    tutorB: { email: 'bonus.tutor.b@petplus.local', name: 'Tutor B Bônus', role: 5 },
    tutorC: { email: 'bonus.tutor.c@petplus.local', name: 'Tutor C Bônus', role: 5 },
    lojista: {
      email: 'bonus.lojista@petplus.local', name: 'Lojista Bônus', role: 2,
      business_name: 'Loja Bônus Pet', document: '11222333000181', document_type: 'CNPJ',
    },
    hotel: {
      email: 'bonus.hotel@petplus.local', name: 'Hotel Bônus', role: 3,
      business_name: 'Hotel Bônus Pet', document: '11444777000161', document_type: 'CNPJ',
    },
  };
  for (const acc of Object.values(accounts)) acc.password = randomPassword();

  // O cadastro público não cria administrador e o seed só cria os papéis; o admin
  // é criado direto no banco local para aprovar parceiros pela rota oficial.
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.upsert({
      where: { email: accounts.admin.email },
      update: { password_hash: await bcrypt.hash(accounts.admin.password, 10), role_id: 1, is_active: true },
      create: {
        full_name: accounts.admin.name,
        email: accounts.admin.email,
        password_hash: await bcrypt.hash(accounts.admin.password, 10),
        role_id: 1,
        is_active: true,
      },
      select: { id: true, email: true, role_id: true },
    });
    log.write(`[${timestamp()}] Admin criado direto no banco local (Prisma): ${JSON.stringify(admin)}\n---`);
  } finally {
    await prisma.$disconnect();
  }

  for (const key of ['tutorA', 'tutorB', 'tutorC', 'lojista', 'hotel']) {
    const acc = accounts[key];
    const body = {
      full_name: acc.name, email: acc.email, password: acc.password, role_id: acc.role, terms_accepted: true,
      ...(acc.business_name
        ? { business_name: acc.business_name, document: acc.document, document_type: acc.document_type }
        : {}),
    };
    const res = await call(log, 'POST', '/auth/register', { body });
    if (![200, 201].includes(res.status)) throw new Error(`Cadastro de ${key} falhou (HTTP ${res.status})`);
  }

  const admin = await login(log, 'admin', accounts.admin.email, accounts.admin.password);
  const partners = await call(log, 'GET', '/providers', { session: admin });
  const providerOf = (businessName) => partners.body.find((p) => p.business_name === businessName);
  for (const key of ['lojista', 'hotel']) {
    const provider = providerOf(accounts[key].business_name);
    accounts[key].providerId = provider.id;
    const res = await call(log, 'PATCH', `/providers/${provider.id}/status`, {
      session: admin, body: { status: 'APROVADO' },
    });
    if (res.status !== 200) throw new Error(`Aprovação de ${key} falhou (HTTP ${res.status})`);
  }

  const s = {};
  for (const key of ['lojista', 'hotel', 'tutorA', 'tutorB', 'tutorC']) {
    s[key] = await login(log, key, accounts[key].email, accounts[key].password);
  }

  const product = await call(log, 'POST', '/products', {
    session: s.lojista,
    body: { name: 'Ração Bônus 1kg', category: 'GERAL', pet_type: 'DOG', description: 'Produto de teste do bônus', stock_quantity: 10, price: 45.9 },
  });
  if (product.status !== 201) throw new Error(`Criação do produto falhou (HTTP ${product.status})`);

  const profile = await call(log, 'PUT', '/providers/profile', { session: s.hotel, body: { daily_rate: 120 } });
  if (profile.status !== 200) throw new Error(`Diária do hotel falhou (HTTP ${profile.status})`);
  const service = await call(log, 'POST', '/providers/services', {
    session: s.hotel, body: { name: 'Hospedagem Bônus', category: 'BOARDING', price: 120 },
  });
  if (service.status !== 201) throw new Error(`Criação do serviço falhou (HTTP ${service.status})`);

  const address = await call(log, 'POST', '/addresses', {
    session: s.tutorB,
    body: { cep: '01310-100', rua: 'Avenida Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' },
  });
  if (address.status !== 201) throw new Error(`Criação do endereço falhou (HTTP ${address.status})`);

  const pet = await call(log, 'POST', '/users/me/pets', {
    session: s.tutorC, body: { name: 'Rex Bônus', species: 'DOG', weight_kg: 12 },
  });
  if (pet.status !== 201) throw new Error(`Criação do pet do tutor C falhou (HTTP ${pet.status})`);

  log.write(`Fim da preparação: ${timestamp()}`);
  return {
    s,
    accounts: Object.fromEntries(
      Object.entries(accounts).map(([k, a]) => [k, { email: a.email, id: s[k]?.user?.id ?? null, providerId: a.providerId ?? null }])
    ),
    productId: product.body.product?.id ?? product.body.id,
    serviceId: service.body.service?.id ?? service.body.id,
    addressId: address.body.id,
    petCId: pet.body.id,
  };
}

// ── Casos ──────────────────────────────────────────────────────────────────

async function ctPi01({ s }) {
  const log = new EvidenceLog('CT-PI-01.log', 'CT-PI-01 — Valor limite do peso do pet (RNE-007) — tutor A');
  const r200 = await call(log, 'POST', '/users/me/pets', { session: s.tutorA, body: { name: 'Teste Borda 200', species: 'DOG', weight_kg: 200 } });
  const r20001 = await call(log, 'POST', '/users/me/pets', { session: s.tutorA, body: { name: 'Teste Borda 200', species: 'DOG', weight_kg: 200.01 } });
  const r0 = await call(log, 'POST', '/users/me/pets', { session: s.tutorA, body: { name: 'Teste Borda 200', species: 'DOG', weight_kg: 0 } });
  const list = await call(log, 'GET', '/users/me/pets', { session: s.tutorA });

  const checks = [
    log.check('200 kg aceito com 201', r200.status === 201, `obtido ${r200.status}`),
    log.check('200,01 kg recusado com 422 "Peso máximo 200 kg"', r20001.status === 422 && bodyText(r20001.body).includes('Peso máximo 200 kg'), `obtido ${r20001.status}`),
    log.check('0 kg recusado com 422 "Peso deve ser maior que zero"', r0.status === 422 && bodyText(r0.body).includes('Peso deve ser maior que zero'), `obtido ${r0.status}`),
    log.check('lista contém só o pet de 200 kg', Array.isArray(list.body) && list.body.length === 1 && Number(list.body[0].weight_kg) === 200, `itens na lista: ${Array.isArray(list.body) ? list.body.length : '?'}`),
  ];
  return { id: 'CT-PI-01', ok: checks.every(Boolean), petId: r200.body?.id };
}

async function ctPi02({ s }, petFromCt01) {
  const log = new EvidenceLog('CT-PI-02.log', 'CT-PI-02 — Limite de 10 pets por tutor (RNE-007) — tutor A');
  log.write('Pré-condição: remover o pet criado no CT-PI-01 para o tutor A ficar sem pets.\n');
  const del = await call(log, 'DELETE', `/users/me/pets/${petFromCt01}`, { session: s.tutorA });
  log.check('pré-condição: pet do CT-PI-01 removido (204)', del.status === 204, `obtido ${del.status}`);

  const statuses = [];
  for (let i = 1; i <= 10; i++) {
    const name = `Pet ${String(i).padStart(2, '0')}`;
    const res = await call(log, 'POST', '/users/me/pets', { session: s.tutorA, body: { name, species: 'CAT' } });
    statuses.push(res.status);
  }
  const r11 = await call(log, 'POST', '/users/me/pets', { session: s.tutorA, body: { name: 'Pet 11', species: 'CAT' } });
  const list = await call(log, 'GET', '/users/me/pets', { session: s.tutorA });

  const checks = [
    log.check('pets 01 a 10 aceitos com 201', statuses.every((st) => st === 201), `obtidos ${statuses.join(',')}`),
    log.check('11º recusado com 409 "Limite de 10 pets por tutor atingido"', r11.status === 409 && bodyText(r11.body).includes('Limite de 10 pets por tutor atingido'), `obtido ${r11.status}`),
    log.check('lista com exatamente 10 pets', Array.isArray(list.body) && list.body.length === 10, `itens na lista: ${Array.isArray(list.body) ? list.body.length : '?'}`),
  ];
  return { id: 'CT-PI-02', ok: checks.every(Boolean) };
}

async function ctPi03({ s, productId, addressId }) {
  const log = new EvidenceLog('CT-PI-03.log', 'CT-PI-03 — Pedido AGUARDANDO_PAGAMENTO não vai direto para ENVIADO (RNE-014) — tutor B + lojista');
  await call(log, 'POST', '/cart/items', { session: s.tutorB, body: { product_id: productId, quantity: 1 } });
  const created = await call(log, 'POST', '/orders', { session: s.tutorB, body: { address_id: addressId } });
  const order = created.body?.order ?? created.body?.orders?.[0];
  log.check('pedido criado em AGUARDANDO_PAGAMENTO', created.status === 201 && order?.status === 'AGUARDANDO_PAGAMENTO', `obtido HTTP ${created.status}, status ${order?.status}`);

  const patch = await call(log, 'PATCH', `/orders/${order.id}/status`, { session: s.lojista, body: { status: 'ENVIADO' } });
  const tutorOrders = await call(log, 'GET', '/orders', { session: s.tutorB });
  const received = await call(log, 'GET', '/orders/received', { session: s.lojista });
  const asTutor = (Array.isArray(tutorOrders.body) ? tutorOrders.body : tutorOrders.body?.data ?? []).find((o) => o.id === order.id);
  const asStore = (Array.isArray(received.body) ? received.body : received.body?.data ?? []).find((o) => o.id === order.id);

  const checks = [
    log.check('PATCH para ENVIADO recusado com 4xx e mensagem tratada', patch.status >= 400 && patch.status < 500 && Boolean(patch.body?.error?.message ?? patch.body?.message), `obtido ${patch.status}`),
    log.check('pedido continua AGUARDANDO_PAGAMENTO (visão do tutor)', asTutor?.status === 'AGUARDANDO_PAGAMENTO', `obtido ${asTutor?.status}`),
    log.check('pedido continua AGUARDANDO_PAGAMENTO (visão do lojista)', asStore?.status === 'AGUARDANDO_PAGAMENTO', `obtido ${asStore?.status}`),
  ];
  return { id: 'CT-PI-03', ok: checks.every(Boolean), orderId: order.id };
}

async function ctPi04({ s }, orderId) {
  const log = new EvidenceLog('CT-PI-04.log', 'CT-PI-04 — Único endereço com pedido em andamento não pode ser excluído (RNE-008/RNE-022) — tutor B');
  log.write(`Pré-condição: pedido ${orderId} do CT-PI-03 em AGUARDANDO_PAGAMENTO.\n`);
  const before = await call(log, 'GET', '/addresses', { session: s.tutorB });
  log.check('tutor B tem exatamente 1 endereço', Array.isArray(before.body) && before.body.length === 1, `itens: ${Array.isArray(before.body) ? before.body.length : '?'}`);
  const addressId = before.body?.[0]?.id;

  const del = await call(log, 'DELETE', `/addresses/${addressId}`, { session: s.tutorB });
  const after = await call(log, 'GET', '/addresses', { session: s.tutorB });
  const orders = await call(log, 'GET', '/orders', { session: s.tutorB });
  const order = (Array.isArray(orders.body) ? orders.body : orders.body?.data ?? []).find((o) => o.id === orderId);
  log.write(`Status do pedido no momento da exclusão: ${order?.status}`);

  const checks = [
    log.check('DELETE recusado com 409 "Não é possível excluir o único endereço enquanto houver pedidos em andamento"', del.status === 409 && bodyText(del.body).includes('Não é possível excluir o único endereço enquanto houver pedidos em andamento'), `obtido ${del.status}`),
    log.check('endereço mantido', Array.isArray(after.body) && after.body.some((a) => a.id === addressId), `itens após o DELETE: ${Array.isArray(after.body) ? after.body.length : '?'}`),
  ];
  return { id: 'CT-PI-04', ok: checks.every(Boolean) };
}

async function ctPi05({ s, serviceId, petCId }) {
  const log = new EvidenceLog('CT-PI-05.log', 'CT-PI-05 — Pet com agendamento futuro não pode ser removido (RNE-022) — tutor C + hotel');
  const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  start.setUTCHours(15, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const appt = await call(log, 'POST', '/appointments', {
    session: s.tutorC,
    body: { service_id: serviceId, pet_id: petCId, start_time: start.toISOString(), end_time: end.toISOString(), notes: 'Agendamento de teste do bônus' },
  });
  const apptBody = appt.body?.appointment ?? appt.body;
  log.write(`Status inicial do agendamento retornado pela API: ${apptBody?.status}`);

  const del = await call(log, 'DELETE', `/users/me/pets/${petCId}`, { session: s.tutorC });
  const pets = await call(log, 'GET', '/users/me/pets', { session: s.tutorC });
  const mine = await call(log, 'GET', '/appointments/my', { session: s.tutorC });
  const mineList = Array.isArray(mine.body) ? mine.body : mine.body?.data ?? mine.body?.appointments ?? [];

  const checks = [
    log.check('agendamento futuro criado', appt.status === 201, `obtido HTTP ${appt.status}, status ${apptBody?.status}`),
    log.check('DELETE recusado com 409 e mensagem da regra ("...agendamentos pendentes ou confirmados")', del.status === 409 && bodyText(del.body).includes('Não é possível remover este pet enquanto houver agendamentos pendentes ou confirmados'), `obtido ${del.status}`),
    log.check('pet mantido', Array.isArray(pets.body) && pets.body.some((p) => p.id === petCId), `itens: ${Array.isArray(pets.body) ? pets.body.length : '?'}`),
    log.check('agendamento mantido', mineList.some((a) => a.id === apptBody?.id), `agendamentos do tutor: ${mineList.length}`),
  ];
  return { id: 'CT-PI-05', ok: checks.every(Boolean) };
}

// ── Execução ───────────────────────────────────────────────────────────────

(async () => {
  const startedAt = timestamp();
  const ctx = await prepare();
  // CT-PI-04 reaproveita o pedido criado no CT-PI-03, por isso o 03 roda antes.
  const r03 = await ctPi03(ctx);
  const r04 = await ctPi04(ctx, r03.orderId);
  const r01 = await ctPi01(ctx);
  const r02 = await ctPi02(ctx, r01.petId);
  const r05 = await ctPi05(ctx);

  const summary = {
    inicio: startedAt,
    fim: timestamp(),
    api: BASE,
    contas: ctx.accounts,
    verificacoes_automaticas: Object.fromEntries([r01, r02, r03, r04, r05].map((r) => [r.id, r.ok ? 'todas atendidas' : 'há verificação não atendida'])),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'resumo-execucao.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
})().catch((err) => {
  console.error('Execução interrompida:', err.message);
  process.exit(1);
});
