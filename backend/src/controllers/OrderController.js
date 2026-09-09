const createOrderUseCase = require('../useCases/orders/CreateOrderUseCase');

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
}

module.exports = new OrderController();
