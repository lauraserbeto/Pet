process.env.LOG_LEVEL = 'silent';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getProfileCompleteness, isPublicProfileComplete } = require('../../src/utils/profileCompleteness');

const base = { description: 'Perfil', phone: '11999990000', city: 'São Paulo', zip_code: '01001000', services: [{ id: 's1', is_active: true }] };

test('hotel com o mínimo da vitrine é público; o resto vira recomendado (G12)', () => {
  const r = getProfileCompleteness({ ...base, gallery_images: ['a.png'], user: { role_id: 3 } });

  assert.equal(r.isPublic, true);
  assert.deepEqual(r.required, []);
  assert.deepEqual(r.recommended.sort(), ['allowed_animals', 'amenities', 'avatar_url', 'gallery_images', 'operating_hours']);
});

test('hotel sem imagem, sem serviço ativo ou sem telefone não é público', () => {
  const r = getProfileCompleteness({ ...base, phone: '', services: [{ id: 's1', is_active: false }], gallery_images: [], user: { role_id: 3 } });

  assert.equal(r.isPublic, false);
  assert.deepEqual(r.required.sort(), ['gallery_images', 'phone', 'services']);
});

test('pet sitter exige modalidade; avatar e horários só recomendados', () => {
  const sem = getProfileCompleteness({ ...base, sitter_roles: [], user: { role_id: 4 } });
  const com = getProfileCompleteness({ ...base, sitter_roles: ['SITTING'], user: { role_id: 4, avatar_url: 'x.png' }, operating_hours: { seg: '8-18' } });

  assert.deepEqual(sem.required, ['sitter_roles']);
  assert.equal(com.isPublic, true);
  assert.deepEqual(com.recommended, []);
});

test('lojista não exige serviço nem galeria', () => {
  assert.equal(isPublicProfileComplete({ ...base, services: [], user: { role_id: 2 } }), true);
});

test('três ou mais imagens deixam de aparecer como recomendação', () => {
  const r = getProfileCompleteness({ ...base, gallery_images: ['1', '2', '3'], allowed_animals: ['DOG'], amenities: ['pool'], operating_hours: { seg: '8-18' }, user: { role_id: 3, avatar_url: 'x' } });

  assert.deepEqual(r.recommended, []);
});
