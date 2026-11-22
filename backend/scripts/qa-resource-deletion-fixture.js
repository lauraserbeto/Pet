const fs = require("node:fs");
const prisma = require("../src/config/database");
const {
  prepareTestDatabase,
  disconnectTestDatabase,
} = require("../tests/helpers/dbIntegration");
const {
  seedRoles,
  createAuthenticatedTutor,
  createPet,
  createAddress,
  createApprovedPartner,
  createService,
  createStoreWithProduct,
} = require("../tests/helpers/testSeed");
const DAY = 86400000;
async function main() {
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.RUN_DB_INTEGRATION_TESTS !== "true" ||
    !process.argv[2]
  )
    throw Error("Exige banco local de teste e arquivo temporário.");
  await prepareTestDatabase();
  try {
    await seedRoles();
    const cases = [];
    for (const width of [1280, 390]) {
      const { tutor, token } = await createAuthenticatedTutor({
        full_name: "Tutor Remoção QA",
      });
      const active = await createPet(tutor.id, {
        name: `Pet em atendimento ${width}`,
      });
      const history = await createPet(tutor.id, {
        name: `Pet histórico ${width}`,
      });
      const free = await createPet(tutor.id, {
        name: `Pet sem histórico ${width}`,
      });
      const { provider } = await createApprovedPartner();
      const service = await createService(provider.id, {
        name: "Hospedagem Remoção QA",
      });
      const item = (pet, status, start) =>
        prisma.appointment.create({
          data: {
            pet_id: pet.id,
            provider_id: provider.id,
            service_id: service.id,
            status,
            start_time: start,
            end_time: new Date(start.getTime() + DAY),
            total_price: "100.00",
          },
        });
      await item(active, "CONFIRMADO", new Date(Date.now() + DAY));
      const appointment = await item(
        history,
        "CONCLUIDO",
        new Date(Date.now() - 2 * DAY),
      );
      await prisma.appointmentPayment.create({
        data: { appointment_id: appointment.id, amount: "100.00" },
      });
      const first = await createAddress(tutor.id, {
        rua: `Rua Principal QA ${width}`,
      });
      const second = await createAddress(tutor.id, {
        rua: `Rua Alternativa QA ${width}`,
        is_default: false,
      });
      const { provider: store } = await createStoreWithProduct();
      const snapshot = Object.fromEntries(
        [
          "cep",
          "rua",
          "numero",
          "complemento",
          "bairro",
          "cidade",
          "estado",
        ].map((key) => [key, first[key]]),
      );
      const order = await prisma.order.create({
        data: {
          customer_id: tutor.id,
          provider_id: store.id,
          total_price: "10.00",
          status: "PAGO",
          shipping_address: snapshot,
        },
      });
      cases.push({
        width,
        user: {
          id: tutor.id,
          full_name: tutor.full_name,
          email: tutor.email,
          role_id: 5,
        },
        token,
        active,
        history,
        free,
        appointmentId: appointment.id,
        first,
        second,
        orderId: order.id,
        snapshot,
      });
    }
    fs.writeFileSync(process.argv[2], JSON.stringify({ cases }), {
      flag: "wx",
    });
  } finally {
    await disconnectTestDatabase();
  }
}
main().catch(() => {
  console.error("Fixture de remoção não criada.");
  process.exitCode = 1;
});
