const express = require('express');
const {
  IMAGE_DATA_URL_MAX_CHARS,
  GALLERY_MAX_IMAGES,
  EVALUATION_MAX_PHOTOS,
} = require('../schemas/imageSchemas');

// Tamanho máximo do corpo JSON por rota (E-03, AUD-03).
//
// Antes o limite global era 50 MB, para caber as imagens em base64. Agora o
// padrão é 100 kb e só as rotas de upload recebem mais — o bastante para o
// número máximo de imagens de 2 MB que cada uma aceita, mais os demais campos.
// Acima do limite, o parser recusa com 413 antes da autenticação.

const DEFAULT_BODY_LIMIT = 100 * 1024;

// Folga para os campos do JSON além das imagens (textos, horários, listas).
const FIELDS_ALLOWANCE = 512 * 1024;

const forImages = (count) => count * IMAGE_DATA_URL_MAX_CHARS + FIELDS_ALLOWANCE;

const UPLOAD_BODY_LIMITS = [
  { method: 'POST', path: /^\/api\/v1\/users\/me\/avatar$/, limit: forImages(1) },
  { method: 'POST', path: /^\/api\/v1\/products$/, limit: forImages(1) },
  { method: 'PUT', path: /^\/api\/v1\/products\/[^/]+$/, limit: forImages(1) },
  // Avatar + galeria completa.
  { method: 'PUT', path: /^\/api\/v1\/providers\/profile$/, limit: forImages(1 + GALLERY_MAX_IMAGES) },
  { method: 'POST', path: /^\/api\/v1\/users\/me\/evaluations$/, limit: forImages(EVALUATION_MAX_PHOTOS) },
];

/** Limite em bytes para o método e caminho (sem query string). */
function bodyLimitFor(method, path) {
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, '') : path;
  const rule = UPLOAD_BODY_LIMITS.find((r) => r.method === method && r.path.test(normalizedPath));
  return rule ? rule.limit : DEFAULT_BODY_LIMIT;
}

/**
 * Substitui o `express.json` global: escolhe o parser (já montado) com o
 * limite da rota. Formulários urlencoded não são usados pela API e ficam no
 * limite padrão.
 */
function jsonBodyParser() {
  const parsers = new Map();
  const parserFor = (limit) => {
    if (!parsers.has(limit)) parsers.set(limit, express.json({ limit }));
    return parsers.get(limit);
  };

  return (req, res, next) => parserFor(bodyLimitFor(req.method, req.path))(req, res, next);
}

const urlencodedBodyParser = () => express.urlencoded({ limit: DEFAULT_BODY_LIMIT, extended: true });

module.exports = {
  DEFAULT_BODY_LIMIT,
  UPLOAD_BODY_LIMITS,
  bodyLimitFor,
  jsonBodyParser,
  urlencodedBodyParser,
};
