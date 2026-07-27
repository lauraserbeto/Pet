const { isApprovedProviderStatus, PROVIDER_STATUS } = require('../constants/providerStatus');

/**
 * Reduz os valores livres de `Provider.status` a três baldes estáveis.
 * Sem isso, o groupBy devolveria 'APROVADO', 'ATIVO' e 'ACTIVE' separados
 * (lojista/hotel gravam um, pet sitter grava outro).
 */
function bucketProviderStatus(status) {
  if (isApprovedProviderStatus(status)) return 'aprovados';
  if (status === PROVIDER_STATUS.REJECTED) return 'recusados';
  return 'pendentes';
}

/** Chave de dia local no formato YYYY-MM-DD. */
function toDayKey(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Agrupa timestamps por dia dentro de uma janela de `days` dias terminando em
 * `now`, preenchendo com 0 os dias sem registro (senão o gráfico ficaria com
 * buracos). O groupBy do Prisma agrupa por timestamp exato, por isso o
 * agrupamento por dia é feito aqui.
 */
function groupByDay(dates, days, now = new Date()) {
  const buckets = new Map();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.set(toDayKey(d), 0);
  }

  dates.forEach((raw) => {
    const key = toDayKey(raw);
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
  });

  return Array.from(buckets, ([date, count]) => ({ date, count }));
}

/** Converte uma lista de groupBy do Prisma em objeto { chave: contagem }. */
function toCountMap(rows, key, mapKey = (v) => String(v)) {
  return rows.reduce((acc, row) => {
    const name = mapKey(row[key]);
    acc[name] = (acc[name] || 0) + (row._count?._all ?? 0);
    return acc;
  }, {});
}

module.exports = { bucketProviderStatus, toDayKey, groupByDay, toCountMap };
