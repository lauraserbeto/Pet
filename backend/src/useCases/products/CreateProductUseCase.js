const defaultProductRepository = require('../../repositories/ProductRepository');
const prisma = require('../../config/database');
const { findOperationalStore } = require('../providers/providerAccess');

// Os dados chegam validados por `createProductSchema` (rota). Aqui fica a regra
// de negócio: só LOJISTA aprovado e com conta ativa cria produto (decisão 5 do
// PLANO, E-01) — antes bastava existir qualquer cadastro de parceiro.
class CreateProductUseCase {
  constructor({
    providerRepository = prisma.provider,
    productRepository = defaultProductRepository,
  } = {}) {
    this.providerRepository = providerRepository;
    this.productRepository = productRepository;
  }

  async execute({
    userId,
    userRole,
    name,
    category,
    pet_type,
    description,
    sku,
    stock_quantity,
    price,
    image_url,
  }) {
    const provider = await findOperationalStore({
      userId,
      userRole,
      providerRepository: this.providerRepository,
    });

    const generatedSku = sku && sku.trim() !== ''
      ? sku.trim()
      : 'PET-' + Date.now().toString().slice(-6);

    return await this.productRepository.create({
      provider_id: provider.id,
      name,
      category: category || 'GERAL',
      pet_type: pet_type || 'TODOS',
      description,
      sku: generatedSku,
      stock_quantity: stock_quantity ?? 0,
      price,
      image_url,
      status: 'ACTIVE',
    });
  }
}

module.exports = new CreateProductUseCase();
module.exports.CreateProductUseCase = CreateProductUseCase;
