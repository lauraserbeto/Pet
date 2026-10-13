const orderId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const attemptId = '33333333-3333-4333-8333-333333333333';

function paymentFixture() {
  const state = {
    order: {
      id: orderId, customer_id: userId, provider_id: 'store',
      status: 'AGUARDANDO_PAGAMENTO', total_price: '90.00',
      items: [{ product_id: 'product', quantity: 2, unit_price: '45.00', product: { name: 'Produto Pet+' } }],
    },
    attempt: null,
    orderUpdates: 0,
    preferenceCalls: 0,
    payment: {
      id: 123456, collector_id: 999, live_mode: false,
      external_reference: orderId, transaction_amount: 90, currency_id: 'BRL',
      status: 'approved', date_last_updated: '2026-10-12T12:00:00Z',
      metadata: { payment_attempt_id: attemptId },
    },
  };
  const database = {
    order: {
      findFirst: async ({ where }) => state.order && where.id === state.order.id &&
        (!where.customer_id || where.customer_id === state.order.customer_id) ? { ...state.order } : null,
      findUnique: async () => state.order && { ...state.order },
      updateMany: async ({ where, data }) => {
        if (state.order.status !== where.status) return { count: 0 };
        Object.assign(state.order, data);
        state.orderUpdates++;
        return { count: 1 };
      },
    },
    paymentAttempt: {
      upsert: async ({ create }) => (state.attempt ||= {
        id: attemptId, status: 'CREATED', currency: 'BRL', preference_id: null,
        checkout_url: null, ...create,
      }),
      findUnique: async () => state.attempt && { ...state.attempt },
      updateMany: async ({ data }) => {
        if (state.attempt.preference_id) return { count: 0 };
        Object.assign(state.attempt, data);
        return { count: 1 };
      },
      update: async ({ data }) => Object.assign(state.attempt, data),
    },
    $queryRaw: async () => [],
  };
  database.$transaction = async (callback) => {
    const snapshot = structuredClone(state);
    try { return await callback(database); }
    catch (error) { Object.assign(state, snapshot); throw error; }
  };
  const gateway = {
    config: { enabled: true, frontendUrl: 'https://petplus.test', backendUrl: 'https://api.petplus.test', testUserId: '999' },
    assertEnabled() {},
    assertTestAccount: async () => {},
    verifySignature() {},
    createPreference: async () => {
      state.preferenceCalls++;
      return { id: 'preference-123', init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=preference-123' };
    },
    getPayment: async () => ({ ...state.payment }),
  };
  return { state, database, gateway, orderId, userId, attemptId };
}

module.exports = { paymentFixture };
