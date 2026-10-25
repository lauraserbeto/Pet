const { z } = require('zod');
const { IMAGE_TYPES, imageSchema } = require('./imageSchemas');

// Query de paginação para a listagem pública de produtos.
// page >= 1; limit 1..100 (o cap protege contra queries não-limitadas — B6).
// Os defaults preservam o catálogo atual (pequeno) sem truncar a UX.
const listProductsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

const productIdParamsSchema = z.object({
  id: z.string().uuid('id inválido'),
});

// --- Criação/edição de produto (E-01) ---
// Antes as rotas não validavam nada: preço "abc" virava NaN e respondia 500.

// Imagem do produto: data URL base64 (JPEG/PNG/WebP/GIF, até 2 MB — regras de
// imageSchemas) ou endereço http(s) já usado por produtos existentes. String
// vazia mantém o comportamento atual do formulário (produto sem imagem).
const productImageSchema = z.literal('').or(
  imageSchema({ types: [...IMAGE_TYPES, 'gif'], allowHttp: true, label: 'Imagem do produto' })
);

// Aceita número ou texto no formato brasileiro ("R$ 1.234,50"), como o
// controller fazia antes de existir validação.
const priceSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.replace(/[R$\s]/g, '');
    return cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  },
  z.coerce
    .number({ message: 'Preço inválido.' })
    .positive('O preço deve ser maior que zero.')
    .max(99_999_999.99, 'Preço acima do limite permitido.')
);

const stockSchema = z.coerce
  .number({ message: 'Estoque inválido.' })
  .int('O estoque deve ser um número inteiro.')
  .min(0, 'O estoque não pode ser negativo.');

// Sem `.strict()`: o formulário do painel reenvia o objeto do produto; chaves
// desconhecidas são descartadas e o use case só grava os campos abaixo.
const productFields = {
  name: z.string().trim().min(1, 'O nome do produto é obrigatório.').max(150),
  category: z.string().trim().max(50).optional(),
  pet_type: z.string().trim().max(50).optional(),
  description: z.string().max(5000).nullable().optional(),
  sku: z.string().trim().max(50).nullable().optional(),
  stock_quantity: stockSchema,
  price: priceSchema,
  image_url: productImageSchema.nullable().optional(),
};

const createProductSchema = z.object({
  ...productFields,
  stock_quantity: stockSchema.default(0),
});

const updateProductSchema = z.object(productFields).partial();

module.exports = {
  listProductsQuery,
  productIdParamsSchema,
  createProductSchema,
  updateProductSchema,
};
