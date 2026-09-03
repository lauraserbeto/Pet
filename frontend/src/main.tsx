
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import { initSentry } from "./lib/sentry";
  import "./styles/index.css";

  // Observabilidade de erros — no-op quando VITE_SENTRY_DSN não está definido.
  initSentry();

  createRoot(document.getElementById("root")!).render(<App />);
  