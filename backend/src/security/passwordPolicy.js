const { z } = require("zod");
const PASSWORD_HASH_COST = 12;
const PASSWORD_MAX_BYTES = 72;
const newPasswordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
  .regex(/\d/, "A senha deve conter ao menos um número")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= PASSWORD_MAX_BYTES,
    "Senha muito longa. Reduza a quantidade de caracteres.",
  );
module.exports = { PASSWORD_HASH_COST, PASSWORD_MAX_BYTES, newPasswordSchema };
