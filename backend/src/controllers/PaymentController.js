const { MERCADO_PAGO } = require('../config/env');
const prisma = require('../config/database');
const createPreference = require('../useCases/payments/CreatePaymentPreferenceUseCase');
const processWebhook = require('../useCases/payments/ProcessPaymentWebhookUseCase');
const { formatOrder } = require('../utils/orderFormatter');
const AppError = require('../utils/AppError');

function gatewayError(error) {
  if (error instanceof AppError || (typeof error.code === 'string' && /^P\d{4}$/.test(error.code))) return error;
  // Erros do SDK podem conter credenciais e dados do pagador; não serializar o objeto cru.
  return new AppError('Não foi possível comunicar com o Mercado Pago. Tente novamente.', 502, 'PAYMENT_GATEWAY_ERROR');
}

class PaymentController {
  configuration(_req, res) {
    return res.json({ provider: MERCADO_PAGO.enabled ? 'MERCADO_PAGO' : 'SIMULATED', sandbox: MERCADO_PAGO.enabled });
  }

  async preference(req, res, next) {
    try {
      return res.status(201).json(await createPreference.execute({
        userId: req.userId, userRole: req.userRole, orderId: req.params.orderId,
      }));
    } catch (error) {
      return next(gatewayError(error));
    }
  }

  async status(req, res, next) {
    try {
      if (req.userRole !== 5) throw AppError.forbidden('Apenas tutores podem consultar pagamentos.');
      const order = await prisma.order.findFirst({
        where: { id: req.params.orderId, customer_id: req.userId },
        include: {
          provider: { select: { id: true, business_name: true } },
          items: { include: { product: { select: { id: true, name: true, image_url: true, sku: true } } } },
          payment_attempt: { select: { status: true } },
        },
      });
      if (!order) throw AppError.notFound('Pedido não encontrado.');
      return res.json({ order: formatOrder(order), paymentStatus: order.payment_attempt?.status ?? null });
    } catch (error) {
      return next(error);
    }
  }

  async webhook(req, res, next) {
    try {
      const result = await processWebhook.execute({
        signature: req.headers['x-signature'], requestId: req.headers['x-request-id'],
        query: req.query, body: req.body,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(gatewayError(error));
    }
  }
}

module.exports = new PaymentController();
