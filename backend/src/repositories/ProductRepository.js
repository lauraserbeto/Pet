const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

  // Excluir (ou desativar) um produto
  async delete(id) {
    return await prisma.product.delete({
      where: { id }
    });
  }
}

module.exports = new ProductRepository();