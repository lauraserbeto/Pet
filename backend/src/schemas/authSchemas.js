const { z } = require("zod");

// Papéis que PODEM ser criados via cadastro público (self-service):
//   2 = Lojista, 3 = Hotel, 4 = Pet Sitter, 5 = Tutor.
// O papel 1 (ADMIN) é DELIBERADAMENTE excluído — nunca deve ser criável por
// um endpoint público. Sem esta restrição, um atacante anônimo poderia enviar
// `role_id: 1` e obter uma conta de administrador (escalada de privilégio).
const SELF_SERVICE_ROLES = [2, 3, 4, 5];

const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Nome deve ter ao menos 2 caracteres")
      .max(150, "Nome muito longo"),
    email: z
      .string()
      .trim()
      .email("E-mail inválido")
      .max(150, "E-mail muito longo"),
    password: z
      .string()
      .min(6, "A senha deve ter no mínimo 6 caracteres")
      .max(128, "Senha muito longa"),
    role_id: z
      .number()
      .int("Tipo de conta inválido")
      .refine((v) => SELF_SERVICE_ROLES.includes(v), {
        message: "Tipo de conta inválido para cadastro.",
      }),
    // Campos comerciais — obrigatórios apenas para parceiros (2/3/4).
    // A obrigatoriedade condicional e a validação do documento (CPF/CNPJ)
    // continuam no RegisterUseCase; aqui apenas garantimos o formato base.
    business_name: z
      .string()
      .trim()
      .min(2, "Razão social muito curta")
      .max(150)
      .optional(),
    document: z.string().trim().max(20).optional(),
    document_type: z.enum(["CPF", "CNPJ"]).optional(),
    terms_accepted: z.boolean().optional(),
  })
  // `.strip()` (padrão do Zod) remove chaves não declaradas antes de chegar ao
  // use case — impede mass-assignment de campos inesperados (is_active, status…).
  .strip();

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Token de recuperação obrigatório."),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .max(128, "Senha muito longa")
      .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
      .regex(/\d/, "A senha deve conter ao menos um número"),
  })
  .strip();

module.exports = { registerSchema, resetPasswordSchema, SELF_SERVICE_ROLES };
