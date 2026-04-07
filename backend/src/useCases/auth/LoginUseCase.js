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

    // 2.5. Verificação de Status (Para Provedores)
    // Se o usuário for Lojista, Hotel ou Pet Sitter, verifica se a conta está ativa
    if ([2, 3, 4].includes(user.role_id)) {
      
      // Se não tem cadastro de provedor ou está PENDENTE
      if (!user.provider || user.provider.status === 'PENDENTE') {
        throw new Error('Sua conta está em análise! Aguarde a aprovação do administrador.');
      }

      // Se foi REJEITADO
      if (user.provider.status === 'REJEITADO') {
        throw new Error(`Cadastro rejeitado. Motivo: ${user.provider.rejection_reason || 'Não informado'}`);
      }
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
        business_name: user.provider?.business_name || null
      },
      token
    };
  }
}

module.exports = new LoginUseCase();