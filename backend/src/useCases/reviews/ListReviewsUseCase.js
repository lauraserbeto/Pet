const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { ReviewRepository, reviewTargetWhere } = require('../../repositories/ReviewRepository');

// Campos públicos do autor — nunca expor password_hash nem document.
const AUTHOR_SELECT = Object.freeze({
  id: true,
  full_name: true,
  avatar_url: true,
});

class ListReviewsUseCase {
  constructor({ db = prisma } = {}) {
    this.db = db;
  }

  async execute({ product_id, provider_id, page = 1, limit = 20 }) {
    const where = reviewTargetWhere({ product_id, provider_id });
    const skip = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      this.db.review.count({ where }),
      this.db.review.findMany({
        where,
        include: { author: { select: AUTHOR_SELECT } },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return { data: reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  summary(target) { return new ReviewRepository({ db: this.db }).summary(target); }

  async mine({ userId, userRole, ...origin }) {
    if (userRole !== 5) throw AppError.forbidden('Apenas tutores podem consultar suas avaliações.');
    return this.db.review.findFirst({ where: { author_id: userId, ...origin }, include: { author: { select: AUTHOR_SELECT } } });
  }
}

module.exports = new ListReviewsUseCase();
module.exports.ListReviewsUseCase = ListReviewsUseCase;
