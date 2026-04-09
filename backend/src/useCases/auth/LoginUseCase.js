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