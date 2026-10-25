const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  IMAGE_MAX_BYTES,
  IMAGE_DATA_URL_MAX_CHARS,
  base64DecodedBytes,
  imageSchema,
  imageListSchema,
  httpsImageUrlSchema,
} = require('../../src/schemas/imageSchemas');
const { bodyLimitFor, DEFAULT_BODY_LIMIT } = require('../../src/middlewares/bodyLimits');

const dataUrl = (type, bytes) => `data:image/${type};base64,${Buffer.alloc(bytes, 7).toString('base64')}`;
const ok = (schema, value) => schema.safeParse(value).success;

// --- Tamanho: o teto é do arquivo decodificado, igual ao `file.size` do front ---

test('base64DecodedBytes devolve o tamanho real do arquivo', () => {
  for (const bytes of [1, 2, 3, 100, 1001]) {
    assert.equal(base64DecodedBytes(Buffer.alloc(bytes).toString('base64')), bytes);
  }
});

test('aceita imagem de exatamente 2 MB e recusa 1 byte a mais', () => {
  const schema = imageSchema();
  assert.ok(ok(schema, dataUrl('png', IMAGE_MAX_BYTES)));
  assert.ok(!ok(schema, dataUrl('png', IMAGE_MAX_BYTES + 1)));
});

test('a maior data URL aceita cabe em IMAGE_DATA_URL_MAX_CHARS', () => {
  assert.ok(dataUrl('jpeg', IMAGE_MAX_BYTES).length <= IMAGE_DATA_URL_MAX_CHARS);
});

// --- Tipo ---

test('aceita JPEG (e o alias jpg), PNG e WebP', () => {
  const schema = imageSchema();
  for (const type of ['jpeg', 'jpg', 'png', 'webp', 'PNG']) {
    assert.ok(ok(schema, dataUrl(type, 10)), type);
  }
});

test('recusa GIF, SVG e data URL que não é imagem', () => {
  const schema = imageSchema();
  assert.ok(!ok(schema, dataUrl('gif', 10)));
  assert.ok(!ok(schema, 'data:image/svg+xml;base64,PHN2Zz4='));
  assert.ok(!ok(schema, 'data:text/html;base64,PGgxPg=='));
});

test('tipos extras só quando pedidos (produto aceita GIF)', () => {
  assert.ok(ok(imageSchema({ types: ['jpeg', 'png', 'webp', 'gif'] }), dataUrl('gif', 10)));
});

test('recusa base64 inválido e lixo', () => {
  const schema = imageSchema();
  assert.ok(!ok(schema, 'data:image/png;base64,@@@'));
  assert.ok(!ok(schema, 'nao-e-imagem'));
  assert.ok(!ok(schema, ''));
});

// --- Endereços ---

test('aceita https; http só com allowHttp; nunca javascript:', () => {
  assert.ok(ok(imageSchema(), 'https://cdn.petplus.test/a.png'));
  assert.ok(!ok(imageSchema(), 'http://cdn.petplus.test/a.png'));
  assert.ok(ok(imageSchema({ allowHttp: true }), 'http://cdn.petplus.test/a.png'));
  assert.ok(!ok(imageSchema({ allowHttp: true }), 'javascript:alert(1)'));
});

test('httpsImageUrlSchema recusa data: e javascript:', () => {
  assert.ok(ok(httpsImageUrlSchema, 'https://cdn.petplus.test/a.png'));
  assert.ok(!ok(httpsImageUrlSchema, dataUrl('png', 10)));
  assert.ok(!ok(httpsImageUrlSchema, 'javascript:alert(1)'));
});

// --- Quantidade ---

test('imageListSchema respeita a quantidade máxima', () => {
  const schema = imageListSchema({ max: 2, listLabel: 'fotos' });
  assert.ok(ok(schema, [dataUrl('png', 10), dataUrl('png', 10)]));
  const result = schema.safeParse([dataUrl('png', 10), dataUrl('png', 10), dataUrl('png', 10)]);
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /no máximo 2 fotos/);
});

// --- Limite do corpo por rota ---

test('limite padrão de 100 kb fora das rotas de upload', () => {
  assert.equal(DEFAULT_BODY_LIMIT, 100 * 1024);
  assert.equal(bodyLimitFor('POST', '/api/v1/auth/login'), DEFAULT_BODY_LIMIT);
  assert.equal(bodyLimitFor('PUT', '/api/v1/users/me'), DEFAULT_BODY_LIMIT);
  assert.equal(bodyLimitFor('GET', '/api/v1/users/me/avatar'), DEFAULT_BODY_LIMIT);
  assert.equal(bodyLimitFor('DELETE', '/api/v1/products/abc'), DEFAULT_BODY_LIMIT);
});

test('rotas de upload cabem o máximo de imagens que aceitam', () => {
  const oneImage = bodyLimitFor('POST', '/api/v1/users/me/avatar');
  assert.ok(oneImage > IMAGE_DATA_URL_MAX_CHARS);
  assert.equal(bodyLimitFor('POST', '/api/v1/products'), oneImage);
  assert.equal(bodyLimitFor('PUT', '/api/v1/products/123'), oneImage);
  assert.equal(bodyLimitFor('POST', '/api/v1/products/'), oneImage); // barra final
  assert.ok(bodyLimitFor('PUT', '/api/v1/providers/profile') > 9 * IMAGE_DATA_URL_MAX_CHARS);
  assert.ok(bodyLimitFor('POST', '/api/v1/users/me/evaluations') > 6 * IMAGE_DATA_URL_MAX_CHARS);
});
