const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const { normalizeEmail } = require('../security/emailIdentity');

class UserRepository {
  async findByEmail(email) {
    const normalized = normalizeEmail(email);
    const matches = await prisma.$queryRaw`SELECT id FROM users WHERE petplus_normalize_email(email) = ${normalized} LIMIT 2`;
    if (matches.length > 1) throw new AppError('Não foi possível identificar a conta com segurança.', 409, 'EMAIL_COLLISION');
    if (!matches.length) return null;
    return await prisma.user.findUnique({
      where: { id: matches[0].id },
      include: {
        provider: true
      }
    });
  }

  // Estado mínimo da conta consultado pelo authMiddleware a cada requisição
  // (E-01): conta ativa, papel e status do cadastro de parceiro.
  async findAuthState(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role_id: true,
        is_active: true,
        provider: { select: { status: true } },
      },
    });
  }

  async create(userData) {
    return await prisma.user.create({
      data: userData,
    });
  }

  async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }
}

module.exports = new UserRepository();
