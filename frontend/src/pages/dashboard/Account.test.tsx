import { it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Account } from "./Account";
import { providerService } from "../../lib/services/providerService";

const auth = vi.hoisted(() => ({ user: {} as Record<string, unknown> }));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));

const renderTela = () =>
  render(
    <MemoryRouter>
      <Account />
    </MemoryRouter>
  );

afterEach(() => vi.restoreAllMocks());

it("Admin não vê dados nem status de parceiro e não consulta /providers/me (G09)", async () => {
  auth.user = { role_id: 1, full_name: "Admin Teste", email: "admin@petplus.test" };
  const fetchMe = vi.spyOn(providerService, "fetchMe");

  renderTela();

  expect(await screen.findByText("Administrador da plataforma")).toBeTruthy();
  expect(screen.queryByText("Tipo de Parceiro")).toBeNull();
  expect(screen.queryByText("Pendente")).toBeNull();
  expect(screen.queryByText("Editar Perfil Público")).toBeNull();
  expect(fetchMe).not.toHaveBeenCalled();
});

it("parceiro continua vendo tipo, status e atalho do perfil público", async () => {
  auth.user = { role_id: 3, full_name: "Hotel Teste", email: "hotel@petplus.test" };
  vi.spyOn(providerService, "fetchMe").mockResolvedValue({
    status: "APROVADO",
    document: "11222333000181",
    user: { role_id: 3, full_name: "Hotel Teste", email: "hotel@petplus.test" },
  });

  renderTela();

  expect(await screen.findByText("Tipo de Parceiro")).toBeTruthy();
  expect(screen.getByText("Hotel para Pets")).toBeTruthy();
  expect(screen.getByText("Ativo")).toBeTruthy();
  expect(screen.getByText("Editar Perfil Público")).toBeTruthy();
});
