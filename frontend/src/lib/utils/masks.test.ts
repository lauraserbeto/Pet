import { describe, it, expect } from "vitest";
import { formatPhone, formatCep, PHONE_MASKED_REGEX, CEP_MASKED_REGEX } from "./masks";

describe("formatPhone", () => {
  it("formata celular de 11 dígitos", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(PHONE_MASKED_REGEX.test(formatPhone("11987654321"))).toBe(true);
  });

  it("formata telefone fixo de 10 dígitos", () => {
    expect(formatPhone("1133224455")).toBe("(11) 3322-4455");
  });

  it("ignora não-dígitos e limita a 11 dígitos", () => {
    expect(formatPhone("(11) 98765-4321 abc 999")).toBe("(11) 98765-4321");
  });

  it("string vazia retorna vazio", () => {
    expect(formatPhone("")).toBe("");
  });
});

describe("formatCep", () => {
  it("formata CEP de 8 dígitos", () => {
    expect(formatCep("01310100")).toBe("01310-100");
    expect(CEP_MASKED_REGEX.test(formatCep("01310100"))).toBe(true);
  });

  it("não insere hífen antes de 5 dígitos", () => {
    expect(formatCep("013")).toBe("013");
  });
});
