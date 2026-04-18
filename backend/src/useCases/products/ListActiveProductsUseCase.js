const prisma = require('../../config/database');

class ListActiveProductsUseCase {
  async execute() {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        provider: {
          select: {
            id: true,
            business_name: true,
            document: true,
            status: true,
            user: {
              select: {
                avatar_url: true,
                full_name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return products.map(product => {
      // Formata a resposta com nome da loja pro card
      return {
        ...product,
        price: Number(product.price),
        provider_name: product.provider?.business_name || 'Loja Parceira',
        provider_avatar: product.provider?.user?.avatar_url || null
      };
    });
  }
}

module.exports = new ListActiveProductsUseCase();
