const UserRepository = require('../../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const DocumentVerificationService = require('../../services/DocumentVerificationService');

class RegisterUseCase {
  async execute({ full_name, email, password, role_id, business_name, document, terms_accepted }) {
    if (!full_name || !email || !password || !role_id) {
      throw new Error('Nome, e-mail, senha e tipo de usuário são obrigatórios.');
    }

    if (password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }

    const userExists = await UserRepository.findByEmail(email);
    if (userExists) {
      throw new Error('Este e-mail já está cadastrado em nossa plataforma.');
    }

    if ([2, 3, 4].includes(role_id)) {
      if (!document) {
        throw new Error("O documento (CPF ou CNPJ) é obrigatório para contas comerciais.");
      }

      const cleanDoc = document.replace(/\D/g, '');

      if (cleanDoc.length === 14) {
        await DocumentVerificationService.verifyCNPJ(cleanDoc);
      } else if (cleanDoc.length === 11) {
        if (!DocumentVerificationService.isValidCPF(cleanDoc)) {
          throw new Error("O CPF informado é matematicamente inválido.");
        }
      } else {
        throw new Error("Formato de documento inválido. Envie um CPF ou CNPJ.");
      }
    }


    const hashedPassword = await bcrypt.hash(password, 10);

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

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}

module.exports = new RegisterUseCase();