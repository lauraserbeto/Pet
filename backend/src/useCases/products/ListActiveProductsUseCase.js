const prisma = require('../../config/database');

const PROVIDER_INCLUDE = {
  provider: {
    select: {
      id: true,
      business_name: true,
      document: true,
      status: true,
      user: {
        select: {
          avatar_url: true,
          full_name: true,
        },
      },
    },
  },
};

class ListActiveProductsUseCase {
  // Paginação por offset (skip/take) + contagem total. `take: limit` garante
  // que a query nunca é não-limitada (antes: findMany sem take).
  async execute({ page = 1, limit = 100 } = {}) {
    const where = { status: 'ACTIVE' };
    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: PROVIDER_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const data = products.map((product) => ({
      ...product,
      price: Number(product.price),
      provider_name: product.provider?.business_name || 'Loja Parceira',
      provider_avatar: product.provider?.user?.avatar_url || null,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new ListActiveProductsUseCase();
