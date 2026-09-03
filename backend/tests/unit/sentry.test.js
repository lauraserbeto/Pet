const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(32);
const { __test__, initSentry } = require('../../src/config/sentry');
const { scrub, scrubData, stripQuery, beforeSend } = __test__;

test('scrub redige chaves sensíveis em qualquer profundidade', () => {
  const result = scrub({
    email: 'tutor@example.com',
    password_hash: '$2b$10$abc',
    perfil: { document: '123.456.789-00', nome: 'Ana' },
    lista: [{ authorization: 'Bearer abc' }],
  });

  assert.deepEqual(result, {
    email: 'tutor@example.com',
    password_hash: '[Filtrado]',
    perfil: { document: '[Filtrado]', nome: 'Ana' },
    lista: [{ authorization: '[Filtrado]' }],
  });
});

test('stripQuery remove a query string (tokens de reset trafegam ali)', () => {
  assert.equal(
    stripQuery('/api/v1/auth/reset?token=segredo'),
    '/api/v1/auth/reset'
  );
  assert.equal(stripQuery(undefined), undefined);
});

test('beforeSend remove usuário, cookies e headers do evento', () => {
  const event = beforeSend({
    user: { id: '42', email: 'tutor@example.com' },
    request: {
      url: '/api/v1/checkout?token=segredo',
      cookies: { session: 'abc' },
      headers: { Authorization: 'Bearer abc' },
      data: { cpf: '123.456.789-00', item: 'Ração' },
    },
  });

  assert.equal(event.user, undefined);
  assert.equal(event.request.cookies, undefined);
  assert.equal(event.request.headers, undefined);
  assert.equal(event.request.url, '/api/v1/checkout');
  assert.deepEqual(event.request.data, { cpf: '[Filtrado]', item: 'Ração' });
});

test('scrubData redige o corpo mesmo quando chega como string JSON', () => {
  // O SDK entrega o body como string crua — sem desserializar, o scrub passaria direto.
  const body = JSON.stringify({ email: 'tutor@example.com', password: '123456' });

  assert.equal(
    scrubData(body),
    JSON.stringify({ email: 'tutor@example.com', password: '[Filtrado]' })
  );
});

test('scrubData descarta corpo não-JSON inteiro, por não haver como redigi-lo', () => {
  assert.equal(scrubData('cpf=123.456.789-00&senha=123456'), '[Filtrado]');
});

test('initSentry é no-op sem SENTRY_DSN (a API sobe normalmente)', () => {
  assert.equal(process.env.SENTRY_DSN, undefined);
  assert.equal(initSentry(), false);
});
