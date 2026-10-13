const prisma = require('../../config/database');
const mercadoPago = require('../../services/MercadoPagoService');
const AppError = require('../../utils/AppError');
const { ORDER_STATUS } = require('../../constants/orderStatus');

function cents(value) {
  return Math.round(Number(value) * 100);
}

class CreatePaymentPreferenceUseCase {
  constructor({ database = prisma, gateway = mercadoPago } = {}) {
    this.database = database;
    this.gateway = gateway;
  }

  async execute({ userId, userRole, orderId }) {
    if (userRole !== 5) throw AppError.forbidden('Apenas tutores podem pagar pedidos.');
    this.gateway.assertEnabled();

    const order = await this.database.order.findFirst({
      where: { id: orderId, customer_id: userId },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
    if (!order) throw AppError.notFound('Pedido não encontrado.');
    if (order.status !== ORDER_STATUS.AWAITING_PAYMENT) {
      throw AppError.conflict('Pedido não está aguardando pagamento.');
    }
    const total = cents(order.total_price);
    const itemsTotal = order.items.reduce((sum, item) => sum + cents(item.unit_price) * item.quantity, 0);
    if (!Number.isSafeInteger(total) || total <= 0 || itemsTotal !== total) {
      throw AppError.conflict('O valor do pedido não confere com os itens.');
    }

    await this.gateway.assertTestAccount();
    const attempt = await this.database.paymentAttempt.upsert({
      where: { order_id: order.id },
      create: { order_id: order.id, amount: order.total_price },
      update: {},
    });
    if (cents(attempt.amount) !== total || attempt.currency !== 'BRL') {
      throw AppError.conflict('O valor da tentativa de pagamento não confere com o pedido.');
    }
    if (attempt.checkout_url) return this.format(attempt);

    const returnUrl = new URL('/checkout/payment', this.gateway.config.frontendUrl);
    returnUrl.searchParams.set('orderId', order.id);
    const preference = await this.gateway.createPreference({
      items: order.items.map((item) => ({
        id: item.product_id,
        title: item.product?.name || 'Produto Pet+',
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        currency_id: 'BRL',
      })),
      external_reference: order.id,
      metadata: { payment_attempt_id: attempt.id },
      notification_url: `${this.gateway.config.backendUrl}/api/v1/orders/webhook`,
      back_urls: {
        success: returnUrl.toString(),
        pending: returnUrl.toString(),
        failure: returnUrl.toString(),
      },
      auto_return: 'approved',
    }, attempt.id);

    let checkoutUrl;
    try {
      checkoutUrl = new URL(preference.init_point);
    } catch {
      throw new AppError('Mercado Pago não retornou um link de pagamento válido.', 502, 'PAYMENT_GATEWAY_ERROR');
    }
    if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'www.mercadopago.com.br' || !preference.id) {
      throw new AppError('Link de pagamento inesperado.', 502, 'PAYMENT_GATEWAY_ERROR');
    }

    // A primeira preferência persistida vence requisições simultâneas.
    await this.database.paymentAttempt.updateMany({
      where: { id: attempt.id, preference_id: null },
      data: { preference_id: preference.id, checkout_url: checkoutUrl.toString() },
    });
    return this.format(await this.database.paymentAttempt.findUnique({ where: { id: attempt.id } }));
  }

  format(attempt) {
    return { preferenceId: attempt.preference_id, initPoint: attempt.checkout_url, orderId: attempt.order_id };
  }
}

module.exports = new CreatePaymentPreferenceUseCase();
module.exports.CreatePaymentPreferenceUseCase = CreatePaymentPreferenceUseCase;
module.exports.cents = cents;
