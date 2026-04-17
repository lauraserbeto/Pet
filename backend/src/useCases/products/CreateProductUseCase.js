const productRepository = require('../../repositories/ProductRepository');
const prisma = require('../../config/database');

class CreateProductUseCase {
  async execute({ provider_id, name, category, pet_type, description, sku, stock_quantity, price, image_url }) {
    
    if (!name || name.trim() === "") {
      throw new Error("O nome do produto é obrigatório.");
    }

    if (price === undefined || price < 0) {
      throw new Error("O preço do produto não pode ser negativo.");
    }

    if (stock_quantity < 0) {
        throw new Error("A quantidade em estoque não pode ser negativa.");
    }

    // Localizar o Lojista vinculado a este Usuário (req.userId)
    const provider = await prisma.provider.findUnique({
      where: { user_id: provider_id }
    });

    if (!provider) {
      throw new Error("Perfil de Lojista não encontrado para este usuário.");
    }

    const generatedSku = sku && sku.trim() !== "" 
      ? sku 
      : 'PET-' + Date.now().toString().slice(-6);

    const product = await productRepository.create({
      provider_id: provider.id,
      name,
      category: category || "GERAL",
      pet_type: pet_type || "TODOS",
      description,
      sku: generatedSku,
      stock_quantity: stock_quantity || 0,
      price,
      image_url,
      status: "ACTIVE" 
    });

    return product;
  }
}

module.exports = new CreateProductUseCase();