# QA-2 — Testes de integração + E2E das jornadas (parte 1)

> Sprint 5 · Semana 10 (27/out–01/nov) · QA · Prioridade Alta · Esforço G · Responsável R4

## Contexto
O CI (`.github/workflows/ci.yml`) já roda três jobs: `backend` (lint + `node --test`/supertest +
`prisma generate`), `frontend` (lint + typecheck + Vitest + build) e `e2e` (Playwright smoke —
`frontend/e2e/smoke.spec.ts`, `a11y.spec.ts`, `legal.spec.ts`). Falta cobrir com testes de
**integração** os fluxos que agora estão vivos (pedido, agendamento, autenticação) e ter **E2E ponta
a ponta** das jornadas principais (compra e agendamento), não só smoke. Esta é a parte 1; recusa/reenvio
e avaliação entram na QA-3.

## Objetivo
Cobrir os fluxos vivos com testes de integração no backend e E2E das jornadas de compra e agendamento
ponta a ponta, rodando no CI.

## Escopo / Passos
1. **Integração — pedido:** teste supertest do fluxo de criação de pedido (`POST /orders`), incluindo o
   pagamento simulado que marca o pedido como pago e a consulta do pedido criado.
2. **Integração — agendamento:** teste do fluxo de agendamento (criação, cálculo de total, estados).
3. **Integração — auth:** login (ativo/desativado), gate por papel e rate limit de `/auth`.
4. **E2E — compra:** jornada Playwright ponta a ponta: navegar catálogo → carrinho → checkout → sucesso →
   pedido visível para o tutor.
5. **E2E — agendamento:** jornada ponta a ponta de agendar hotel/sitter até a confirmação.
6. **CI:** garantir que integração roda no job `backend` e as jornadas E2E rodam no job `e2e` (estender
   além do smoke atual); manter tudo verde.

## Arquivos envolvidos
- `backend/tests/integration/*` (novos testes de pedido, agendamento, auth — padrão `node --test` + supertest)
- `frontend/e2e/compra.spec.ts` (novo — jornada de compra)
- `frontend/e2e/agendamento.spec.ts` (novo — jornada de agendamento)
- `frontend/playwright.config.ts` (ajustes se necessário)
- `.github/workflows/ci.yml` (job `e2e` cobrindo as jornadas, não só smoke)

## Dependências (Depende de / Bloqueia)
- **Depende de:** nenhuma (os fluxos de pedido/agendamento/auth já existem).
- **Bloqueia:** QA-3 (parte 2 estende E2E para recusa/reenvio e avaliação e valida o checklist de release).

## Critério de aceite (Definition of Done)
- Testes de integração de **pedido**, **agendamento** e **auth** passam no CI.
- E2E de **compra** e **agendamento** ponta a ponta passam no CI.
- Suíte estável (sem flakiness intermitente) e verde na `main`.

## Testes
- `npm test` no backend (inclui os novos testes de integração) verde.
- `npm run test:e2e` no frontend (compra + agendamento) verde localmente e no CI.
- Rodar a suíte 2–3× para confirmar ausência de flakiness antes do merge.

## Notas técnicas / armadilhas
- Padrão do backend: `node --test` + supertest; o CI usa segredos fake (`JWT_SECRET`, `DATABASE_URL`) só
  para boot/config — testes de integração que tocam o banco precisam de banco de teste isolado/seed.
- E2E exige o build servido; `playwright.config.ts` já configura o projeto chromium — reaproveitar o setup do smoke.
- Cuidado com o **rate limit** de `/auth` (20 req/15min) nos testes — resetar/estado por teste para não estourar o limite.
- Pagamento é **simulado** (marca pago) — o E2E de compra valida o caminho feliz sem gateway real.
- Manter os testes determinísticos: dados semeados, sem dependência de horário/relógio real onde possível.
