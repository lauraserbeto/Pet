// Cria os bancos dedicados que algumas fixtures de E2E exigem (E-13, E-19, E-33).
// Esses scripts recusam rodar fora do banco com o nome exato, para que a massa
// de um cenário nunca contamine a de outro.
//
// Uso: node scripts/qa-create-databases.js
// Lê DATABASE_URL e cria os bancos irmãos no mesmo servidor.
const { PrismaClient } = require('@prisma/client');

const EXTRA_DATABASES = ['petplus_e13_test', 'petplus_e19_test', 'petplus_e33_test'];
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'postgres'];

async function main() {
  const url = new URL(process.env.DATABASE_URL || '');

  // Mesma guarda dos helpers de integração: só banco local e com "test" no nome.
  if (!LOCAL_HOSTS.includes(url.hostname.toLowerCase()) || !url.pathname.includes('test')) {
    throw new Error('Recusado: exige banco local de teste em DATABASE_URL.');
  }

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const prisma = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });

  try {
    for (const name of EXTRA_DATABASES) {
      try {
        await prisma.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
        console.log(`criado: ${name}`);
      } catch (error) {
        // 42P04 = already exists. Reexecutar o script precisa ser inofensivo.
        if (error?.meta?.code === '42P04' || /already exists/i.test(error.message)) {
          console.log(`já existia: ${name}`);
        } else {
          throw error;
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`[qa-create-databases] ${error.message}`);
  process.exitCode = 1;
});
