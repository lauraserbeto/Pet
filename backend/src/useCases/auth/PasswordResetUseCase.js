const UserRepository = require("../../repositories/UserRepository");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../../config/database");
const { FRONTEND_URL } = require("../../config/env");
const EmailService = require("../../services/EmailService");
const logger = require("../../config/logger");
const AppError = require("../../utils/AppError");
const { emailSchema } = require("../../security/emailIdentity");
const { PASSWORD_HASH_COST } = require("../../security/passwordPolicy");
const { lockCredentials } = require("../../security/credentialLock");
const { resetPasswordSchema } = require("../../schemas/authSchemas");
const GENERIC_RESET_MESSAGE =
  "Se esse e-mail estiver cadastrado, você receberá as instruções.";
const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");
const ForgotPasswordUseCase = {
  async execute(email) {
    const normalized = emailSchema.parse(email);
    let user;
    try {
      user = await UserRepository.findByEmail(normalized);
    } catch (error) {
      if (error.code === "EMAIL_COLLISION")
        return { message: GENERIC_RESET_MESSAGE };
      throw error;
    }
    if (!user || user.is_active === false)
      return { message: GENERIC_RESET_MESSAGE };
    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetToken = await prisma.$transaction(async (tx) => {
      await lockCredentials(tx, user.id);
      await tx.passwordResetToken.updateMany({
        where: { user_id: user.id, used: false },
        data: { used: true },
      });
      return tx.passwordResetToken.create({
        data: {
          user_id: user.id,
          token_hash: hashToken(rawToken),
          expires_at: new Date(Date.now() + 3600000),
        },
      });
    });
    const resetUrl = `${FRONTEND_URL}/redefinir-senha?token=${rawToken}`;
    try {
      await EmailService.sendPasswordReset(normalized, resetUrl);
    } catch {
      // Não registrar URL, token, corpo do e-mail ou o objeto bruto do provider.
      await prisma.passwordResetToken
        .update({ where: { id: resetToken.id }, data: { used: true } })
        .catch(() => {
          logger.error(
            { user_id: user.id, code: "RESET_INVALIDATION_FAILED" },
            "Falha ao invalidar token não enviado",
          );
        });
      logger.error(
        { user_id: user.id, code: "RESET_DELIVERY_FAILED" },
        "Falha ao enviar recuperação de senha",
      );
    }
    return { message: GENERIC_RESET_MESSAGE };
  },
};
const ResetPasswordUseCase = {
  async execute(rawToken, newPassword) {
    const parsed = resetPasswordSchema.parse({
      token: rawToken,
      password: newPassword,
    });
    const tokenHash = hashToken(parsed.token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: { select: { password_hash: true } } },
    });
    if (!record) throw AppError.badRequest("Token inválido ou já utilizado.");
    if (record.used)
      throw AppError.badRequest("Este link de recuperação já foi utilizado.");
    if (new Date() >= record.expires_at)
      throw AppError.badRequest(
        "Este link de recuperação expirou. Solicite um novo.",
      );
    if (
      record.user?.password_hash &&
      (await bcrypt.compare(parsed.password, record.user.password_hash))
    )
      throw AppError.validation(
        "A nova senha deve ser diferente da senha atual.",
      );
    const passwordHash = await bcrypt.hash(parsed.password, PASSWORD_HASH_COST);
    await prisma.$transaction(
      async (tx) => {
        await lockCredentials(tx, record.user_id);
        const consumed = await tx.passwordResetToken.updateMany({
          where: {
            id: record.id,
            user_id: record.user_id,
            used: false,
            expires_at: { gt: new Date() },
          },
          data: { used: true },
        });
        if (consumed.count !== 1)
          throw AppError.badRequest("Token inválido ou já utilizado.");
        const changed = await tx.user.updateMany({
          where: {
            id: record.user_id,
            password_hash: record.user.password_hash,
            OR: [{ is_active: true }, { is_active: null }],
          },
          data: { password_hash: passwordHash, updated_at: new Date() },
        });
        if (changed.count !== 1)
          throw AppError.conflict(
            "As credenciais mudaram. Solicite um novo link de recuperação.",
          );
        await tx.passwordResetToken.updateMany({
          where: { user_id: record.user_id, used: false },
          data: { used: true },
        });
      },
      { timeout: 15000 },
    );
    return { message: "Senha atualizada com sucesso." };
  },
};
module.exports = { ForgotPasswordUseCase, ResetPasswordUseCase };
