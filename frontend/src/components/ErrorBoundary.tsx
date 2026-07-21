import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

/**
 * Captura erros de renderização em qualquer componente-filho e exibe uma UI de
 * fallback em vez de derrubar a aplicação inteira (tela branca).
 *
 * Estilos inline propositalmente — a fallback precisa funcionar mesmo que o
 * erro tenha origem na camada de estilos. Ponto de integração futuro com
 * monitoramento de erros (Sentry) fica em `componentDidCatch` — ver PET-09.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO(PET-09): reportar para ferramenta de monitoramento (Sentry) com source maps.
    console.error("[ErrorBoundary] Erro não tratado:", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return <>{this.props.fallback}</>;

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          color: "#1a2233",
          background: "#fafbfc",
        }}
      >
        <div style={{ fontSize: "44px" }} aria-hidden="true">
          🐾
        </div>
        <h1 style={{ fontSize: "22px", margin: 0 }}>Algo deu errado</h1>
        <p style={{ maxWidth: "420px", color: "#5b6577", margin: 0, lineHeight: 1.5 }}>
          Encontramos um problema inesperado ao carregar esta página. Você pode
          voltar ao início e tentar novamente. Se o problema persistir, contate o suporte.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            marginTop: "8px",
            padding: "10px 22px",
            fontSize: "15px",
            fontWeight: 600,
            color: "#fff",
            background: "#e6842b",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Voltar ao início
        </button>
      </div>
    );
  }
}
