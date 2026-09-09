process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';

const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { DeleteProductUseCase } = require('../../src/useCases/products/DeleteProductUseCase');

const PRODUCT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const USER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

function makeProduct(providerId = 'provider-1') {
  return {
    id: PRODUCT_ID,
    provider_id: providerId,
    name: 'Racao teste',
  };
}

function makeUseCase({
  providerId = 'provider-1',
  product = makeProduct(),
  deleteImpl = async () => ({ id: PRODUCT_ID }),
} = {}) {
  const providerRepository = {
    findUnique: mock.fn(async () => (providerId ? { id: providerId } : null)),
  };
  const productRepository = {
    findById: mock.fn(async () => product),
    delete: mock.fn(deleteImpl),
  };

  return {
    useCase: new DeleteProductUseCase({ providerRepository, productRepository }),
    providerRepository,
    productRepository,
  };
}

afterEach(() => mock.restoreAll());

test('deleteProduct remove produto do lojista autenticado', async () => {
  const { useCase, productRepository } = makeUseCase();

  const result = await useCase.execute(PRODUCT_ID, USER_ID, 2);

  assert.equal(result.id, PRODUCT_ID);
  assert.equal(productRepository.delete.mock.callCount(), 1);
});

test('deleteProduct bloqueia usuário que não é lojista', async () => {
  const { useCase } = makeUseCase();

  await assert.rejects(
    useCase.execute(PRODUCT_ID, USER_ID, 5),
    (error) => {
      assert.equal(error.statusCode, 403);
      return true;
    }
  );
});

test('deleteProduct retorna 404 quando produto não existe', async () => {
  const { useCase } = makeUseCase({ product: null });

  await assert.rejects(
    useCase.execute(PRODUCT_ID, USER_ID, 2),
    (error) => {
      assert.equal(error.statusCode, 404);
      return true;
    }
  );
});

test('deleteProduct retorna 403 quando produto pertence a outro lojista', async () => {
  const { useCase } = makeUseCase({ product: makeProduct('provider-2') });

  await assert.rejects(
    useCase.execute(PRODUCT_ID, USER_ID, 2),
    (error) => {
      assert.equal(error.statusCode, 403);
      return true;
    }
  );
});

test('deleteProduct retorna 409 quando produto está vinculado a pedido', async () => {
  const { useCase } = makeUseCase({ deleteImpl: async () => {
    const error = new Error('Foreign key violation');
    error.code = 'P2003';
    throw error;
  } });

  await assert.rejects(
    useCase.execute(PRODUCT_ID, USER_ID, 2),
    (error) => {
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /vinculado a pedidos/i);
      return true;
    }
  );
});
