import { test, expect } from "vitest";
import { newPasswordSchema, passwordChecks } from "./passwordPolicy";
import { normalizeEmail } from "./emailIdentity";
test("DEC-E exige oito caracteres, maiúscula e número, sem modificar a senha", () => {
  for (const value of ["Senha123", " ComEspaco1 "])
    expect(newPasswordSchema.parse(value)).toBe(value);
  for (const value of ["curta1", "senhanova1", "SENHANOVA"])
    expect(newPasswordSchema.safeParse(value).success).toBe(false);
  expect(passwordChecks.every((check) => check.test("Senha123"))).toBe(true);
});
test("limite é UTF-8: aceita 72 bytes e rejeita truncamento silencioso com acentos", () => {
  for (const value of ["A1" + "a".repeat(70), "A1" + "á".repeat(35)])
    expect(newPasswordSchema.safeParse(value).success).toBe(true);
  for (const value of ["A1" + "a".repeat(71), "A1" + "á".repeat(36)])
    expect(newPasswordSchema.safeParse(value).success).toBe(false);
});
test("e-mail normaliza bordas/caixa sem juntar aliases", () => {
  expect(normalizeEmail("\t Maria.Silva+Pet@EXAMPLE.COM\u00A0")).toBe(
    "maria.silva+pet@example.com"
  );
  expect(normalizeEmail("Maria.Silva@example.com")).not.toBe(
    normalizeEmail("MariaSilva@example.com")
  );
});
