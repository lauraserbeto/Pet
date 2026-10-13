const prisma = require('../config/database');

class ServiceRepository {
  async create(data) {
    return await prisma.service.create({
      data
    });
  }

  async findByProviderId(providerId, { activeOnly = true } = {}) {
    return await prisma.service.findMany({
      where: {
        provider_id: providerId,
        ...(activeOnly ? { is_active: true } : {}),
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(id) {
    return await prisma.service.findUnique({
      where: { id }
    });
  }

  async update(id, data) {
    return await prisma.service.update({
      where: { id },
      data
    });
  }

  async deactivate(id) {
    return await prisma.service.update({
      where: { id },
      data: { is_active: false },
    });
  }
}

module.exports = new ServiceRepository();
