# Sprint 0 — Fundação

> Semana 1 (25–31/ago) · Marco **M0 = 31/ago** · Pet+ (marketplace de pets: loja + hotéis + pet sitters)

## Objetivo do Sprint
Estabilizar a base do produto antes de evoluir funcionalidades: destravar o fluxo de
carrinho para o TUTOR (bug de gate de papel em back e front), sanear a infraestrutura
de banco/segredos (migrations gerenciadas, validação de env, rotação de credenciais) e
tornar honesta a experiência de demonstração (estados de erro reais e avisos claros de
tela mock, além de observabilidade com Sentry). Ao final do Sprint 0, o tutor consegue
comprar de ponta a ponta e o ambiente sobe de forma reprodutível e segura.

## Marco M0 (31/ago) — Definition of Done do Sprint
- [ ] Tutor adiciona item e faz merge de carrinho sem 403 (back e front).
- [ ] `prisma migrate deploy` aplica o schema do zero; env validado no boot; `.env.example` versionado; rotação de segredos documentada.
- [ ] Telas mock exibem estados de erro reais; links quebrados removidos; banner de demonstração nas 5 telas restantes; Sentry capturando erros em front e back.

## Tasks
| ID | Título | Trilha | Prioridade | Esforço | Resp. |
|----|--------|--------|-----------|---------|-------|
| PED-0 | Corrige gate de papel do carrinho no backend (tutor tomava 403). | Backend | Crítico | P | R1 |
| INF-0 | Baseline de migrations Prisma + validação de env + `.env.example` + rotação de segredos. | Infra | Crítico | M | R2 |
| CAR-0 | Corrige carrinho no front + estados de erro reais + remoção de links mock. | Frontend | Crítico | P | R3 |
| UX-0 | Banner "Ambiente de Demonstração" nos dashboards mock + configuração do Sentry. | Frontend | Alta | M | R4 |

## Ordem sugerida
As 4 tasks não têm dependências entre si e podem correr em paralelo. Ordem de prioridade
para começar: **PED-0** (bug crítico, esforço P, destrava back) e **CAR-0** (mesmo bug no
front) primeiro para desbloquear a jornada de compra; **INF-0** em paralelo (crítico, base
de deploy); **UX-0** por último dentro do sprint (Alta, esforço M).

## Convenções do time
- Ninguém commita direto na `main` — fluxo de Pull Request com revisão obrigatória.
- Backend em camadas: routes → controllers → useCases → repositories/prisma; erros via `next(AppError)` + errorHandler central; validação Zod; logger pino.
- Frontend: `lib/services/*` sobre `httpClient` tipado; hooks React Query; sempre tratar loading/erro/vazio/sucesso; `HamsterLoader`.
- Testes de backend rodam com o test runner nativo do Node: `npm test` (`node --test`).
