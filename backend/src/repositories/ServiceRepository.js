const prisma = require('../config/database');

class ServiceRepository {
  async create(data) {
    return await prisma.service.create({
      data
    });
  }

  async findByProviderId(providerId) {
    return await prisma.service.findMany({
      where: { provider_id: providerId },
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

  async delete(id) {
    return await prisma.service.delete({
      where: { id }
    });
  }
}

module.exports = new ServiceRepository();