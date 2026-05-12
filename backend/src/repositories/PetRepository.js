const prisma = require('../config/database');

const BLOCKING_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED'];

class PetRepository {
  findManyByTutor(tutorId) {
    return prisma.pet.findMany({
      where: { tutor_id: tutorId },
      orderBy: { created_at: 'desc' },
    });
  }

  findByIdAndTutor(id, tutorId) {
    return prisma.pet.findFirst({
      where: { id, tutor_id: tutorId },
    });
  }

  countByTutor(tutorId) {
    return prisma.pet.count({ where: { tutor_id: tutorId } });
  }

  create(data) {
    return prisma.pet.create({ data });
  }

  update(id, data) {
    return prisma.pet.update({ where: { id }, data });
  }

  delete(id) {
    return prisma.pet.delete({ where: { id } });
  }

  countActiveAppointments(petId) {
    return prisma.appointment.count({
      where: {
        pet_id: petId,
        status: { in: BLOCKING_APPOINTMENT_STATUSES },
        start_time: { gt: new Date() },
      },
    });
  }
}

module.exports = new PetRepository();
