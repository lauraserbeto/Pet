# Checklist de Release — Pet+ (Marco M5, 08/nov)

> Consolidado do Sprint 5 · Preenchido e validado em **QA-3** · Gate final da entrega/apresentação.
> Marque cada item ao concluir; o release só é aprovado com todos os itens validados.

## 1. Deploy e Infra (INF-2)
- [ ] Manifesto de deploy versionado no repositório (`Dockerfile`/`railway.json`/`nixpacks.toml`).
- [ ] Build roda `npm ci` + `npx prisma generate`.
- [ ] `npx prisma migrate deploy` executa no release; banco de produção em sincronia com o schema.
- [ ] `engines.node` fixado (Node 20, alinhado ao CI).
- [ ] `npm audit --audit-level=high` = **zero** highs no backend e no frontend.
- [ ] Gate de auditoria do CI **bloqueante** (sem `continue-on-error`) para high nos dois jobs.
- [ ] Variáveis de ambiente de produção configuradas (JWT_SECRET, DATABASE_URL, Resend, etc.).

## 2. Segurança (SEC-2 + herdado)
- [ ] Rota inexistente e `:id` malformado retornam **404/422**, nunca 500.
- [ ] UUID validado nos parâmetros `:id` antes da query Prisma.
- [ ] Erros de Auth/Product/Provider padronizados via `AppError` + `errorHandler` central.
- [ ] `GET /api/metrics` protegido (autenticação/admin) — não público.
- [ ] Rate limit **global** ativo, além do limite de `/auth`.
- [ ] Nenhuma resposta vaza `password_hash` ou `document` (regressão dos sprints anteriores mantida).

## 3. Dashboards com dado real (DSH-1, DSH-2)
- [ ] Overview/Finance do **parceiro** leem dados reais (sem `mockKPIs`/`mockChartData`/`mockTransactions`/`Mock Data`).
- [ ] Receita do parceiro calculada de pedidos **pagos**.
- [ ] Painel **admin** exibe receita/pedidos/agendamentos reais.
- [ ] Números do admin **conferem com o banco** e batem com a soma dos parceiros.
- [ ] Comentário `AdminController.js:13-17` atualizado (métricas não mais omitidas).

## 4. Avaliações reais (AVL-F1, AVL-F2)
- [ ] Cliente escreve avaliação **pós-conclusão**, persistida via backend.
- [ ] Rating real exibido em Hotéis, Walkers e detalhe de produto.
- [ ] Reviews com **paginação** e **estado vazio** honesto.
- [ ] Distribuição de notas a partir de dados reais.
- [ ] **Nenhuma tela** exibe rating/review fake (`Math.random`, `rating: 5.0`, `rating={4.8}`, `allProductsMock`, `ratingDistribution`, `Mocked` removidos).

## 5. Testes e QA (QA-2, QA-3)
- [ ] Integração de **pedido**, **agendamento** e **auth** passa no CI.
- [ ] E2E de **compra** e **agendamento** ponta a ponta passa no CI.
- [ ] E2E de **recusa/reenvio** e **avaliação** passa no CI.
- [ ] Suíte estável, sem flakiness; `main` verde.
- [ ] Acessibilidade revisada (foco, labels/`aria-*`, contraste, teclado) sem regressão.
- [ ] Responsividade revisada (mobile/tablet/desktop) sem quebras nas telas-chave.

## 6. Processo e entrega
- [ ] Todas as tasks do Sprint 5 mergeadas via **Pull Request** (ninguém commita direto na `main`).
- [ ] CI verde na `main` (backend, frontend, e2e).
- [ ] Demo/apresentação ensaiada com dados semeados representativos.
- [ ] Este checklist **aprovado** — gate final do Marco M5 (08/nov).
