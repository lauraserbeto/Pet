import { it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

const Boom = () => {
  throw new Error("boom de teste");
};

it("mostra o fallback quando um filho lança erro", () => {
  // Silencia o console.error esperado (React loga o erro capturado).
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});

  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );

  expect(screen.queryByRole("alert")).not.toBeNull();
  expect(screen.queryByText(/algo deu errado/i)).not.toBeNull();

  spy.mockRestore();
});

it("renderiza os filhos normalmente quando não há erro", () => {
  render(
    <ErrorBoundary>
      <p>conteúdo ok</p>
    </ErrorBoundary>
  );

  expect(screen.queryByText("conteúdo ok")).not.toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});
