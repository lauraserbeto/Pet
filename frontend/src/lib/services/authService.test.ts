import { beforeEach, afterEach, test, expect, vi } from "vitest";
import { authService } from "./authService";
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ token: "test", user: { id: "qa" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    )
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});
test("cadastro e login enviam e-mail canônico e preservam a senha exata", async () => {
  const values = { email: " Maria@PETPLUS.TEST ", password: " ComEspaco1 " };
  await authService.register(values);
  await authService.login(values);
  for (const call of vi.mocked(fetch).mock.calls)
    expect(JSON.parse(String(call[1]?.body))).toMatchObject({
      email: "maria@petplus.test",
      password: " ComEspaco1 ",
    });
});
test("recuperação normaliza e-mail antes do transporte", async () => {
  await authService.forgotPassword("\t MARIA@PETPLUS.TEST ");
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({
    email: "maria@petplus.test",
  });
});
