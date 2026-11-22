const fs = require('node:fs');
const path = require('node:path');
const prisma = require('../src/config/database');
const { prepareTestDatabase, disconnectTestDatabase } = require('../tests/helpers/dbIntegration');
const { seedRoles, createAuthenticatedTutor, createStoreWithProduct, createAddress } = require('../tests/helpers/testSeed');
async function main() {
  if (process.env.NODE_ENV !== 'test' || process.env.RUN_DB_INTEGRATION_TESTS !== 'true' || !process.argv[2] || !path.isAbsolute(process.argv[2])) throw Error('Exige QA local e arquivo exclusivo absoluto.');
  await prepareTestDatabase();
  try {
    await seedRoles(); const cases = [];
    for (const width of [1280, 390]) {
      const { tutor, token } = await createAuthenticatedTutor();
      await createAddress(tutor.id);
      const { product, provider } = await createStoreWithProduct({ price: '10.10', stock_quantity: 30 });
      const cart = await prisma.cart.create({ data: { user_id: tutor.id } });
      await prisma.cartItem.create({ data: { cart_id: cart.id, product_id: product.id, quantity: 3, unit_price_snapshot: product.price } });
      const order = async (customerId, status, amount) => prisma.order.create({ data: { customer_id: customerId, provider_id: provider.id, status, total_price: amount } });
      const pending = await order(tutor.id, 'AGUARDANDO_PAGAMENTO', '10.10');
      const cancelled = await order(tutor.id, 'CANCELADO', '20.20');
      const { tutor: other } = await createAuthenticatedTutor();
      const alien = await order(other.id, 'PAGO', '999');
      cases.push({ width, user: { id: tutor.id, full_name: tutor.full_name, email: tutor.email, role_id: 5 }, token,
        anon: [{ id: product.id, name: product.name, price: 10.1, quantity: 2 }], pending: pending.id, cancelled: cancelled.id, alien: alien.id });
    }
    fs.writeFileSync(process.argv[2], JSON.stringify(cases), { flag: 'wx' });
  } finally { await disconnectTestDatabase(); }
}
main().catch(() => { console.error('Fixture E-18 não criada; confira banco/arquivo exclusivo.'); process.exitCode = 1; });
