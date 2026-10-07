const createOrderUseCase = require('../useCases/orders/CreateOrderUseCase');
const confirmOrderPaymentUseCase = require('../useCases/orders/ConfirmOrderPaymentUseCase');
const { PAYMENT_PROVIDER, PAYMENT_STATUS } = require('../constants/orderStatus');
const listCustomerOrdersUseCase = require('../useCases/orders/ListCustomerOrdersUseCase');
const listProviderOrdersUseCase = require('../useCases/orders/ListProviderOrdersUseCase');
const updateOrderStatusUseCase = require('../useCases/orders/UpdateOrderStatusUseCase');
const { listOrdersQuerySchema, updateOrderStatusSchema } = require('../schemas/orderSchemas');

class OrderController {
  async create(req, res, next) {
    try {
      const result = await createOrderUseCase.execute({
        userId: req.userId,
        userRole: req.userRole,
        ...req.body // <-- Adicionamos esta linha para receber os dados do Frontend
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

  /** GET /api/v1/orders — Pedidos do tutor autenticado */
  async listMine(req, res, next) {
    try {
      const parsed = listOrdersQuerySchema.safeParse(req.query);
      const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };

      const result = await listCustomerOrdersUseCase.execute({
        userId: req.userId,
        page,
        limit,
      });

      res.set('X-Total-Count', String(result.total));
      res.set('X-Page', String(result.page));
      res.set('X-Limit', String(result.limit));
      res.set('X-Total-Pages', String(result.totalPages));

      return res.status(200).json(result.orders);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /api/v1/orders/received e GET /api/v1/providers/orders — Pedidos recebidos pelo parceiro */
  async listReceived(req, res, next) {
    try {
      const parsed = listOrdersQuerySchema.safeParse(req.query);
      const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };

      const result = await listProviderOrdersUseCase.execute({
        userId: req.userId,
        page,
        limit,
      });

      res.set('X-Total-Count', String(result.total));
      res.set('X-Page', String(result.page));
      res.set('X-Limit', String(result.limit));
      res.set('X-Total-Pages', String(result.totalPages));

      return res.status(200).json(result.orders);
    } catch (err) {
      return next(err);
    }
  }

  async webhook(_req, res) {
    return res.status(501).json({
      message: 'Webhook de pagamento reservado para integração de gateway em PGT-1.',
    });
  }

  /** PATCH /api/v1/orders/:id/status — Atualiza status com máquina de estados e ownership */
  async updateStatus(req, res, next) {
    try {
      const parsed = updateOrderStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        const AppError = require('../utils/AppError');
        const messages = parsed.error.errors.map((e) => e.message).join(', ');
        return next(AppError.validation(messages));
      }

      const { status } = parsed.data;
      const orderId = req.params.id;

      const result = await updateOrderStatusUseCase.execute({
        orderId,
        status,
        userId: req.userId,
      });

      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new OrderController();
