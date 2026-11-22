import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { authService } from "../../lib/services/authService";
beforeEach(() => vi.spyOn(authService, "resetPassword").mockResolvedValue({ success: true }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
for (const [password, message] of [
  ["novasenha1", /ao menos uma letra maiúscula/],
  ["A1" + "á".repeat(36), /Senha muito longa/],
])
  test(`reset valida ${message} antes de chamar API`, async () => {
    render(
      <MemoryRouter initialEntries={["/redefinir-senha?token=fixture-token"]}>
        <ResetPasswordPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/^Nova senha$/i), {
      target: { value: password },
    });
    fireEvent.change(screen.getByLabelText(/^Confirmar senha$/i), {
      target: { value: password },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(await screen.findByText(message)).toBeTruthy();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });
