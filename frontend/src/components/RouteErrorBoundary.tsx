import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import * as Sentry from "@sentry/react";
import { ErrorFallback } from "./ErrorFallback";

/**
 * Fronteira de erro do React Router.
 *
 * Sem ela o router usa a própria tela padrão ("Unexpected Application Error!")
 * e engole o erro antes do `ErrorBoundary` da app — em produção nada chegava ao
 * Sentry. Aqui o erro é reportado e o usuário vê o mesmo fallback do Pet+.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    // Respostas de rota (404/401 vindas de loaders) são fluxo esperado, não falha.
    if (isRouteErrorResponse(error)) return;
    Sentry.captureException(error, { tags: { boundary: "route" } });
    console.error("[RouteErrorBoundary] Erro não tratado na rota:", error);
  }, [error]);

  return <ErrorFallback />;
}
