import { it, expect } from "vitest";
import { ApiError } from "../httpClient";
import { describeDeleteProductError, isProductGoneError } from "./productService";

it("dá a mensagem certa para cada erro do DELETE /products/:id", () => {
  const casos: [number, RegExp][] = [
    [403, /permissão/i],
    [404, /não existe mais/i],
    [409, /vinculado a pedidos/i],
    [422, /recarregue a página/i],
  ];

  for (const [status, esperado] of casos) {
    const erro = new ApiError(status, "QUALQUER", "mensagem crua do backend");
    expect(describeDeleteProductError(erro)).toMatch(esperado);
  }
});

it("mantém o texto do httpClient para falha de rede e timeout", () => {
  const rede = new ApiError(0, "NETWORK", "Falha de conexão com o servidor.");
  const timeout = new ApiError(0, "TIMEOUT", "Tempo de resposta esgotado.");

  expect(describeDeleteProductError(rede)).toBe("Falha de conexão com o servidor.");
  expect(describeDeleteProductError(timeout)).toBe("Tempo de resposta esgotado.");
});

it("nunca devolve [object Object] — o bug que motivou a migração pro httpClient", () => {
  // O backend responde { error: { code, message } }; o service antigo fazia
  // new Error(errorData.error) e o toast exibia "[object Object]".
  const erro = new ApiError(500, "INTERNAL_ERROR", "Erro interno do servidor");

  const mensagem = describeDeleteProductError(erro);
  expect(mensagem).not.toContain("[object Object]");
  expect(mensagem).toBe("Erro interno do servidor");
});

it("cai numa mensagem genérica quando o erro não é da API", () => {
  expect(describeDeleteProductError(new Error("boom"))).toMatch(/não foi possível excluir/i);
  expect(describeDeleteProductError(null)).toMatch(/não foi possível excluir/i);
});

it("isProductGoneError identifica só o 404", () => {
  expect(isProductGoneError(new ApiError(404, "NOT_FOUND", "x"))).toBe(true);
  expect(isProductGoneError(new ApiError(409, "CONFLICT", "x"))).toBe(false);
  expect(isProductGoneError(new Error("boom"))).toBe(false);
});
