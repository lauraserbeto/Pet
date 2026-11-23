import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Upload de source maps para o Sentry — sem ele o stack trace no painel vem
// minificado e ilegível. Só liga quando SENTRY_AUTH_TOKEN existe (build da
// Vercel); em build local o passo inteiro é pulado.
//
// Os .map são gerados APENAS nesse caso e apagados logo após o upload
// (`filesToDeleteAfterUpload`), para não irem parar no bundle público.
const SENTRY_UPLOAD = Boolean(process.env.SENTRY_AUTH_TOKEN)

// Cabeçalhos de segurança: fonte única em vercel.json (produção), com a CSP EFETIVA
// (E-35). O teste src/config/csp.test.ts confere a política. O `vite preview` serve
// os mesmos cabeçalhos, trocando só a origem da API de produção pela de VITE_API_URL,
// para validar o build local contra a API local. O `vite dev` não recebe CSP (HMR).
const PRODUCTION_API_ORIGIN = 'https://api-petplus.up.railway.app'

function previewSecurityHeaders(apiUrl: string | undefined): Record<string, string> {
  const vercel = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'vercel.json'), 'utf8')) as {
    headers: Array<{ headers: Array<{ key: string; value: string }> }>
  }
  const headers = Object.fromEntries(
    vercel.headers.flatMap((h) => h.headers).map((h) => [h.key, h.value]),
  )
  let apiOrigin = 'http://localhost:3000'
  try {
    apiOrigin = new URL(apiUrl || 'http://localhost:3000/api/v1').origin
  } catch {
    /* mantém o padrão local */
  }
  const csp = headers['Content-Security-Policy']
  if (csp) headers['Content-Security-Policy'] = csp.replace(PRODUCTION_API_ORIGIN, apiOrigin)
  return headers
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
  plugins: [
    react(),
    tailwindcss(),
    ...(SENTRY_UPLOAD
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
            telemetry: false,
          }),
        ]
      : []),
  ],

  build: {
    // Gera source maps só quando eles serão enviados e apagados em seguida.
    sourcemap: SENTRY_UPLOAD,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  // `vite preview` serve o build de produção com a CSP efetiva e os mesmos
  // cabeçalhos de segurança da Vercel.
  preview: {
    headers: previewSecurityHeaders(env.VITE_API_URL),
  },
  }
})
