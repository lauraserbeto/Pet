// Serializador de Provider para a listagem administrativa (E-02).
//
// A listagem de parceiros (`GET /providers`) era pública e devolvia nome,
// e-mail e status de todos os parceiros — inclusive pendentes e recusados — a
// qualquer visitante. Ela passou a ser exclusiva do admin, que precisa
// justamente dos dados de moderação (CPF/CNPJ e motivo da recusa) que as rotas
// públicas escondem (ver publicProvider.js).
//
// Lista explícita de campos: uma coluna nova no Provider não aparece aqui sem
// decisão, e nada do usuário além do necessário sai (nunca `password_hash`).

const ADMIN_PROVIDER_SELECT = Object.freeze({
  id: true,
  user_id: true,
  business_name: true,
  document: true,
  document_type: true,
  status: true,
  rejection_reason: true,
  created_at: true,
  user: {
    select: {
      full_name: true,
      email: true,
      role_id: true,
      is_active: true,
    },
  },
});

/** Achata os dados do usuário no formato que o painel de aprovações consome. */
function toAdminProvider(provider) {
  if (!provider) return provider;

  const { user, ...fields } = provider;
  return {
    ...fields,
    full_name: user?.full_name ?? null,
    email: user?.email ?? null,
    role_id: user?.role_id ?? null,
    // `is_active` é Boolean? com default true: null vale como ativo.
    is_active: user?.is_active !== false,
  };
}

/** Versão para listas. */
function toAdminProviders(providers) {
  return Array.isArray(providers) ? providers.map(toAdminProvider) : providers;
}

module.exports = { ADMIN_PROVIDER_SELECT, toAdminProvider, toAdminProviders };
