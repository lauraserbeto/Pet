import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import { BookingPage } from "./BookingPage";
import { TutorAppointments } from "./tutor/TutorAppointments";
import { AppointmentActions } from "../components/AppointmentActions";
import { providerService } from "../lib/services/providerService";
import { petService } from "../lib/services/petService";
import { appointmentService, type Appointment } from "../lib/services/appointmentService";
import { ApiError } from "../lib/httpClient";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "tutor", role_id: 5 }, token: "test" }),
}));
const appointment: Appointment = {
  id: "a",
  provider_id: "p",
  service_id: "s",
  pet_id: "pet",
  status: "PENDENTE",
  start_time: "2099-01-10T10:00:00Z",
  end_time: "2099-01-11T10:00:00Z",
  total_price: 150,
  payment_policy: "PRE_PAGO",
  payment: null,
  pet: { id: "pet", name: "Rex" },
  service: { name: "Hospedagem", category: "BOARDING" },
  provider: { business_name: "Hotel Teste" },
};
const provider = {
  id: "p",
  business_name: "Hotel Teste",
  payment_policy: "PRE_PAGO",
  status: "APROVADO",
  services: [{ id: "s", name: "Hospedagem", price: 100, billing_unit: "DIARIA", is_active: true }],
} as Awaited<ReturnType<typeof providerService.fetchProviderDetails>>;
let client: QueryClient;
function renderPage(element = <BookingPage />, path = "/tutor/agendar/p") {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tutor/agendar/:providerId" element={element} />
          <Route path="/tutor/agendamentos" element={<TutorAppointments />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
async function fill() {
  await screen.findByText("Hotel Teste");
  fireEvent.change(screen.getByRole("combobox", { name: /^Serviço/ }), { target: { value: "s" } });
  fireEvent.change(screen.getByRole("combobox", { name: /^Pet/ }), { target: { value: "pet" } });
  fireEvent.change(screen.getByLabelText("Início (horário local)"), {
    target: { value: "2099-01-10T10:00" },
  });
  fireEvent.change(screen.getByLabelText("Fim (horário local)"), {
    target: { value: "2099-01-11T10:00" },
  });
}
beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(providerService, "fetchProviderDetails").mockResolvedValue(provider);
  vi.spyOn(petService, "list").mockResolvedValue([{ id: "pet", name: "Rex" }] as Awaited<
    ReturnType<typeof petService.list>
  >);
  vi.spyOn(appointmentService, "create").mockResolvedValue(appointment);
  vi.spyOn(appointmentService, "get").mockResolvedValue(appointment);
  vi.spyOn(appointmentService, "mine").mockResolvedValue([appointment]);
  vi.spyOn(appointmentService, "pay").mockResolvedValue({
    ...appointment,
    status: "AGUARDANDO_CONFIRMACAO",
    payment: {
      id: "pay",
      status: "APPROVED",
      amount: 150,
      paid_at: "",
      refunded_at: null,
      simulated: true,
    },
  });
  vi.spyOn(appointmentService, "cancel").mockResolvedValue({ ...appointment, status: "CANCELADO" });
});
afterEach(() => {
  cleanup();
  client?.clear();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

test("envia serviço/pet e datas ISO uma vez, sem confiar no preço do cliente", async () => {
  renderPage();
  await fill();
  const button = screen.getByRole("button", { name: "Enviar solicitação" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(await screen.findByText("Sua solicitação")).toBeTruthy();
  expect(appointmentService.create).toHaveBeenCalledTimes(1);
  const payload = vi.mocked(appointmentService.create).mock.calls[0][0];
  expect(payload.service_id).toBe("s");
  expect(payload.pet_id).toBe("pet");
  expect(payload.start_time).toMatch(/Z$/);
  expect(payload).not.toHaveProperty("price");
  expect(screen.getByText(/R\$\s*150,00/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Pagar agendamento" }));
  expect(await screen.findByText(/Total: R\$\s*150,00/)).toBeTruthy();
  expect(appointmentService.pay).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar pagamento simulado" }));
  await waitFor(() => expect(appointmentService.pay).toHaveBeenCalledWith("a"));
});
test("recupera um envio incerto pelo histórico sem criar de novo", async () => {
  vi.mocked(appointmentService.create).mockRejectedValue(
    new ApiError(0, "TIMEOUT", "Tempo esgotado")
  );
  renderPage();
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Enviar solicitação" }));
  await screen.findByText(/O envio pode ter sido concluído/);
  const payload = vi.mocked(appointmentService.create).mock.calls[0][0];
  const recovered = { ...appointment, start_time: payload.start_time, end_time: payload.end_time };
  vi.mocked(appointmentService.mine).mockResolvedValue([recovered]);
  vi.mocked(appointmentService.get).mockResolvedValue(recovered);
  fireEvent.click(screen.getByRole("button", { name: "Verificar solicitação" }));
  expect(await screen.findByText("Sua solicitação")).toBeTruthy();
  expect(appointmentService.create).toHaveBeenCalledTimes(1);
});
test("falha na conferência do envio mantém bloqueio de reenvio", async () => {
  vi.mocked(appointmentService.create).mockRejectedValue(
    new ApiError(0, "TIMEOUT", "Tempo esgotado")
  );
  vi.mocked(appointmentService.mine).mockRejectedValue(new Error("offline"));
  renderPage();
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Enviar solicitação" }));
  await screen.findByText(/O envio pode ter sido concluído/);
  fireEvent.click(screen.getByRole("button", { name: "Verificar solicitação" }));
  expect(await screen.findByText(/Ainda não foi possível conferir/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Enviar solicitação" }).hasAttribute("disabled")).toBe(
    true
  );
});
test("presencial não anuncia confirmação e não oferece pagamento", async () => {
  vi.mocked(appointmentService.create).mockResolvedValue({
    ...appointment,
    payment_policy: "PRESENCIAL",
  });
  vi.mocked(appointmentService.get).mockResolvedValue({
    ...appointment,
    payment_policy: "PRESENCIAL",
  });
  renderPage();
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Enviar solicitação" }));
  expect(await screen.findByText(/Solicitação enviada. Aguarde/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Pagar agendamento" })).toBeNull();
});
test("erro incerto bloqueia reenvio e mantém proteção após recarregar", async () => {
  vi.mocked(appointmentService.create).mockRejectedValue(
    new ApiError(0, "TIMEOUT", "Tempo esgotado")
  );
  const first = renderPage();
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Enviar solicitação" }));
  expect(await screen.findByText(/O envio pode ter sido concluído/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Enviar solicitação" }).hasAttribute("disabled")).toBe(
    true
  );
  first.unmount();
  client.clear();
  renderPage();
  expect(await screen.findByText(/O envio pode ter sido concluído/)).toBeTruthy();
  expect(appointmentService.create).toHaveBeenCalledTimes(1);
});
test("conflito conhecido mantém os campos e permite corrigir sem sucesso falso", async () => {
  vi.mocked(appointmentService.create).mockRejectedValue(
    new ApiError(409, "SCHEDULE_CONFLICT", "Horário indisponível")
  );
  renderPage();
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Enviar solicitação" }));
  expect(await screen.findByText("Horário indisponível")).toBeTruthy();
  expect(screen.queryByText("Sua solicitação")).toBeNull();
  expect(screen.getByRole("button", { name: "Enviar solicitação" }).hasAttribute("disabled")).toBe(
    false
  );
});
test("sem pets oferece cadastro e não cria reserva", async () => {
  vi.mocked(petService.list).mockResolvedValue([]);
  renderPage();
  expect(await screen.findByText("Você ainda não possui pets cadastrados.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Cadastrar pet" }).getAttribute("href")).toBe(
    "/tutor/pets"
  );
  expect(screen.getByRole("button", { name: "Enviar solicitação" }).hasAttribute("disabled")).toBe(
    true
  );
});
test("falha ao carregar pets é erro, não ausência de pets", async () => {
  vi.mocked(petService.list).mockRejectedValue(new Error("offline"));
  renderPage();
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("Você ainda não possui pets cadastrados.")).toBeNull();
});
test("histórico usa API, permite filtrar hotel e sitter e não usa mocks", async () => {
  vi.mocked(appointmentService.mine).mockResolvedValue([
    appointment,
    {
      ...appointment,
      id: "b",
      service: { name: "Passeio", category: "WALKING" },
      provider: { business_name: "Sitter Teste" },
    },
  ]);
  renderPage(<TutorAppointments />);
  expect(await screen.findByText("Hotel Teste")).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("tab", { name: "Pet Sitters" }), { key: "Enter" });
  expect(screen.getByRole("tab", { name: "Pet Sitters" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByText("Sitter Teste")).toBeTruthy();
  expect(screen.queryByText("Hotel Teste")).toBeNull();
});
test("cancelamento requer confirmação e informa estorno, sem pagar de novo", async () => {
  const paid = {
    ...appointment,
    status: "AGUARDANDO_CONFIRMACAO" as const,
    payment: {
      id: "pay",
      status: "APPROVED" as const,
      amount: 150,
      paid_at: "",
      refunded_at: null,
      simulated: true as const,
    },
  };
  vi.mocked(appointmentService.get).mockResolvedValue(paid);
  renderPage(<AppointmentActions appointment={paid} />);
  fireEvent.click(screen.getByRole("button", { name: "Cancelar agendamento" }));
  expect(await screen.findByText(/estorno integral simulado/)).toBeTruthy();
  expect(appointmentService.cancel).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
  await waitFor(() => expect(appointmentService.cancel).toHaveBeenCalledWith("a"));
});
test("mudança de valor no backend exige nova conferência antes de pagar", async () => {
  vi.mocked(appointmentService.get).mockResolvedValue({ ...appointment, total_price: 180 });
  renderPage(<AppointmentActions appointment={appointment} />);
  fireEvent.click(screen.getByRole("button", { name: "Pagar agendamento" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar pagamento simulado" }));
  expect(await screen.findByText(/O agendamento foi atualizado/)).toBeTruthy();
  expect(appointmentService.pay).not.toHaveBeenCalled();
});
