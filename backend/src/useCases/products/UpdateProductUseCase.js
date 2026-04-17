const productRepository = require('../../repositories/ProductRepository');
const prisma = require('../../config/database');

class UpdateProductUseCase {
  async execute(product_id, provider_id, { name, category, pet_type, description, sku, stock_quantity, price, image_url }) {
    
    if (!product_id) {
      throw new Error("ID do produto é obrigatório.");
    }
    
    if (price !== undefined && price < 0) {
      throw new Error("O preço do produto não pode ser negativo.");
    }

    if (stock_quantity !== undefined && stock_quantity < 0) {
        throw new Error("A quantidade em estoque não pode ser negativa.");
    }

    const provider = await prisma.provider.findUnique({
      where: { user_id: provider_id }
    });

    if (!provider) {
      throw new Error("Perfil de Lojista não encontrado para este usuário.");
    }

    const currentProduct = await productRepository.findById(product_id);

    if (!currentProduct) {
      throw new Error("Produto não encontrado.");
    }

    if (currentProduct.provider_id !== provider.id) {
      throw new Error("Você não tem permissão para editar este produto.");
    }

    const updatedProduct = await productRepository.update(product_id, {
      name: name !== undefined ? name : currentProduct.name,
      category: category !== undefined ? category : currentProduct.category,
      pet_type: pet_type !== undefined ? pet_type : currentProduct.pet_type,
      description: description !== undefined ? description : currentProduct.description,
      sku: sku !== undefined ? sku : currentProduct.sku,
      stock_quantity: stock_quantity !== undefined ? stock_quantity : currentProduct.stock_quantity,
      price: price !== undefined ? price : currentProduct.price,
      image_url: image_url !== undefined ? image_url : currentProduct.image_url,
      updated_at: new Date()
    });

    return updatedProduct;
  }
}

module.exports = new UpdateProductUseCase();
