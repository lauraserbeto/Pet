// Fixture de auditoria visual — SOMENTE banco local descartável (prepareTestDatabase recusa outros).
const B = 'C:/PI - 2026/Pet/backend';
const fs = require('node:fs');
const jwt = require(B + '/node_modules/jsonwebtoken');
const prisma = require(B + '/src/config/database');
const { prepareTestDatabase, disconnectTestDatabase } = require(B + '/tests/helpers/dbIntegration');
const S = require(B + '/tests/helpers/testSeed');

const H = 3600000;
async function main() {
  if (process.env.RUN_DB_INTEGRATION_TESTS !== 'true' || !process.argv[2]) throw Error('Exige banco local de teste e saída.');
  await prepareTestDatabase();
  try {
    await S.seedRoles();
    const { tutor } = await S.createAuthenticatedTutor({ full_name: 'Tutora Teste QA' });
    await S.createAddress(tutor.id).catch(() => null);
    const { tutor: adminUser } = await S.createAuthenticatedTutor({ full_name: 'Admin Teste QA' });
    const admin = await prisma.user.update({ where: { id: adminUser.id }, data: { role_id: 1 } });

    const store = await S.createStoreWithProduct({ name: 'Ração Premium Teste' }, { business_name: 'Loja Teste QA' });
    await S.createProduct(store.provider.id, { name: 'Coleira Ajustável Teste', category: 'ACESSORIOS', price: '29.90' }).catch(() => null);
    await S.createProduct(store.provider.id, { name: 'Brinquedo Mordedor Teste com nome bem longo para testar quebra', price: '15.00', stock_quantity: 0 }).catch(() => null);
    const empty = await S.createStoreWithProduct({}, { business_name: 'Loja Vazia QA' });
    for (const status of ['PAGO', 'PREPARANDO', 'ENVIADO', 'CONCLUIDO', 'AGUARDANDO_PAGAMENTO', 'CANCELADO'])
      await prisma.order.create({ data: { provider_id: store.provider.id, customer_id: tutor.id, status, total_price: '49.90', items: { create: { product_id: store.product.id, quantity: 1, unit_price: '49.90' } } } });

    const hotel = await S.createApprovedPartner({ role_id: 3, payment_policy: 'PRE_PAGO' });
    const sitter = await S.createApprovedPartner({ role_id: 4 });
    for (const p of [hotel, sitter]) {
      await prisma.provider.update({ where: { id: p.provider.id }, data: { description: 'Perfil fictício para auditoria visual.', city: 'São Paulo', state: 'SP' } }).catch(() => null);
    }
    const pet = await S.createPet(tutor.id, { name: 'Thor' });
    await S.createPet(tutor.id, { name: 'Mel' });
    const now = Date.now();
    const plan = [
      [hotel, 'BOARDING', 'Hospedagem Teste', 'PENDENTE', 26],
      [hotel, 'BOARDING', 'Hospedagem Teste', 'AGUARDANDO_CONFIRMACAO', 50],
      [hotel, 'BOARDING', 'Day care Teste', 'CONCLUIDO', -48],
      [sitter, 'SITTING', 'Visita Teste', 'CONFIRMADO', 3],
      [sitter, 'WALKING', 'Passeio Teste', 'CONCLUIDO', -30],
    ];
    for (const [p, category, name, status, offset] of plan) {
      const service = await S.createService(p.provider.id, { name, category, price: '80' });
      const start = new Date(now + offset * H);
      await prisma.appointment.create({ data: { provider_id: p.provider.id, service_id: service.id, pet_id: pet.id, status,
        payment_policy: p === hotel ? 'PRE_PAGO' : 'PRESENCIAL', total_price: '80', start_time: start, end_time: new Date(start.getTime() + 4 * H),
        ...(p === hotel && status !== 'PENDENTE' ? { payment: { create: { amount: '80', status: 'APPROVED', paid_at: new Date() } } } : {}) } });
    }
    // Fila do admin: parceiro pendente, sitter com avaliação pendente, parceiro recusado.
    const pending = await S.createApprovedPartner({ role_id: 3 });
    await prisma.provider.update({ where: { id: pending.provider.id }, data: { status: 'PENDENTE', business_name: 'Hotel Pendente QA' } });
    const sitterPend = await S.createApprovedPartner({ role_id: 4 });
    await prisma.provider.update({ where: { id: sitterPend.provider.id }, data: { status: 'EM_REVISAO', business_name: 'Sitter Em Revisão QA' } }).catch(() => null);
    await prisma.sitterEvaluation.updateMany({ where: { user_id: sitterPend.partnerUser.id }, data: { status: 'PENDING' } });
    const rejected = await S.createApprovedPartner({ role_id: 3 });
    await prisma.provider.update({ where: { id: rejected.provider.id }, data: { status: 'REJEITADO', business_name: 'Hotel Recusado QA' } });

    const accounts = {};
    const all = { tutor, admin, store: store.storeUser, empty: empty.storeUser, hotel: hotel.partnerUser, sitter: sitter.partnerUser, rejected: rejected.partnerUser, pending: pending.partnerUser };
    for (const [kind, rec] of Object.entries(all)) {
      const u = await prisma.user.findUnique({ where: { id: rec.id } });
      const prov = await prisma.provider.findFirst({ where: { user_id: rec.id } }).catch(() => null);
      accounts[kind] = { user: { id: u.id, full_name: u.full_name, email: u.email, role_id: u.role_id, provider_status: prov?.status, onboarding_step: u.onboarding_step },
        token: jwt.sign({ id: u.id, role_id: u.role_id }, process.env.JWT_SECRET, { algorithm: 'HS256' }) };
    }
    fs.writeFileSync(process.argv[2], JSON.stringify({ accounts, ids: { hotel: hotel.provider.id, sitter: sitter.provider.id, store: store.provider.id, product: store.product.id } }, null, 1));
  } finally { await disconnectTestDatabase(); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
