import { test, expect } from "vitest";
import { isValidDocument, normalizeDocument } from "./documentIdentity";
test("CPF e CNPJ numérico/alfanumérico seguem os exemplos e preservam letras", () => {
  expect(isValidDocument("529.982.247-25", "CPF")).toBe(true);
  expect(isValidDocument("11.222.333/0001-81", "CNPJ")).toBe(true);
  expect(isValidDocument("12.abc.345/01de-35", "CNPJ")).toBe(true);
  expect(normalizeDocument("12.abc.345/01de-35")).toBe("12ABC34501DE35");
});
test("documentos repetidos, caracteres estranhos e DV incorreto são recusados", () => {
  for (const value of ["11111111111", "52998224724", "52998224725!"])
    expect(isValidDocument(value, "CPF")).toBe(false);
  for (const value of [
    "00000000000000",
    "12345678000199",
    "12ABC34501DE34",
    "12ABC34501DE3A",
    "12ABC34501DE35!",
  ])
    expect(isValidDocument(value, "CNPJ")).toBe(false);
});
