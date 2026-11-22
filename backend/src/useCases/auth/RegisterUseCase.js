const UserRepository = require("../../repositories/UserRepository");
const bcrypt = require("bcryptjs");
const prisma = require("../../config/database");
const { PROVIDER_STATUS } = require("../../constants/providerStatus");
const { PASSWORD_HASH_COST } = require("../../security/passwordPolicy");
const { normalizeDocument } = require("../../security/documentIdentity");
const { registerSchema } = require("../../schemas/authSchemas");
const AppError = require("../../utils/AppError");

class RegisterUseCase {
  async execute(input) {
    // Também valida chamadas internas; não depende apenas do middleware HTTP.
    const values = registerSchema.parse(input);
    let userExists;
    try {
      userExists = await UserRepository.findByEmail(values.email);
    } catch (error) {
      if (error.code === "EMAIL_COLLISION")
        throw AppError.conflict(
          "Este e-mail já está cadastrado em nossa plataforma.",
        );
      throw error;
    }
    if (userExists)
      throw AppError.conflict(
        "Este e-mail já está cadastrado em nossa plataforma.",
      );
    const commercial = [2, 3, 4].includes(values.role_id);
    const document = commercial ? normalizeDocument(values.document) : null;
    if (commercial) {
      const duplicates =
        await prisma.$queryRaw`SELECT id FROM providers WHERE petplus_normalize_document(document) = ${document} LIMIT 1`;
      if (duplicates.length)
        throw AppError.conflict(
          "Este documento já está cadastrado em nossa plataforma.",
        );
    }
    const password_hash = await bcrypt.hash(
      values.password,
      PASSWORD_HASH_COST,
    );
    try {
      const user = await prisma.user.create({
        data: {
          full_name: values.full_name,
          email: values.email,
          password_hash,
          role_id: values.role_id,
          terms_accepted: values.terms_accepted,
          terms_accepted_at: new Date(),
          terms_version: values.terms_version,
          ...(commercial
            ? {
                provider: {
                  create: {
                    business_name: values.business_name,
                    document,
                    document_type: values.document_type,
                    status: PROVIDER_STATUS.PENDING,
                  },
                },
              }
            : {}),
        },
      });
      const { password_hash: _omit, ...safe } = user;
      return safe;
    } catch (error) {
      // O índice arbitra a corrida depois da consulta, sem revelar documento/conta.
      if (error.code === "P2002")
        throw AppError.conflict(
          "E-mail ou documento já cadastrado em nossa plataforma.",
        );
      throw error;
    }
  }
}
module.exports = new RegisterUseCase();
