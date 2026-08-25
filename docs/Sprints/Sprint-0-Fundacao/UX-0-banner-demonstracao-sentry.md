# UX-0 — Banner "Ambiente de Demonstração" nos dashboards mock + Sentry

> Sprint 0 · Semana 1 (25–31/ago) · Frontend · Prioridade Alta · Esforço M · Responsável R4

## Contexto
Algumas telas de dashboard são 100% mock (dados fictícios, sem integração com o backend), mas
**não avisam o usuário** disso — o que induz a leitura de números inventados como reais. Ao
mesmo tempo, o projeto já tem um padrão de aviso pronto: `frontend/src/pages/dashboard/Finance.tsx`
(e `Orders.tsx`) exibem um bloco "Ambiente de Demonstração" (em `Finance.tsx`, por volta da
linha 82: card `bg-amber-50 border-amber-200` com ícone `AlertCircle`, título "Ambiente de
Demonstração" e texto explicando que a tela usa dados fictícios e ainda não foi integrada).

As telas mock **sem** esse aviso são:
- `frontend/src/pages/dashboard/Overview.tsx`
- `frontend/src/pages/dashboard/Schedule.tsx`
- `frontend/src/pages/dashboard/Customers.tsx`
- `frontend/src/pages/tutor/TutorOrders.tsx`
- `frontend/src/pages/tutor/TutorAppointments.tsx`

Além disso, não há monitoramento de erros. O `frontend/src/components/ErrorBoundary.tsx:22`
tem `// TODO(PET-09): reportar para ferramenta de monitoramento (Sentry) com source maps.` no
`componentDidCatch`, mas hoje só faz `console.error`. O backend também não reporta erros a
nenhuma ferramenta.

## Objetivo
Deixar explícito ao usuário quando uma tela é de demonstração (banner nas 5 telas) e habilitar
observabilidade de erros com Sentry no front e no back.

## Escopo / Passos
1. **Banner:** replicar o bloco de "Ambiente de Demonstração" de `Finance.tsx` nas 5 telas mock
   listadas. Preferir extrair um componente reutilizável (ex.: `DemoBanner`) e usá-lo também em
   `Finance.tsx`/`Orders.tsx` para eliminar a duplicação, mantendo o mesmo visual (amber, ícone
   `AlertCircle`, título e texto).
2. **Sentry (front):** instalar/configurar o SDK do Sentry no bootstrap do app; enviar o report
   no `componentDidCatch` do `ErrorBoundary` (substituindo o TODO PET-09), preservando o
   `console.error`. Configurar DSN via env (`VITE_SENTRY_DSN`) e habilitar apenas quando presente.
3. **Sentry (back):** configurar o SDK do Sentry no Express 5; capturar erros no errorHandler
   central (onde os `AppError`/erros são tratados) e/ou via middleware. DSN via env (`SENTRY_DSN`).
4. Garantir que nenhum dado sensível vaze nos eventos (sem `password_hash`, sem `document`/CPF/CNPJ,
   sem token).

## Arquivos envolvidos
- `frontend/src/pages/dashboard/Finance.tsx:82` — referência do banner atual (fonte do padrão).
- `frontend/src/pages/dashboard/Overview.tsx` — adicionar banner de demonstração.
- `frontend/src/pages/dashboard/Schedule.tsx` — adicionar banner.
- `frontend/src/pages/dashboard/Customers.tsx` — adicionar banner.
- `frontend/src/pages/tutor/TutorOrders.tsx` — adicionar banner.
- `frontend/src/pages/tutor/TutorAppointments.tsx` — adicionar banner.
- `frontend/src/components/ErrorBoundary.tsx:22` — substituir o TODO(PET-09) por report ao Sentry.
- Bootstrap do front (ex.: `frontend/src/main.tsx`) — inicialização do Sentry.
- `backend/src/server.js` e o errorHandler central — inicialização e captura do Sentry no back.
- `backend/.env.example` / `frontend/.env` — nova chave de DSN (placeholder, sem segredo).

## Dependências
- Depende de: nenhuma. (Recomenda-se coordenar a chave de DSN no `.env.example` com INF-0.)
- Bloqueia: nenhuma.

## Critério de aceite (Definition of Done)
- [ ] As 5 telas (`Overview`, `Schedule`, `Customers`, `TutorOrders`, `TutorAppointments`) exibem o banner "Ambiente de Demonstração" com o mesmo visual de `Finance.tsx`.
- [ ] (Se extraído) componente `DemoBanner` reutilizado também por `Finance.tsx` e `Orders.tsx`, sem regressão visual.
- [ ] Sentry configurado no front: um erro de renderização capturado pelo `ErrorBoundary` chega ao Sentry.
- [ ] Sentry configurado no back: um erro tratado pelo errorHandler central chega ao Sentry.
- [ ] DSNs configurados via env; sem DSN, a app funciona normalmente (Sentry desabilitado).
- [ ] Nenhum dado sensível (senha, CPF/CNPJ, token) nos eventos enviados.

## Testes
- Forçar um erro de render numa das telas e confirmar o evento no Sentry (front).
- Forçar um erro numa rota do backend e confirmar o evento no Sentry (back).
- Abrir cada uma das 5 telas e verificar o banner.
- Rodar a app sem DSN e confirmar que nada quebra.

## Notas técnicas / armadilhas
- O texto do banner deve deixar claro que os dados são fictícios e a tela ainda não foi integrada ao backend — mesmo tom do já existente em `Finance.tsx`.
- Sentry no front: usar source maps para stack traces legíveis; não subir source maps públicos com segredos.
- Sentry no back (Express 5): atenção à ordem dos middlewares — a captura de erros vem depois das rotas e integra com o errorHandler central; não engolir o `next(err)` existente.
- Scrubbing de PII: garantir que o payload de eventos não inclua `user` cru, `document` (CPF/CNPJ) nem tokens; configurar `beforeSend` se necessário.
- Habilitar Sentry só em produção/staging (ou quando o DSN existir) para não poluir com erros de dev.
