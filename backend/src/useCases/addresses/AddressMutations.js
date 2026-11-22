const prisma = require("../../config/database");
const AppError = require("../../utils/AppError");
const {
  blocksLastAddressRemoval,
} = require("../../utils/resourceDeletionPolicy");
class AddressMutations {
  constructor({ db = prisma } = {}) {
    this.db = db;
  }
  async run(userId, action) {
    try {
      return await this.db.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
          return action(tx);
        },
        { isolationLevel: "Serializable", timeout: 15000 },
      );
    } catch (error) {
      if (error.code === "P2034")
        throw AppError.conflict(
          "Os endereços ou pedidos mudaram durante a operação. Atualize a página e tente novamente.",
        );
      throw error;
    }
  }
  async owned(tx, userId, id) {
    const address = await tx.address.findFirst({
      where: { id, user_id: userId },
    });
    if (!address) throw AppError.notFound("Endereço não encontrado");
    return address;
  }
  create(userId, payload) {
    return this.run(userId, async (tx) => {
      const count = await tx.address.count({ where: { user_id: userId } });
      if (count >= 5)
        throw AppError.conflict("Limite de 5 endereços por usuário atingido");
      return tx.address.create({
        data: {
          user_id: userId,
          cep: payload.cep,
          rua: payload.rua,
          numero: payload.numero || "",
          complemento: payload.complemento || null,
          bairro: payload.bairro,
          cidade: payload.cidade,
          estado: payload.estado,
          is_default: count === 0,
        },
      });
    });
  }
  update(userId, id, payload) {
    return this.run(userId, async (tx) => {
      await this.owned(tx, userId, id);
      return tx.address.update({ where: { id }, data: payload });
    });
  }
  setDefault(userId, id) {
    return this.run(userId, async (tx) => {
      await this.owned(tx, userId, id);
      await tx.address.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      });
      return tx.address.update({ where: { id }, data: { is_default: true } });
    });
  }
  remove(userId, id) {
    return this.run(userId, async (tx) => {
      const address = await this.owned(tx, userId, id);
      const count = await tx.address.count({ where: { user_id: userId } });
      if (count === 1) {
        const states = await tx.order.findMany({
          where: { customer_id: userId },
          select: { status: true },
          distinct: ["status"],
        });
        if (states.some((row) => blocksLastAddressRemoval(row.status)))
          throw AppError.conflict(
            "Não é possível excluir o único endereço enquanto houver pedidos em andamento. Confira seus pedidos ou cadastre outro endereço.",
          );
      }
      await tx.address.delete({ where: { id } });
      if (address.is_default && count > 1) {
        const next = await tx.address.findFirst({
          where: { user_id: userId },
          orderBy: [{ created_at: "desc" }, { id: "asc" }],
          select: { id: true },
        });
        if (next) {
          await tx.address.updateMany({
            where: { user_id: userId, is_default: true },
            data: { is_default: false },
          });
          await tx.address.update({
            where: { id: next.id },
            data: { is_default: true },
          });
        }
      }
    });
  }
}
module.exports = new AddressMutations();
module.exports.AddressMutations = AddressMutations;
