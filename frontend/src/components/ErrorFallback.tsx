/**
 * UI de fallback exibida quando um erro derruba a árvore de componentes.
 *
 * Estilos inline propositalmente — precisa funcionar mesmo que o erro tenha
 * origem na camada de estilos. Compartilhada por `ErrorBoundary` (erros de
 * render da app) e `RouteErrorBoundary` (erros dentro de uma rota).
 */
export function ErrorFallback() {
  const handleReload = () => window.location.assign("/");

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
        onClick={handleReload}
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
