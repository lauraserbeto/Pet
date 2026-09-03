import { Component, type ErrorInfo, type ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { ErrorFallback } from "./ErrorFallback";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

/**
 * Captura erros de renderização em qualquer componente-filho e exibe uma UI de
 * fallback em vez de derrubar a aplicação inteira (tela branca).
 *
 * Estilos inline propositalmente — a fallback precisa funcionar mesmo que o
 * erro tenha origem na camada de estilos. Erros capturados aqui são reportados
 * ao Sentry (no-op quando VITE_SENTRY_DSN não está configurado).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    });
    console.error("[ErrorBoundary] Erro não tratado:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return <>{this.props.fallback}</>;

    return <ErrorFallback />;
  }
}

