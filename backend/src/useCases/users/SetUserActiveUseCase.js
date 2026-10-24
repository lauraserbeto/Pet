const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

const ADMIN_ROLE = 1;

const USER_SUMMARY_SELECT = Object.freeze({
  id: true,
  full_name: true,
  email: true,
  role_id: true,
  is_active: true,
});

// Ativar/desativar conta (decisão 9 do PLANO, DEC-G).
//
// Desativar é suspensão da conta: o login e os tokens já emitidos param de
// valer (authMiddleware consulta `is_active` a cada requisição) e os produtos
// e serviços somem da vitrine. É diferente de recusar o cadastro de parceiro
// (`REJEITADO`), que tem motivo, e-mail e fluxo de correção.
class SetUserActiveUseCase {
  constructor({ userRepository = prisma.user } = {}) {
    this.userRepository = userRepository;
  }

  async execute({ adminId, targetUserId, isActive }) {
    if (targetUserId === adminId) {
      throw AppError.validation('Você não pode alterar o estado da própria conta.');
    }

    const user = await this.userRepository.findUnique({
      where: { id: targetUserId },
      select: { id: true, role_id: true },
    });

    if (!user) {
      throw AppError.notFound('Usuário não encontrado.');
    }

    if (user.role_id === ADMIN_ROLE) {
      throw AppError.forbidden('Contas de administrador não podem ser desativadas por esta rota.');
    }

    return await this.userRepository.update({
      where: { id: targetUserId },
      data: { is_active: isActive, updated_at: new Date() },
      select: USER_SUMMARY_SELECT,
    });
  }
}

module.exports = new SetUserActiveUseCase();
module.exports.SetUserActiveUseCase = SetUserActiveUseCase;
