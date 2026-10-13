const prisma = require('../../config/database');
const mercadoPago = require('../../services/MercadoPagoService');
const confirmPayment = require('../orders/ConfirmOrderPaymentUseCase');
const { cents } = require('./CreatePaymentPreferenceUseCase');
const { ORDER_STATUS, PAYMENT_PROVIDER } = require('../../constants/orderStatus');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');

const NON_APPROVED_STATUSES = new Set(['pending', 'in_process', 'authorized', 'rejected', 'cancelled']);

class ProcessPaymentWebhookUseCase {
  constructor({ database = prisma, gateway = mercadoPago, confirmOrderPayment = confirmPayment } = {}) {
    this.database = database;
    this.gateway = gateway;
    this.confirmOrderPayment = confirmOrderPayment;
  }

  async execute({ signature, requestId, query, body }) {
    const paymentId = query['data.id'];
    if (typeof paymentId !== 'string' || !/^\d+$/.test(paymentId)) {
      throw AppError.badRequest('Identificador de pagamento inválido.');
    }
    this.gateway.verifySignature({ signature, requestId, paymentId });
    if (body?.data?.id !== undefined && String(body.data.id) !== paymentId) {
      throw AppError.badRequest('Identificadores de pagamento divergentes.');
    }
    if (query.type !== 'payment' || (body?.type && body.type !== 'payment')) {
      return { received: true, ignored: true };
    }

    const payment = await this.gateway.getPayment(paymentId);
    if (String(payment.id) !== paymentId || payment.live_mode !== false ||
        String(payment.collector_id) !== this.gateway.config.testUserId) {
      throw AppError.forbidden('Pagamento fora da conta de teste configurada.');
    }
    const reference = payment.external_reference;
    if (typeof reference !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference)) {
      return { received: true, ignored: true };
    }
    const attempt = await this.database.paymentAttempt.findUnique({ where: { order_id: reference } });
    if (!attempt) return { received: true, ignored: true };
    if (payment.metadata?.payment_attempt_id !== attempt.id ||
        payment.currency_id !== attempt.currency || cents(payment.transaction_amount) !== cents(attempt.amount)) {
      throw AppError.conflict('Referência, valor ou moeda do pagamento divergente.');
    }

    return this.database.$transaction(async (tx) => {
      // Serializa notificações do mesmo pedido; pedido e pagamento mudam juntos.
      await tx.$queryRaw`SELECT id FROM payment_attempts WHERE id = ${attempt.id}::uuid FOR UPDATE`;
      const current = await tx.paymentAttempt.findUnique({ where: { id: attempt.id } });
      if (current.status === 'APPROVED') {
        if (['refunded', 'charged_back'].includes(payment.status)) {
          logger.warn({ orderId: reference, paymentId }, 'Estorno ou contestação exige conciliação manual');
        }
        if (current.external_id !== paymentId) {
          logger.warn({ orderId: reference, paymentId }, 'Pagamento adicional para pedido já pago');
        }
        return { received: true, duplicate: true };
      }
      const gatewayDate = new Date(payment.date_last_updated);
      if (Number.isNaN(gatewayDate.getTime())) {
        throw AppError.validation('Data do pagamento inválida.');
      }
      if (current.gateway_updated_at && gatewayDate < current.gateway_updated_at) {
        return { received: true, ignored: true };
      }
      const order = await tx.order.findUnique({ where: { id: reference } });
      if (order && cents(order.total_price) !== cents(current.amount)) {
        throw AppError.conflict('O valor do pedido mudou após iniciar o pagamento.');
      }
      const canConfirm = payment.status === 'approved' && order?.status === ORDER_STATUS.AWAITING_PAYMENT &&
        !Number(payment.transaction_amount_refunded || 0);
      const status = canConfirm ? 'APPROVED' :
        NON_APPROVED_STATUSES.has(payment.status) ? payment.status.toUpperCase() : 'REVIEW_REQUIRED';

      if (canConfirm) {
        await this.confirmOrderPayment.execute({
          userId: order.customer_id,
          userRole: 5,
          orderId: order.id,
          paymentResult: { provider: PAYMENT_PROVIDER.MERCADO_PAGO, status: 'APPROVED', external_id: paymentId },
          database: tx,
        });
      }
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status, external_id: paymentId, gateway_updated_at: gatewayDate },
      });
      if (status === 'REVIEW_REQUIRED') {
        logger.warn({ orderId: reference, paymentId }, 'Pagamento exige conciliação manual');
      }
      return { received: true };
    });
  }
}

module.exports = new ProcessPaymentWebhookUseCase();
module.exports.ProcessPaymentWebhookUseCase = ProcessPaymentWebhookUseCase;
