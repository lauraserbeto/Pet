const defaultProductRepository = require('../../repositories/ProductRepository');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { findOperationalStore } = require('../providers/providerAccess');

const EDITABLE_FIELDS = [
  'name',
  'category',
  'pet_type',
  'description',
  'sku',
  'stock_quantity',
  'price',
  'image_url',
];

// Os dados chegam validados por `updateProductSchema` (rota). Só o LOJISTA
// aprovado, ativo e dono do produto edita (E-01). Os erros agora são AppError:
// antes "não encontrado" e "sem permissão" viravam 500.
class UpdateProductUseCase {
  constructor({
    providerRepository = prisma.provider,
    productRepository = defaultProductRepository,
  } = {}) {
    this.providerRepository = providerRepository;
    this.productRepository = productRepository;
  }

  async execute({ productId, userId, userRole, data }) {
    const provider = await findOperationalStore({
      userId,
      userRole,
      providerRepository: this.providerRepository,
    });

    const currentProduct = await this.productRepository.findById(productId);

    if (!currentProduct) {
      throw AppError.notFound('Produto não encontrado.');
    }

    if (currentProduct.provider_id !== provider.id) {
      throw AppError.forbidden('Você não tem permissão para editar este produto.');
    }

    const changes = {};
    for (const field of EDITABLE_FIELDS) {
      if (data[field] !== undefined) changes[field] = data[field];
    }

    return await this.productRepository.update(productId, {
      ...changes,
      updated_at: new Date(),
    });
  }
}

module.exports = new UpdateProductUseCase();
module.exports.UpdateProductUseCase = UpdateProductUseCase;
