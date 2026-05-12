const AppError = require('../utils/AppError');

class CepService {
  /**
   * Valida o CEP no ViaCEP. Retorna os dados normalizados quando o CEP existe.
   * - Rejeita (422) se o ViaCEP responder `erro: true`.
   * - Em falha de rede/timeout, faz fail-open (retorna null) para não bloquear
   *   o usuário por indisponibilidade de terceiros — o regex já garantiu formato.
   */
  static async validate(rawCep) {
    const cleanCep = String(rawCep || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      throw AppError.validation('CEP deve ter 8 dígitos');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        return null; // fail-open
      }

      const data = await response.json();
      if (data?.erro) {
        throw AppError.validation('CEP não encontrado');
      }

      return {
        cep: cleanCep,
        rua: data.logradouro ?? '',
        bairro: data.bairro ?? '',
        cidade: data.localidade ?? '',
        estado: data.uf ?? '',
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      // network/abort/timeout — fail-open
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = CepService;
