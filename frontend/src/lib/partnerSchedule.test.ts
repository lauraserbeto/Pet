import { expect, test } from "vitest";
import { appointmentsOnDay, partnerCanTransition, scheduleDays } from "./partnerSchedule";
import type { Appointment } from "./services/appointmentService";

const now = new Date(2026, 10, 16, 12).getTime();
const item = {
  id: "a",
  start_time: new Date(now + 3600000).toISOString(),
  end_time: new Date(now + 7200000).toISOString(),
  status: "PENDENTE",
  payment_policy: "PRESENCIAL",
  payment: null,
} as Appointment;
test("agenda inclui intervalos sobrepostos e exclui fim exato à meia-noite", () => {
  const day = new Date(2026, 10, 17);
  const stay = {
    ...item,
    start_time: new Date(2026, 10, 16, 23).toISOString(),
    end_time: new Date(2026, 10, 18).toISOString(),
  };
  expect(appointmentsOnDay([stay], day)).toHaveLength(1);
  expect(appointmentsOnDay([stay], new Date(2026, 10, 18))).toHaveLength(0);
  expect(appointmentsOnDay([{ ...stay, end_time: day.toISOString() }], day)).toHaveLength(0);
});
test("semana começa na segunda e navega também na virada de ano", () => {
  const days = scheduleDays(new Date(2027, 0, 1), "week");
  expect(days).toHaveLength(7);
  expect(days[0].getDay()).toBe(1);
  expect(days[0].getFullYear()).toBe(2026);
  expect(days[6].getFullYear()).toBe(2027);
});
test("pré-pago não pago e estados terminais não oferecem ações", () => {
  for (const status of ["PENDENTE", "CANCELADO", "RECUSADO", "CONCLUIDO"] as const)
    for (const target of ["CONFIRMADO", "RECUSADO", "CANCELADO", "CONCLUIDO"] as const)
      expect(
        partnerCanTransition({ ...item, status, payment_policy: "PRE_PAGO" }, target, now)
      ).toBe(false);
});
test("presencial pendente permite decisão e pré-pago exige registro aprovado", () => {
  expect(partnerCanTransition(item, "CONFIRMADO", now)).toBe(true);
  expect(partnerCanTransition(item, "RECUSADO", now)).toBe(true);
  const paid = {
    ...item,
    status: "AGUARDANDO_CONFIRMACAO",
    payment_policy: "PRE_PAGO",
    payment: { status: "APPROVED" },
  } as Appointment;
  expect(partnerCanTransition(paid, "CONFIRMADO", now)).toBe(true);
  expect(partnerCanTransition({ ...paid, payment: null }, "RECUSADO", now)).toBe(false);
});
test("cancelamento e conclusão respeitam a fronteira exata do início", () => {
  const confirmed = { ...item, status: "CONFIRMADO" } as Appointment;
  const start = new Date(item.start_time).getTime();
  expect(partnerCanTransition(confirmed, "CANCELADO", start - 1)).toBe(true);
  expect(partnerCanTransition(confirmed, "CONCLUIDO", start - 1)).toBe(false);
  expect(partnerCanTransition(confirmed, "CANCELADO", start)).toBe(false);
  expect(partnerCanTransition(confirmed, "CONCLUIDO", start)).toBe(true);
});
