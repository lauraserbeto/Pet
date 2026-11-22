import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../contexts/AuthContext";
import {
  clearPostLoginRedirect,
  getPostLoginRedirect,
  isSafeInternalPath,
  rememberPostLoginRedirect,
  resolvePostLoginDestination,
  rememberProtectedLocation,
} from "./postLoginRedirect";

describe("postLoginRedirect", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("aceita somente caminhos internos", () => {
    expect(isSafeInternalPath("/cart")).toBe(true);
    expect(isSafeInternalPath("/checkout?step=payment")).toBe(true);
    expect(isSafeInternalPath("https://example.com")).toBe(false);
    expect(isSafeInternalPath("//example.com")).toBe(false);
    expect(isSafeInternalPath("/\\example.com")).toBe(false);
  });

  it("preserva e recupera o contexto do checkout", () => {
    rememberPostLoginRedirect({ returnTo: "/cart", intent: "checkout" });

    expect(getPostLoginRedirect()).toEqual({
      returnTo: "/cart",
      intent: "checkout",
    });
  });

  it("prioriza o estado da rota e permite limpar o destino", () => {
    rememberPostLoginRedirect({ returnTo: "/cart", intent: "checkout" });

    expect(getPostLoginRedirect({ returnTo: "/tutor/perfil" })).toEqual({
      returnTo: "/tutor/perfil",
    });

    clearPostLoginRedirect();
    expect(getPostLoginRedirect()).toBeNull();
  });

  it("descarta conteúdo de storage inválido", () => {
    sessionStorage.setItem("petplus_post_login_redirect", "not-json");

    expect(getPostLoginRedirect()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
});

afterEach(() => vi.restoreAllMocks());
const account = (role_id: number, extra = {}): AuthUser => ({
  id: "qa",
  full_name: "QA",
  email: "qa@petplus.test",
  role_id,
  provider_status: "APROVADO",
  onboarding_step: "COMPLETED",
  ...extra,
});

it.each([
  "//example.com",
  "/\\example.com",
  "/\n/example.com",
  "/%2fexample.com",
  "/%5cexample.com",
  "/login",
  "/register",
  "/dashboard/nao-existe",
])("não retoma destino externo, ambíguo ou de autenticação: %s", (returnTo) => {
  expect(resolvePostLoginDestination(account(1), { returnTo })).toBe("/dashboard");
});

it.each([
  [1, "/tutor/pets"],
  [2, "/dashboard/usuarios"],
  [3, "/dashboard/products"],
  [4, "/dashboard/orders"],
  [5, "/dashboard/conta"],
])("perfil %i descarta destino de outro perfil %s", (role, returnTo) => {
  expect(
    resolvePostLoginDestination(account(role as number), { returnTo: returnTo as string })
  ).toBe(role === 5 ? "/" : "/dashboard");
});

it("normaliza segmentos antes de conferir a permissão", () => {
  expect(
    resolvePostLoginDestination(account(5), { returnTo: "/tutor/../dashboard/usuarios" })
  ).toBe("/");
  expect(
    resolvePostLoginDestination(account(2), { returnTo: "/dashboard/./orders?pagina=2#lista" })
  ).toBe("/dashboard/orders?pagina=2#lista");
});

it("prioriza aprovação e onboarding sobre um destino antigo", () => {
  expect(
    resolvePostLoginDestination(account(3, { provider_status: "EM_REVISAO" }), {
      returnTo: "/dashboard/perfil",
    })
  ).toBe("/");
  expect(
    resolvePostLoginDestination(account(2, { provider_status: "REJEITADO" }), { returnTo: "/cart" })
  ).toBe("/parceiro/corrigir-cadastro");
  expect(
    resolvePostLoginDestination(account(4, { onboarding_step: "DESCONHECIDO" }), {
      returnTo: "/dashboard/servicos",
    })
  ).toBe("/onboarding/sitter");
});

it.each([
  "/dashboard/orders",
  "/dashboard/usuarios",
  "/tutor/pets",
  "/checkout/payment",
  "/parceiro/corrigir-cadastro",
])("expiração preserva a rota protegida completa: %s", (pathname) => {
  sessionStorage.clear();
  rememberProtectedLocation({ pathname, search: "?pagina=2", hash: "#lista" });
  expect(getPostLoginRedirect()?.returnTo).toBe(pathname + "?pagina=2#lista");
});

it("a própria tela de login não sobrescreve o destino pendente", () => {
  rememberPostLoginRedirect({ returnTo: "/dashboard/orders" });
  rememberProtectedLocation({ pathname: "/login", search: "", hash: "" });
  expect(getPostLoginRedirect()?.returnTo).toBe("/dashboard/orders");
});

it("storage indisponível não impede usar o estado da rota ou concluir login", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  expect(() => rememberPostLoginRedirect({ returnTo: "/dashboard/orders" })).not.toThrow();
  expect(getPostLoginRedirect({ returnTo: "/dashboard/orders" })?.returnTo).toBe(
    "/dashboard/orders"
  );
  expect(getPostLoginRedirect()).toBeNull();
  expect(() => clearPostLoginRedirect()).not.toThrow();
});
