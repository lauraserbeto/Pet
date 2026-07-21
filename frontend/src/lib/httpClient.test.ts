import { describe, it, expect, vi, afterEach } from "vitest";
import { request } from "./httpClient";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("httpClient", () => {
  it("lança ApiError TIMEOUT quando a requisição excede o timeout", async () => {
    vi.useFakeTimers();
    // fetch que nunca resolve, mas respeita o AbortSignal.
    vi.stubGlobal("fetch", (_url: string, opts: RequestInit) =>
      new Promise((_resolve, reject) => {
        opts.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      })
    );

    const promise = request("/lento", { auth: false, timeoutMs: 1000 });
    promise.catch(() => {}); // evita unhandledRejection antes do assert
    await vi.advanceTimersByTimeAsync(1001);

    await expect(promise).rejects.toMatchObject({
      name: "ApiError",
      code: "TIMEOUT",
      status: 0,
    });
  });

  it("retorna o JSON parseado em caso de sucesso", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    }));

    await expect(request("/ok", { auth: false })).resolves.toEqual({ ok: true });
  });
});
