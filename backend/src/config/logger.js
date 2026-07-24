const pino = require('pino');
const { NODE_ENV } = require('./env');

// Logger estruturado (JSON, uma linha por evento) pronto para agregadores
// (Loki/Datadog/Elastic). Cada requisição recebe um correlation id (req.id)
// injetado pelo pino-http em app.js.
const level =
  process.env.LOG_LEVEL ||
  (NODE_ENV === 'test' ? 'silent' : NODE_ENV === 'production' ? 'info' : 'debug');

const logger = pino({
  level,
  // Redação defensiva de dados sensíveis — nunca vazar segredos/PII nos logs.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'password_hash',
      'token',
      '*.password',
      '*.password_hash',
      '*.token',
    ],
    remove: true,
  },
});

module.exports = logger;
