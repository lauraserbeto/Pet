process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET ||= 'test-secret-com-mais-de-32-caracteres-0000';
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/petplus_test';
process.env.FRONTEND_URL ||= 'http://localhost:5173';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  UpdateProviderAccountUseCase,
} = require('../../src/useCases/providers/UpdateProviderAccountUseCase');
const { PAYMENT_POLICY } = require('../../src/constants/paymentPolicy');

/**
 * Repositório falso que captura os dados que chegariam ao banco. O client do
 * Prisma usa proxy e não é estável para mock de método, por isso a injeção.
 */
function capturarUpdate() {
  const capturado = {};
  const useCase = new UpdateProviderAccountUseCase({
    providerRepository: {
      update: async (args) => {
        Object.assign(capturado, args.data);
        return { id: 'prov-1', ...args.data };
      },
    },
  });
  return { capturado, useCase };
}

test('persiste payment_policy quando enviado', async () => {
  const { capturado, useCase } = capturarUpdate();

  await useCase.execute('user-1', { payment_policy: PAYMENT_POLICY.PREPAID });

  assert.equal(capturado.payment_policy, 'PRE_PAGO');
});

test('rejeita política de cobrança inválida', async () => {
  const { useCase } = capturarUpdate();

  await assert.rejects(
    () => useCase.execute('user-1', { payment_policy: 'DE_GRACA' }),
    (err) => err.statusCode === 422 && /política de cobrança/i.test(err.message)
  );
});

test('não toca em payment_policy quando o campo não vem', async () => {
  const { capturado, useCase } = capturarUpdate();

  await useCase.execute('user-1', { city: 'São Paulo' });

  assert.equal(capturado.city, 'São Paulo');
  assert.ok(!('payment_policy' in capturado), 'campo ausente não deve sobrescrever o valor atual');
});
