/**
 * Rótulos da completude do perfil público (espelha
 * `backend/src/utils/profileCompleteness.js`). `missingFields` impede a
 * publicação na vitrine; `recommendedFields` só melhora o perfil (G12).
 */
export interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  recommendedFields?: string[];
}

const REQUIRED_LABELS: Record<string, string> = {
  description: "Descrição",
  phone: "Telefone",
  zip_code: "CEP",
  city: "Cidade",
  services: "Ao menos um serviço ativo",
  gallery_images: "Ao menos uma imagem na galeria",
  sitter_roles: "Tipos de serviço",
};

const RECOMMENDED_LABELS: Record<string, string> = {
  avatar_url: "Foto de perfil",
  operating_hours: "Horário de funcionamento",
  allowed_animals: "Animais aceitos",
  amenities: "Comodidades",
  gallery_images: "Três ou mais imagens na galeria",
};

export const requiredFieldLabel = (field: string) => REQUIRED_LABELS[field] ?? field;
export const recommendedFieldLabel = (field: string) => RECOMMENDED_LABELS[field] ?? field;
