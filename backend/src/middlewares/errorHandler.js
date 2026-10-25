const AppError = require('../utils/AppError');
const { captureError } = require('../config/sentry');

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Rota não encontrada: ${req.method} ${req.originalUrl}`));
}

/** "3,2 MB" / "100 KB" para mensagens de limite. */
function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

function errorHandler(err, req, res, _next) {
  // Erros do parser de corpo (express.json), antes de qualquer rota (E-03).
  // Antes caíam no fallback e respondiam 500.
  if (err?.type === 'entity.too.large') {
    const message = `Corpo da requisição acima do limite de ${formatBytes(err.limit)} desta rota.`;
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message, details: { limit: err.limit } },
      message,
    });
  }
  if (err?.type === 'entity.parse.failed') {
    const message = 'JSON malformado no corpo da requisição.';
    return res.status(400).json({ error: { code: 'INVALID_JSON', message }, message });
  }
  if (err?.type && Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    // Demais recusas do parser (charset/encoding não suportado, requisição abortada).
    const message = err.expose ? err.message : 'Corpo da requisição inválido.';
    return res.status(err.status).json({ error: { code: 'INVALID_BODY', message }, message });
  }

  // Zod errors (vindos do middleware validate)
  if (err?.name === 'ZodError') {
    const details = err.issues?.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', details },
      message: 'Dados inválidos',
    });
  }

  // Prisma known errors (códigos relevantes)
  if (err?.code === 'P2002') {
    return res.status(409).json({
      error: {
        code: 'UNIQUE_CONSTRAINT',
        message: 'Registro duplicado',
        details: { fields: err.meta?.target },
      },
      message: 'Registro duplicado',
    });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Recurso não encontrado' },
      message: 'Recurso não encontrado',
    });
  }
  if (err?.code === 'P2003') {
    return res.status(409).json({
      error: { code: 'FOREIGN_KEY_VIOLATION', message: 'Referência inválida' },
      message: 'Referência inválida',
    });
  }

  // AppError (erros operacionais explícitos). Só reporta os 5xx — 4xx são
  // fluxo esperado (validação, permissão, não encontrado) e virariam ruído.
  if (err instanceof AppError) {
    if (err.statusCode >= 500) captureError(err, req);
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
      message: err.message,
    });
  }

  // Fallback — erro inesperado. Loga com o correlation id (req.log vem do
  // pino-http) e devolve o requestId ao cliente para rastreio no suporte.
  const log = req.log || require('../config/logger');
  log.error({ err }, 'Erro não tratado');
  captureError(err, req);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor', requestId: req.id },
    message: 'Erro interno do servidor',
  });
}

module.exports = { errorHandler, notFoundHandler };
