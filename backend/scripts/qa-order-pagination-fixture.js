// Exporta somente contas da massa E-19 já criada pelo teste de integração.
const fs = require('node:fs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/database');
const { prepareTestDatabase, disconnectTestDatabase } = require('../tests/helpers/dbIntegration');
async function main() {
  if (process.env.NODE_ENV !== 'test' || process.env.RUN_DB_INTEGRATION_TESTS !== 'true' || !process.argv[2]) throw Error('Exige QA local autorizado.');
  await prepareTestDatabase();
  try {
    const rows = await prisma.provider.findMany({ include: { user: true, _count: { select: { orders: true } } } });
    const store = rows.find(row => row._count.orders === 26);
    if (!store) throw Error('Execute antes orderPaginationDb.test.js em banco separado.');
    const order = await prisma.order.findFirst({ where: { provider_id: store.id, customer: { full_name: 'Tutor QA' } }, include: { customer: true } });
    const accounts = {};
    for (const user of [store.user, order.customer]) accounts[user.role_id] = {
      user: { id: user.id, role_id: user.role_id, full_name: user.full_name, email: user.email, provider_status: 'APROVADO' },
      token: jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET, { expiresIn: '1h' }),
    };
    fs.writeFileSync(process.argv[2], JSON.stringify(accounts), { flag: 'wx' });
  } finally { await disconnectTestDatabase(); }
}
main().catch(() => { console.error('Fixture E-19 não criada; confira banco/massa/arquivo exclusivo.'); process.exitCode = 1; });
