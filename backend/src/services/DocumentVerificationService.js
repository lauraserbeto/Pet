class DocumentVerificationService {
  
  static async verifyCNPJ(cnpj) {
    const cleanCNPJ = cnpj.replace(/\D/g, ''); // Remove pontuação
    
    if (cleanCNPJ.length !== 14) {
      throw new Error("O CNPJ deve ter 14 dígitos.");
    }

    // Validação de API removida a pedido do usuário
    return { message: "Bypass mode" };
  }

  // 2. Validação Matemática Oficial do CPF (Evita "111.111.111-11")
  static isValidCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) soma += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
  }
}

module.exports = DocumentVerificationService;