import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import CorrecaoCadastro from "./CorrecaoCadastro";
import { providerService } from "../../lib/services/providerService";
import { ApiError } from "../../lib/httpClient";

const providerRejeitado = {
  status: "REJEITADO",
  rejection_reason: "Documento ilegível",
  business_name: "Hotel do Rex",
  phone: "(11) 90000-0000",
  zip_code: "01000-000",
  address_line: "Rua A, 1",
  city: "São Paulo",
  state: "SP",
};

const renderTela = () =>
  render(
    <MemoryRouter>
      <CorrecaoCadastro />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.spyOn(providerService, "updateMe").mockResolvedValue({});
  vi.spyOn(providerService, "resubmit").mockResolvedValue({});
});

afterEach(() => vi.restoreAllMocks());

it("mostra o motivo da recusa em destaque", async () => {
  vi.spyOn(providerService, "fetchMe").mockResolvedValue(providerRejeitado);

  renderTela();

  expect(await screen.findByText("Cadastro recusado")).toBeTruthy();
  expect(screen.getByText("Documento ilegível")).toBeTruthy();
});

it("salva as correções e só então reenvia — o endpoint de reenvio não grava dados", async () => {
  vi.spyOn(providerService, "fetchMe").mockResolvedValue(providerRejeitado);
  const ordem: string[] = [];
  vi.mocked(providerService.updateMe).mockImplementation(async () => {
    ordem.push("updateMe");
    return {};
  });
  vi.mocked(providerService.resubmit).mockImplementation(async () => {
    ordem.push("resubmit");
    return {};
  });

  renderTela();
  await screen.findByText("Cadastro recusado");

  fireEvent.click(screen.getByRole("button", { name: /reenviar/i }));

  await waitFor(() => expect(ordem).toEqual(["updateMe", "resubmit"]));
});

it("avisa quando as correções salvam mas o reenvio falha", async () => {
  vi.spyOn(providerService, "fetchMe").mockResolvedValue(providerRejeitado);
  vi.mocked(providerService.resubmit).mockRejectedValue(
    new ApiError(400, "BAD_REQUEST", "Status atual: EM_REVISAO")
  );

  renderTela();
  await screen.findByText("Cadastro recusado");

  fireEvent.click(screen.getByRole("button", { name: /reenviar/i }));

  // Não pode anunciar sucesso: os dados foram salvos, o reenvio não aconteceu.
  await waitFor(() =>
    expect(screen.queryByText(/reenviado para análise/i)).toBeNull()
  );
});

it("bloqueia o reenvio quando não há recusa pendente", async () => {
  vi.spyOn(providerService, "fetchMe").mockResolvedValue({
    ...providerRejeitado,
    status: "EM_REVISAO",
    rejection_reason: null,
  });

  renderTela();

  expect(await screen.findByText("Nenhuma recusa pendente")).toBeTruthy();
  const botao = screen.getByRole("button", { name: /reenviar/i }) as HTMLButtonElement;
  expect(botao.disabled).toBe(true);
});

it("mostra erro com retry quando o cadastro não carrega", async () => {
  vi.spyOn(providerService, "fetchMe").mockRejectedValue(
    new ApiError(0, "NETWORK", "Falha de conexão com o servidor.")
  );

  renderTela();

  expect(await screen.findByText("Falha de conexão com o servidor.")).toBeTruthy();
  expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeTruthy();
});
