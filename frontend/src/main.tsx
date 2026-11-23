
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import { initSentry } from "./lib/sentry";
  import "./styles/index.css";
  import { z } from "zod";

  // CSP efetiva (E-35): sem 'unsafe-eval'. O Zod 4 testa `new Function` para
  // compilar validações; com `jitless` ele não tenta e não gera violação.
  z.config({ jitless: true });

  // Observabilidade de erros — no-op quando VITE_SENTRY_DSN não está definido.
  initSentry();

  createRoot(document.getElementById("root")!).render(<App />);
  