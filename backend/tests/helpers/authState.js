// Estado de conta simulado para os testes de rota (E-01).
//
// O authMiddleware passou a consultar o banco a cada requisição (conta ativa,
// papel e status do cadastro de parceiro). Os testes de rota não usam banco:
// assinam o token com `signTestToken`, que registra a conta, e o
// UserRepository passa a responder a partir desse registro.
//
// Cada arquivo de teste roda em processo próprio no `node --test`, então o
// registro não vaza entre arquivos.

const jwt = require('jsonwebtoken');
const UserRepository = require('../../src/repositories/UserRepository');

const accounts = new Map();

UserRepository.findAuthState = async (id) => accounts.get(id) ?? null;

/**
 * Assina um JWT de teste e registra o estado da conta correspondente.
 * `role_id` ausente gera um token sem papel (caso usado nos testes de carrinho).
 */
function signTestToken({ id, role_id, is_active = true, provider_status = null }) {
  accounts.set(id, {
    id,
    role_id,
    is_active,
    provider: provider_status ? { status: provider_status } : null,
  });

  const payload = { id };
  if (role_id !== undefined) payload.role_id = role_id;
  return jwt.sign(payload, process.env.JWT_SECRET);
}

/** Altera o estado de uma conta já registrada (ex.: desativar no meio do teste). */
function setAccountState(id, changes) {
  const current = accounts.get(id);
  if (!current) throw new Error(`Conta de teste "${id}" não registrada`);
  accounts.set(id, { ...current, ...changes });
}

module.exports = { signTestToken, setAccountState };
