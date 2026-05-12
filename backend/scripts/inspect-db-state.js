// Script de INSPEÇÃO read-only. Não escreve nada no banco.
// Uso: node scripts/inspect-db-state.js
require('dotenv').config();
const prisma = require('../src/config/database');

async function tableExists(tableName) {
  const result = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (
       SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = $1
     ) AS exists`,
    tableName
  );
  return Boolean(result?.[0]?.exists);
}

async function columnExists(tableName, columnName) {
  const result = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (
       SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     ) AS exists`,
    tableName,
    columnName
  );
  return Boolean(result?.[0]?.exists);
}

async function indexExists(indexName) {
  const result = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (
       SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = $1
     ) AS exists`,
    indexName
  );
  return Boolean(result?.[0]?.exists);
}

async function main() {
  console.log('\n========== INSPEÇÃO DO BANCO (read-only) ==========\n');

  // 1) Contagem das tabelas existentes
  const [users, providers, products, addresses, pets, orders] = await Promise.all([
    prisma.user.count(),
    prisma.provider.count(),
    prisma.product.count(),
    prisma.address.count(),
    prisma.pet.count(),
    prisma.order.count(),
  ]);
  console.log('📊 Contagem (tabelas existentes):');
  console.log(`   users:       ${users}`);
  console.log(`   providers:   ${providers}`);
  console.log(`   products:    ${products}`);
  console.log(`   addresses:   ${addresses}`);
  console.log(`   pets:        ${pets}`);
  console.log(`   orders:      ${orders}`);

  // 2) Distinct species (pra decidir se aplica a normalização)
  if (pets > 0) {
    const speciesRaw = await prisma.$queryRawUnsafe(
      `SELECT species, COUNT(*)::int AS count FROM pets GROUP BY species ORDER BY count DESC`
    );
    console.log('\n🐾 Valores distintos de pets.species:');
    speciesRaw.forEach((r) => console.log(`   "${r.species}" → ${r.count}`));
  }

  // 3) Quantos endereços por user — se cada user tem só 1, backfill é trivial
  if (addresses > 0) {
    const addrPerUser = await prisma.$queryRawUnsafe(
      `SELECT count_per_user, COUNT(*)::int AS users FROM (
         SELECT user_id, COUNT(*)::int AS count_per_user FROM addresses GROUP BY user_id
       ) t GROUP BY count_per_user ORDER BY count_per_user`
    );
    console.log('\n📍 Distribuição de endereços por usuário:');
    addrPerUser.forEach((r) =>
      console.log(`   ${r.count_per_user} endereço(s): ${r.users} usuário(s)`)
    );
  }

  // 4) Estado das mudanças pendentes (foi aplicado algo antes?)
  console.log('\n🔍 Estado das mudanças do plano:');
  const checks = [
    { label: 'addresses.is_default (coluna)', exists: await columnExists('addresses', 'is_default') },
    { label: 'addresses_user_id_default_unique (índice parcial)', exists: await indexExists('addresses_user_id_default_unique') },
    { label: 'favorites (tabela)', exists: await tableExists('favorites') },
    { label: 'carts (tabela)', exists: await tableExists('carts') },
    { label: 'cart_items (tabela)', exists: await tableExists('cart_items') },
  ];
  checks.forEach((c) => console.log(`   ${c.exists ? '✅' : '❌'}  ${c.label}`));

  console.log('\n====================================================\n');
}

main()
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
