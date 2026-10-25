import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { PublicProfile } from "./PublicProfile";
import { providerService } from "../../lib/services/providerService";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Perfil de hotel já completo: o salvamento passa pela validação da tela.
const perfilHotel = {
  business_name: "Hotel Patinhas",
  phone: "(11) 99999-0000",
  description: "Hospedagem com área verde",
  zip_code: "01001-000",
  address_line: "Rua A, 10",
  city: "São Paulo",
  state: "SP",
  daily_rate: 120,
  allowed_animals: ["Cachorro"],
  gallery_images: ["https://cdn.petplus.test/g1.png"],
  user: { role_id: 3, avatar_url: "https://cdn.petplus.test/avatar.png" },
};

const renderTela = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PublicProfile />
    </QueryClientProvider>
  );
};

/** Arquivo com o tamanho informado sem alocar o conteúdo. */
const arquivo = (nome: string, tipo: string, tamanho: number) => {
  const file = new File(["x"], nome, { type: tipo });
  Object.defineProperty(file, "size", { value: tamanho });
  return file;
};

beforeEach(() => {
  vi.spyOn(providerService, "fetchMe").mockResolvedValue(perfilHotel);
  vi.spyOn(providerService, "updatePublicProfile").mockResolvedValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it("recusa foto de perfil acima de 2 MB e avisa, sem trocar a imagem", async () => {
  renderTela();
  const input = await screen.findByLabelText("Escolher foto de perfil");

  fireEvent.change(input, { target: { files: [arquivo("logo.png", "image/png", 2 * 1024 * 1024 + 1)] } });

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/mais de 2 MB/))
  );
  expect(screen.getByAltText("Logo").getAttribute("src")).toBe(perfilHotel.user.avatar_url);
});

it("recusa formato que a API não aceita (GIF)", async () => {
  renderTela();
  const input = await screen.findByLabelText("Escolher foto de perfil");

  fireEvent.change(input, { target: { files: [arquivo("logo.gif", "image/gif", 1000)] } });

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/JPEG, PNG ou WebP/))
  );
});

it("ao salvar sem trocar imagens, não reenvia avatar nem galeria", async () => {
  renderTela();
  await screen.findByLabelText("Escolher foto de perfil");

  fireEvent.click(screen.getByRole("button", { name: /Salvar Perfil/ }));

  await waitFor(() => expect(providerService.updatePublicProfile).toHaveBeenCalledTimes(1));
  const payload = vi.mocked(providerService.updatePublicProfile).mock.calls[0][0];
  expect(payload).not.toHaveProperty("avatar_url");
  expect(payload).not.toHaveProperty("gallery_images");
  expect(payload.city).toBe("São Paulo");
});

it("mostra a mensagem da API quando o salvamento é recusado", async () => {
  vi.mocked(providerService.updatePublicProfile).mockRejectedValue(
    new Error("Envie no máximo 8 fotos na galeria.")
  );
  renderTela();
  await screen.findByLabelText("Escolher foto de perfil");

  fireEvent.click(screen.getByRole("button", { name: /Salvar Perfil/ }));

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("Envie no máximo 8 fotos na galeria.")
  );
});
