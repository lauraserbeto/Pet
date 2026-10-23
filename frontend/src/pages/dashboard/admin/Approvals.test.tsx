import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { toast } from "sonner";
import { Approvals } from "./Approvals";

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

  render(<Approvals />);

  expect(await screen.findByText("12.345.678/0001-90")).toBeTruthy();
  expect(screen.getByText("529.982.247-25")).toBeTruthy();
  expect(screen.queryByLabelText("Documento com formato inválido")).toBeNull();
});

it("busca parceiros pelo documento", async () => {
  respondeCom(200, parceiros);

  render(<Approvals />);
  await screen.findByText("Loja do Rex");

  fireEvent.change(screen.getByPlaceholderText("Buscar por Nome ou Documento..."), {
    target: { value: "12345678" },
  });

  expect(screen.getByText("Loja do Rex")).toBeTruthy();
  expect(screen.queryByText("Sitter da Ana")).toBeNull();
});

it("exibe a mensagem da API quando a listagem é negada", async () => {
  respondeCom(403, { error: "Acesso negado. Apenas administradores podem realizar esta ação." });

  render(<Approvals />);

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "Acesso negado. Apenas administradores podem realizar esta ação."
    )
  );
});
