const prisma = require("../../config/database");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/AppError");
const { changePasswordSchema } = require("../../schemas/userSchemas");
const { PASSWORD_HASH_COST } = require("../../security/passwordPolicy");
const { lockCredentials } = require("../../security/credentialLock");
class ChangePasswordUseCase {
  async execute({ userId, currentPassword, newPassword }) {
    const values = changePasswordSchema.parse({ currentPassword, newPassword });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true },
    });
    if (!user?.password_hash)
      throw AppError.unauthorized("Usuário não possui senha definida");
    if (!(await bcrypt.compare(values.currentPassword, user.password_hash)))
      throw AppError.unauthorized("Senha atual incorreta");
    if (await bcrypt.compare(values.newPassword, user.password_hash))
      throw AppError.validation(
        "A nova senha deve ser diferente da senha atual",
      );
    const password_hash = await bcrypt.hash(
      values.newPassword,
      PASSWORD_HASH_COST,
    );
    await prisma.$transaction(
      async (tx) => {
        await lockCredentials(tx, userId);
        const changed = await tx.user.updateMany({
          where: {
            id: userId,
            password_hash: user.password_hash,
            OR: [{ is_active: true }, { is_active: null }],
          },
          data: { password_hash, updated_at: new Date() },
        });
        if (changed.count !== 1)
          throw AppError.conflict(
            "As credenciais mudaram. Entre novamente antes de alterar a senha.",
          );
        await tx.passwordResetToken.updateMany({
          where: { user_id: userId, used: false },
          data: { used: true },
        });
      },
      { timeout: 15000 },
    );
  }
}
module.exports = new ChangePasswordUseCase();
