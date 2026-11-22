// Somente PostgreSQL local de teste; cria duas compras independentes para o navegador.
const fs = require("node:fs");
const jwt = require("jsonwebtoken");
const prisma = require("../src/config/database");
const {
  prepareTestDatabase,
  disconnectTestDatabase,
} = require("../tests/helpers/dbIntegration");
const {
  seedRoles,
  createAuthenticatedTutor,
  createAddress,
  createStoreWithProduct,
} = require("../tests/helpers/testSeed");
async function main() {
  if (process.env.RUN_DB_INTEGRATION_TESTS !== "true" || !process.argv[2])
    throw Error("Exige banco local autorizado e caminho temporário.");
  await prepareTestDatabase();
  try {
    await seedRoles();
    const cases = [];
    for (const width of [1280, 390]) {
      const { tutor, token } = await createAuthenticatedTutor();
      const address = await createAddress(tutor.id);
      const { storeUser, provider, product } = await createStoreWithProduct({
        name: `Produto Integridade ${width}`,
        price: "10.10",
        stock_quantity: 10,
      });
      const cart = await prisma.cart.create({ data: { user_id: tutor.id } });
      await prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id: product.id,
          quantity: 2,
          unit_price_snapshot: "10.10",
        },
      });
      cases.push({
        width,
        token,
        user: {
          id: tutor.id,
          full_name: tutor.full_name,
          email: tutor.email,
          role_id: 5,
        },
        addressId: address.id,
        productId: product.id,
        providerId: provider.id,
        partnerToken: jwt.sign(
          { id: storeUser.id, role_id: 2 },
          process.env.JWT_SECRET,
        ),
      });
    }
    fs.writeFileSync(process.argv[2], JSON.stringify({ cases }));
  } finally {
    await disconnectTestDatabase();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
