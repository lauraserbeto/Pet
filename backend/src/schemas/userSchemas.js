const { z } = require('zod');
const {
  EVALUATION_MAX_PHOTOS,
  imageSchema,
  imageListSchema,
  httpsImageUrlSchema,
} = require('./imageSchemas');

const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(150, 'Nome muito longo')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Telefone inválido. Use o formato (00) 00000-0000')
    .optional()
    .or(z.literal('')),
  // Só endereço https: a foto enviada pelo usuário vai por POST /users/me/avatar
  // (E-03). Bloqueia `data:` e `javascript:` por aqui.
  avatar_url: httpsImageUrlSchema.optional().or(z.literal('')),
}).strict();

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual obrigatória'),
    newPassword: z
      .string()
      .min(8, 'Nova senha deve ter ao menos 8 caracteres')
      .max(128, 'Senha muito longa')
      .regex(/[A-Za-z]/, 'Nova senha deve conter ao menos uma letra')
      .regex(/\d/, 'Nova senha deve conter ao menos um número'),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da senha atual',
    path: ['newPassword'],
  });

// Avatar em base64 (data URL): JPEG, PNG ou WebP de até 2 MB (imageSchemas).
const uploadAvatarSchema = z
  .object({
    image: z
      .string()
      .min(1, 'Imagem obrigatória')
      .regex(/^data:/i, 'Formato inválido. Envie uma data URL base64 (JPEG, PNG ou WebP).')
      .pipe(imageSchema({ label: 'Foto de perfil' })),
  })
  .strict();

// Avaliação do Pet Sitter no onboarding (E-03): só tipo e tamanho dos campos.
// Quem pode enviar e em que estado da avaliação fica para o E-11.
const evaluationTextSchema = z.union([
  z.string().max(10_000, 'Texto muito longo.'),
  z.record(z.string(), z.string().max(5_000, 'Resposta muito longa.')),
]);

const submitSitterEvaluationSchema = z.object({
  experience_details: evaluationTextSchema,
  environment_photos: imageListSchema({
    max: EVALUATION_MAX_PHOTOS,
    label: 'Foto do ambiente',
    listLabel: 'fotos do ambiente',
  }).default([]),
  quiz_answers: z.record(z.string(), z.string().max(5_000, 'Resposta muito longa.')).optional(),
});

// Query da listagem de usuários no painel admin.
// `limit` tem teto para evitar consulta não-limitada (mesma convenção de produtos).
const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  role_id: z.coerce.number().int().min(1).max(5).optional(),
  q: z.string().trim().max(150).optional(),
});

// Ativar/desativar conta pelo admin (E-01, DEC-G).
const userIdParamsSchema = z.object({
  id: z.string().uuid('id inválido'),
});

const updateUserActiveSchema = z
  .object({
    is_active: z.boolean({ message: 'is_active deve ser true ou false' }),
  })
  .strict();

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  uploadAvatarSchema,
  submitSitterEvaluationSchema,
  listUsersQuery,
  userIdParamsSchema,
  updateUserActiveSchema,
};
