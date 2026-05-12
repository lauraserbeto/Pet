const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Rota não encontrada: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
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

  // AppError (erros operacionais explícitos)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
      message: err.message,
    });
  }

  // Fallback — erro inesperado
  console.error('[UNHANDLED ERROR]', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    message: 'Erro interno do servidor',
  });
}

module.exports = { errorHandler, notFoundHandler };
