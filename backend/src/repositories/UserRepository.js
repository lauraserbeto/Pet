const prisma = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
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