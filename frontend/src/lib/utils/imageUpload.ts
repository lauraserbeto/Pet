/**
 * Regras de upload de imagem — as mesmas da API (`backend/src/schemas/imageSchemas.js`, E-03).
 *
 * As imagens vão como data URL base64 dentro do JSON. O tipo e o tamanho do
 * ARQUIVO são conferidos antes da conversão: assim o usuário é avisado na hora,
 * e a API não recebe nada que recusaria.
 */

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const IMAGE_ACCEPTED_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

export const GALLERY_MAX_IMAGES = 8;
export const EVALUATION_MAX_PHOTOS = 6;

/** Valor para o atributo `accept` do `<input type="file">`. */
export const acceptAttribute = (types: readonly string[] = IMAGE_ACCEPTED_TYPES) => types.join(",");

const TYPE_NAMES: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
};

function describeTypes(types: readonly string[]): string {
  const names = types.map((type) => TYPE_NAMES[type] ?? type);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} ou ${names[names.length - 1]}` : names[0];
}

/** Mensagem de erro para o arquivo, ou `null` se ele pode ser enviado. */
export function validateImageFile(
  file: File,
  acceptedTypes: readonly string[] = IMAGE_ACCEPTED_TYPES
): string | null {
  if (!acceptedTypes.includes(file.type)) {
    return `"${file.name}": formato não aceito. Envie ${describeTypes(acceptedTypes)}.`;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return `"${file.name}" tem mais de 2 MB. Escolha uma imagem menor.`;
  }
  return null;
}

/** Lê o arquivo como data URL (base64). */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
