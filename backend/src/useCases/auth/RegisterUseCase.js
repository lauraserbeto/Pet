const UserRepository = require('../../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const DocumentVerificationService = require('../../services/DocumentVerificationService');

// IDs de roles que OBRIGATORIAMENTE exigem CNPJ (Lojista e Hotel)
const CNPJ_ONLY_ROLES = [2, 3];
// IDs de roles com documento obrigatório (Lojista, Hotel, Pet Sitter)
const COMMERCIAL_ROLES = [2, 3, 4];

class RegisterUseCase {
  async execute({ full_name, email, password, role_id, business_name, document, document_type, terms_accepted }) {
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

    // --- VALIDAÇÃO DE DOCUMENTO PARA CONTAS COMERCIAIS ---
    if (COMMERCIAL_ROLES.includes(role_id)) {
      if (!document) {
        throw new Error("O documento (CPF ou CNPJ) é obrigatório para contas comerciais.");
      }

      if (!document_type || !['CPF', 'CNPJ'].includes(document_type)) {
        throw new Error("O tipo de documento (document_type) deve ser 'CPF' ou 'CNPJ'.");
      }

      // VALIDAÇÃO DE SEGURANÇA: Lojistas e Hotéis DEVEM usar CNPJ
      if (CNPJ_ONLY_ROLES.includes(role_id) && document_type === 'CPF') {
        throw new Error("Lojistas e Hotéis devem obrigatoriamente utilizar CNPJ.");
      }

      const cleanDoc = document.replace(/\D/g, '');

      if (document_type === 'CNPJ') {
        if (cleanDoc.length !== 14) {
          throw new Error("O CNPJ deve ter 14 dígitos.");
        }
        await DocumentVerificationService.verifyCNPJ(cleanDoc);
      } else if (document_type === 'CPF') {
        if (cleanDoc.length !== 11) {
          throw new Error("O CPF deve ter 11 dígitos.");
        }
        if (!DocumentVerificationService.isValidCPF(cleanDoc)) {
          throw new Error("O CPF informado é matematicamente inválido.");
        }
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
        ...(COMMERCIAL_ROLES.includes(role_id) ? {
          provider: {
            create: {
              business_name: business_name,
              document: document,
              document_type: document_type,
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