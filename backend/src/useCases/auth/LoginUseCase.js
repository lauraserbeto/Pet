const UserRepository = require('../../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { PROVIDER_STATUS, isApprovedProviderStatus } = require('../../constants/providerStatus');

// Lojista (2) e Hotel (3) só acessam a plataforma depois da aprovação do admin.
// O Pet Sitter (4) é exceção deliberada: precisa logar ainda PENDENTE para
// preencher o onboarding/avaliação — só depois disso o admin pode aprová-lo.
const ROLES_REQUIRING_APPROVAL = [2, 3];

class LoginUseCase {
  async execute(email, password) {
    // 1. Verificar se o usuário existe
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('E-mail ou senha inválidos.');
    }

    // 2. Verificar se a senha bate (Comparando o hash)
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('E-mail ou senha inválidos.');
    }

    // --- BLOQUEIO DE CONTA DESATIVADA ---
    // `is_active` é Boolean? com default true: null/undefined valem como ativo,
    // então só barra quando o admin desativou explicitamente.
    if (user.is_active === false) {
      const error = new Error('Conta desativada. Entre em contato com o suporte.');
      error.statusCode = 403;
      throw error;
    }

    // --- BLOQUEIO PARA PARCEIROS REJEITADOS ---
    if (user.provider?.status === PROVIDER_STATUS.REJECTED) {
        const reason = user.provider.rejection_reason || 'Sem motivo especificado pelo administrador.';
        const error = new Error(`Seu cadastro de parceiro foi recusado. Motivo: ${reason}`);
        error.statusCode = 403;
        throw error;
    }

    // --- BLOQUEIO DE ACESSO ANTES DA APROVAÇÃO (Lojista e Hotel) ---
    // Depois da migração STA-1, APROVADO é o único status que libera acesso.
    if (ROLES_REQUIRING_APPROVAL.includes(user.role_id) && !isApprovedProviderStatus(user.provider?.status)) {
        const error = new Error('Seu cadastro está em análise. Você poderá acessar a plataforma assim que for aprovado pelo administrador.');
        error.statusCode = 403;
        throw error;
    }

    // 3. Gerar o Token JWT (O "Crachá" de acesso)
    // O secret deve estar no seu .env
    const token = jwt.sign(
      { id: user.id, role_id: user.role_id },
      JWT_SECRET,
      { expiresIn: '1d' } // Expira em 1 dia
    );

    // 4. Retornar dados essenciais (sem a senha!)
    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
        onboarding_step: user.onboarding_step,
        business_name: user.provider?.business_name || null,
        provider_status: user.provider?.status || null
      },
      token
    };
  }
}

module.exports = new LoginUseCase();
