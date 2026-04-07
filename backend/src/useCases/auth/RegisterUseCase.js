const UserRepository = require('../../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');

class RegisterUseCase {
  async execute({ full_name, email, password, role_id, business_name, document, terms_accepted }) {
    // 1. Validação básica
    if (!full_name || !email || !password || !role_id) {
      throw new Error('Nome, e-mail, senha e tipo de usuário são obrigatórios.');
    }

    if (password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }

    // 2. Verificar se o e-mail já está em uso
    const userExists = await UserRepository.findByEmail(email);
    if (userExists) {
      throw new Error('Este e-mail já está cadastrado em nossa plataforma.');
    }

    // 3. Criptografar a senha (O "Salto" de segurança)
    // O número 10 é o "Cost Factor" (quanto maior, mais seguro, porém mais lento)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Salvar no banco de dados via Repositório
    const newUser = await prisma.user.create({
      data: {
        full_name,
        email,
        password_hash: hashedPassword,
        role_id,
        terms_accepted: true,
        ...([2, 3, 4].includes(role_id) ? {
          provider: {
            create: {
              business_name: business_name,
              document: document,
              status: 'PENDENTE'
            }
          }
        } : {})
      }
    });

    // 5. Retornar os dados do usuário (REMOVENDO A SENHA por segurança)
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}

module.exports = new RegisterUseCase();