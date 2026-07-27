import { describe, it, expect } from "vitest";
import {
  formatPhone,
  formatCep,
  formatCpf,
  formatCnpj,
  formatDocument,
  isValidDocument,
  PHONE_MASKED_REGEX,
  CEP_MASKED_REGEX,
} from "./masks";

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

describe("formatCpf / formatCnpj", () => {
  it("formata CPF de 11 dígitos", () => {
    expect(formatCpf("65288049580")).toBe("652.880.495-80");
  });
  it("formata CNPJ de 14 dígitos", () => {
    expect(formatCnpj("09253439000109")).toBe("09.253.439/0001-09");
  });
});

describe("formatDocument", () => {
  it("14 dígitos → máscara de CNPJ", () => {
    expect(formatDocument("09253439000109")).toBe("09.253.439/0001-09");
  });
  it("11 dígitos → máscara de CPF", () => {
    expect(formatDocument("65288049580")).toBe("652.880.495-80");
  });
  it("ignora pontuação existente", () => {
    expect(formatDocument("09.253.439/0001-09")).toBe("09.253.439/0001-09");
  });
});

describe("isValidDocument", () => {
  it("aceita 11 e 14 dígitos", () => {
    expect(isValidDocument("65288049580")).toBe(true);
    expect(isValidDocument("09253439000109")).toBe(true);
  });
  it("rejeita comprimento inválido", () => {
    expect(isValidDocument("123")).toBe(false);
    expect(isValidDocument("0925343900010")).toBe(false);
  });
  it("rejeita todos os dígitos iguais", () => {
    expect(isValidDocument("11111111111")).toBe(false);
  });
});
