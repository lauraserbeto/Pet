const { z } = require('zod');

// Regras únicas das imagens enviadas à API (E-03, AUD-03).
//
// Sem armazenamento de arquivos (STO-1), as imagens chegam como data URL
// base64 dentro do JSON: avatar, galeria do perfil, imagem do produto e fotos
// da avaliação do Pet Sitter. O teto vale para o ARQUIVO decodificado — o mesmo
// número que o frontend confere em `file.size` antes de converter.

const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const IMAGE_TYPES = Object.freeze(['jpeg', 'png', 'webp']);

const GALLERY_MAX_IMAGES = 8;
const EVALUATION_MAX_PHOTOS = 6;

// Maior data URL aceita: prefixo + base64 de IMAGE_MAX_BYTES (~2,67 MB de texto).
// Usado também para dimensionar o limite do corpo das rotas de upload.
const IMAGE_DATA_URL_MAX_CHARS = 'data:image/jpeg;base64,'.length + 4 * Math.ceil(IMAGE_MAX_BYTES / 3);

const DATA_URL_REGEX = /^data:image\/([a-z]+);base64,([A-Za-z0-9+/]+={0,2})$/i;
const HTTPS_URL_REGEX = /^https:\/\/\S+$/i;
const HTTP_URL_REGEX = /^http:\/\/\S+$/i;

const TYPE_ALIASES = { jpg: 'jpeg' };

/** Bytes do arquivo representado por um texto base64. */
function base64DecodedBytes(base64) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

function describeTypes(types) {
  const names = types.map((type) => (type === 'jpeg' ? 'JPEG' : type === 'webp' ? 'WebP' : type.toUpperCase()));
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} ou ${names.at(-1)}` : names[0];
}

/**
 * Imagem como data URL base64 (tipos permitidos, até IMAGE_MAX_BYTES) ou
 * endereço `https`. `allowHttp` aceita também `http` (produtos antigos).
 */
function imageSchema({ types = IMAGE_TYPES, allowHttp = false, label = 'Imagem' } = {}) {
  const allowed = describeTypes(types);
  const urlHint = allowHttp ? 'http(s)' : 'https';

  return z.string().superRefine((value, ctx) => {
    if (HTTPS_URL_REGEX.test(value) || (allowHttp && HTTP_URL_REGEX.test(value))) return;

    if (value.length > IMAGE_DATA_URL_MAX_CHARS + 16) {
      ctx.addIssue({ code: 'custom', message: `${label} muito grande (máx. 2 MB).` });
      return;
    }

    const match = DATA_URL_REGEX.exec(value);
    if (!match) {
      ctx.addIssue({
        code: 'custom',
        message: `${label} inválida: envie um arquivo ${allowed} (até 2 MB) ou um endereço ${urlHint}.`,
      });
      return;
    }

    const rawType = match[1].toLowerCase();
    const type = TYPE_ALIASES[rawType] ?? rawType;
    if (!types.includes(type)) {
      ctx.addIssue({ code: 'custom', message: `${label}: tipo não permitido. Envie ${allowed}.` });
      return;
    }

    if (base64DecodedBytes(match[2]) > IMAGE_MAX_BYTES) {
      ctx.addIssue({ code: 'custom', message: `${label} muito grande (máx. 2 MB).` });
    }
  });
}

/** Lista de imagens com quantidade máxima. */
function imageListSchema({ max, label = 'Imagem', listLabel = 'imagens' }) {
  return z
    .array(imageSchema({ label }))
    .max(max, `Envie no máximo ${max} ${listLabel}.`);
}

/** Endereço de imagem que não pode ser data URL (ex.: `avatar_url` do PUT /users/me). */
const httpsImageUrlSchema = z
  .string()
  .regex(HTTPS_URL_REGEX, 'URL de avatar inválida: use um endereço https. Para enviar uma foto, use POST /users/me/avatar.');

module.exports = {
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  IMAGE_DATA_URL_MAX_CHARS,
  GALLERY_MAX_IMAGES,
  EVALUATION_MAX_PHOTOS,
  base64DecodedBytes,
  imageSchema,
  imageListSchema,
  httpsImageUrlSchema,
};
