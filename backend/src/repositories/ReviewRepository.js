const prisma = require('../config/database');
const { ORDER_STATUS } = require('../constants/orderStatus');
const { APPOINTMENT_STATUS } = require('../constants/appointmentStatus');

function reviewTargetWhere({ product_id, provider_id }) {
  return product_id ? {
    product_id, provider_id: null, appointment_id: null,
    order: { is: { status: ORDER_STATUS.COMPLETED } },
  } : {
    provider_id, product_id: null, order_id: null,
    appointment: { is: { status: APPOINTMENT_STATUS.COMPLETED } },
  };
}

// On-read: um GROUP BY para o conjunto retornado, sem cache nem coluna derivada.
// Origens não concluídas não entram no agregado, inclusive registros legados.
class ReviewRepository {
  constructor({ db = prisma } = {}) { this.db = db; }

  async #withRatings(items, field, origin) {
    if (!items.length) return [];
    const ids = [...new Set(items.map(item => item.id))];
    const products = field === 'product_id';
    const groups = await this.db.review.groupBy({
      by: [field],
      where: {
        [field]: { in: ids },
        [products ? 'provider_id' : 'product_id']: null,
        [products ? 'appointment_id' : 'order_id']: null,
        [origin]: { is: { status: products ? ORDER_STATUS.COMPLETED : APPOINTMENT_STATUS.COMPLETED } },
      },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const ratings = new Map(groups.map(group => [group[field], {
      rating_avg: group._avg.rating === null ? null : Math.round(Number(group._avg.rating) * 10) / 10,
      rating_count: group._count._all,
    }]));
    return items.map(item => ({ ...item, ...(ratings.get(item.id) || { rating_avg: null, rating_count: 0 }) }));
  }

  withProductRatings(items) { return this.#withRatings(items, 'product_id', 'order'); }
  withProviderRatings(items) { return this.#withRatings(items, 'provider_id', 'appointment'); }

  async summary(target) {
    const groups = await this.db.review.groupBy({
      by: ['rating'], where: reviewTargetWhere(target), _count: { _all: true },
    });
    const count = groups.reduce((sum, item) => sum + item._count._all, 0);
    const total = groups.reduce((sum, item) => sum + item.rating * item._count._all, 0);
    return {
      rating_avg: count ? Math.round(total / count * 10) / 10 : null,
      rating_count: count,
      distribution: [5, 4, 3, 2, 1].map(rating => ({ rating, count: groups.find(item => item.rating === rating)?._count._all || 0 })),
    };
  }
}

module.exports = new ReviewRepository();
module.exports.ReviewRepository = ReviewRepository;
module.exports.reviewTargetWhere = reviewTargetWhere;
