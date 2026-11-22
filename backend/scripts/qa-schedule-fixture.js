// Fixtures exclusivas do PostgreSQL local descartável de testes.
const fs = require('node:fs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/database');
const { prepareTestDatabase, disconnectTestDatabase } = require('../tests/helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createApprovedPartner, createService, createPet } = require('../tests/helpers/testSeed');

async function main() {
  if (process.env.RUN_DB_INTEGRATION_TESTS !== 'true' || !process.argv[2]) throw Error('Exige banco de teste autorizado e caminho de saída.');
  await prepareTestDatabase();
  try {
    await seedRoles();
    const { tutor, token } = await createAuthenticatedTutor();
    const fixture = { tutorToken: token, partners: [] };
    for (const role of [3, 4]) {
      const { partnerUser, provider } = await createApprovedPartner({ role_id: role, payment_policy: 'PRE_PAGO' });
      await prisma.user.update({ where: { id: partnerUser.id }, data: { onboarding_step: 'COMPLETED' } });
      const now = new Date();
      const future = new Date(now.getTime() + 60 * 60 * 1000);
      const records = {};
      for (const kind of ['unpaid', 'paid', 'reject', 'confirmed', 'started']) {
        const pet = await createPet(tutor.id, { name: `Rex ${kind}` });
        const service = await createService(provider.id, { name: `Atendimento ${kind}`, category: role === 3 ? 'BOARDING' : 'SITTING', price: '80' });
        const start = kind === 'started' ? new Date(now.getTime() - 3600000) : future;
        const appointment = await prisma.appointment.create({ data: {
          provider_id: provider.id, service_id: service.id, pet_id: pet.id,
          start_time: start, end_time: new Date(start.getTime() + 7200000), total_price: '80',
          payment_policy: kind === 'started' ? 'PRESENCIAL' : 'PRE_PAGO',
          status: kind === 'unpaid' ? 'PENDENTE' : ['paid', 'reject'].includes(kind) ? 'AGUARDANDO_CONFIRMACAO' : 'CONFIRMADO',
          ...(['paid', 'reject', 'confirmed'].includes(kind) ? { payment: { create: { amount: '80', status: 'APPROVED' } } } : {}),
        } });
        records[kind] = { id: appointment.id, day: start.toISOString() };
      }
      fixture.partners.push({ user: { id: partnerUser.id, role_id: role, full_name: partnerUser.full_name, email: partnerUser.email, provider_status: 'APROVADO', onboarding_step: 'COMPLETED' },
        token: jwt.sign({ id: partnerUser.id, role_id: role }, process.env.JWT_SECRET), records });
    }
    fs.writeFileSync(process.argv[2], JSON.stringify(fixture));
  } finally { await disconnectTestDatabase(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
