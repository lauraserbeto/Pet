const createReviewUseCase = require('../useCases/reviews/CreateReviewUseCase');
const listReviewsUseCase = require('../useCases/reviews/ListReviewsUseCase');
const { createReviewSchema, listReviewsQuerySchema } = require('../schemas/reviewSchemas');

// Erros via next(AppError) — o errorHandler central os mapeia para o status correto.
class ReviewController {
  async create(req, res, next) {
    try {
      const data = createReviewSchema.parse(req.body);

      const review = await createReviewUseCase.execute({
        userId: req.userId,
        ...data,
      });

      return res.status(201).json({
        message: 'Avaliação registrada com sucesso!',
        review,
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      // Express 5: req.query é read-only — validar com Zod sem reatribuir a raiz.
      const { product_id, provider_id, page, limit } = listReviewsQuerySchema.parse(req.query);

      const { data, total, totalPages } = await listReviewsUseCase.execute({
        product_id,
        provider_id,
        page,
        limit,
      });

      res.set({
        'X-Total-Count': String(total),
        'X-Page': String(page),
        'X-Limit': String(limit),
        'X-Total-Pages': String(totalPages),
      });

      return res.status(200).json(data);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ReviewController();

