const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const UserRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');
const { PROVIDER_STATUS } = require('../constants/providerStatus');

// Rotas que um parceiro com cadastro REJEITADO ainda pode usar (E-01, P1):
// corrigir e reenviar o cadastro, cuidar da própria conta e as duas leituras
// que o app dispara sozinho ao logar. Todo o resto responde 403 até o reenvio.
const REJECTED_PROVIDER_ALLOWED_ROUTES = new Set([
  'GET /api/v1/users/me',
  'PUT /api/v1/users/me',
  'PATCH /api/v1/users/me/password',
  'GET /api/v1/providers/me',
  'PUT /api/v1/providers/me',
  'POST /api/v1/providers/me/resubmit',
  'GET /api/v1/cart',
  'GET /api/v1/favorites/ids',
]);

function isAllowedForRejectedProvider(req) {
  const path = req.originalUrl.split('?')[0].replace(/\/+$/, '');
  return REJECTED_PROVIDER_ALLOWED_ROUTES.has(`${req.method} ${path}`);
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Token erro' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (!decoded?.id) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // O token só prova quem é o usuário. Conta ativa, papel e status do parceiro
  // vêm do banco a cada requisição (E-01): desativar a conta ou recusar o
  // cadastro vale na requisição seguinte, sem esperar o token de 1 dia expirar.
  const account = await UserRepository.findAuthState(decoded.id);
  if (!account || account.is_active === false) {
    return next(
      new AppError('Conta desativada. Entre em contato com o suporte.', 401, 'ACCOUNT_DISABLED')
    );
  }

  req.userId = account.id;
  req.userRole = account.role_id;
  req.providerStatus = account.provider?.status ?? null;

  if (req.providerStatus === PROVIDER_STATUS.REJECTED && !isAllowedForRejectedProvider(req)) {
    return next(
      new AppError(
        'Cadastro recusado: corrija e reenvie seu cadastro para voltar a usar a plataforma.',
        403,
        'PROVIDER_REJECTED'
      )
    );
  }

  return next();
}

module.exports = authMiddleware;
module.exports.REJECTED_PROVIDER_ALLOWED_ROUTES = REJECTED_PROVIDER_ALLOWED_ROUTES;
