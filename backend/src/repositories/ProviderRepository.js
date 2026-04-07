const prisma = require('../config/database'); // Ajuste o caminho se o seu arquivo do prisma estiver em outro lugar

class ProviderRepository {
  async findAll(status) {
    const whereClause = status ? { status } : {};

    return await prisma.provider.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
            phone: true,
            is_active: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }
}

module.exports = new ProviderRepository();