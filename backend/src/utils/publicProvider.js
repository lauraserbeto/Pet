// Contrato explícito: colunas futuras não se tornam públicas automaticamente.
const PRIVATE_PROVIDER_FIELDS = [
  "document",
  "document_type",
  "rejection_reason",
];
const PROVIDER_FIELDS = [
  "id",
  "business_name",
  "status",
  "description",
  "city",
  "state",
  "payment_policy",
  "daily_rate",
  "hourly_rate",
  "operating_hours",
  "allowed_animals",
  "amenities",
  "gallery_images",
  "rules_policies",
  "highlights",
  "sitter_roles",
  "created_at",
  "rating_avg",
  "rating_count",
  // Derivado do menor preço entre serviços ativos (já públicos) nas vitrines
  // de hotéis e sitters. Sem ele, todo card mostrava "Preço não informado"
  // e a ordenação por preço não funcionava (auditoria visual G11).
  "starting_price",
];
const USER_FIELDS = ["full_name", "avatar_url", "role_id"];
const PRODUCT_FIELDS = [
  "id",
  "provider_id",
  "name",
  "description",
  "category",
  "pet_type",
  "price",
  "image_url",
  "stock_quantity",
  "status",
  "rating_avg",
  "rating_count",
];
const SERVICE_FIELDS = [
  "id",
  "provider_id",
  "name",
  "category",
  "description",
  "price",
  "duration_minutes",
  "is_active",
  "billing_unit",
  "created_at",
];
const CONTACT_FIELDS = ["phone", "zip_code", "address_line"];
const pick = (value, fields) =>
  Object.fromEntries(
    fields
      .filter((key) => value && Object.hasOwn(value, key))
      .map((key) => [key, value[key]]),
  );
function toPublicProvider(provider, { bookedContact = false } = {}) {
  if (!provider) return provider;
  const result = pick(provider, PROVIDER_FIELDS);
  // Só estabelecimento comercial publica contato. Cuidadores e perfis sem
  // papel comprovado ficam restritos à cidade/UF no contrato público.
  if (bookedContact || [2, 3].includes(provider.user?.role_id))
    Object.assign(result, pick(provider, CONTACT_FIELDS));
  if (provider.user) result.user = pick(provider.user, USER_FIELDS);
  if (Array.isArray(provider.products))
    result.products = provider.products.map((row) => pick(row, PRODUCT_FIELDS));
  if (Array.isArray(provider.services))
    result.services = provider.services.map((row) => pick(row, SERVICE_FIELDS));
  if (provider._count)
    result._count = pick(provider._count, ["products", "services"]);
  return result;
}
const toPublicProviders = (providers) =>
  Array.isArray(providers)
    ? providers.map((provider) => toPublicProvider(provider))
    : providers;
module.exports = {
  toPublicProvider,
  toPublicProviders,
  PRIVATE_PROVIDER_FIELDS,
};
