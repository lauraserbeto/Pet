import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPostLoginRedirect,
  getPostLoginRedirect,
  isSafeInternalPath,
  rememberPostLoginRedirect,
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
