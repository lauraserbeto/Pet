/**
 * Regra única de completude do perfil público (auditoria visual G12, decisão
 * "mínimo + recomendados" de 20/11/2026).
 *
 * - `required`: o que decide se o parceiro aparece na vitrine. É exatamente a
 *   regra que a listagem pública já aplicava; nenhum parceiro hoje visível sai.
 * - `recommended`: melhora o perfil, mas não bloqueia a publicação.
 *
 * A vitrine (`ProviderController`) e `/providers/completeness` usam esta mesma
 * função, para o aviso do painel nunca contradizer a vitrine.
 */
const ROLE = { STORE: 2, HOTEL: 3, SITTER: 4 };
const RECOMMENDED_GALLERY_IMAGES = 3;

// Mesmo critério de antes (valor "truthy"), para não tirar ninguém da vitrine.
const filled = (value) => Boolean(value);
const count = (value) => (Array.isArray(value) ? value.length : 0);
const hasOperatingHours = (value) =>
  Boolean(value) && typeof value === "object" && Object.keys(value).length > 0;
// Na listagem os serviços já vêm filtrados por `is_active`; no endpoint de
// completude, idem (só `id`). Um serviço sem o campo conta como ativo.
const hasActiveService = (services) =>
  Array.isArray(services) && services.some((service) => service?.is_active !== false);

function getProfileCompleteness(provider) {
  const roleId = provider?.user?.role_id;
  const required = [];
  const recommended = [];

  if (!filled(provider?.description)) required.push("description");
  if (!filled(provider?.phone)) required.push("phone");
  if (!filled(provider?.city)) required.push("city");
  if (!filled(provider?.zip_code)) required.push("zip_code");

  if (roleId === ROLE.HOTEL || roleId === ROLE.SITTER) {
    if (!hasActiveService(provider?.services)) required.push("services");
  }
  if (roleId === ROLE.HOTEL) {
    const images = count(provider?.gallery_images);
    if (images < 1) required.push("gallery_images");
    else if (images < RECOMMENDED_GALLERY_IMAGES) recommended.push("gallery_images");
    if (count(provider?.allowed_animals) < 1) recommended.push("allowed_animals");
    if (count(provider?.amenities) < 1) recommended.push("amenities");
  }
  if (roleId === ROLE.SITTER && count(provider?.sitter_roles) < 1) {
    required.push("sitter_roles");
  }

  if (!filled(provider?.user?.avatar_url)) recommended.push("avatar_url");
  if (!hasOperatingHours(provider?.operating_hours)) recommended.push("operating_hours");

  return { isPublic: required.length === 0, required, recommended };
}

const isPublicProfileComplete = (provider) => getProfileCompleteness(provider).isPublic;

module.exports = {
  getProfileCompleteness,
  isPublicProfileComplete,
  RECOMMENDED_GALLERY_IMAGES,
};
