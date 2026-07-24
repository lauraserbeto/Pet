const { test } = require('node:test');
const assert = require('node:assert/strict');
const { listProductsQuery } = require('../../src/schemas/productSchemas');

test('defaults: page=1, limit=100 quando ausente', () => {
  assert.deepEqual(listProductsQuery.parse({}), { page: 1, limit: 100 });
});

test('coage strings de query para números', () => {
  assert.deepEqual(listProductsQuery.parse({ page: '3', limit: '20' }), { page: 3, limit: 20 });
});

test('rejeita limit acima do teto (100) — protege contra query não-limitada', () => {
  assert.throws(() => listProductsQuery.parse({ limit: '500' }));
});

test('rejeita page < 1', () => {
  assert.throws(() => listProductsQuery.parse({ page: '0' }));
});

test('rejeita valores não-numéricos', () => {
  assert.throws(() => listProductsQuery.parse({ limit: 'abc' }));
});
