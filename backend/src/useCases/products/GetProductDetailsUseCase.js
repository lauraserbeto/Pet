const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { PROVIDER_ROLES, operationalProviderWhere } = require('../providers/providerAccess');

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
  // Detalhe público: só produto ativo de lojista aprovado e com conta ativa (E-01).
  // Para o visitante, produto de parceiro fora da vitrine é o mesmo que inexistente.
  async execute(productId) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        status: 'ACTIVE',
        provider: operationalProviderWhere({ roleId: PROVIDER_ROLES.STORE }),
      },
      include: PRODUCT_DETAILS_INCLUDE,
    });

    if (!product) {
      throw AppError.notFound('Produto não encontrado.');
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
