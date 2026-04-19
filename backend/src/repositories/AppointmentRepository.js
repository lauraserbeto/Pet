const prisma = require('../config/database');

class AppointmentRepository {
  async create(data) {
    return await prisma.appointment.create({
      data
    });
  }

  async findByProviderId(providerId) {
    return await prisma.appointment.findMany({
      where: { provider_id: providerId },
      include: {
        pet: {
          include: {
            tutor: true
          }
        },
        service: true
      },
      orderBy: { start_time: 'asc' }
    });
  }

  async findByCustomerId(customerId) {
    return await prisma.appointment.findMany({
      where: {
        pet: {
          tutor_id: customerId
        }
      },
      include: {
        provider: true,
        service: true,
        pet: true
      },
      orderBy: { start_time: 'asc' }
    });
  }

  async findById(id) {
    return await prisma.appointment.findUnique({
      where: { id },
      include: {
        pet: {
          include: {
            tutor: true
          }
        },
        service: true,
        provider: true
      }
    });
  }

  async update(id, data) {
    return await prisma.appointment.update({
      where: { id },
      data
    });
  }
}

module.exports = new AppointmentRepository();