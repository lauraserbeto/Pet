const prisma = require('../../config/database');

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
    const where = product_id ? { product_id } : { provider_id };
    const skip = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      this.db.review.count({ where }),
      this.db.review.findMany({
        where,
        include: { author: { select: AUTHOR_SELECT } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data: reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new ListReviewsUseCase();
module.exports.ListReviewsUseCase = ListReviewsUseCase;
