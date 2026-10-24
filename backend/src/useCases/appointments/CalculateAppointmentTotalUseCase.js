const AppError = require('../../utils/AppError');

/**
 * Cálculo do total de um agendamento (AGD-1; fonte do preço pela DEC-B, 23/10/2026).
 *
 * Não expõe endpoint: é a regra reutilizável que a criação do agendamento
 * (AGD-2) consome.
 *
 * REGRAS DE COBRANÇA: o preço é o do SERVIÇO reservado (`Service.price`); o
 * papel do parceiro só define a unidade cobrada.
 *
 *   Hotel (role 3)  → `service.price` × número de DIÁRIAS
 *   Sitter (role 4) → `service.price` × número de HORAS
 *
 * `Provider.daily_rate`/`hourly_rate` continuam no perfil público, mas não
 * entram no total: um hotel com dois serviços cobra o preço de cada um.
 *
 * ARREDONDAMENTO — decisões tomadas aqui, porque o card pede que sejam
 * explícitas:
 *
 *   Diária = noite. O número de diárias é a diferença entre as DATAS de
 *   calendário de entrada e saída, no fuso do parceiro. Entrar dia 10 e sair
 *   dia 12 são 2 diárias, independentemente do horário. Entrada e saída no
 *   mesmo dia contam como 1 diária (mínimo), que é a regra de daycare.
 *
 *   Hora iniciada conta inteira. 90 minutos custam 2 horas; o mínimo é 1 hora.
 *   É a prática usual de serviço por hora e evita cobrar frações de centavo.
 *
 * FUSO: as diárias são contadas por data de calendário em `America/Sao_Paulo`,
 * não por diferença bruta de horas — senão uma estadia das 23h às 01h viraria
 * "0 diária". O Provider ainda não tem campo de fuso; quando tiver, trocar a
 * constante abaixo pelo fuso do parceiro.
 */

const BUSINESS_TIMEZONE = 'America/Sao_Paulo';

const PROVIDER_ROLE = {
  HOTEL: 3,
  SITTER: 4,
};

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60 * 1000;

/** Data de calendário (AAAA-MM-DD) no fuso do negócio. */
function toBusinessDate(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Diferença em dias entre duas datas de calendário. */
function calendarDaysBetween(start, end) {
  const startDate = new Date(`${toBusinessDate(start)}T00:00:00Z`);
  const endDate = new Date(`${toBusinessDate(end)}T00:00:00Z`);
  return Math.round((endDate - startDate) / (24 * 60 * MS_PER_MINUTE));
}

/** Diárias cobradas: noites entre entrada e saída, mínimo 1. */
function countDailyRates(startTime, endTime) {
  return Math.max(1, calendarDaysBetween(startTime, endTime));
}

/** Horas cobradas: hora iniciada conta inteira, mínimo 1. */
function countBillableHours(startTime, endTime) {
  const minutes = (endTime - startTime) / MS_PER_MINUTE;
  return Math.max(1, Math.ceil(minutes / MINUTES_PER_HOUR));
}

/** Decimal do Prisma sai como objeto/string — normaliza para número. */
function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** Arredonda para centavos, evitando lixo de ponto flutuante. */
function toCurrency(value) {
  return Math.round(value * 100) / 100;
}

class CalculateAppointmentTotalUseCase {
  /**
   * @param {object} params
   * @param {object} params.service   Serviço reservado, com `price`
   * @param {object} params.provider  Parceiro com `user.role_id` (define a unidade)
   * @param {Date|string} params.startTime
   * @param {Date|string} params.endTime
   * @returns {{ total: number, unit: 'DIARIA'|'HORA', quantity: number, unitPrice: number }}
   */
  execute({ service, provider, startTime, endTime }) {
    if (!service) {
      throw AppError.badRequest('Serviço é obrigatório para calcular o total.');
    }
    if (!provider) {
      throw AppError.badRequest('Parceiro é obrigatório para calcular o total.');
    }

    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw AppError.badRequest('Datas de início e fim inválidas.');
    }
    if (end <= start) {
      throw AppError.badRequest('A data de fim deve ser posterior à de início.');
    }

    const roleId = provider.user?.role_id ?? provider.role_id;

    if (roleId === PROVIDER_ROLE.HOTEL) {
      return this.#build(service.price, 'DIARIA', countDailyRates(start, end));
    }

    if (roleId === PROVIDER_ROLE.SITTER) {
      return this.#build(service.price, 'HORA', countBillableHours(start, end));
    }

    throw AppError.badRequest(
      `Apenas hotéis e pet sitters têm agendamento. Papel recebido: ${roleId ?? 'desconhecido'}.`
    );
  }

  #build(rawPrice, unit, quantity) {
    const unitPrice = toNumber(rawPrice);

    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      throw AppError.badRequest(
        'Serviço sem preço definido — não é possível calcular o total do agendamento.'
      );
    }

    return {
      total: toCurrency(unitPrice * quantity),
      unit,
      quantity,
      unitPrice: toCurrency(unitPrice),
    };
  }
}

module.exports = new CalculateAppointmentTotalUseCase();
module.exports.CalculateAppointmentTotalUseCase = CalculateAppointmentTotalUseCase;
// Exportados para teste e para os limites de período da criação (E-04).
module.exports.countDailyRates = countDailyRates;
module.exports.countBillableHours = countBillableHours;
module.exports.BUSINESS_TIMEZONE = BUSINESS_TIMEZONE;
