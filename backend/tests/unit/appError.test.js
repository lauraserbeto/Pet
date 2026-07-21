const { test } = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../../src/utils/AppError');

test('notFound → 404 / NOT_FOUND e é operacional', () => {
  const e = AppError.notFound();
  assert.equal(e.statusCode, 404);
  assert.equal(e.code, 'NOT_FOUND');
  assert.ok(e instanceof Error);
  assert.equal(e.isOperational, true);
});

test('conflict → 409 preservando details', () => {
  const e = AppError.conflict('Duplicado', { field: 'email' });
  assert.equal(e.statusCode, 409);
  assert.equal(e.code, 'CONFLICT');
  assert.deepEqual(e.details, { field: 'email' });
});

test('forbidden → 403 / FORBIDDEN', () => {
  const e = AppError.forbidden();
  assert.equal(e.statusCode, 403);
  assert.equal(e.code, 'FORBIDDEN');
});

test('validation → 422 / VALIDATION_ERROR', () => {
  const e = AppError.validation('Inválido', [{ path: 'x' }]);
  assert.equal(e.statusCode, 422);
  assert.equal(e.code, 'VALIDATION_ERROR');
  assert.deepEqual(e.details, [{ path: 'x' }]);
});

test('badRequest é o default (400 / BAD_REQUEST)', () => {
  const e = new AppError('erro');
  assert.equal(e.statusCode, 400);
  assert.equal(e.code, 'BAD_REQUEST');
});
