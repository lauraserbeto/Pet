import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import CorrecaoCadastro from "./CorrecaoCadastro";
import { providerService } from "../../lib/services/providerService";
import { ApiError } from "../../lib/httpClient";
import { toast } from "sonner";

const auth = vi.hoisted(() => ({ refetchMe: vi.fn() }));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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
  vi.clearAllMocks();
  auth.refetchMe.mockResolvedValue(null);
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
  expect(await screen.findByText(/Correções salvas, mas o reenvio falhou:/)).toBeTruthy();
  expect(toast.success).not.toHaveBeenCalled();
  expect(auth.refetchMe).not.toHaveBeenCalled();
});

it.each([
  ["business_name", " ", /nome de negócio entre 2 e 150/],
  ["state", "ZZ", /Selecione uma UF válida/],
  ["state", "SPO", /Selecione uma UF válida/],
  ["zip_code", "123", /Informe um CEP válido/],
  ["phone", "1".repeat(21), /Telefone deve ter no máximo 20/],
  ["address_line", "A".repeat(256), /Endereço deve ter no máximo 255/],
  ["city", "A".repeat(101), /Cidade deve ter no máximo 100/],
])("não salva nem reenvia com %s inválido", async (field, value, message) => {
  vi.spyOn(providerService, "fetchMe").mockResolvedValue(providerRejeitado);
  renderTela();
  await screen.findByText("Cadastro recusado");
  fireEvent.change(document.getElementById(field as string)!, { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: /reenviar/i }));
  expect(await screen.findByText(message as RegExp)).toBeTruthy();
  expect(providerService.updateMe).not.toHaveBeenCalled();
  expect(providerService.resubmit).not.toHaveBeenCalled();
  expect(document.getElementById(field as string)?.getAttribute("aria-invalid")).toBe("true");
});

it("normaliza nome, UF e CEP, atualiza a sessão e impede um segundo reenvio", async () => {
  vi.spyOn(providerService, "fetchMe").mockResolvedValue(providerRejeitado);
  renderTela();
  await screen.findByText("Cadastro recusado");
  fireEvent.change(screen.getByLabelText("Nome do negócio"), { target: { value: "  Hotel QA  " } });
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: " go " } });
  fireEvent.change(screen.getByLabelText("CEP"), { target: { value: " 74000-000 " } });
  fireEvent.click(screen.getByRole("button", { name: /reenviar/i }));
  await screen.findByText("Nenhuma recusa pendente");
  expect(providerService.updateMe).toHaveBeenCalledWith(
    expect.objectContaining({
      business_name: "Hotel QA",
      state: "GO",
      zip_code: "74000000",
    })
  );
  await waitFor(() => expect(auth.refetchMe).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: /reenviar/i }));
  expect(providerService.resubmit).toHaveBeenCalledTimes(1);
});

it("erro ao salvar preserva os dados e não tenta reenviar", async () => {
  vi.spyOn(providerService, "fetchMe").mockResolvedValue(providerRejeitado);
  vi.mocked(providerService.updateMe).mockRejectedValue(
    new ApiError(422, "VALIDATION_ERROR", "Cadastro inválido na API.")
  );
  renderTela();
  await screen.findByText("Cadastro recusado");
  fireEvent.change(screen.getByLabelText("Nome do negócio"), { target: { value: "Correção QA" } });
  fireEvent.click(screen.getByRole("button", { name: /reenviar/i }));
  expect(await screen.findByText("Cadastro inválido na API.")).toBeTruthy();
  expect((screen.getByLabelText("Nome do negócio") as HTMLInputElement).value).toBe("Correção QA");
  expect(providerService.resubmit).not.toHaveBeenCalled();
  expect(toast.success).not.toHaveBeenCalled();
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
