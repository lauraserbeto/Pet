const { z } = require("zod");
const { newPasswordSchema } = require("../security/passwordPolicy");
const { emailSchema } = require("../security/emailIdentity");
const legalPolicy = require("../constants/legalPolicy");
const { isValidCPF, isValidCNPJ } = require("../security/documentIdentity");

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
    email: emailSchema,
    password: newPasswordSchema,
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
    terms_accepted: z.literal(true, {
      message:
        "É necessário aceitar os Termos de Uso e a Política de Privacidade.",
    }),
    terms_version: z.literal(legalPolicy.version, {
      message:
        "Confira a versão vigente dos termos antes de concluir o cadastro.",
    }),
  })
  // `.strip()` (padrão do Zod) remove chaves não declaradas antes de chegar ao
  // use case — impede mass-assignment de campos inesperados (is_active, status…).
  .strip()
  .superRefine((data, ctx) => {
    if (![2, 3, 4].includes(data.role_id)) return;
    const issue = (path, message) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (!data.business_name)
      issue("business_name", "Informe o nome comercial.");
    if (!["CPF", "CNPJ"].includes(data.document_type)) {
      issue("document_type", "Informe o tipo de documento.");
      return;
    }
    if ([2, 3].includes(data.role_id) && data.document_type !== "CNPJ")
      issue("document_type", "Lojistas e Hotéis devem utilizar CNPJ.");
    const valid =
      data.document_type === "CPF"
        ? isValidCPF(data.document)
        : isValidCNPJ(data.document);
    if (!valid)
      issue(
        "document",
        `O ${data.document_type} informado possui formato ou dígitos verificadores inválidos.`,
      );
  });

const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(1, "Token de recuperação obrigatório.")
      .max(256),
    password: newPasswordSchema,
  })
  .strip();

module.exports = { registerSchema, resetPasswordSchema, SELF_SERVICE_ROLES };
