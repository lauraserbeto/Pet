const UserRepository = require('../../repositories/UserRepository');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { FRONTEND_URL } = require('../../config/env');
const EmailService = require('../../services/EmailService');
const logger = require('../../config/logger');

const GENERIC_RESET_MESSAGE = 'Se esse e-mail estiver cadastrado, você receberá as instruções.';

// ── Helpers ──────────────────────────────────────────────────────────
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ── ForgotPasswordUseCase ─────────────────────────────────────────────
const ForgotPasswordUseCase = {
  async execute(email) {
    // 1. Verificar se o usuário existe (resposta genérica por segurança)
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Retornamos sucesso mesmo quando o email não existe (evita enumeração)
      return { message: GENERIC_RESET_MESSAGE };
    }

    // 2. Invalidar tokens anteriores deste usuário
    await prisma.passwordResetToken.updateMany({
      where: { user_id: user.id, used: false },
      data: { used: true },
    });

    // 3. Gerar token aleatório seguro de 32 bytes
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    // 4. Salvar no banco com expiração de 1 hora
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // +1h
      },
    });

    // 5. Enviar e-mail real de recuperação. A resposta HTTP continua genérica
    // tanto no sucesso quanto em falha de provider para evitar enumeração.
    const resetUrl = `${FRONTEND_URL}/redefinir-senha?token=${rawToken}`;
    try {
      await EmailService.sendPasswordReset(user.email, resetUrl);
    } catch (err) {
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }).catch((updateErr) => {
        logger.error({ err: updateErr, user_id: user.id }, 'Falha ao invalidar token de reset não enviado');
      });

      logger.error({ err, user_id: user.id }, 'Falha ao enviar e-mail de recuperação de senha');
    }

    return { message: GENERIC_RESET_MESSAGE };
  },
};

// ── ResetPasswordUseCase ──────────────────────────────────────────────
const ResetPasswordUseCase = {
  async execute(rawToken, newPassword) {
    if (!rawToken || !newPassword) {
      throw new Error('Token e nova senha são obrigatórios.');
    }

    if (newPassword.length < 8) {
      throw new Error('A senha deve ter no mínimo 8 caracteres.');
    }

    const tokenHash = hashToken(rawToken);

    // 1. Buscar o token no banco
    const record = await prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!record) {
      throw new Error('Token inválido ou já utilizado.');
    }

    if (record.used) {
      throw new Error('Este link de recuperação já foi utilizado.');
    }

    if (new Date() > record.expires_at) {
      // Marca como usado para evitar ataques de timing
      await prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      });
      throw new Error('Este link de recuperação expirou. Solicite um novo.');
    }

    // 2. Atualizar senha do usuário com bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: record.user_id },
      data: { password_hash: passwordHash, updated_at: new Date() },
    });

    // 3. Invalidar o token
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    });

    return { message: 'Senha atualizada com sucesso.' };
  },
};

module.exports = { ForgotPasswordUseCase, ResetPasswordUseCase };
