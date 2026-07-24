// Coletor de métricas RED (Rate, Errors, Duration) em memória, por rota.
// Alimenta GET /api/metrics — permite responder "qual a rota mais lenta / com
// mais erros esta sessão?" sem instrumentação ad hoc (golden signals do SRE).
//
// Limitações conscientes: store em memória por instância (reinicia no deploy;
// em multi-instância, exportar para Prometheus/OpenTelemetry). O endpoint
// deveria ser restrito à rede interna/auth em produção.
const store = new Map();
const MAX_SAMPLES = 500; // janela deslizante de latências por rota

function record(key, ms, isError) {
  let m = store.get(key);
  if (!m) {
    m = { count: 0, errors: 0, durations: [] };
    store.set(key, m);
  }
  m.count += 1;
  if (isError) m.errors += 1;
  m.durations.push(ms);
  if (m.durations.length > MAX_SAMPLES) m.durations.shift();
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    // Usa o TEMPLATE da rota (ex.: /:id) para não explodir a cardinalidade.
    const routePath = req.route && req.route.path ? req.route.path : req.path || '';
    const key = `${req.method} ${(req.baseUrl || '') + routePath}`;
    record(key, ms, res.statusCode >= 500);
  });
  next();
}

function getMetrics() {
  const routes = {};
  for (const [key, m] of store.entries()) {
    const sorted = [...m.durations].sort((a, b) => a - b);
    const sum = m.durations.reduce((a, b) => a + b, 0);
    routes[key] = {
      count: m.count,
      errors: m.errors,
      error_rate: m.count ? Number((m.errors / m.count).toFixed(4)) : 0,
      latency_ms: {
        avg: m.durations.length ? Number((sum / m.durations.length).toFixed(1)) : 0,
        p50: Number(percentile(sorted, 50).toFixed(1)),
        p95: Number(percentile(sorted, 95).toFixed(1)),
        p99: Number(percentile(sorted, 99).toFixed(1)),
      },
    };
  }
  return { uptime_s: Math.round(process.uptime()), routes };
}

function metricsHandler(req, res) {
  return res.status(200).json(getMetrics());
}

function _reset() {
  store.clear();
}

module.exports = { metricsMiddleware, getMetrics, metricsHandler, record, _reset };
