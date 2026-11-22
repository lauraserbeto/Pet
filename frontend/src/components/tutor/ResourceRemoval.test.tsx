import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { TutorPets } from "../../pages/tutor/TutorPets";
import { AddressesSection } from "./AddressesSection";
import { petService, type Pet } from "../../lib/services/petService";
import { addressService, type Address } from "../../lib/services/addressService";
import { ApiError } from "../../lib/httpClient";
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => ({ token: "fixture" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const pet: Pet = {
  id: "pet",
  tutor_id: "tutor",
  name: "Rex QA",
  species: "DOG",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};
const address: Address = {
  id: "address",
  user_id: "tutor",
  cep: "01001000",
  rua: "Rua QA",
  numero: "10",
  bairro: "Centro",
  cidade: "São Paulo",
  estado: "SP",
  is_default: true,
  created_at: "2026-01-01",
};
let client: QueryClient;
// Confirmação agora é o diálogo do app (G22), não window.confirm().
const confirmLabel = (kind: string) => (kind === "pet" ? "Remover pet" : "Excluir endereço");
async function answerDialog(kind: string, accept: boolean) {
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(
    within(dialog).getByRole("button", { name: accept ? confirmLabel(kind) : "Voltar" })
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
}
beforeEach(() => {
  vi.spyOn(petService, "list").mockResolvedValue([pet]);
  vi.spyOn(addressService, "list").mockResolvedValue([address]);
});
afterEach(() => {
  cleanup();
  client?.clear();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
function mount(kind: string) {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{kind === "pet" ? <TutorPets /> : <AddressesSection />}</MemoryRouter>
    </QueryClientProvider>
  );
}
for (const kind of ["pet", "address"]) {
  const buttonName = kind === "pet" ? "Excluir pet Rex QA" : "Excluir endereço Rua QA, 10";
  const itemName = kind === "pet" ? "Rex QA" : "Rua QA, 10";
  test(`${kind}: cancelar confirmação não chama API; conflito mantém cartão e impede reenvio durante operação`, async () => {
    let reject!: (error: Error) => void;
    const remove = vi
      .spyOn(kind === "pet" ? petService : addressService, "remove")
      .mockImplementation(
        () =>
          new Promise<void>((_resolve, fail) => {
            reject = fail;
          })
      );
    mount(kind);
    const button = await screen.findByRole("button", { name: buttonName });
    fireEvent.click(button);
    await answerDialog(kind, false);
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(button);
    await answerDialog(kind, true);
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(true));
    expect(screen.getByText(itemName, { exact: true })).toBeTruthy();
    fireEvent.click(button);
    expect(remove).toHaveBeenCalledTimes(1);
    reject(new ApiError(409, "CONFLICT", "Há vínculos em andamento."));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Há vínculos em andamento."));
    expect(screen.getByText(itemName, { exact: true })).toBeTruthy();
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
  });
  test(`${kind}: sucesso só remove o cartão após confirmação e atualização da lista`, async () => {
    const service = kind === "pet" ? petService : addressService;
    vi.spyOn(service, "remove").mockResolvedValue(undefined);
    if (kind === "pet")
      vi.mocked(petService.list).mockResolvedValueOnce([pet]).mockResolvedValue([]);
    else vi.mocked(addressService.list).mockResolvedValueOnce([address]).mockResolvedValue([]);
    mount(kind);
    fireEvent.click(await screen.findByRole("button", { name: buttonName }));
    await answerDialog(kind, true);
    await waitFor(() => expect(screen.queryByText(itemName, { exact: true })).toBeNull());
    expect(service.remove).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(2);
  });
}
