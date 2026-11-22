// Dados fictícios para o navegador; exige PostgreSQL local autorizado de teste.
const fs = require('node:fs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/database');
const { prepareTestDatabase, disconnectTestDatabase } = require('../tests/helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createStoreWithProduct, createApprovedPartner, createService, createPet } = require('../tests/helpers/testSeed');
async function main() {
  if (process.env.RUN_DB_INTEGRATION_TESTS !== 'true' || !process.argv[2]) throw Error('Exige banco local de teste autorizado e caminho de saída.');
  await prepareTestDatabase();
  try {
    await seedRoles();
    const { tutor } = await createAuthenticatedTutor();
    const { tutor: adminUser } = await createAuthenticatedTutor();
    const admin = await prisma.user.update({ where: { id: adminUser.id }, data: { role_id: 1 } });
    const store = await createStoreWithProduct({}, { business_name: 'Loja Painel QA' });
    const other = await createStoreWithProduct({}, { business_name: 'Outra Loja QA' });
    const empty = await createStoreWithProduct({}, { business_name: 'Loja sem operações QA' });
    for (const status of ['PAGO', 'PREPARANDO', 'ENVIADO', 'CONCLUIDO']) await prisma.order.create({ data: { provider_id: store.provider.id, customer_id: tutor.id, status, total_price: '10.10' } });
    await prisma.order.create({ data: { provider_id: store.provider.id, customer_id: tutor.id, status: 'CONCLUIDO', total_price: '20.20', payment_attempt: { create: { amount: '20.20', status: 'APPROVED' } } } });
    for (const status of ['CANCELADO', 'AGUARDANDO_PAGAMENTO']) await prisma.order.create({ data: { provider_id: store.provider.id, customer_id: tutor.id, status, total_price: '999' } });
    await prisma.order.create({ data: { provider_id: other.provider.id, customer_id: tutor.id, status: 'CONCLUIDO', total_price: '30.30' } });
    const hotel = await createApprovedPartner({ payment_policy: 'PRE_PAGO' });
    const sitter = await createApprovedPartner({ role_id: 4 });
    const pet = await createPet(tutor.id);
    for (const [partner, total_price, status] of [[hotel, '80', 'APPROVED'], [hotel, '50.10', 'REFUNDED'], [sitter, '100', null]]) {
      const service = await createService(partner.provider.id, { name: partner === hotel ? 'Hospedagem Painel QA' : 'Cuidado Painel QA' });
      const now = new Date();
      await prisma.appointment.create({ data: { provider_id: partner.provider.id, service_id: service.id, pet_id: pet.id, status: status === 'REFUNDED' ? 'CANCELADO' : 'CONCLUIDO', payment_policy: partner === hotel ? 'PRE_PAGO' : 'PRESENCIAL', total_price, start_time: new Date(now.getTime() - 7200000), end_time: new Date(now.getTime() - 3600000), ...(status ? { payment: { create: { amount: total_price, status, paid_at: now, ...(status === 'REFUNDED' ? { refunded_at: now } : {}) } } } : {}) } });
    }
    const accounts = {};
    for (const [kind, record] of Object.entries({ store: store.storeUser, hotel: hotel.partnerUser, sitter: sitter.partnerUser, empty: empty.storeUser, admin })) {
      await prisma.user.update({ where: { id: record.id }, data: { onboarding_step: 'COMPLETED' } });
      accounts[kind] = { user: { id: record.id, full_name: record.full_name, email: record.email, role_id: record.role_id, provider_status: record.role_id === 1 ? undefined : 'APROVADO', onboarding_step: 'COMPLETED' }, token: jwt.sign({ id: record.id, role_id: record.role_id }, process.env.JWT_SECRET) };
    }
    fs.writeFileSync(process.argv[2], JSON.stringify({ accounts }));
  } finally { await disconnectTestDatabase(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
