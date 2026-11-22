const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ReviewRepository } = require('../../src/repositories/ReviewRepository');

test('AVL-2: agrega em lote, arredonda a uma casa e preserva itens sem avaliação', async () => {
  let calls = 0;
  const repository = new ReviewRepository({ db: { review: { groupBy: async query => {
    calls++;
    assert.deepEqual(query.by, ['product_id']);
    assert.equal(query.where.order.is.status, 'CONCLUIDO');
    assert.equal(query.where.provider_id, null);
    assert.equal(query.where.appointment_id, null);
    assert.equal(query.where.product_id.in.length, 100);
    return [{ product_id: 'p0', _avg: { rating: 4.333333333 }, _count: { _all: 3 } }];
  } } } });
  const source = Array.from({ length: 100 }, (_, index) => ({ id: `p${index}`, name: 'Produto' }));
  const values = await repository.withProductRatings(source);
  assert.equal(calls, 1, 'não pode executar uma consulta por produto');
  assert.equal(values.length, 100);
  assert.deepEqual(values[0], { id: 'p0', name: 'Produto', rating_avg: 4.3, rating_count: 3 });
  assert.deepEqual(values[1], { id: 'p1', name: 'Produto', rating_avg: null, rating_count: 0 });
  assert.equal(source[0].rating_avg, undefined);
});

test('AVL-2: parceiros usam apenas avaliações de agendamentos concluídos', async () => {
  const repository = new ReviewRepository({ db: { review: { groupBy: async query => {
    assert.deepEqual(query.by, ['provider_id']);
    assert.equal(query.where.appointment.is.status, 'CONCLUIDO');
    assert.equal(query.where.product_id, null);
    assert.equal(query.where.order_id, null);
    return [{ provider_id: 'hotel', _avg: { rating: 4 }, _count: { _all: 3 } }];
  } } } });
  assert.deepEqual(await repository.withProviderRatings([{ id: 'hotel' }]), [{ id: 'hotel', rating_avg: 4, rating_count: 3 }]);
});

test('AVL-2: conjunto vazio não consulta o banco', async () => {
  const repository = new ReviewRepository({ db: { review: { groupBy: async () => { throw Error('consulta indevida'); } } } });
  assert.deepEqual(await repository.withProductRatings([]), []);
  assert.deepEqual(await repository.withProviderRatings([]), []);
});

test('AVL-2: falha na agregação é propagada, sem inventar zero avaliações', async () => {
  const repository = new ReviewRepository({ db: { review: { groupBy: async () => { throw Error('banco indisponível'); } } } });
  await assert.rejects(repository.withProviderRatings([{ id: 'hotel' }]), /banco indisponível/);
});
