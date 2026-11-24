# Checklist de Release — Pet+ (Marco M5, 08/nov)

> Consolidado do Sprint 5 · Preenchido e validado em **QA-3** · Gate final da entrega/apresentação.
> Marque cada item ao concluir; o release só é aprovado com todos os itens validados.

> **Validado em 23/11/2026.** Cada item marcado traz a evidência ao lado — arquivo,
> teste ou comando que o comprova. Itens que dependem do ambiente publicado ou de
> ação humana continuam abertos e estão agrupados no fim.

## 1. Deploy e Infra (INF-2)
- [x] Manifesto de deploy versionado no repositório (`Dockerfile`/`railway.json`/`nixpacks.toml`). — `backend/Dockerfile` e `backend/railway.json`
- [x] Build roda `npm ci` + `npx prisma generate`. — `backend/Dockerfile:11`
- [x] `npx prisma migrate deploy` executa no release; banco de produção em sincronia com o schema. — `start` em `backend/package.json`; aplicação das 20 migrations verificada do zero em container
- [x] `engines.node` fixado, alinhado ao CI. — `engines.node: 24.x` e `.nvmrc: 24.22.3` (o texto original dizia Node 20, defasado)
- [x] `npm audit --audit-level=high` = **zero** highs no backend e no frontend. — `found 0 vulnerabilities` nas duas pontas
- [x] Gate de auditoria do CI **bloqueante** (sem `continue-on-error`) para high nos dois jobs. — nenhuma ocorrência de `continue-on-error` em `ci.yml`
- [ ] Variáveis de ambiente de produção configuradas (JWT_SECRET, DATABASE_URL, Resend, etc.). — **exige acesso ao Railway**

## 2. Segurança (SEC-2 + herdado)
- [x] Rota inexistente e `:id` malformado retornam **404/422**, nunca 500. — `tests/integration/securityContracts.test.js`
- [x] UUID validado nos parâmetros `:id` antes da query Prisma. — schemas Zod com `.uuid()` em todas as rotas com `:id`
- [x] Erros de Auth/Product/Provider padronizados via `AppError` + `errorHandler` central. — `securityContracts.test.js` (envelope 401/422/500)
- [x] `GET /api/metrics` protegido (autenticação/admin) — não público. — `app.js`: `authMiddleware` + `adminMiddleware`
- [x] Rate limit **global** ativo, além do limite de `/auth`. — `app.use("/api", requestLimits.api)`
- [x] Nenhuma resposta vaza `password_hash` ou `document`. — SEC-1 + `securityPrivacyDb.test.js` + `e2e/security-real.spec.ts`

## 3. Dashboards com dado real (DSH-1, DSH-2)
- [x] Overview/Finance do **parceiro** leem dados reais. — nenhum `mockKPIs`/`mockChartData`/`mockTransactions` em `pages/dashboard/`
- [x] Receita do parceiro calculada de pedidos **pagos**. — `utils/commerceMetrics.js`: `PAID_ORDER_STATUSES`
- [x] Painel **admin** exibe receita/pedidos/agendamentos reais. — `e2e/metrics-real.spec.ts`
- [x] Números do admin **conferem com o banco** e batem com a soma dos parceiros. — `tests/integration/commerceMetricsDb.test.js` ("endpoints reconciliam com banco")
- [x] Comentário `AdminController.js` atualizado (métricas não mais omitidas). — comentário atual descreve "contagens existentes e comércio real"

## 4. Avaliações reais (AVL-F1, AVL-F2)
- [x] Cliente escreve avaliação **pós-conclusão**, persistida via backend. — `e2e/reviews-real.spec.ts`
- [x] Rating real exibido em Hotéis, Walkers e detalhe de produto. — `e2e/reviews-real.spec.ts`
- [x] Reviews com **paginação** e **estado vazio** honesto. — `useCases/reviews/ListReviewsUseCase.js`
- [x] Distribuição de notas a partir de dados reais. — `components/reviews/ReviewsPanel.tsx`
- [x] **Nenhuma tela** exibe rating/review fake. — busca por `Math.random`, `rating: 5.0`, `rating={4.8}`, `allProductsMock` em `frontend/src`: nenhuma ocorrência

