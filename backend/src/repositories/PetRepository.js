const prisma = require("../config/database");

class PetRepository {
  findManyByTutor(tutorId) {
    return prisma.pet.findMany({
      where: { tutor_id: tutorId, archived_at: null },
      orderBy: { created_at: "desc" },
    });
  }

  findByIdAndTutor(id, tutorId) {
    return prisma.pet.findFirst({
      where: { id, tutor_id: tutorId, archived_at: null },
    });
  }

  countByTutor(tutorId) {
    return prisma.pet.count({
      where: { tutor_id: tutorId, archived_at: null },
    });
  }

  create(data) {
    return prisma.pet.create({ data });
  }

  update(id, data) {
    return prisma.pet.update({ where: { id, archived_at: null }, data });
  }
}

module.exports = new PetRepository();
