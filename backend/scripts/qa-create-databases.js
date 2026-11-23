// Cria os bancos dos cenários de E2E (QA-2).
//
// Cada cenário roda isolado: várias fixtures semeiam massa fixa e os cenários
// que medem agregados (métricas, integridade de pedido, segurança) quebram se
// outro cenário escrever no mesmo banco.
//
// Uso:
//   node scripts/qa-create-databases.js <nome> [--recriar] [--template <base>]
//
// `--template` copia um banco já migrado, em vez de rodar as migrations de
// novo em cada um — 14 bancos × migrations seria lento sem necessidade.
const { PrismaClient } = require('@prisma/client');

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'postgres'];

function valorDe(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

async function main() {
  const url = new URL(process.env.DATABASE_URL || '');

  // Mesma guarda dos helpers de integração: só banco local e com "test" no nome.
  if (!LOCAL_HOSTS.includes(url.hostname.toLowerCase()) || !url.pathname.includes('test')) {
    throw new Error('Recusado: exige banco local de teste em DATABASE_URL.');
  }

  const args = process.argv.slice(2);
  const nome = args.find((arg) => !arg.startsWith('--') && arg !== valorDe(args, '--template'));
  const recriar = args.includes('--recriar');
  const template = valorDe(args, '--template');

  if (!nome) throw new Error('Informe o nome do banco.');
  if (!nome.includes('test')) throw new Error(`Recusado: "${nome}" não é banco de teste.`);

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const prisma = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });

  try {
    // Recriar deixa a execução repetível: as fixtures semeiam massa fixa e
    // colidiriam em chave única numa segunda rodada. No CI o banco já nasce
    // vazio; localmente, sem isto, só funcionaria na primeira vez.
    if (recriar) {
      await prisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${nome}" WITH (FORCE)`);
    }

    const origem = template ? ` TEMPLATE "${template}"` : '';
    try {
      await prisma.$executeRawUnsafe(`CREATE DATABASE "${nome}"${origem}`);
      console.log(`criado: ${nome}${template ? ` (a partir de ${template})` : ''}`);
    } catch (error) {
      // 42P04 = already exists. Reexecutar precisa ser inofensivo.
      if (error?.meta?.code === '42P04' || /already exists/i.test(error.message)) {
        console.log(`já existia: ${nome}`);
      } else {
        throw error;
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