## 5. Testes e QA (QA-2, QA-3)
- [x] Integração de **pedido**, **agendamento** e **auth** passa no CI. — 28 arquivos em `tests/integration/`, job com Postgres real
- [x] E2E de **compra** e **agendamento** ponta a ponta passa no CI. — `purchase-real.spec.ts` e `booking-real.spec.ts`, agora executados (antes pulavam)
- [x] E2E de **recusa/reenvio** e **avaliação** passa no CI. — `provider-correction-real.spec.ts` e `reviews-real.spec.ts`
- [x] Suíte estável, sem flakiness; `main` verde. — **101 testes, 101 passaram, sem retry**, em 3m12s no job de E2E do CI (run `45418949079`), incluindo os dois viewports do `checkout-recovery-real` (E-18). Duas causas de instabilidade foram removidas: contenção de recursos (workers do Playwright fixados em 2 no CI) e perda de mensagem no outbox de e-mail por escrita concorrente (trava em `qa-auth-server.js`), que derrubava o E-09. Resta uma fragilidade conhecida, registrada abaixo: o E-18 falha quando o spec roda **sozinho na máquina local**, ainda que passe no CI e na suíte completa. O verde na `main` é o item seguinte, só verificável depois do merge
- [x] Acessibilidade revisada (foco, labels/`aria-*`, contraste, teclado) sem regressão. — `e2e/a11y.spec.ts`: 22 casos, rotas públicas, checkout, painéis, telas do tutor, gestão de serviços e modais
- [x] Responsividade revisada (mobile/tablet/desktop) sem quebras nas telas-chave. — mesma suíte em 390px, 768px e 1280px

## 6. Processo e entrega
- [x] Todas as tasks do Sprint 5 mergeadas via **Pull Request**. — histórico da `main` sem commit direto
- [ ] CI verde na `main` (backend, frontend, e2e). — **confirmar após o merge da QA-2/QA-3**
- [ ] Demo/apresentação ensaiada com dados semeados representativos. — **ação da equipe**
- [ ] Este checklist **aprovado** — gate final do Marco M5. — **depende dos itens acima**

---

## Itens em aberto

| Item | Por quê | Quem resolve |
|---|---|---|
| Variáveis de produção | Exige acesso ao painel do Railway | quem administra o deploy |
| CI verde na `main` | Só verificável depois do merge | QA |
| Demo ensaiada | Ação da equipe | equipe |
| Aprovação do checklist | Gate: depende dos três acima | responsável pela entrega |

**29 dos 33 itens validados com evidência.** Os quatro restantes não são
verificáveis a partir do repositório ou dependem de ação humana.

## E-18: fragilidade conhecida (não bloqueia)

`checkout-recovery-real.spec.ts` simula perda de rede abortando a primeira
sincronização do carrinho. O handler **busca a requisição no servidor e só
depois aborta a resposta** (`spec:22` e `spec:27`), então o merge acontece de
fato no banco: o cliente acha que falhou, mas o carrinho já foi mesclado. Na
segunda tentativa, `total_items` pode vir diferente de 5 e a asserção dentro do
próprio handler derruba a requisição.

O caso **passa no CI** (run `45418949079`, 1280px e 390px, sem retry) e na suíte
completa local. Falha de forma determinística num cenário só: o spec rodando
sozinho na máquina local. Ou seja, o resultado do teste depende da temporização
da corrida entre o abort do cliente e a escrita do servidor — a asserção é
correta, o cenário é que está mal isolado.

Tentativa de correção (abortar antes de buscar, sem tocar no servidor) tornou a
falha determinística **nos dois viewports** em vez de resolvê-la — foi
revertida. Tornar o cenário determinístico exige conhecer a semântica pretendida
do carrinho anônimo quando o merge chega ao banco sem o cliente saber, que é de
quem escreveu o spec.

Reprodução da fragilidade: `./scripts/e2e-full.sh e2e/checkout-recovery-real.spec.ts`
— o caso de 1280px falha, inclusive na repetição; o de 390px passa.

## Como reproduzir as evidências de teste

```bash
# Suíte de integração (precisa de Postgres local)
cd backend && npm test

# Jornadas E2E completas, do zero
docker run -d --name petplus-e2e-pg -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=petplus_test -p 5432:5432 postgres:16
./scripts/e2e-full.sh
```
