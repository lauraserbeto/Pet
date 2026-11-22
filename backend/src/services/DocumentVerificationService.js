const { isValidCPF, isValidCNPJ } = require("../security/documentIdentity");
const AppError = require("../utils/AppError");
class DocumentVerificationService {
  static isValidCPF = isValidCPF;
  static isValidCNPJ = isValidCNPJ;
  static async verifyCNPJ(document) {
    if (!isValidCNPJ(document))
      throw AppError.validation(
        "O CNPJ informado possui formato ou dígitos verificadores inválidos.",
      );
    return { mathematically_valid: true };
  }
}
module.exports = DocumentVerificationService;
