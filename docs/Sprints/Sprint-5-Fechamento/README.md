# Sprint 5 — Fechamento

> Semanas 10–11 (27/out–08/nov) · Marco **M5 = 08/nov** · Pet+ (marketplace de pets: loja + hotéis + pet sitters)

## Objetivo do Sprint
Fechar o produto para entrega. Este é o sprint final: com pedidos (`Order`) e agendamentos
(`Appointment`) já existindo dos sprints anteriores, agora os **dashboards passam a ler dado
real** (parceiro e admin), a **UI de avaliações consome o backend de reviews** e todos os
ratings/reviews fabricados são removidos das telas, o **backend/infra é endurecido** (deploy
reproduzível, vulnerabilidades high zeradas, hardening residual de segurança) e roda a
**bateria de testes/QA de release** (integração + E2E das jornadas, a11y/responsividade e o
checklist de release consolidado). Ao final, o Pet+ está pronto para a apresentação.

## Marco M5 (08/nov) — Definition of Done do Sprint
"**Avaliações reais + dashboards com dado real + testes E2E + pronto p/ entrega**"
- [ ] Dashboards do **parceiro** (Overview/Finance) e do **admin** leem métricas reais; receita calculada de pedidos pagos; números conferem com o banco.
- [ ] Cliente **avalia pós-conclusão**; rating/review reais exibidos com paginação e estado vazio; **nenhuma tela** exibe rating/review fake.
- [ ] **Deploy reproduzível** do repositório (manifesto + `migrate deploy` no release); `npm audit` high **zerado e bloqueante** no CI.
- [ ] Hardening residual aplicado (404 correto, erros padronizados via `AppError`, `/api/metrics` protegido, rate limit global, UUID validado nos `:id`).
- [ ] **Integração + E2E** das jornadas (compra, agendamento, recusa/reenvio, avaliação) passam no CI; a11y/responsividade revisados; **checklist de release aprovado**.

## Tasks
| ID | Título | Trilha | Prioridade | Esforço | Sem. | Resp. |
|----|--------|--------|-----------|---------|------|-------|
| INF-2 | Deploy manifest + `migrate deploy` no boot + fix vulnerabilidades high. | Infra | Alta | M | 10 | R1 |
| DSH-1 | Overview/Finance do parceiro com dados reais. | Backend | Alta | M | 10 | R2 |
| AVL-F1 | UI de avaliações (parte 1) — escrever/exibir rating real. | Frontend | Alta | G | 10 | R3 |
| QA-2 | Testes de integração + E2E das jornadas (parte 1). | QA | Alta | G | 10 | R4 |
| SEC-2 | Hardening final + buffer. | Segurança | Alta | M | 11 | R1 |
| DSH-2 | Métricas admin com receita/pedidos reais. | Backend | Alta | M | 11 | R2 |
| AVL-F2 | UI de avaliações (parte 2) + remover últimos mocks. | Frontend | Alta | M | 11 | R3 |
| QA-3 | E2E (parte 2) + a11y/responsividade + checklist de release. | QA | Alta | G | 11 | R4 |

## Dependências e ordem sugerida
- **Herdadas de sprints anteriores:** `PED-2` (`POST /orders`) e `AGD-2` (agendamento) — bloqueiam **DSH-1**. `AVL-2` (backend de avaliações) — bloqueia **AVL-F1**.
- **Semana 10:** **DSH-1** (depende de PED-2 + AGD-2), **AVL-F1** (depende de AVL-2) e **INF-2** (depende de INF-0) correm em paralelo; **QA-2** começa sem dependências e cobre os fluxos vivos.
- **Semana 11:** **DSH-2** depende de **DSH-1**; **AVL-F2** depende de **AVL-F1**; **QA-3** depende de **QA-2**. **SEC-2** sem dependências e serve de buffer para pendências.
- Cadeia crítica do marco: `DSH-1 → DSH-2` (dados dos dashboards), `AVL-F1 → AVL-F2` (avaliações) e `QA-2 → QA-3` (testes/checklist de release).
- Ver o [checklist de release consolidado](RELEASE-CHECKLIST.md) — preenchido e validado em **QA-3**.

## Convenções do time
- Ninguém commita direto na `main` — fluxo de Pull Request com revisão obrigatória.
- Backend em camadas: routes → controllers → useCases → repositories/prisma; erros via `next(AppError)` + errorHandler central; validação Zod; logger pino. Express 5: `req.query` é read-only (validar com Zod inline). Prisma `Decimal` → `Number()`. Prisma `groupBy` por timestamp → bucketizar por dia em JS. Nunca vazar `password_hash`/`document`.
- Frontend: `lib/services/*` sobre `httpClient` tipado; hooks React Query; sempre tratar loading/erro/vazio/sucesso; `HamsterLoader`.
- CI (`.github/workflows/ci.yml`): backend (lint + unit/integração + Prisma generate), frontend (lint + typecheck + Vitest + build) e E2E smoke (Playwright). O gate `npm audit --audit-level=high` hoje é `continue-on-error: true` — **INF-2** o torna bloqueante para high.
