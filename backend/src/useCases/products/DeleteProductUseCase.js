const defaultProductRepository = require('../../repositories/ProductRepository');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { findOperationalStore } = require('../providers/providerAccess');

class DeleteProductUseCase {
  constructor({
    providerRepository = prisma.provider,
    productRepository = defaultProductRepository,
  } = {}) {
    this.providerRepository = providerRepository;
    this.productRepository = productRepository;
  }

  async execute(productId, userId, userRole) {
    // Papel LOJISTA, cadastro aprovado e conta ativa (E-01).
    const provider = await findOperationalStore({
      userId,
      userRole,
      providerRepository: this.providerRepository,
    });

    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw AppError.notFound('Produto não encontrado.');
    }

    if (product.provider_id !== provider.id) {
      throw AppError.forbidden('Você não tem permissão para excluir este produto.');
    }

    try {
      await this.productRepository.delete(productId);
    } catch (error) {
      if (error?.code === 'P2003') {
        throw AppError.conflict(
          'Produto vinculado a pedidos; não é possível excluir.',
          { product_id: productId }
        );
      }
      throw error;
    }

    return product;
  }
}

module.exports = new DeleteProductUseCase();
module.exports.DeleteProductUseCase = DeleteProductUseCase;
