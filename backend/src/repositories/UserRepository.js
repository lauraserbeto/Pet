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