const prisma = require('../config/database');

// Dados do tutor que o parceiro precisa para atender o agendamento (AUD-17,
// antecipado no E-04): nada de hash de senha, avatar ou estado da conta.
const APPOINTMENT_TUTOR_SELECT = {
  id: true,
  full_name: true,
  phone: true,
  email: true,
};

// Include único das respostas de agendamento (criação, listagens, detalhe e
// troca de status), para que todas tragam os mesmos campos.
const APPOINTMENT_INCLUDE = {
  pet: { include: { tutor: { select: APPOINTMENT_TUTOR_SELECT } } },
  service: true,
  provider: true,
};

class AppointmentRepository {
  async create(data) {
    return await prisma.appointment.create({
      data
    });
  }

  async findByProviderId(providerId) {
    return await prisma.appointment.findMany({
      where: { provider_id: providerId },
      include: APPOINTMENT_INCLUDE,
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
      include: APPOINTMENT_INCLUDE,
      orderBy: { start_time: 'asc' }
    });
  }

  async findById(id) {
    return await prisma.appointment.findUnique({
      where: { id },
      include: APPOINTMENT_INCLUDE
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
module.exports.APPOINTMENT_INCLUDE = APPOINTMENT_INCLUDE;
module.exports.APPOINTMENT_TUTOR_SELECT = APPOINTMENT_TUTOR_SELECT;
