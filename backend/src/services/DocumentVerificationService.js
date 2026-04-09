class DocumentVerificationService {
  
  static async verifyCNPJ(cnpj) {
    const cleanCNPJ = cnpj.replace(/\D/g, ''); // Remove pontuação
    
    if (cleanCNPJ.length !== 14) {
      throw new Error("O CNPJ deve ter 14 dígitos.");
    }

    try {
      // Usando a BrasilAPI
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      
      if (response.status === 404) {
        throw new Error("CNPJ não encontrado na base da Receita Federal.");
      }

      // TRATAMENTO DE ERROS MAIS INTELIGENTE
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Erro na BrasilAPI:", response.status, errorData);
        
        if (response.status === 429) {
          throw new Error("Muitas requisições à Receita Federal. Aguarde um minuto e tente novamente.");
        }
        if (response.status === 400) {
          throw new Error("O CNPJ informado é inválido.");
        }
        throw new Error("A Receita Federal está offline no momento. Tente novamente mais tarde.");
      }

      const data = await response.json();

      if (data.descricao_situacao_cadastral !== "ATIVA") {
        throw new Error(`Cadastro rejeitado. Este CNPJ encontra-se: ${data.descricao_situacao_cadastral}`);
      }

      return data; 
    } catch (error) {
      // BYPASS DE DESENVOLVIMENTO (O pulo do gato!)
      // Se a API externa cair e você estiver testando localmente, o código deixa passar.
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Bypass de CNPJ ativado devido a falha na API externa.');
        return { message: "Bypass mode" };
      }

      // Se estiver em produção, ele devolve o erro para o usuário
      throw new Error(error.message);
    }
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