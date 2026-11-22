const fs = require("node:fs"),
  jwt = require("jsonwebtoken");
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
  createApprovedPartner,
  createService,
} = require("../tests/helpers/testSeed");
async function main() {
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.RUN_DB_INTEGRATION_TESTS !== "true" ||
    !process.argv[2]
  )
    throw Error("Exige banco local autorizado e arquivo temporário.");
  await prepareTestDatabase();
  try {
    await seedRoles();
    const cases = [];
    for (const width of [1280, 390]) {
      const { tutor, token } = await createAuthenticatedTutor({
        full_name: "Tutor Segurança QA",
      });
      await createAddress(tutor.id);
      const { storeUser, product } = await createStoreWithProduct({
        name: `Produto Segurança ${width}`,
        stock_quantity: 10,
        price: "10.10",
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
        user: {
          id: tutor.id,
          full_name: tutor.full_name,
          email: tutor.email,
          role_id: 5,
        },
        token,
        productId: product.id,
        productName: product.name,
        partnerToken: jwt.sign(
          { id: storeUser.id, role_id: 2 },
          process.env.JWT_SECRET,
        ),
      });
    }
    const { provider, partnerUser } = await createApprovedPartner({
      role_id: 4,
    });
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        business_name: "Sitter Privacidade QA",
        description: "Cuidados para pets em Anápolis.",
        city: "Anápolis",
        state: "GO",
        phone: "11999998888",
        zip_code: "75100000",
        address_line: "Rua Privada QA, 42",
        sitter_roles: ["SITTING"],
        gallery_images: ["http://localhost:4173/email-assets/petplus-logo.png"],
      },
    });
    await prisma.user.update({
      where: { id: partnerUser.id },
      data: {
        avatar_url: "http://localhost:4173/email-assets/petplus-logo.png",
      },
    });
    await createService(provider.id, {
      name: "Cuidado Segurança QA",
      category: "SITTING",
      price: "50.00",
    });
    const { tutor: admin } = await createAuthenticatedTutor();
    await prisma.user.update({ where: { id: admin.id }, data: { role_id: 1 } });
    fs.writeFileSync(
      process.argv[2],
      JSON.stringify({
        cases,
        sitterId: provider.id,
        adminToken: jwt.sign(
          { id: admin.id, role_id: 1 },
          process.env.JWT_SECRET,
        ),
      }),
      { flag: "wx" },
    );
  } finally {
    await disconnectTestDatabase();
  }
}
main().catch(() => {
  console.error("Fixture de segurança não criada.");
  process.exitCode = 1;
});
