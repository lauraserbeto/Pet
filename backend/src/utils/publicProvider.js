// Serializador de Provider para rotas públicas (SEC-1).
//
// As listagens públicas (hotéis, sitters, lojas, parceiros) e o detalhe do
// parceiro devolviam o registro cru do banco, expondo o CPF/CNPJ do parceiro a
// qualquer visitante — sem autenticação nenhuma.
//
// Em vez de um `select` gigante em cada consulta (que precisaria ser atualizado
// a cada coluna nova e quebraria o filtro de completude), a resposta passa por
// aqui antes de sair.

// Colunas do Provider que nunca podem aparecer em rota pública.
const PRIVATE_PROVIDER_FIELDS = [
  'document',          // CPF/CNPJ
  'document_type',     // revela se o CPF/CNPJ é de pessoa física
  'rejection_reason',  // nota interna do admin sobre a recusa
];

/** Remove os campos privados de um provider. Aceita `null` sem quebrar. */
function toPublicProvider(provider) {
  if (!provider) return provider;

  const publicProvider = { ...provider };
  for (const field of PRIVATE_PROVIDER_FIELDS) {
    delete publicProvider[field];
  }
  return publicProvider;
}

/** Versão para listas. */
function toPublicProviders(providers) {
  return Array.isArray(providers) ? providers.map(toPublicProvider) : providers;
}

module.exports = { toPublicProvider, toPublicProviders, PRIVATE_PROVIDER_FIELDS };
