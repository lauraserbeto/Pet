import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PetSitterOnboarding } from "./PetSitterOnboarding";
import { userService } from "../../lib/services/userService";

const auth = vi.hoisted(() => ({ setUser: vi.fn() }));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../../lib/services/userService", () => ({ userService: { getMe: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem("petplus_user", "{}");
});

it("COMPLETED sem aprovação não entra em loop entre onboarding e painel", async () => {
  vi.mocked(userService.getMe).mockResolvedValue({
    id: "qa",
    full_name: "QA",
    email: "qa@petplus.test",
    role_id: 4,
    onboarding_step: "COMPLETED",
    provider_status: "PENDENTE",
  });
  render(
    <MemoryRouter>
      <PetSitterOnboarding />
    </MemoryRouter>
  );
  expect(await screen.findByText("Painel ainda indisponível")).toBeTruthy();
  expect(userService.getMe).toHaveBeenCalledTimes(1);
  expect(auth.setUser).toHaveBeenCalledTimes(1);
});

it("falha de leitura mantém uma opção de nova consulta sem encerrar a sessão", async () => {
  vi.mocked(userService.getMe)
    .mockRejectedValueOnce(Error("offline"))
    .mockResolvedValueOnce({
      id: "qa",
      full_name: "QA",
      email: "qa@petplus.test",
      role_id: 4,
      onboarding_step: "IN_REVIEW",
      provider_status: "EM_REVISAO",
    });
  render(
    <MemoryRouter>
      <PetSitterOnboarding />
    </MemoryRouter>
  );
  await screen.findByText("Não foi possível consultar seu cadastro");
  fireEvent.click(screen.getByRole("button", { name: "Consultar novamente" }));
  expect(await screen.findByText("Avaliação em Análise")).toBeTruthy();
  expect(localStorage.getItem("petplus_user")).not.toBeNull();
});
