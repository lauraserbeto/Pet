const prisma = require('../../config/database');

class GetProductDetailsUseCase {
  async execute(productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        provider: {
          select: {
            id: true,
            business_name: true,
            document: true,
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
      }
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
