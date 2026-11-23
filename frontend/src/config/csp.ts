/**
 * Content Security Policy do frontend (E-35) — definição esperada.
 *
 * Aplicada em modo EFETIVO (bloqueia), não mais Report-Only. O cabeçalho servido
 * vem de `vercel.json` (produção); o `vite preview` lê o mesmo arquivo e troca só a
 * origem da API. O teste `csp.test.ts` exige que `vercel.json` seja exatamente
 * `buildCsp(PRODUCTION_API_ORIGIN)`, então mudar a política é mudar os dois juntos.
 * O `vite dev` (HMR) não recebe CSP: ele depende de scripts inline/eval do Vite.
 *
 * Fontes conferidas no código e no navegador (ver E-35-IMPLEMENTACAO-E-VALIDACAO.md):
 * - scripts: só o próprio bundle. Sem 'unsafe-eval' (o Zod roda com `jitless`).
 * - estilos: 'unsafe-inline' é necessário (animações e gráficos aplicam `style`
 *   inline); Google Fonts via @import em `styles/fonts.css`.
 * - imagens: data: (fotos enviadas em base64), blob: (prévia local das fotos do
 *   onboarding) e https: (fotos de produtos/parceiros hospedadas fora).
 * - conexões: API, ViaCEP e ingestão do Sentry (regiões US/DE e genérica).
 * - pagamento: o Mercado Pago é aberto por navegação (`location.assign`), que a
 *   CSP não restringe; não há SDK, iframe ou formulário externo.
 */
export const PRODUCTION_API_ORIGIN = "https://api-petplus.up.railway.app";

export function buildCsp(apiOrigin: string): string {
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'"]],
    ["style-src", ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]],
    ["font-src", ["'self'", "data:", "https://fonts.gstatic.com"]],
    ["img-src", ["'self'", "data:", "blob:", "https:"]],
    [
      "connect-src",
      [
        "'self'",
        apiOrigin,
        "https://viacep.com.br",
        "https://*.ingest.sentry.io",
        "https://*.ingest.us.sentry.io",
        "https://*.ingest.de.sentry.io",
      ],
    ],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];
  return directives.map(([name, values]) => `${name} ${values.join(" ")}`).join("; ");
}
