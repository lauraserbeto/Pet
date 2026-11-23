// E-34: avaliação do Pet Sitter em Dialog acessível e com as fotos reais (RF-010).
import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { SitterEvaluations } from "./SitterEvaluations";
import { userService } from "../../lib/services/userService";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
afterEach(() => vi.restoreAllMocks());

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

it("mostra as fotos enviadas com texto alternativo, sem 'previews simulados', em diálogo acessível", async () => {
  vi.spyOn(userService, "getEvaluations").mockResolvedValue([
    {
      id: "ev1",
      user_id: "u1",
      status: "PENDING",
      created_at: "2026-11-20T10:00:00Z",
      experience_details: {},
      quiz_answers: {},
      environment_photos: [PNG, "https://cdn.petplus.test/ambiente.jpg", "javascript:alert(1)"],
      user: { id: "u1", full_name: "Candidata QA", email: "candidata@petplus.test" },
    },
  ] as never);

  render(<SitterEvaluations />);
  fireEvent.click(await screen.findByRole("button", { name: /Analisar/ }));

  const dialog = await screen.findByRole("dialog", { name: "Avaliação: Candidata QA" });
  const fotos = within(dialog).getAllByRole("img", { name: /Foto \d de 3 do ambiente de Candidata QA/ });
  expect(fotos).toHaveLength(2);
  expect(fotos[0].getAttribute("src")).toBe(PNG);
  expect(fotos[1].getAttribute("src")).toBe("https://cdn.petplus.test/ambiente.jpg");
  // Endereço fora do formato aceito pela API não vira <img>/<a>.
  expect(within(dialog).getByText("Formato de imagem não suportado")).toBeTruthy();
  expect(dialog.querySelector('[href^="javascript:"], [src^="javascript:"]')).toBeNull();
  expect(within(dialog).queryByText(/Previews simulados/)).toBeNull();

  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});
