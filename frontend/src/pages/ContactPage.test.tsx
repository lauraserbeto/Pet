import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { ContactPage } from "./ContactPage";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const realLocation = window.location;
let href = "";

// jsdom não tem IntersectionObserver (animações whileInView) nem APIs de
// ponteiro usadas pelo Select do Radix.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", NoopObserver);
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

beforeEach(() => {
  href = "";
  // jsdom não navega para mailto:; capturamos o destino.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...realLocation,
      get href() {
        return href;
      },
      set href(value: string) {
        href = value;
      },
    },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: realLocation });
  vi.clearAllMocks();
});

it("abre o e-mail com a mensagem pronta e não anuncia envio que não aconteceu (E-20)", async () => {
  render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: "Tutora Teste" } });
  fireEvent.change(screen.getByLabelText(/E-mail \*/), { target: { value: "tutora@petplus.test" } });
  fireEvent.change(screen.getByLabelText(/Mensagem/), { target: { value: "Dúvida sobre reserva" } });
  // Assunto é um Select (Radix); o formulário exige um assunto válido.
  fireEvent.keyDown(screen.getByLabelText(/Assunto/), { key: "Enter" });
  fireEvent.click(screen.getByRole("option", { name: "Sugestão" }));

  fireEvent.click(screen.getByRole("button", { name: /Abrir e-mail com a mensagem/ }));

  expect(href.startsWith("mailto:contato@petplus.com.br?")).toBe(true);
  expect(decodeURIComponent(href)).toContain("[Pet+] Sugestão");
  expect(decodeURIComponent(href)).toContain("Dúvida sobre reserva");
  expect(toast.success).not.toHaveBeenCalled();
  expect(await screen.findByText("Sua mensagem está pronta")).toBeTruthy();
  expect(screen.queryByText(/Mensagem enviada/)).toBeNull();
});

it("campos obrigatórios vazios não abrem o e-mail", () => {
  render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: /Abrir e-mail com a mensagem/ }));

  expect(href).toBe("");
  expect(toast.error).toHaveBeenCalledWith("Preencha todos os campos obrigatórios.");
});
