import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { toast } from "sonner";
import { MemoryRouter } from "react-router";
import { Approvals } from "./Approvals";

// A tela usa Link (atalho para avaliar candidatura de Pet Sitter — E-11).
const renderTela = () => render(<MemoryRouter><Approvals /></MemoryRouter>);

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Formato devolvido pela listagem administrativa (GET /providers, E-02):
// documento e motivo da recusa voltaram a chegar ao painel.
const parceiros = [
  {
    id: "p-1",
    user_id: "u-1",
    business_name: "Loja do Rex",
    document: "12345678000190",
    document_type: "CNPJ",
    status: "PENDENTE",
    rejection_reason: null,
    full_name: "Rex Silva",
    email: "rex@petplus.test",
    role_id: 2,
    is_active: true,
  },
  {
    id: "p-2",
    user_id: "u-2",
    business_name: "Sitter da Ana",
    document: "52998224725",
    document_type: "CPF",
    status: "EM_REVISAO",
    rejection_reason: "Foto do documento ilegível",
    full_name: "Ana Souza",
    email: "ana@petplus.test",
    role_id: 4,
    is_active: true,
  },
];

const respondeCom = (status: number, body: unknown) =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body })
  );

beforeEach(() => {
  localStorage.setItem("petplus_user", JSON.stringify({ id: "admin-1", role_id: 1 }));
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("mostra o CPF/CNPJ formatado e não marca documento válido como inválido", async () => {
  respondeCom(200, parceiros);

  renderTela();

  expect(await screen.findByText("12.345.678/0001-90")).toBeTruthy();
  expect(screen.getByText("529.982.247-25")).toBeTruthy();
  expect(screen.queryByLabelText("Documento com formato inválido")).toBeNull();
});

it("busca parceiros pelo documento", async () => {
  respondeCom(200, parceiros);

  renderTela();
  await screen.findByText("Loja do Rex");

  fireEvent.change(screen.getByPlaceholderText("Buscar por Nome ou Documento..."), {
    target: { value: "12345678" },
  });

  expect(screen.getByText("Loja do Rex")).toBeTruthy();
  expect(screen.queryByText("Sitter da Ana")).toBeNull();
});

const lojaAprovada = {
  ...parceiros[0],
  id: "p-3",
  user_id: "u-3",
  business_name: "Pet Shop Ativo",
  status: "APROVADO",
};

it("desativar pede confirmação e chama a rota de conta, não a de recusa (DEC-G)", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [lojaAprovada] })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: "u-3", is_active: false }) });
  vi.stubGlobal("fetch", fetchMock);

  renderTela();
  fireEvent.click(await screen.findByRole("button", { name: "Aprovados" }));
  fireEvent.click(await screen.findByRole("button", { name: /Desativar/ }));
  fireEvent.click(screen.getByRole("button", { name: "Desativar conta" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const [url, options] = fetchMock.mock.calls[1];
  expect(url).toMatch(/\/users\/admin\/users\/u-3\/active$/);
  expect(JSON.parse(options.body)).toEqual({ is_active: false });

  expect(await screen.findByText("Inativo")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Reativar/ })).toBeTruthy();
});

it("reativar devolve o acesso sem passar pela confirmação", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ ...lojaAprovada, is_active: false }] })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: "u-3", is_active: true }) });
  vi.stubGlobal("fetch", fetchMock);

  renderTela();
  fireEvent.click(await screen.findByRole("button", { name: "Aprovados" }));
  fireEvent.click(await screen.findByRole("button", { name: /Reativar/ }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ is_active: true });
  await waitFor(() => expect(screen.queryByText("Inativo")).toBeNull());
  expect(screen.getByRole("button", { name: /Desativar/ })).toBeTruthy();
});

it("exibe a mensagem da API quando a listagem é negada", async () => {
  respondeCom(403, { error: "Acesso negado. Apenas administradores podem realizar esta ação." });

  renderTela();

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "Acesso negado. Apenas administradores podem realizar esta ação."
    )
  );
});


it("cadastro reenviado aparece distinto, com a recusa anterior (E-11)", async () => {
  respondeCom(200, parceiros);
  renderTela();

  expect(await screen.findByText("Reenviado após correção")).toBeTruthy();
  expect(screen.getByText("Recusa anterior: Foto do documento ilegível")).toBeTruthy();
});

it("Pet Sitter não tem atalho de aprovação direta: vai para a avaliação (DEC-D)", async () => {
  respondeCom(200, parceiros);
  renderTela();
  await screen.findByText("Sitter da Ana");

  expect(screen.getAllByRole("button", { name: /^Aprovar$/ })).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Avaliar candidatura" }).getAttribute("href")).toBe(
    "/dashboard/avaliacoes-sitters"
  );
});

it("recusa exige motivo e mostra a mensagem real da API", async () => {
  respondeCom(200, parceiros);
  renderTela();
  await screen.findByText("Loja do Rex");

  fireEvent.click(screen.getAllByRole("button", { name: /Recusar/ })[0]);
  const confirmar = screen.getByRole("button", { name: "Confirmar Ação" });
  expect((confirmar as HTMLButtonElement).disabled).toBe(true);

  fireEvent.change(screen.getByLabelText("Motivo da recusa (obrigatório)"), { target: { value: "   " } });
  expect((confirmar as HTMLButtonElement).disabled).toBe(true);

  respondeCom(422, { error: { code: "INVALID_PROVIDER_TRANSITION", message: "Transição de status inválida: APROVADO → REJEITADO." } });
  fireEvent.change(screen.getByLabelText("Motivo da recusa (obrigatório)"), { target: { value: "Documento ilegível" } });
  fireEvent.click(confirmar);

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("Transição de status inválida: APROVADO → REJEITADO.")
  );
});
