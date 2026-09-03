import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemoBanner } from "./DemoBanner";

it("exibe o título e a mensagem padrão de ambiente de demonstração", () => {
  render(<DemoBanner />);

  expect(screen.queryByText("Ambiente de Demonstração")).not.toBeNull();
  expect(screen.queryByText(/dados fictícios/i)).not.toBeNull();
});

it("permite customizar a mensagem para telas parcialmente integradas", () => {
  render(<DemoBanner message="Somente os gráficos usam dados fictícios." />);

  expect(
    screen.queryByText("Somente os gráficos usam dados fictícios.")
  ).not.toBeNull();
});

it("é anunciado por leitores de tela como status", () => {
  render(<DemoBanner />);

  expect(screen.queryByRole("status")).not.toBeNull();
});
