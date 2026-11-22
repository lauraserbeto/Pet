import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Navbar } from "./Navbar";

vi.mock("../cart/CartContext", () => ({ useCart: () => ({ totalItems: 0 }) }));

const renderAs = (user: Record<string, unknown>) => {
  localStorage.setItem("petplus_token", "token-de-teste");
  localStorage.setItem("petplus_user", JSON.stringify(user));
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it("parceiro pendente tem menu da conta com status e saída (G06)", async () => {
  renderAs({ full_name: "Hotel Pendente", email: "hotel@petplus.test", role_id: 3, provider_status: "PENDENTE" });

  fireEvent.click(await screen.findByRole("button", { name: /Menu da conta de Hotel Pendente/ }));

  expect(screen.getByText("Cadastro em análise")).toBeTruthy();
  expect(screen.getByText("Sair da conta")).toBeTruthy();
  expect(screen.queryByText("Corrigir cadastro")).toBeNull();
  expect(screen.queryByText("Meus Pets")).toBeNull();
});

it("parceiro recusado tem atalho para corrigir o cadastro (G06)", async () => {
  renderAs({ full_name: "Loja Recusada", email: "loja@petplus.test", role_id: 2, provider_status: "REJEITADO" });

  fireEvent.click(await screen.findByRole("button", { name: /Menu da conta de Loja Recusada/ }));

  expect(screen.getByText("Cadastro recusado")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Corrigir cadastro/ }).getAttribute("href")).toBe(
    "/parceiro/corrigir-cadastro"
  );
});

it("Tutor mantém o menu próprio, sem status de parceiro", async () => {
  renderAs({ full_name: "Tutora Teste", email: "tutora@petplus.test", role_id: 5 });

  fireEvent.click(await screen.findByRole("button", { name: /Menu da conta de Tutora Teste/ }));

  expect(screen.getByText("Meus Pets")).toBeTruthy();
  expect(screen.queryByText("Cadastro em análise")).toBeNull();
});

it("não imprime o e-mail da sessão no console", async () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  renderAs({ full_name: "Tutora Teste", email: "tutora@petplus.test", role_id: 5 });

  await screen.findByRole("button", { name: /Menu da conta/ });

  expect(log.mock.calls.flat().join(" ")).not.toContain("tutora@petplus.test");
});

it("busca do cabeçalho leva ao Shopping com o termo (G19)", async () => {
  const { Routes, Route, useLocation } = await import("react-router");
  const Where = () => <p>Destino: {useLocation().pathname + useLocation().search}</p>;
  localStorage.clear();
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Navbar />
      <Routes>
        <Route path="/" element={null} />
        <Route path="/shopping" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );

  const [campo] = await screen.findAllByRole("searchbox", { name: "Buscar produtos no Shopping" });
  fireEvent.change(campo, { target: { value: "ração filhote" } });
  fireEvent.submit(campo.closest("form")!);

  expect(await screen.findByText("Destino: /shopping?q=ra%C3%A7%C3%A3o%20filhote")).toBeTruthy();
});
