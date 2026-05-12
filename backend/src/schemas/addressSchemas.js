const { z } = require('zod');

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR',
  'SC', 'SP', 'SE', 'TO',
];

const cepRegex = /^\d{5}-?\d{3}$/;

const addressBaseSchema = z.object({
  cep: z.string().trim().regex(cepRegex, 'CEP inválido (use 00000-000 ou 00000000)'),
  rua: z.string().trim().min(2, 'Rua é obrigatória').max(255),
  numero: z.string().trim().min(1, 'Número é obrigatório').max(20),
  complemento: z.string().trim().max(255).optional().or(z.literal('')),
  bairro: z.string().trim().min(2, 'Bairro é obrigatório').max(100),
  cidade: z.string().trim().min(2, 'Cidade é obrigatória').max(100),
  estado: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => UF_LIST.includes(v), 'UF inválida'),
});

const createAddressSchema = addressBaseSchema.strict();
const updateAddressSchema = addressBaseSchema.partial().strict();

const addressIdParamsSchema = z.object({
  id: z.string().uuid('ID de endereço inválido'),
});

module.exports = {
  UF_LIST,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamsSchema,
};
