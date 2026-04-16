const productRepository = require('../../repositories/productRepository');

class CreateProductUseCase {
  async execute({ provider_id, name, category, description, sku, stock_quantity, price, image_url }) {
    
    if (!name || name.trim() === "") {
      throw new Error("O nome do produto é obrigatório.");
    }

    if (price === undefined || price < 0) {
      throw new Error("O preço do produto não pode ser negativo.");
    }

    if (stock_quantity < 0) {
        throw new Error("A quantidade em estoque não pode ser negativa.");
    }

    const product = await productRepository.create({
      provider_id,
      name,
      category: category || "GERAL",
      description,
      sku,
      stock_quantity: stock_quantity || 0,
      price,
      image_url,
      status: "ACTIVE" 
    });

    return product;
  }
}

module.exports = new CreateProductUseCase();