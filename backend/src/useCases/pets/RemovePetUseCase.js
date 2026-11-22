const prisma = require("../../config/database");
const AppError = require("../../utils/AppError");
const { blocksPetRemoval } = require("../../utils/resourceDeletionPolicy");
class RemovePetUseCase {
  constructor({ db = prisma } = {}) {
    this.db = db;
  }
  async execute({ petId, userId }) {
    return this.db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM pets WHERE id = ${petId}::uuid AND tutor_id = ${userId}::uuid AND archived_at IS NULL FOR UPDATE`;
        const pet = await tx.pet.findFirst({
          where: { id: petId, tutor_id: userId, archived_at: null },
          select: { id: true },
        });
        if (!pet) throw AppError.notFound("Pet não encontrado");
        const states = await tx.appointment.findMany({
          where: { pet_id: petId },
          select: { status: true },
          distinct: ["status"],
        });
        if (states.some((row) => blocksPetRemoval(row.status)))
          throw AppError.conflict(
            "Não é possível remover este pet enquanto houver agendamentos em andamento. Conclua ou cancele os atendimentos antes de tentar novamente.",
          );
        if (states.length)
          await tx.pet.update({
            where: { id: petId },
            data: { archived_at: new Date(), updated_at: new Date() },
          });
        else await tx.pet.delete({ where: { id: petId } });
      },
      { timeout: 15000 },
    );
  }
}
module.exports = new RemovePetUseCase();
module.exports.RemovePetUseCase = RemovePetUseCase;
