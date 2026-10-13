import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Services } from "./Services";
import { serviceService, type Service } from "../../lib/services/serviceService";
import { providerService } from "../../lib/services/providerService";
import { ApiError } from "../../lib/httpClient";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ token: "fake-token" }),
}));

const servicoHotel: Service = {
  id: "s1",
  provider_id: "p1",
  name: "Hospedagem completa",
  category: "BOARDING",
  description: null,
  price: 120,
  duration_minutes: null,
  billing_unit: "DIARIA",
  is_active: true,
  created_at: "2026-10-13T12:00:00Z",
};

const renderTela = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Services />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.spyOn(providerService, "fetchMe").mockResolvedValue({ payment_policy: "PRESENCIAL" });
  vi.spyOn(providerService, "updateMe").mockResolvedValue({});
});

afterEach(() => vi.restoreAllMocks());

it("lista os serviços com a unidade de cobrança que o backend derivou", async () => {
  vi.spyOn(serviceService, "list").mockResolvedValue([servicoHotel]);

  renderTela();

  expect(await screen.findByText("Hospedagem completa")).toBeTruthy();
  // DIARIA veio do backend; o front não decide isso
  expect(screen.getByText("por diária")).toBeTruthy();
  expect(screen.getByText("R$ 120,00")).toBeTruthy();
});

it("mostra estado vazio quando não há serviços", async () => {
  vi.spyOn(serviceService, "list").mockResolvedValue([]);

  renderTela();

  expect(await screen.findByText("Nenhum serviço cadastrado ainda")).toBeTruthy();
});

it("mostra erro com retry quando a listagem falha", async () => {
  vi.spyOn(serviceService, "list").mockRejectedValue(
    new ApiError(403, "FORBIDDEN", "Apenas parceiros aprovados podem gerenciar serviços.")
  );

  renderTela();

  expect(
    await screen.findByText("Apenas parceiros aprovados podem gerenciar serviços.")
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeTruthy();
});

it("bloqueia criação com nome vazio e preço não-positivo", async () => {
  vi.spyOn(serviceService, "list").mockResolvedValue([]);
  const create = vi.spyOn(serviceService, "create").mockResolvedValue(servicoHotel);

  renderTela();
  await screen.findByText("Nenhum serviço cadastrado ainda");

  fireEvent.change(screen.getByLabelText("Preço"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: /criar serviço/i }));

  await waitFor(() => expect(screen.getByText("Informe o nome do serviço")).toBeTruthy());
  expect(screen.getByText("O preço deve ser maior que zero")).toBeTruthy();
  expect(create).not.toHaveBeenCalled();
});

it("persiste a política de cobrança ao trocar o seletor", async () => {
  vi.spyOn(serviceService, "list").mockResolvedValue([]);

  renderTela();
  await screen.findByText("Nenhum serviço cadastrado ainda");

  await waitFor(() => expect(providerService.fetchMe).toHaveBeenCalled());
  expect(screen.getByText(/paga no local/i)).toBeTruthy();
});

it("desfaz a troca de política quando o backend recusa", async () => {
  vi.spyOn(serviceService, "list").mockResolvedValue([]);
  vi.mocked(providerService.updateMe).mockRejectedValue(
    new ApiError(422, "VALIDATION_ERROR", "Política de cobrança inválida.")
  );

  renderTela();
  await screen.findByText("Nenhum serviço cadastrado ainda");

  // O valor em tela continua sendo o carregado do backend.
  await waitFor(() => expect(screen.getByText(/paga no local/i)).toBeTruthy());
});
