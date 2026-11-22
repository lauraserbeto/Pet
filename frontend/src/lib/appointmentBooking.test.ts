import { expect, test } from "vitest";
import { bookingPreview } from "./appointmentBooking";

test("diárias seguem o calendário de São Paulo, incluindo estadia no mesmo dia", () => {
  const now = Date.parse("2030-01-01");
  expect(
    bookingPreview(80, "DIARIA", "2030-01-10T23:00:00-03:00", "2030-01-12T01:00:00-03:00", now)
      .total
  ).toBe(160);
  expect(
    bookingPreview(80, "DIARIA", "2030-01-10T09:00:00-03:00", "2030-01-10T18:00:00-03:00", now)
      .quantity
  ).toBe(1);
});
test("90 minutos são duas horas, sem fracionar centavos", () => {
  expect(
    bookingPreview(
      12.35,
      "HORA",
      "2030-01-10T10:00:00Z",
      "2030-01-10T11:30:00Z",
      Date.parse("2030-01-01")
    ).total
  ).toBe(24.7);
});
test("rejeita período inválido, passado, excesso e preço inválido", () => {
  const now = Date.parse("2030-01-01");
  for (const [start, end] of [
    ["", ""],
    ["2029-01-01", "2029-01-02"],
    ["2030-01-10", "2030-01-09"],
    ["2030-01-10", "2030-01-12"],
  ]) {
    expect(() => bookingPreview(10, "HORA", start, end, now)).toThrow();
  }
  expect(() => bookingPreview(10, "DIARIA", "2030-01-10", "2030-02-12", now)).toThrow();
  expect(() =>
    bookingPreview(NaN, "HORA", "2030-01-10T10:00Z", "2030-01-10T11:00Z", now)
  ).toThrow();
});
