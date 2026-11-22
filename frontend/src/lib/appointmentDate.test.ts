import { it, expect } from "vitest";
import { appointmentDate } from "./appointmentBooking";

it("data de agendamento sem segundos, no mesmo formato curto dos pedidos (G13)", () => {
  const texto = appointmentDate("2026-11-21T01:07:35Z");

  expect(texto).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  expect(texto).toMatch(/^\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}$/);
});
