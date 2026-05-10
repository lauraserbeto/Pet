const UserRepository = require('../../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    // --- BLOQUEIO PARA PARCEIROS REJEITADOS ---
    if (user.provider?.status === 'REJEITADO') {
        const reason = user.provider.rejection_reason || 'Sem motivo especificado pelo administrador.';
        const error = new Error(`Seu cadastro de parceiro foi recusado. Motivo: ${reason}`);
        error.statusCode = 403;
        throw error;
    }

    // --- BLOQUEIO DE LOGIN PARA PET SITTER EM ANÁLISE ---
    // Se for role 4 (PET_SITTER) e o status do provedor for PENDENTE, bloqueamos o login.
    if (user.role_id === 4 && user.provider?.status === 'PENDENTE' && user.onboarding_step === 'INCOMPLETE') {
        const error = new Error('Sua conta está em análise pelo administrador.');
        error.statusCode = 403;
        throw error;
    }

    // 3. Gerar o Token JWT (O "Crachá" de acesso)
    // O secret deve estar no seu .env
    const token = jwt.sign(
      { id: user.id, role_id: user.role_id },
      process.env.JWT_SECRET || 'secret_pet_plus',
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