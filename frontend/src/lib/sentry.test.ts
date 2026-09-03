import { it, expect } from "vitest";
import type { ErrorEvent } from "@sentry/react";
import { __test__ } from "./sentry";

const { scrub, scrubData, stripQuery, beforeSend } = __test__;

it("redige valores de chaves sensíveis em qualquer profundidade", () => {
  const scrubbed = scrub({
    email: "tutor@example.com",
    password: "123456",
    perfil: { document: "123.456.789-00", nome: "Ana" },
    lista: [{ access_token: "abc" }],
  }) as Record<string, never>;

  expect(scrubbed).toEqual({
    email: "tutor@example.com",
    password: "[Filtrado]",
    perfil: { document: "[Filtrado]", nome: "Ana" },
    lista: [{ access_token: "[Filtrado]" }],
  });
});

it("remove a query string das URLs (tokens de reset trafegam ali)", () => {
  expect(stripQuery("https://petplus.app/redefinir-senha?token=segredo")).toBe(
    "https://petplus.app/redefinir-senha"
  );
  expect(stripQuery(undefined)).toBeUndefined();
});

it("beforeSend remove usuário, cookies e headers do evento", () => {
  const event = {
    user: { id: "42", email: "tutor@example.com" },
    request: {
      url: "https://petplus.app/checkout?token=segredo",
      cookies: { session: "abc" },
      headers: { Authorization: "Bearer abc" },
      data: { cpf: "123.456.789-00", item: "Ração" },
    },
  } as unknown as ErrorEvent;

  const sent = beforeSend(event, {});

  expect(sent.user).toBeUndefined();
  expect(sent.request?.cookies).toBeUndefined();
  expect(sent.request?.headers).toBeUndefined();
  expect(sent.request?.url).toBe("https://petplus.app/checkout");
  expect(sent.request?.data).toEqual({ cpf: "[Filtrado]", item: "Ração" });
});

it("redige o corpo da requisição mesmo quando chega como string JSON", () => {
  // O SDK entrega o body como string crua — sem desserializar, o scrub passaria direto.
  const body = JSON.stringify({ email: "tutor@example.com", password: "123456" });

  expect(scrubData(body)).toBe(
    JSON.stringify({ email: "tutor@example.com", password: "[Filtrado]" })
  );
});

it("descarta corpo não-JSON inteiro, por não haver como redigi-lo", () => {
  expect(scrubData("cpf=123.456.789-00&senha=123456")).toBe("[Filtrado]");
});
