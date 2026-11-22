// Dados descartáveis para E2E local; nunca executar em banco publicado.
const fs = require('node:fs');
const jwt = require('jsonwebtoken');
const { prepareTestDatabase, disconnectTestDatabase } = require('../tests/helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createApprovedPartner, createService, createPet } = require('../tests/helpers/testSeed');

async function main() {
  if (process.env.RUN_DB_INTEGRATION_TESTS !== 'true' || !process.argv[2]) throw Error('Exige banco de teste autorizado e caminho de saída.');
  await prepareTestDatabase(); // Recusa hosts não locais e nomes sem "test".
  try {
    await seedRoles();
    const { tutor, token } = await createAuthenticatedTutor();
    const pet = await createPet(tutor.id);
    const hotel = await createApprovedPartner({ payment_policy: 'PRE_PAGO' });
    const sitter = await createApprovedPartner({ role_id: 4, payment_policy: 'PRESENCIAL' });
    const hotelService = await createService(hotel.provider.id, { name: 'Hospedagem E2E', price: '80' });
    const sitterService = await createService(sitter.provider.id, { name: 'Passeio E2E', category: 'WALKING', price: '50' });
    fs.writeFileSync(process.argv[2], JSON.stringify({
      user: { id: tutor.id, full_name: tutor.full_name, email: tutor.email, role_id: 5 }, token, petId: pet.id,
      hotel: { providerId: hotel.provider.id, serviceId: hotelService.id, partnerToken: jwt.sign({ id: hotel.partnerUser.id, role_id: 3 }, process.env.JWT_SECRET) },
      sitter: { providerId: sitter.provider.id, serviceId: sitterService.id, partnerToken: jwt.sign({ id: sitter.partnerUser.id, role_id: 4 }, process.env.JWT_SECRET) },
    }));
  } finally { await disconnectTestDatabase(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
