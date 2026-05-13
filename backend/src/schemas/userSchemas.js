const { z } = require('zod');

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
  avatar_url: z.string().url('URL de avatar inválida').optional().or(z.literal('')),
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

// Avatar em base64 (data URL). Limite ~2.7MB de string ≈ 2MB de imagem.
// Após decodificar base64 (~75% do tamanho da string), ainda fica abaixo do
// limite global de 50mb do express.json definido em server.js.
const AVATAR_MAX_CHARS = 2_700_000;

const uploadAvatarSchema = z
  .object({
    image: z
      .string()
      .min(1, 'Imagem obrigatória')
      .max(AVATAR_MAX_CHARS, 'Imagem muito grande (máx ~2MB)')
      .regex(
        /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i,
        'Formato inválido. Envie uma data URL base64 (JPEG, PNG ou WebP).'
      ),
  })
  .strict();

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  uploadAvatarSchema,
  AVATAR_MAX_CHARS,
};
