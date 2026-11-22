import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Schedule } from "./Schedule";
import { appointmentService, type Appointment } from "../../lib/services/appointmentService";

const auth = vi.hoisted(() => ({ user: { id: "partner", role_id: 3 }, token: "test" }));
vi.mock("../../contexts/AuthContext", () => ({ useAuth: () => auth }));
let client: QueryClient;
let items: Appointment[];
const fixture = (): Appointment => ({
  id: "a",
  provider_id: "p",
  pet_id: "pet",
  service_id: "s",
  status: "PENDENTE",
  payment_policy: "PRESENCIAL",
  total_price: 80,
  start_time: new Date(2026, 10, 16, 14).toISOString(),
  end_time: new Date(2026, 10, 16, 15).toISOString(),
  payment: null,
  provider: { business_name: "Hotel Teste" },
  service: { name: "Hospedagem", category: "BOARDING" },
  pet: {
    id: "pet",
    name: "Rex",
    tutor: { id: "t", full_name: "Laura Teste", phone: "11999990000" },
  },
});
function renderSchedule() {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Schedule />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 16, 12));
  auth.user = { id: "partner", role_id: 3 };
  items = [fixture()];
  vi.spyOn(appointmentService, "provider").mockImplementation(async () => [...items]);
  vi.spyOn(appointmentService, "get").mockImplementation(async (id) =>
    items.find((item) => item.id === id)!
  );
  vi.spyOn(appointmentService, "updateStatus").mockImplementation(async (id, status) => {
    const updated = { ...items.find((item) => item.id === id)!, status };
    if (["RECUSADO", "CANCELADO"].includes(status) && updated.payment)
      updated.payment = { ...updated.payment, status: "REFUNDED" };
    items = items.map((item) => (item.id === id ? updated : item));
    return updated;
  });
});
afterEach(() => {
  cleanup();
  client?.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("carrega dados reais e confirma presencial com uma única mutation", async () => {
  renderSchedule();
  expect(await screen.findByText("Tutor: Laura Teste")).toBeTruthy();
  expect(screen.queryByText(/Demonstração/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  const button = await screen.findByRole("button", { name: "Confirmar atendimento" });
  fireEvent.click(button);
  fireEvent.click(button);
  await waitFor(() => expect(appointmentService.updateStatus).toHaveBeenCalledTimes(1));
  expect(await screen.findByText("Confirmado", { selector: "span" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Concluir" })).toBeNull();
});
test("pré-pago pendente fica sem ações e explica a espera pelo tutor", async () => {
  items[0].payment_policy = "PRE_PAGO";
  renderSchedule();
  await screen.findByText("Aguardando pagamento do tutor");
  for (const name of ["Confirmar", "Recusar", "Cancelar", "Concluir"])
    expect(screen.queryByRole("button", { name })).toBeNull();
});
test("recusa pré-pago pago pede confirmação e mostra estorno retornado", async () => {
  items[0] = {
    ...items[0],
    payment_policy: "PRE_PAGO",
    status: "AGUARDANDO_CONFIRMACAO",
    payment: {
      id: "pay",
      status: "APPROVED",
      amount: 80,
      paid_at: "",
      refunded_at: null,
      simulated: true,
    },
  };
  renderSchedule();
  fireEvent.click(await screen.findByRole("button", { name: "Recusar" }));
  expect(screen.getByRole("dialog").textContent).toContain("estorno integral simulado");
  expect(appointmentService.updateStatus).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Recusar solicitação" }));
  expect(await screen.findByText(/Estornado \(simulado\)/)).toBeTruthy();
});
test("confirmado futuro pode cancelar mas não concluir", async () => {
  items[0].status = "CONFIRMADO";
  renderSchedule();
  fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("button", { name: "Concluir" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar atendimento" }));
  expect(await screen.findByText("Cancelado", { selector: "span" })).toBeTruthy();
});
test("conclui atendimento iniciado e não oferece cancelamento", async () => {
  items[0] = {
    ...items[0],
    status: "CONFIRMADO",
    start_time: new Date(2026, 10, 16, 10).toISOString(),
  };
  renderSchedule();
  fireEvent.click(await screen.findByRole("button", { name: "Concluir" }));
  expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Concluir atendimento" }));
  expect(await screen.findByText("Concluído", { selector: "span" })).toBeTruthy();
});
test("atualização concorrente exige conferir estado novo antes de agir", async () => {
  renderSchedule();
  fireEvent.click(await screen.findByRole("button", { name: "Confirmar" }));
  items = [{ ...items[0], status: "CANCELADO" }];
  fireEvent.click(screen.getByRole("button", { name: "Confirmar atendimento" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    expect.stringContaining("agendamento mudou")
  );
  expect(appointmentService.updateStatus).not.toHaveBeenCalled();
});
test("falha na mutation permite repetir sem perder data e filtro", async () => {
  vi.mocked(appointmentService.updateStatus).mockRejectedValueOnce(new Error("Falha de rede"));
  renderSchedule();
  fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
    target: { value: "PENDENTE" },
  });
  fireEvent.click(await screen.findByRole("button", { name: "Confirmar" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar atendimento" }));
  expect(await screen.findByText("Falha de rede")).toBeTruthy();
  expect(screen.getByLabelText("Data da agenda")).toHaveProperty("value", "2026-11-16");
  expect(screen.getByLabelText("Status")).toHaveProperty("value", "PENDENTE");
  fireEvent.click(screen.getByRole("button", { name: "Confirmar atendimento" }));
  await waitFor(() => expect(appointmentService.updateStatus).toHaveBeenCalledTimes(2));
});
test("loading, erro e retry mantêm o período escolhido", async () => {
  vi.mocked(appointmentService.provider).mockRejectedValueOnce(new Error("offline"));
  renderSchedule();
  expect(screen.getByRole("status", { name: "Carregando agenda..." })).toBeTruthy();
  await screen.findByText("Não foi possível carregar a agenda.");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Hotel Teste")).toBeTruthy();
});
test("navega por dia/semana, inclui hospedagem em curso e filtra status", async () => {
  items[0] = {
    ...items[0],
    start_time: new Date(2026, 10, 15, 23, 30).toISOString(),
    end_time: new Date(2026, 10, 17).toISOString(),
  };
  renderSchedule();
  await screen.findByText("Atendimento iniciado em dia anterior.");
  fireEvent.click(screen.getByRole("button", { name: "Próximo dia" }));
  expect(await screen.findByText("Nenhum agendamento neste dia.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Semana" }));
  expect(
    within(screen.getByRole("region", { name: "16/11/2026" })).getByText("Hotel Teste")
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Próxima semana" }));
  expect(await screen.findByText("Nenhum agendamento neste período.")).toBeTruthy();
});
test("cache da agenda é separado entre contas", async () => {
  const rendered = renderSchedule();
  await screen.findByText("Hotel Teste");
  auth.user = { id: "other", role_id: 4 };
  items = [];
  rendered.rerender(
    <QueryClientProvider client={client}>
      <Schedule />
    </QueryClientProvider>
  );
  await screen.findByText("Nenhum agendamento neste dia.");
  expect(screen.queryByText("Hotel Teste")).toBeNull();
});
