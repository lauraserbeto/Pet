import { test, expect } from "vitest";
import { ApiError } from "./httpClient";
import { getCheckoutErrorMessage } from "./checkoutError";
test("conflito real preserva mensagem e ação de carrinho, sem depender de código inventado", () => {
  const message = "Estoque insuficiente para o produto X";
  expect(getCheckoutErrorMessage(new ApiError(409, "CONFLICT", message))).toMatchObject({
    description: message,
    cartAction: true,
    title: "Estoque insuficiente",
  });
  expect(
    getCheckoutErrorMessage(new ApiError(409, "PROVIDER_UNAVAILABLE", "Loja indisponível"))
  ).toMatchObject({ description: "Loja indisponível", cartAction: true });
});
test("falha interna não devolve mensagem crua; limitação e validação preservam resposta operacional", () => {
  expect(
    getCheckoutErrorMessage(new ApiError(500, "INTERNAL_ERROR", "SQL senha=segredo")).description
  ).not.toContain("segredo");
  expect(
    getCheckoutErrorMessage(new ApiError(429, "RATE_LIMITED", "Aguarde um minuto"))
  ).toMatchObject({ description: "Aguarde um minuto", cartAction: false });
  expect(
    getCheckoutErrorMessage(new ApiError(422, "VALIDATION_ERROR", "Confira o endereço"))
  ).toMatchObject({ description: "Confira o endereço" });
});
