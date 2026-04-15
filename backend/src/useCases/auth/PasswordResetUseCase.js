const UserRepository = require('../../repositories/UserRepository');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');

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
      return { message: 'Se esse e-mail estiver cadastrado, você receberá as instruções.' };
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
    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // +1h
      },
    });

    // 5. ── ESPAÇO PARA ENVIO DE E-MAIL ──────────────────────────────
    // Substitua abaixo pelo seu provider (Resend, Nodemailer, etc.)
    //
    // Exemplo com Resend:
    // const { Resend } = require('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'no-reply@petplus.com.br',
    //   to: user.email,
    //   subject: 'Redefinição de senha — Pet+',
    //   html: `<p>Clique <a href="${process.env.FRONTEND_URL}/redefinir-senha?token=${rawToken}">aqui</a> para redefinir sua senha. O link expira em 1 hora.</p>`,
    // });
    //
    // Exemplo com Nodemailer:
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ from, to: user.email, subject, html });
    // ────────────────────────────────────────────────────────────────

    // Por enquanto, loga o token no console para testes locais
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/redefinir-senha?token=${rawToken}`;
    console.log(`\n🔑 [DEV] Link de recuperação para ${user.email}:\n${resetUrl}\n`);

    return { message: 'Se esse e-mail estiver cadastrado, você receberá as instruções.' };
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
