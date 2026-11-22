import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Settings } from "./Settings";

it("não oferece ações sem endpoint nem simula sucesso (CFG-1 / G07)", () => {
  render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>
  );

  expect(screen.queryByRole("button", { name: /salvar/i })).toBeNull();
  expect(screen.queryByText(/forçar logout/i)).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByRole("switch")).toBeNull();
  expect(screen.getByText("Análise manual")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Abrir aprovações" }).getAttribute("href")).toBe(
    "/dashboard/aprovacoes"
  );
});
