const { z } = require("zod");
// Mesmos espaços de String.trim(); manter alinhado à função SQL da migration.
const EMAIL_TRIM_CHARS =
  "\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF";
const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("E-mail inválido")
  .max(150, "E-mail muito longo");
module.exports = { EMAIL_TRIM_CHARS, normalizeEmail, emailSchema };
