const prisma = require('../config/database');
const AppError = require('../utils/AppError');

class ProductRepository {
  // Criar um novo produto
  async create(data) {
    return await prisma.product.create({
      data
    });
  }

  // Buscar produtos de um lojista específico (para o Dashboard dele)
  async findByProviderId(providerId) {
    return await prisma.product.findMany({
      where: { provider_id: providerId },
      orderBy: { created_at: 'desc' }
    });
  }

  // Buscar os detalhes de um produto específico
  async findById(productId) {
    return await prisma.product.findUnique({
      where: { id: productId }
    });
  }

  // Atualizar um produto
  async update(id, data) {
    return await prisma.product.update({
      where: { id },
      data
    });
  }

  // Decrementar estoque de um produto com suporte a transação
  async decrementStock(productId, quantity, tx = prisma) {
    const result = await tx.product.updateMany({
      where: { id: productId, status: 'ACTIVE', stock_quantity: { gte: quantity } },
      data: {
        stock_quantity: {
          decrement: quantity,
        },
      },
    });
    if (result.count !== 1) throw AppError.conflict('Estoque insuficiente ou produto indisponível no momento da finalização.', { product_id: productId });
    return result;
  }

  // Excluir (ou desativar) um produto
  async delete(id) {
    return await prisma.product.delete({
      where: { id }
    });
  }
}

module.exports = new ProductRepository();
