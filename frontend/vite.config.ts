import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// CSP em modo Report-Only: NÃO bloqueia nada, apenas reporta no console o que
// violaria a política. Espelha o header servido pela Vercel em produção
// (frontend/vercel.json), permitindo validar a política localmente via preview.
//
// `connect-src` inclui o ingest do Sentry: hoje a política é só report-only,
// mas ao ser promovida a enforcing (PET-10) o envio de eventos seria bloqueado
// silenciosamente. Manter os dois arquivos em sincronia.
const CSP_REPORT_ONLY =
  "default-src 'self'; " +
  "script-src 'self'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' data: https://fonts.gstatic.com; " +
  "img-src 'self' data: https:; " +
  "connect-src 'self' https://api-petplus.up.railway.app https://viacep.com.br https://*.ingest.sentry.io https://*.ingest.us.sentry.io; " +
  "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Aplica o CSP Report-Only no `vite preview` (que serve o build de produção),
  // reproduzindo o comportamento da Vercel para validação local.
  preview: {
    headers: {
      'Content-Security-Policy-Report-Only': CSP_REPORT_ONLY,
    },
  },
})
