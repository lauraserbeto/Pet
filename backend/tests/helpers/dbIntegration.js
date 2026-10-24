const { PrismaClient } = require('@prisma/client');
const prisma = require('../../src/config/database');

// O `node --test` roda cada arquivo em um processo, em paralelo, e todo arquivo
// com banco trunca as mesmas tabelas. Um advisory lock de SESSÃO, numa conexão
// dedicada, faz cada arquivo esperar o anterior terminar; se o processo morrer,
// a conexão cai e o lock é solto pelo próprio Postgres.
const DB_TEST_LOCK_KEY = 20261024;
let lockClient = null;

const TRUNCATE_TABLES = [
  'payment_attempts',
  'appointments',
  'services',
  'order_items',
  'orders',
  'cart_items',
  'carts',
  'favorites',
  'password_reset_tokens',
  'addresses',
  'pets',
  'products',
  'sitter_evaluations',
  'providers',
  'users',
  'roles',
];

function isDbIntegrationEnabled() {
  return process.env.RUN_DB_INTEGRATION_TESTS === 'true';
}

function parseDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL || '';

  try {
    return new URL(databaseUrl);
  } catch {
    return null;
  }
}

function getDatabaseName(parsedUrl) {
  return decodeURIComponent(parsedUrl.pathname || '').replace(/^\/+/, '').toLowerCase();
}

function isSafeTestDatabaseUrl() {
  const parsedUrl = parseDatabaseUrl();
  if (!parsedUrl) return false;

  const hostname = parsedUrl.hostname.toLowerCase();
  const databaseName = getDatabaseName(parsedUrl);
  const isLocalHost = ['localhost', '127.0.0.1', '::1', 'postgres'].includes(hostname);

  return isLocalHost && databaseName.includes('test');
}

function getDbIntegrationSkipReason() {
  if (!isDbIntegrationEnabled()) {
    return 'Defina RUN_DB_INTEGRATION_TESTS=true para executar testes com banco real';
  }

  return false;
}

function assertSafeTestDatabaseUrl() {
  if (!isSafeTestDatabaseUrl()) {
    throw new Error(
      '[QA-1] Testes com banco recusados: DATABASE_URL deve apontar para um Postgres local de teste.'
    );
  }
}

async function acquireTestDatabaseLock() {
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', '1');
  lockClient = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  await lockClient.$executeRawUnsafe(`SELECT pg_advisory_lock(${DB_TEST_LOCK_KEY})`);
}

async function prepareTestDatabase() {
  assertSafeTestDatabaseUrl();
  await acquireTestDatabaseLock();
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
}

async function resetTestDatabase() {
  assertSafeTestDatabaseUrl();
  const quotedTables = TRUNCATE_TABLES.map((table) => `"${table}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`);
}

async function disconnectTestDatabase() {
  await prisma.$disconnect();
  // Fechar a conexão dedicada solta o advisory lock.
  await lockClient?.$disconnect();
  lockClient = null;
}

module.exports = {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
};
