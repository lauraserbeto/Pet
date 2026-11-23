// Massa descartável da jornada de compra ponta a ponta (QA-2): um tutor com
// endereço e uma loja aprovada com produto em estoque. Nunca rodar em banco
// publicado — prepareTestDatabase recusa host remoto e nome sem "test".
const fs = require('node:fs');
const path = require('node:path');
const { prepareTestDatabase, disconnectTestDatabase } = require('../tests/helpers/dbIntegration');
const {
  seedRoles,
  createAuthenticatedTutor,
  createAddress,
  createStoreWithProduct,
} = require('../tests/helpers/testSeed');

async function main() {
  const destino = process.argv[2];
  if (
    process.env.NODE_ENV !== 'test' ||
    process.env.RUN_DB_INTEGRATION_TESTS !== 'true' ||
    !destino ||
    !path.isAbsolute(destino)
  ) {
    throw new Error('Exige ambiente de teste autorizado e arquivo de saída absoluto.');
  }

  await prepareTestDatabase();
  try {
    await seedRoles();

    // Um tutor por viewport: os dois casos rodam em paralelo e o carrinho vive
    // no banco — compartilhar a conta faria um teste somar itens do outro.
    const casos = [];
    for (const width of [1280, 390]) {
      const { tutor, token } = await createAuthenticatedTutor();
      const endereco = await createAddress(tutor.id);

      // Preço e estoque fixos: o teste confere o total exibido no checkout.
      const { provider, product } = await createStoreWithProduct({
        name: `Ração Premium QA ${width}`,
        price: '45.50',
        stock_quantity: 10,
      });

      casos.push({
        width,
        user: {
          id: tutor.id,
          full_name: tutor.full_name,
          email: tutor.email,
          role_id: 5,
        },
        token,
        addressId: endereco.id,
        store: { providerId: provider.id, businessName: provider.business_name },
        product: {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          stock: product.stock_quantity,
        },
      });
    }

    fs.writeFileSync(destino, JSON.stringify(casos));
  } finally {
    await disconnectTestDatabase();
  }
}

main().catch((error) => {
  console.error(`[qa-purchase-fixture] ${error.message}`);
  process.exitCode = 1;
});
