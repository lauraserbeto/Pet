const createOrderUseCase = require('../useCases/orders/CreateOrderUseCase');
const confirmOrderPaymentUseCase = require('../useCases/orders/ConfirmOrderPaymentUseCase');
const { PAYMENT_PROVIDER, PAYMENT_STATUS } = require('../constants/orderStatus');

class OrderController {
  async create(req, res, next) {
    try {
      const result = await createOrderUseCase.execute({
        userId: req.userId,
        userRole: req.userRole,
      });

      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async pay(req, res, next) {
    try {
      const result = await confirmOrderPaymentUseCase.execute({
        userId: req.userId,
        userRole: req.userRole,
        orderId: req.params.orderId,
        paymentResult: {
          provider: PAYMENT_PROVIDER.SIMULATED,
          status: PAYMENT_STATUS.APPROVED,
          external_id: null,
        },
      });

      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async webhook(_req, res) {
    return res.status(501).json({
      message: 'Webhook de pagamento reservado para integração de gateway em PGT-1.',
    });
  }
}

module.exports = new OrderController();
