/**
 * Máscaras de input para dados brasileiros. Recebem qualquer string
 * (com ou sem caracteres não-numéricos) e devolvem o valor formatado.
 *
 * Use junto com React Hook Form interceptando o onChange:
 *
 *   const reg = register("phone");
 *   <input
 *     {...reg}
 *     onChange={(e) => { e.target.value = formatPhone(e.target.value); reg.onChange(e); }}
 *   />
 */

export function formatPhone(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function formatCep(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// ─── Documentos (CPF / CNPJ) ───

export function formatCpf(value: string): string {
  const d = (value ?? "").replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCnpj(value: string): string {
  const d = (value ?? "").replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Formata o documento decidindo pela quantidade de dígitos: >11 → CNPJ, senão CPF. */
export function formatDocument(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length > 11 ? formatCnpj(digits) : formatCpf(digits);
}

/** Validação leve (bem-formado): 11 dígitos (CPF) ou 14 (CNPJ), não todos iguais. */
export function isValidDocument(value: string): boolean {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length !== 11 && digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}

// Regex que casa o valor já formatado pelas máscaras acima.
// Use no front; o backend é mais tolerante (aceita com/sem máscara).
export const PHONE_MASKED_REGEX = /^\(\d{2}\) \d{4,5}-\d{4}$/;
export const CEP_MASKED_REGEX = /^\d{5}-\d{3}$/;
