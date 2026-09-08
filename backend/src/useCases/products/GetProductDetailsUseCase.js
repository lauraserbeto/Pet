const prisma = require('../../config/database');

const PRODUCT_DETAILS_INCLUDE = {
  provider: {
    select: {
      id: true,
      business_name: true,
      description: true,
      status: true,
      created_at: true,
      user: {
        select: {
          full_name: true,
          avatar_url: true,
          phone: true
        }
      }
    }
  }
};

class GetProductDetailsUseCase {
  async execute(productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: PRODUCT_DETAILS_INCLUDE,
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    return {
      ...product,
      price: Number(product.price)
    };
  }
}

module.exports = new GetProductDetailsUseCase();
// Exportado para teste: garante que o document do parceiro não volte ao select.
module.exports.PRODUCT_DETAILS_INCLUDE = PRODUCT_DETAILS_INCLUDE;
