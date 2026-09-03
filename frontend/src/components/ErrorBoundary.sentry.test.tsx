import { it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import * as Sentry from "@sentry/react";
import { ErrorBoundary } from "./ErrorBoundary";
import { __test__ } from "../lib/sentry";

const Boom = () => {
  throw new Error("boom de teste");
};

/**
 * Prova de ponta a ponta do caminho ErrorBoundary → Sentry: em vez de espionar
 * o SDK, inicializa o Sentry de verdade com um transport falso e inspeciona o
 * envelope que sairia pela rede.
 */
it("envia ao Sentry o erro capturado pelo ErrorBoundary, sem PII", async () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  // O tipo Envelope vive em @sentry/core; aqui basta a forma que o teste inspeciona.
  type EnvelopeItem = [unknown, { exception?: { values: { value: string }[] }; user?: unknown }];
  const envelopes: EnvelopeItem[][] = [];

  Sentry.init({
    dsn: "http://publickey@localhost/1",
    sendDefaultPii: false,
    beforeSend: __test__.beforeSend,
    transport: () => ({
      send: (envelope) => {
        envelopes.push(envelope[1] as EnvelopeItem[]);
        return Promise.resolve({});
      },
      flush: () => Promise.resolve(true),
    }),
  });

  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );

  await Sentry.flush(2000);

  const event = envelopes
    .flat()
    .map(([, payload]) => payload)
    .find((payload) => payload?.exception);

  expect(event).toBeDefined();
  expect(event?.exception?.values[0].value).toBe("boom de teste");
  expect(event?.user).toBeUndefined();

  consoleSpy.mockRestore();
  await Sentry.getClient()?.close();
});
