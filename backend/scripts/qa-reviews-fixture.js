// Dados fictícios somente para o PostgreSQL local descartável de E2E.
const fs = require('node:fs');
const prisma = require('../src/config/database');
const { prepareTestDatabase, disconnectTestDatabase } = require('../tests/helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createStoreWithProduct, createApprovedPartner, createService, createPet } = require('../tests/helpers/testSeed');

async function main() {
  if (process.env.RUN_DB_INTEGRATION_TESTS !== 'true' || !process.argv[2]) throw Error('Exige banco de teste e arquivo de saída explícitos.');
  await prepareTestDatabase();
  try {
    await seedRoles();
    const { tutor, token } = await createAuthenticatedTutor({ full_name: 'Tutora Avaliações QA' });
    const { provider, product } = await createStoreWithProduct({ name: 'Produto Avaliações QA', image_url: 'http://localhost:4173/email-assets/petplus-logo.png' });
    const createOrder = (customer_id, status = 'CONCLUIDO') => prisma.order.create({ data: {
      customer_id, provider_id: provider.id, status, total_price: '49.90',
      items: { create: { product_id: product.id, quantity: 1, unit_price: '49.90' } },
    } });
    const order = await createOrder(tutor.id);
    await createOrder(tutor.id, 'AGUARDANDO_PAGAMENTO');
    const other = await createAuthenticatedTutor({ full_name: 'Autor Avaliações QA' });
    for (let index = 0; index < 12; index++) {
      const source = await createOrder(other.tutor.id);
      await prisma.review.create({ data: { author_id: other.tutor.id, product_id: product.id, order_id: source.id, rating: 4, comment: `Avaliação real de teste ${index + 1}`, created_at: new Date(Date.UTC(2000, 0, 1, index)) } });
    }
    const appointments = [];
    for (const role_id of [3, 4]) {
      const partner = await createApprovedPartner({ role_id });
      await prisma.provider.update({ where: { id: partner.provider.id }, data: {
        description: 'Perfil de testes de avaliações', phone: '11999990000', city: 'São Paulo', zip_code: '01001000',
        gallery_images: ['http://localhost:4173/email-assets/petplus-logo.png'], sitter_roles: ['SITTING'],
      } });
      const service = await createService(partner.provider.id, { name: role_id === 3 ? 'Hospedagem Avaliações QA' : 'Cuidado Avaliações QA', category: role_id === 3 ? 'BOARDING' : 'SITTING' });
      const pet = await createPet(tutor.id);
      const appointment = await prisma.appointment.create({ data: {
        provider_id: partner.provider.id, service_id: service.id, pet_id: pet.id, status: 'CONCLUIDO', payment_policy: 'PRESENCIAL', total_price: '100',
        start_time: new Date('2026-01-01T10:00:00Z'), end_time: new Date('2026-01-02T10:00:00Z'),
      } });
      appointments.push({ id: appointment.id, providerId: partner.provider.id, name: service.name, path: role_id === 3 ? 'hotels' : 'walkers' });
    }
    fs.writeFileSync(process.argv[2], JSON.stringify({ user: { id: tutor.id, role_id: 5, full_name: tutor.full_name, email: tutor.email }, token, orderId: order.id, productId: product.id, appointments }));
  } finally { await disconnectTestDatabase(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
