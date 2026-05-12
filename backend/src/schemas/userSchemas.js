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

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};
