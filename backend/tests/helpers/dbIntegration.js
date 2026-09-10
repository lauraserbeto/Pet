const prisma = require('../../src/config/database');

const TRUNCATE_TABLES = [
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

async function prepareTestDatabase() {
  assertSafeTestDatabaseUrl();
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
}

module.exports = {
  getDbIntegrationSkipReason,
  prepareTestDatabase,
  resetTestDatabase,
  disconnectTestDatabase,
};
