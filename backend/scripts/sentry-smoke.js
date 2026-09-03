// Smoke test do Sentry. Dispara UM evento de verificação com o DSN configurado
// e confirma o envio — serve para validar a integração sem derrubar nenhuma
// rota real.
//
// Uso: npm run sentry:smoke   (com SENTRY_DSN no .env ou no ambiente)
//
// O evento leva usuário e campos sensíveis propositalmente falsos: no painel
// eles devem sumir ou aparecer como [Filtrado], provando que o scrubbing do
// `beforeSend` está ativo.
require('dotenv').config();

const Sentry = require('@sentry/node');
const { initSentry, captureError } = require('../src/config/sentry');

async function main() {
  if (!initSentry()) {
    console.error(
      '[SMOKE] SENTRY_DSN não definido. Defina a variável no .env ou no ambiente ' +
      'antes de rodar este script.'
    );
    process.exit(1);
  }

  // Isca gerada em runtime — de propósito: se o valor fosse um literal, ele
  // apareceria no trecho de código-fonte que o Sentry anexa ao stack trace e
  // poluiria a checagem.
  const isca = `isca-${Date.now()}`;

  Sentry.setUser({ id: isca, email: `${isca}@petplus.local` });
  Sentry.setExtra('payload', {
    email: 'smoke@petplus.local',
    password: isca,
    document: isca,
  });

  const error = new Error('[SMOKE] Evento de verificação do Pet+ — pode ignorar');

  // Mesmo caminho usado pelo errorHandler em produção.
  captureError(error, {
    id: 'smoke-test',
    method: 'POST',
    originalUrl: `/api/v1/smoke?token=${isca}`,
  });

  // `close` faz o flush e encerra o cliente — sem isso o SDK segura o event
  // loop e o script não termina sozinho.
  const enviado = await Sentry.close(5000);

  if (!enviado) {
    console.error('[SMOKE] Falha no envio (timeout no flush). Verifique o DSN e a rede.');
    process.exit(1);
  }

  console.log('[SMOKE] Evento enviado.');
  console.log(`[SMOKE] Isca desta execução: ${isca}`);
  console.log('[SMOKE] No painel do Sentry (projeto do backend), confirme:');
  console.log('        1. o evento "[SMOKE] Evento de verificação do Pet+" aparece;');
  console.log('        2. a seção User está VAZIA;');
  console.log('        3. em Additional Data, payload.password e payload.document = [Filtrado];');
  console.log('        4. a rota aparece SEM a query string (/api/v1/smoke);');
  console.log('        5. a isca acima NÃO aparece em nenhum lugar do evento.');

  process.exit(0);
}

main();
