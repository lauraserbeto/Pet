const productRepository = require('../../repositories/ProductRepository');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

class ListProviderProductsUseCase {
  async execute(provider_id) {
    if (!provider_id) {
      throw AppError.unauthorized('ID do usuário não fornecido.');
    }

    // Localizar o Lojista vinculado a este Usuário (req.userId)
    const provider = await prisma.provider.findUnique({
      where: { user_id: provider_id }
    });

    if (!provider) {
      throw AppError.forbidden('Perfil de Lojista não encontrado para este usuário.');
    }

    const products = await productRepository.findByProviderId(provider.id);
    return products;
  }
}

module.exports = new ListProviderProductsUseCase();
