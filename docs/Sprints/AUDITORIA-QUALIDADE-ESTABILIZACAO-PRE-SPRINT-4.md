# Auditoria de Qualidade e Plano de Estabilização — Sprints Anteriores à Sprint 4

> **Data:** 23/10/2026 (verificações executadas em 22/10/2026) · **Base auditada:** `origin/main` no commit `c1d53f0` (AGD-2, 15/10/2026), confirmado como ponta remota da `main` em 22/10/2026 · **Escopo:** Sprints 0 a 3 (28 tasks) e os módulos-base dos quais elas dependem · **Natureza:** auditoria somente leitura — nenhuma correção foi aplicada.
>
> Os números de linha citados referem-se ao commit `c1d53f0`. A branch `Tasks-Laura` (`176e5a4`) está 8 commits atrás da `main` e não contém AGD-2, CHK-3, SRV-F1/F2 nem o ajuste de migrations no boot.

**Legenda de severidade:** **Crítico** = falha de segurança ou de regra de negócio essencial explorável hoje, que compromete a base das próximas sprints · **Alto** = regra de negócio quebrada no fluxo principal, perda de dado ou exposição de dado pessoal · **Médio** = comportamento incorreto em fluxo alternativo, validação ausente que gera erro 500, interface enganosa ou dívida com risco concreto · **Baixo** = higiene, cosmético ou risco de baixa probabilidade.

**Legenda de evidência:** **Comprovado** = confirmado pela leitura do código e, quando indicado, por execução · **Risco potencial** = o código permite o problema, mas ele não foi reproduzido · **A investigar** = depende de ambiente externo ou de dado de produção.

---

## 1. Resumo executivo

**Resposta curta:** a base técnica é organizada e a esteira automatizada está verde, mas as entregas das Sprints 0 a 3 **não estão completas nem suficientemente confiáveis** para servir de base à Sprint 4 sem estabilização prévia. O código compila, os testes passam e o fluxo principal de compra funciona; os problemas estão nas regras de negócio aplicadas só no frontend, nos fluxos alternativos e nos dados que a interface afirma sem que o backend os sustente.

**Pontos fortes verificados**

- Esteira verde em todas as camadas: no CI do GitHub para `c1d53f0` (15/10/2026) passaram backend com PostgreSQL, frontend, E2E, deploy Vercel e deploy Railway. Na execução local de 22/10: **260 testes de backend (256 aprovados, 0 falhas, 4 ignorados por exigirem banco)**, **64 testes de frontend aprovados**, **13 cenários E2E aprovados**, typecheck e build sem erro, lint sem erros.
- Núcleo transacional bem construído: criação de pedido com transação, revalidação de estoque e prova de rollback em banco real (`backend/tests/integration/cartOrderDb.test.js`); máquina de estados de pedidos; webhook do Mercado Pago com assinatura, conferência de valor e moeda, lock e idempotência.
- Migrations versionadas e nunca editadas depois de aplicadas (um commit por migration); validação de ambiente no boot; Helmet, rate limit em `/auth`, Sentry com remoção de PII.
- Padrões de camadas, `AppError`, Zod e serviços HTTP tipados existem e são seguidos nas entregas mais recentes (SRV-1, PGT-1, AGD-1/AGD-2, SRV-F1/F2).

**Principais problemas**

1. **Crítico — a aprovação de parceiro é aplicada só na interface.** Um Pet Sitter ainda pendente, um lojista recusado ou um parceiro "desativado" pelo admin consegue autenticar e criar produtos que aparecem na loja e podem ser comprados. A PRD-2, que fecharia esse caminho, não foi implementada (AUD-01).
2. **Dados pessoais expostos:** `GET /api/v1/providers` é público e devolve nome, e-mail e status de todos os parceiros, inclusive pendentes e recusados (AUD-02). O corpo das requisições aceita até 50 MB antes de qualquer autenticação (AUD-03).
3. **O pedido não guarda o endereço de entrega** (AUD-04), e **o total exibido no checkout difere do valor cobrado**: frete de R$ 14,90, "5% de desconto no PIX" e cupom existem só na tela (AUD-05).
4. **A base de agendamento que a Sprint 4 vai consumir é contraditória:** o preço ignora o valor do serviço cadastrado (AUD-06), e a semântica de `PENDENTE`/`AGUARDANDO_CONFIRMACAO`/estorno diverge entre especificação, código, comentários e textos da interface (AUD-07).
5. **Jornadas parcialmente entregues:** o parceiro recusado não volta à tela de correção após o login (AUD-08). A vitrine pública mostra preços padrão inventados (R$ 150 a diária, R$ 50 a hora), avaliações aleatórias e até um depoimento fabricado (AUD-09). A CHK-3 introduziu regressão nas mensagens de erro do checkout (AUD-19). Configurações e Contato confirmam ações que não acontecem, e os botões "Reservar agora" e "Agendar agora" não fazem nada (AUD-21).
6. **Processo:** 9 das entregas entraram na `main` sem Pull Request (a branch não tem proteção). Nenhum critério de aceite foi marcado nas especificações, e há decisões de negócio sem task responsável, como o aceite real dos termos (AUD-14, AUD-28).

**Situação das 28 tasks auditadas**

| Classificação | Qtde | Tasks |
| --- | --- | --- |
| Concluída e validada | 2 | PED-0, AGD-1 |
| Concluída com ressalvas | 16 | INF-0, UX-0, PED-1, SEC-1, CHK-1, PED-2, STA-1, PRD-1, QA-1, PAG-1, EML-1, PED-F, AGD-2, SRV-1, SRV-F1, SRV-F2 |
| Parcialmente implementada | 6 | CAR-0, CHK-2, UX-2, REC-1, REC-2, CHK-3 |
| Não implementada | 3 | CFG-1, PRD-2, SRV-Fpub |
| Não verificável | 1 | PGT-1 (opcional; depende do sandbox do Mercado Pago) |

**Achados consolidados:** 40 itens — 1 crítico, 8 altos, 24 médios e 7 baixos (seção 8).

**Parecer:** prontidão **condicional**. A Sprint 4 não deve começar pelas tasks de agendamento (PAG-2, BKG-1/2, SCH-1/2) antes de resolver as decisões da Fase 0 e os bloqueadores da Fase 1 do plano de estabilização (seções 10 e 13).

---

## 2. Escopo e metodologia

### 2.1. Fontes analisadas

- **Planejamento:** `docs/Sprints/PLANO-DESENVOLVIMENTO.md` (decisões de negócio, convenções, DoD, marcos), `docs/Sprints/README.md`, os READMEs das sprints e os 28 arquivos de task das Sprints 0 a 3, além dos READMEs e tasks das Sprints 4 e 5 para avaliar dependências.
- **Requisitos e regras versionados:** `docs/funcional/04-requisitos.md` (RF-001 a RF-015, RNF-001 a RNF-006) e `docs/funcional/03-regras-de-negocio.md`. As numerações propostas em documentos locais não versionados não foram usadas como base.
- **Código:** snapshot integral de `c1d53f0`, extraído com `git archive` para uma pasta temporária fora do projeto: `backend/src`, `backend/prisma`, `backend/tests`, `frontend/src`, `frontend/e2e` e `.github/workflows/ci.yml`.
- **Histórico Git:** autoria e datas de cada entrega, merges e associação de commits a Pull Requests, consultada pela API pública do GitHub.
- **Contexto anterior:** `docs/CONTEXTO-HANDOFF-PETPLUS-2026-10-22.md` e `docs/evidencias-testes/2026-10-18/`. Foram usados como referência histórica; todo achado reaproveitado foi reconferido no código atual.

### 2.2. Verificações executadas

Todas as verificações rodaram sobre o snapshot da `main`, com as dependências já instaladas no projeto, sem banco de dados real, sem credenciais reais e sem chamadas a serviços externos.

| Verificação | Comando (equivalente) | Resultado |
| --- | --- | --- |
| Lint backend | `npx eslint .` | 0 erros, 7 avisos |
| Schema Prisma | `npx prisma validate` | válido |
| Testes backend + cobertura | `node --test --experimental-test-coverage` (Node 24.18, `RUN_DB_INTEGRATION_TESTS=false`) | 260 testes: 256 aprovados, 0 falhas, 4 ignorados |
| Lint frontend | `npx eslint .` | 0 erros, 151 avisos |
| Typecheck frontend | `npx tsc --noEmit` | sem erros |
| Testes frontend | `npx vitest run` | 12 arquivos, 64 testes aprovados |
| Build frontend | `npx vite build` | concluído; aviso de chunk acima de 500 kB |
| E2E | `npx playwright test` (Chromium, build local) | 13 cenários aprovados |
| Auditoria de dependências | `npm audit --omit=dev --audit-level=high` | backend: 5 vulnerabilidades; frontend: 2 |
| CI remoto | API pública do GitHub (check-runs e statuses de `c1d53f0`) | backend, frontend, E2E, Vercel e Railway: sucesso em 15/10/2026 |
| Disciplina de PR | API pública do GitHub (`commits/{sha}/pulls`, `branches/main`) | 9 commits de entrega sem PR; `main` sem proteção |

A leitura do código foi dividida por sprint (0–1, 2 e 3) e por tema transversal (segurança e arquitetura do backend; frontend), com cada achado vinculado a arquivo e linha. **Todos os achados críticos e altos foram reconferidos diretamente no código** antes de entrar neste documento; os médios e baixos vêm da leitura com referência de arquivo e linha.

### 2.3. Limitações

- **Sem banco local:** os 4 testes que exigem PostgreSQL foram ignorados localmente; a aprovação deles vem do CI de 15/10/2026. Não foram executados testes de concorrência.
- **Sem acesso aos serviços externos:** Railway, Vercel, Resend, Mercado Pago, Sentry e o banco de produção não foram acessados. Entrega de e-mails, webhooks no sandbox, rotação de segredos e estado das migrations em produção ficam como **não verificáveis**, com o procedimento de verificação indicado.
- **Sem board (Trello/Notion), apontamento de horas ou registro de revisão:** não é possível avaliar produtividade, esforço real ou eficiência. A análise de processo usa apenas o histórico Git e os documentos do repositório.
- **Cobertura:** o percentual do backend vem da instrumentação nativa do Node sobre a execução **sem banco**; não representa o CI. O frontend não tem ferramenta de cobertura instalada (`@vitest/coverage-v8` ausente), por isso **nenhum percentual é atribuído ao frontend**.
- **Interface:** não houve navegação manual nas telas autenticadas. As conclusões sobre interface vêm do código e dos testes E2E/componentes.
- **Módulos-base anteriores às sprints** (pets, endereços, perfil, onboarding, favoritos, admin) não têm especificação de sprint. Foram avaliados apenas quanto a riscos que afetam as entregas auditadas.

---

## 3. Inventário das entregas

"Entrada na main" indica o commit principal, a data, a autoria registrada no Git e se a entrega passou por Pull Request. Autoria de commit não equivale necessariamente à atribuição da task.

### Sprint 0 — Fundação (marco M0: 31/08)

| Task | Objetivo | Entrada na main | Classificação | Ressalvas principais |
| --- | --- | --- | --- | --- |
| PED-0 | Gate de papel no carrinho (backend) | `2537453` · 01/09 · Vitor · PR #14 | **Concluída e validada** | 12 testes de rota cobrem papéis 1–5. Gate "fail-open" para token sem papel (AUD-30) |
| INF-0 | Baseline de migrations, env, segredos | `e03ca88` · 03/09 · Laura · PR #14 | Concluída com ressalvas | `migrate deploy` comprovado no CI; rotação de segredos não verificável; sem teste do fail-fast |
| CAR-0 | Carrinho no front, estados de erro, links mock | `2537453` · 01/09 · Vitor · PR #14 | **Parcialmente implementada** | `WalkersPage` sem estado de erro; sem testes (AUD-22) |
| UX-0 | Banner de demonstração e Sentry | `b2ceb3e`…`4f6544a` · 31/08–03/09 · Marcel · PR #15 | Concluída com ressalvas | Cerca de 20 respostas 500 não passam pelo `errorHandler` e não chegam ao Sentry (AUD-10) |

### Sprint 1 — Pedidos e Segurança (marco M1: 14/09)

| Task | Objetivo | Entrada na main | Classificação | Ressalvas principais |
| --- | --- | --- | --- | --- |
| PED-1 | `POST /orders` transacional | `2c1eaf9` · 08/09 · Layssa · **sem PR** | Concluída com ressalvas | Rollback provado em banco; endereço descartado (AUD-04); corrida de estoque (AUD-12) |
| SEC-1 | Fechar vazamentos e `is_active` | `7bbd377` · 08/09 · Marcel · PR #19 | Concluída com ressalvas | `GET /providers` segue público com e-mails; regressão no painel Approvals (AUD-02); token não revogado (AUD-13) |
| CHK-1 | Checkout com validação real | `c83d4c8` · 09/09 · Vitor · **sem PR** | Concluída com ressalvas | Nenhum teste automatizado dos cenários da spec |
| CFG-1 | Persistir Configurações do parceiro | — | **Não implementada** | `Settings.tsx` só exibe toasts de sucesso (AUD-21) |
| PED-2 | `GET /orders` e `PATCH` de status | `84ca021` · 22/09 · Layssa · **sem PR** | Concluída com ressalvas | `PATCH` inválido responde 500 (Zod 4); cancelamento não devolve estoque (AUD-10, AUD-12) |
| STA-1 | Enum de `Provider.status` + `DELETE /products` | `03ea0b3` · 08/09 · Laura · PR #17 | Concluída com ressalvas | Migration rebaixa status desconhecidos sem aviso (AUD-36); "sitter operacional" pouco aplicado (AUD-15) |
| PRD-1 | Front do `DELETE` de produto | `99e915e` · 09/09 · Marcel · PR #18 | Concluída com ressalvas | Falta só teste de componente da remoção |
| QA-1 | Infra de testes de integração | `36ba673` · 10/09 · Laura · PR #20 | Concluída com ressalvas | Cobre carrinho, pedido e rollback; sem listagem nem concorrência em banco |

### Sprint 2 — Checkout, E-mail e Recusa (marco M2: 28/09)

| Task | Objetivo | Entrada na main | Classificação | Ressalvas principais |
| --- | --- | --- | --- | --- |
| PAG-1 | Pagamento simulado | `8c18267` · 04/10 · Laura · PR #25 (+ ajustes #26–#29) | Concluída com ressalvas | Lojista consegue marcar `PAGO` via `PATCH`; update simulado sem guarda de status (AUD-12) |
| EML-1 | Resend e recuperação de senha | `8c18267` · 04/10 · Laura · PR #25 | Concluída com ressalvas | Entrega real validada só manualmente (relato), sem evidência registrada; sem teste de token expirado ou usado |
| CHK-2 | Checkout real e tela de sucesso | `81a44a1` · 06/10 · Vitor · **sem PR** (+ `7c61bc2`, PR #27) | **Parcialmente implementada** | Tela de sucesso com status e prazo fabricados; totais divergentes; merge do carrinho sem estado (AUD-05, AUD-18) |
| UX-2 | Consistência visual, favoritos, reload | `461a159` · 07/10 · Vitor · **sem PR** | **Parcialmente implementada** | Finance e Orders fora do design system; sem testes (AUD-31) |
| AGD-1 | Modelagem de agendamento | `458f89f` · 07/10 · Marcel · PR #31 | **Concluída e validada** | 27 testes unitários; só a tabela da spec diverge numa transição |
| REC-1 | Recusa e reenvio (backend) | `7bd1633` · 05/10 · Layssa · **sem PR** (+ ajustes de template, Laura) | **Parcialmente implementada** | Painel não distingue `EM_REVISAO`; motivo "opcional" na interface contra 422 na API (AUD-15) |
| PED-F | Pedidos do tutor e do parceiro com dados reais | `18ff0e9` · 09/10 · Layssa · **sem PR** | Concluída com ressalvas | KPIs e listas limitados aos 20 pedidos mais recentes (AUD-20) |
| REC-2 | Tela de correção de cadastro recusado | `dd92f39` · 08/10 · Marcel · PR #32 | **Parcialmente implementada** | Lojista/hotel recusado não volta à tela após login (AUD-08); "sessão restrita" só no front (AUD-01) |

### Sprint 3 — Serviços e Agendamento (marco M3: 12/10)

| Task | Objetivo | Entrada na main | Classificação | Ressalvas principais |
| --- | --- | --- | --- | --- |
| AGD-2 | `POST/GET/PATCH` de agendamento | `c1d53f0` · 15/10 · Layssa · **sem PR** | Concluída com ressalvas | Preço ignora o serviço; semântica contraditória; testes de rota tautológicos (AUD-06, AUD-07, AUD-26) |
| SRV-1 | CRUD de serviços | `176e5a4` · 13/10 · Laura · PR #36 | Concluída com ressalvas | Detalhe público não filtra o status do parceiro; id inexistente responde 500 (AUD-16) |
| CHK-3 | Refino de erros do checkout | `ae19776` · 14/10 · Vitor · **sem PR** | **Parcialmente implementada** | Mapeia códigos que o backend não emite: **regressão** (AUD-19) |
| SRV-F1 | UI de serviços (parte 1) + `payment_policy` | `2f0fd35` · 13/10 · Marcel · PR #39 | Concluída com ressalvas | Seletor fica em "Carregando…" se o perfil falhar; texto da política contradiz o AGD-2 |
| PGT-1 ⭐ | Mercado Pago sandbox (opcional) | `176e5a4` · 13/10 · Laura · PR #36 | **Não verificável** | Código defensivo e testado com dependências simuladas; falta evidência no sandbox real (AUD-37) |
| PRD-2 | Gate de criação de produto | — | **Não implementada** | Nenhum commit em nenhuma branch (AUD-01) |
| SRV-Fpub | Serviços reais no detalhe público | — | **Não implementada** | Detalhes públicos com dados fabricados (AUD-09) |
| SRV-F2 | UI de serviços (parte 2) | `f2025b0` · 13/10 · Marcel · PR #39 | Concluída com ressalvas | Categoria não coerente com o tipo de parceiro |

### Situação dos marcos

| Marco | Entrega verificável prevista | Situação verificada |
| --- | --- | --- |
| M0 (31/08) | Carrinho para tutor · banco versionado · segredos rotacionados · dashboards com aviso | Atingido com ressalvas (entregas de 31/08 a 03/09; rotação não verificável) |
| M1 (14/09) | Pedidos no backend · vazamentos fechados · `status` enum | Atingido com ressalvas (PED-2 em 22/09; e-mails de parceiros seguem públicos; CFG-1 não entregue) |
| M2 (28/09) | Compra ponta a ponta · e-mail real · recusa/reenvio | Parcialmente atingido (04–09/10): compra sem endereço e com totais divergentes; recusa sem retorno pós-login nem restrição no backend |
| M3 (12/10) | Serviços e agendamento no backend · gate de produto | Parcialmente atingido (13–15/10): gate de produto e serviços públicos reais não entregues |

---

## 4. Matriz de rastreabilidade

Relaciona os requisitos versionados (`docs/funcional/04-requisitos.md`), as decisões de negócio do plano (§3 do `PLANO-DESENVOLVIMENTO.md`, numeradas D1–D8) e as máquinas de estado com tasks, implementação, testes e evidências. "Sem teste" significa que nenhum teste automatizado exercita o comportamento.

### 4.1. Decisões de negócio do plano

| Decisão | Tasks | Regra / critério | Implementação | Testes | Situação |
| --- | --- | --- | --- | --- | --- |
| D1 — Status de parceiro como enum; "sitter operacional" = APROVADO + avaliação APPROVED | STA-1, SRV-1 | Quatro status; sitter só opera aprovado e avaliado | Enum em `backend/prisma/schema.prisma:88-93`; helper usado só em `listSitters`; `serviceAccess.js:39` não exige avaliação; `PATCH /providers/:id/status` aprova sitter sem avaliação | `providerStatus.test.js` (5), `loginUseCase.test.js` | Parcial (AUD-15) |
| D2 — Recusa com motivo, e-mail, correção autenticada, reenvio para `EM_REVISAO` | REC-1, REC-2, EML-1 | Motivo obrigatório; link; login; reenvio | `ProviderController.js:317-397`; `EmailService.js:95-104`; `CorrecaoCadastro.tsx` | `providerRejection.test.js` (10), `providerRejectionEmail.test.js` (3), `CorrecaoCadastro.test.tsx` (5) | Parcial (AUD-08, AUD-01, AUD-15) |
| D3 — `payment_policy` PRESENCIAL/PRE_PAGO conduz o agendamento | AGD-1, AGD-2, SRV-F1 | PRE_PAGO paga antes; recusa/cancelamento estorna | Enum e seletor existem; agendamento nasce `CONFIRMADO`/`AGUARDANDO_CONFIRMACAO` sem pagamento; estorno só na resposta (`UpdateAppointmentStatusUseCase.js:99-125`) | `appointmentUseCases.test.js` (14), `paymentPolicy.test.js` (4), `Services.test.tsx` | Parcial (AUD-07) |
| D4 — Hotel por diária, sitter por hora | AGD-1, SRV-1 | Cálculo no servidor | `CalculateAppointmentTotalUseCase.js:52-133`, com a tarifa do parceiro e não o preço do serviço | `calculateAppointmentTotal.test.js` (12) | Implementada, mas com fonte de preço em conflito (AUD-06) |
| D5 — Só LOJISTA aprovado vende; loja não mostra produto de não aprovado | PRD-2 | 403 e filtro na vitrine | Ausente: `CreateProductUseCase.js:19-26`, `ListActiveProductsUseCase.js:23` | Sem teste | **Não atendida** (AUD-01) |
| D6 — Aceite de termos real (bloqueia sem aceite; grava data/versão) | **Nenhuma task** | Campo obrigatório + data/versão | `RegisterUseCase.js:68` grava `true` sempre; `authSchemas.js:43` deixa opcional | Sem teste | **Não atendida** (AUD-14) |
| D7 — Pagamento simulado primeiro; Mercado Pago opcional por cima | PAG-1, PGT-1 | Simulado marca pago; gateway sem refazer o modelo | `ConfirmOrderPaymentUseCase.js`; `ProcessPaymentWebhookUseCase.js` | `orderRoutes.test.js`, `paymentRoutes.test.js` (8), `mercadoPagoPayment.test.js` (21), E2E `payment.spec.ts` (3) | Atendida com ressalvas (AUD-12); sandbox não verificável |
| D8 — `Favorite.target_id` sem FK | — | Integridade na aplicação | Unicidade `schema.prisma:203` | Sem teste | Mantida, não testada |
| Máquina de pedido | PED-1, PED-2, PAG-1 | Transições definidas | `backend/src/constants/orderStatus.js:39-46` | `orderRoutes.test.js` (34) | Atendida; cancelamento não devolve estoque (AUD-12) |
| Máquina de agendamento | AGD-1, AGD-2 | `PENDENTE → [AGUARDANDO_CONFIRMACAO] → CONFIRMADO → CONCLUIDO` | `PENDENTE` inalcançável na criação (`CreateAppointmentUseCase.js:74-77`) | `appointmentStatus.test.js` (12) | Divergente (AUD-07) |

### 4.2. Requisitos funcionais versionados

| Requisito | Tasks relacionadas | Implementação principal | Testes | Situação |
| --- | --- | --- | --- | --- |
| RF-001 Cadastro | (base), SEC-1 | `RegisterUseCase.js`, `authSchemas.js` | `authRoutes.test.js` (admin barrado, sem senha), `authSchemas.test.js` (8); use case com 16,9% de linhas cobertas | Com ressalvas: política de senha, termos, CNPJ (AUD-13, AUD-14) |
| RF-002 Autenticação | SEC-1 | `LoginUseCase.js`, `authMiddleware.js` | `loginUseCase.test.js` (16), `rateLimit.test.js` | Com ressalvas: token não revogado; e-mail sem normalização (AUD-13) |
| RF-003 Redirecionamento por papel | REC-2, CHK-2 | `LoginPage.tsx:78-100`, `postLoginRedirect` | `postLoginRedirect.test.ts` (4) | Com ressalvas: parceiro não volta ao destino (AUD-08) |
| RF-004 Gestão de pets | (base) | `PetController.js` (limite 10) | Sem teste (controller com 21,6% de linhas) | Implementado; trava de exclusão inerte (AUD-11) |
| RF-005 Gestão de endereços | (base), CHK-1 | `AddressController.js` (limite 5) | Sem teste (15,8%) | Implementado; trava de exclusão inerte; endereço não chega ao pedido (AUD-11, AUD-04) |
| RF-006 Edição de perfil | (base) | `UserController.js`, `userSchemas.js` | Sem teste (16,6%) | Implementado; imagens sem limite (AUD-03) |
| RF-007 Alteração de senha | (base) | `PATCH /users/me/password` | Sem teste | Implementado; política divergente (AUD-13) |
| RF-008 Onboarding de Pet Sitter | (base) | `POST /users/me/evaluations` | Sem teste | Implementado sem validação nem restrição de papel (AUD-15) |
| RF-009 Moderação de parceiros | STA-1, REC-1 | `PATCH /providers/:id/status` | `providerRejection.test.js` | Com ressalvas: sem máquina de transições (AUD-15) |
| RF-010 Revisão de candidaturas | (base) | `GET/PATCH /users/admin/evaluations` | Sem teste | Implementado sem validação (AUD-15); exibição das fotos não reverificada |
| RF-011 Painel do parceiro | UX-0, PED-F (DSH na Sprint 5) | `Overview`, `Finance`, `Schedule` com `DemoBanner`; `Orders` real | `DemoBanner.test.tsx` (3) | Parcial por planejamento (dados reais previstos para DSH-1/2) |
| RF-012 Status do onboarding | REC-2 | `ProtectedRoute.tsx`, onboarding | Sem teste de guarda | Não reverificado em profundidade |
| RF-013 Vitrine de produtos | PRD-2, SEC-1 | `ListActiveProductsUseCase.js` | `productService.test.ts` (5) | Com ressalvas: exibe produto de parceiro não aprovado (AUD-01) |
| RF-014 Carrinho | PED-0, CAR-0, QA-1 | `CartController.js`, `CartContext.tsx` | `cartRoutes.test.js` (12), `cartOrderDb.test.js` (banco) | Com ressalvas: merge sem estado/retry; gate fail-open (AUD-18, AUD-30) |
| RF-015 Perfil comercial | (base), REC-2 | `PUT /providers/profile`, `PUT /providers/me` | `updateProviderAccount.test.js` (3); `UpdateProviderProfileUseCase` com 8,3% | Com ressalvas: `profile` sem validação (AUD-03, AUD-23) |

### 4.3. Fluxos acrescentados nas sprints (ainda sem RF versionado)

| Fluxo | Tasks | Critérios de aceite centrais | Evidência | Testes | Situação |
| --- | --- | --- | --- | --- | --- |
| Compra ponta a ponta | PED-1, PAG-1, CHK-1/2/3 | Pedido real por lojista; pago; sucesso real; erros claros | Transação e rollback em banco; pagamento simulado | `orderRoutes.test.js` (34), `cartOrderDb.test.js` (4), E2E `payment.spec.ts` (API simulada) | Com ressalvas: endereço, totais, tela de sucesso, mensagens (AUD-04, AUD-05, AUD-18, AUD-19) |
| Recuperação de senha | EML-1 | Link de uso único de 1 h; resposta genérica | `PasswordResetUseCase.js` | `passwordResetUseCase.test.js` (5) | Com ressalvas: e-mail com maiúsculas não recupera (AUD-13) |
| Serviços do parceiro | SRV-1, SRV-F1/F2, SRV-Fpub | CRUD só para hotel/sitter aprovado; vitrine real | `serviceAccess.js`, `Services.tsx` | `serviceRoutes.test.js` (10), `Services.test.tsx` (10) | Gestão ok; vitrine fabricada (AUD-09, AUD-16) |
| Agendamento (backend) | AGD-1, AGD-2 | Criação, listagem por dono, transições, estorno | `useCases/appointments/*` | `appointmentUseCases.test.js` (14), `appointmentRoutes.test.js` (21, use case simulado) | Base contraditória (AUD-06, AUD-07, AUD-16) |
| Mercado Pago sandbox | PGT-1 | Preferência, webhook idempotente, conferência de valor | `ProcessPaymentWebhookUseCase.js` | `mercadoPagoPayment.test.js` (21), `paymentRoutes.test.js` (8), concorrência em banco no CI | Não verificável sem sandbox (AUD-37) |

---

## 5. Diagnóstico técnico

### 5.1. Arquitetura e organização

- **Camadas:** a convenção routes → controllers → useCases → repositories é seguida nas entregas recentes (pedidos, pagamentos, serviços, agendamentos). Os módulos-base não a seguem: o Prisma é chamado diretamente em 7 controllers (`Address`, `Admin`, `Cart`, `Favorite`, `Payment`, `Provider`, `User`), e a lógica de negócio de moderação e avaliação vive em controllers (`UserController.js:147-175`, `:265-321`; `ProviderController.js:317-397`). **Impacto:** regras espalhadas e difíceis de testar; é nesses módulos que estão os 500 crus e a ausência de testes.
- **Duplicação:** `formatOrder` existe em três lugares (`CreateOrderUseCase.js:15-38`, `ConfirmOrderPaymentUseCase.js:40-63`, `utils/orderFormatter.js`); há 6 cópias de `asNumber`; papéis aparecem como números mágicos (`2`, `3`, `5`) e `SELF_SERVICE_ROLES` está duplicado (`authSchemas.js:8`, `RegisterUseCase.js:9`).
- **Código morto:** `nextStatusAfterPartnerAccepts` e `INITIAL_APPOINTMENT_STATUS` (`appointmentStatus.js`) não são usados; `ListProviderUseCase`/`ProviderRepository` sem uso.
- **Contratos e estados:** os status de `Order`, `Appointment`, `Product` e `PaymentAttempt` são `String` sem enum nem `CHECK`, enquanto `Provider.status` é enum. As constantes em `backend/src/constants/*.js` são a fonte da verdade, mas **não são importadas onde mais importam**: `PetRepository.js:3` e `AddressController.js:6` usam literais em inglês que o sistema não grava (AUD-11). Comentários de schema estão desatualizados (`schema.prisma:233`, `:249`; `paymentPolicy.js:10-11`).
- **Contrato frontend ↔ backend sem fonte única:** o frontend espera códigos de erro (`INSUFFICIENT_STOCK`, `CART_EMPTY`) que o backend não emite (AUD-19), soma frete e descontos que o backend não conhece (AUD-05), envia `address_id`, que o backend ignora (AUD-04), e lê `document` de uma rota que o remove (AUD-02). **Causa comum:** front e back de uma mesma jornada foram entregues em tasks separadas, sem contrato escrito nem teste de contrato.

### 5.2. Tratamento de erros

O `errorHandler` central (`backend/src/middlewares/errorHandler.js`) é bom, mas é contornado em boa parte dos módulos-base:

- Controllers respondem `res.status(400|401|500).json({ error: error.message })` com status fixo: `AuthController.js:21-22,37,49`; `ProductController.js:20,46,57,68,104,137`; `ProviderController.js:191,216,230,244`. Consequências comprovadas: "Produto não encontrado" e "Você não tem permissão…" (`UpdateProductUseCase.js:30,34`) viram **500**; mensagens internas do Prisma chegam ao cliente; essas falhas **não chegam ao Sentry**.
- `OrderController.js:99` usa `parsed.error.errors`, que **não existe no Zod 4.4.3** (conferido: `undefined`). Um `PATCH /orders/:id/status` sem `status` gera TypeError e responde 500 em vez de 422.
- O `errorHandler` não trata `P2023` (id que não é UUID) nem erros do body-parser (JSON malformado, corpo grande demais), que viram 500.
- O formato da resposta de erro varia entre `{error: 'texto'}`, `{error: {...}}` sem `message` e o formato padrão `{error: {code, message}, message}`.

### 5.3. Integrações

- **Resend:** serviço único com templates por alias (`password-reset`, `cadastro-rejeitado`) e escape do motivo da recusa. O envio não tem timeout. A entrega real depende de domínio verificado e templates publicados: **não verificável aqui**. O template `order-payment-approved` existe na documentação, mas **nenhum código o dispara**, e a Sprint 2 prometia "e-mail real" na compra sem task correspondente.
- **Mercado Pago (opcional):** a implementação mais defensiva do projeto (assinatura, `live_mode`, conta coletora, referência, moeda, valor, lock `FOR UPDATE`, idempotência). Pendências: comprovação no sandbox real e a premissa sobre `live_mode=false` para usuários de teste (AUD-37).
- **ViaCEP:** `CepService.js` com fail-open documentado; sem teste (26% de linhas).
- **Deploy:** a `main` aplica migrations no boot (`"start": "prisma migrate deploy && node src/server.js"`), enquanto `PGT-1-CONFIGURACAO.md:28` orienta usar Pre-Deploy Command. Se ambos estiverem configurados na Railway, a migração roda duas vezes. É idempotente, mas confuso; a configuração real precisa ser conferida no painel.

### 5.4. Dependências e configuração

- **Vulnerabilidades em dependências de produção** (`npm audit --omit=dev`, 22/10/2026):
  - **Backend:** `proxy-addr` (crítica, via `express`); `brace-expansion`, `ip-address` e `js-yaml` (altas); `qs` (moderada).
  - **Frontend:** `dompurify` (crítica, via `jspdf`); `react-router` (alta, CSRF no modo RSC).
  - A exploração depende do contexto: o projeto não usa o modo RSC do React Router; o `dompurify` entra pela geração de PDF; `proxy-addr` afeta cenários de `trust proxy` por sub-rede, e o projeto usa `trust proxy 1`.
  - O passo de auditoria no CI tem `continue-on-error: true`, e a INF-2 (Sprint 5) prevê torná-lo bloqueante.
- **Configuração:**
  - Swagger exposto em produção (`app.js:89`).
  - `/api/metrics` público e com cardinalidade ilimitada para rotas não encontradas (`app.js:124`; `metrics.js:34-35`).
  - `NODE_ENV` cai em `development` quando ausente, o que dispensa `RESEND_API_KEY` (`env.js:6`).
  - `frontend/.env.local` está versionado e aponta para a API de produção.
  - Coexistem `package-lock.json` e `yarn.lock`.
  - `"main": "index.js"` aponta para arquivo inexistente.
  - `validate.js:7-9` atribui `req.query`, que é somente leitura no Express 5: a coerção do schema de query é ignorada em silêncio.

### 5.5. Manutenibilidade do frontend

- **Lint:** 151 avisos (74 variáveis não usadas, 66 `any`, 6 dependências de `useEffect` ausentes). O typecheck passa, mas o uso de `any` e tipos abertos como `| string` no status de pedido (`frontend/src/lib/services/orderService.ts:3-10`) enfraquecem os contratos.
- **Bundle:** chunk principal de 560,8 kB (176,5 kB gzip), acima do limite de aviso; `Products` com 440 kB (importa `jspdf` de forma estática, `Products.tsx:24-25`) e `AreaChart` com 420 kB.
- **Código morto e dependências sem uso:**
  - `src/imports/` tem 7.479 linhas sem nenhuma referência.
  - `src/app/components/ui/` tem 48 componentes shadcn sem nenhuma referência; o kit usado é `src/components/ui`.
  - Também não são usados: `src/app/dashboard/`, `pages/dashboard/Profile.tsx` (sem rota) e `components/ServiceCard.tsx`.
  - MUI, Emotion, `react-dnd`, `react-slick`, `react-popper`, `gsap` e outras dependências estão declaradas, mas **nenhum arquivo as importa**. Não pesam no bundle, mas pesam no `npm ci`, no `npm audit` e na leitura do projeto.
  - `@types/react@19` convive com `react@18`; a rota `style-guide` está publicada em produção.
- **Tamanho e duplicação:**
  - Páginas grandes: `LandingPage` 1.246 linhas, `PublicProfile` 829, `RegisterPage` 811, `CheckoutPage` 709, `ShoppingPage` 680, `Products` 675, `HotelDetailsPage` 559.
  - `PublicProfile.tsx:366-380` declara componentes dentro do render.
  - `HotelDetailsPage` e `WalkerDetailsPage` repetem busca, fallbacks e barra de ações; `HotelsPage` e `WalkersPage` repetem busca e ordenação.
  - Há três modais feitos à mão (`Approvals.tsx:400`, `SitterEvaluations.tsx:231`, `TutorPets.tsx:229`), embora o `Dialog` do Radix já seja usado em outras telas.

### 5.6. Diagnóstico transversal do frontend

**Rotas e guarda de acesso**

- `/checkout/*` exige tutor. `/dashboard/*` exige só login (`frontend/src/app/routes.tsx:327-332`, sem `allowedRoles`), e a prop `adminOnly` de `ProtectedRoute.tsx` não é usada. Um tutor que acessa `/dashboard` vê o `Overview` com dados fictícios; `Settings` e `SitterEvaluations` não verificam papel. `/tutor/*` aceita qualquer papel (`routes.tsx:272-303`). Os dados reais continuam protegidos pelo backend (AUD-39).
- O retorno pós-login preserva o destino só para tutor (`LoginPage.tsx:82-97`): o parceiro recusado não chega à correção (AUD-08) e um admin perde o link que abriu.
- **Não há open redirect:** `postLoginRedirect.ts:10-18` aceita só caminhos internos, e o redirecionamento ao Mercado Pago valida protocolo e host (`CheckoutPaymentPage.tsx:52-58`).

**Dados reais × dados fabricados**

- Têm `DemoBanner`: `Overview`, `Schedule`, `Customers`, `Finance` e `TutorAppointments`. O texto do banner do `Overview` não menciona que os KPIs também são fixos (`Overview.tsx:102,151-205`).
- **Sem aviso, exibem dados inventados como reais** (AUD-09):
  - `HotelsPage.tsx:75-84` e `WalkersPage.tsx:45-53`: nota 5.0; número de avaliações com `Math.random()`; **preço padrão de R$ 150 ou R$ 50 quando o parceiro não cadastrou tarifa**; "verificado", "3 anos", "40 pets" e distâncias fixas. A ordenação "mais próximos" usa a distância constante.
  - `HotelDetailsPage.tsx:82-90` e `WalkerDetailsPage.tsx:46-69`: serviços com preço inventados quando o sitter não cadastrou nenhum, depoimento atribuído a um cliente fictício e "Certificado profissional".
  - `StorePage.tsx:24-25`: nota 4.9 e 120 avaliações.
  - `ProductDetailPage.tsx`: avaliações, distribuição de notas e ficha técnica fixa ("Peso 15 kg", "Sabor carne") para qualquer produto.
  - `LandingPage.tsx`: `Math.random()` nas avaliações (810-811), depoimentos fictícios (154-182) e um contador "Ofertas encerram em" que reinicia sozinho (488-506).
- **Ações que confirmam o que não aconteceu ou não fazem nada** (AUD-21):
  - `Settings.tsx:29-44` (quatro toasts de sucesso sem API, inclusive "Logout forçado disparado para todos os usuários ativos");
  - `ContactPage.tsx:221-233` ("Mensagem enviada com sucesso!" sem envio);
  - **"Reservar agora" e "Agendar agora" com `onClick={() => {}}`** (`HotelDetailsPage.tsx:533`, `WalkerDetailsPage.tsx:467`), além de Compartilhar, Ligar e Mensagem sem ação;
  - o sino de notificações e a busca do painel não fazem nada (`DashboardLayout.tsx:189-203`).
  
  O fluxo de agendamento no frontend é escopo da Sprint 4 (BKG/SCH), mas os botões principais falham em silêncio, sem aviso.
- **Checkout simulado:** pede número e CVV do cartão com "criptografia SSL", sem informar que o pagamento é simulado. O aviso de teste só aparece no modo Mercado Pago (`CheckoutPage.tsx:432,534`) (AUD-05).

**Camada de dados e estado**

- 19 chamadas `fetch` diretas nos services (`providerService.ts` 9, `productService.ts` 6, `authService.ts` 4) e 3 na própria página `Approvals.tsx` (81, 105, 140) ignoram o `httpClient`. Perdem-se o timeout, o logout automático em 401 e o tipo `ApiError`. **Efeito comprovado:** `CorrecaoCadastro.tsx:78-80,119-123` verifica `instanceof ApiError`, mas o serviço lança `Error`, então a mensagem do backend nunca aparece (AUD-38).
- A sessão tem várias fontes: o usuário é lido do `localStorage` em 6 arquivos (`DashboardLayout`, `Navbar`, `Account`, `Approvals`, `Overview`, `PetSitterOnboarding`). O login e o `/users/me` devolvem formatos diferentes: o nome comercial vem só no login e some do painel após recarregar (AUD-38).
- React Query foi adotado em parte: listas e detalhes públicos, `Products`, `Approvals`, `Users`, `Account`, `CorrecaoCadastro` e o onboarding seguem com `useEffect`/`useState`. O checkout não invalida o cache de "Meus pedidos" (`TutorOrders.tsx:63`, cache de 30 s).

**Estados de interface**

- **Bem tratados:** `TutorOrders`, `Orders`, `Services`, `CorrecaoCadastro` e `CheckoutPaymentPage`. Proteção contra clique duplo no checkout e botões desabilitados durante o envio nas demais telas.
- **Enganosos** (AUD-22):
  - Em caso de erro, `ProductDetailPage.tsx:144-152` **monta um produto falso a R$ 0 com o botão de carrinho ativo**.
  - `WalkersPage` transforma erro em lista vazia.
  - As páginas de detalhe tratam falha de rede como "não encontrado".
  - `Account.tsx:61-77` mostra status "Pendente" quando a consulta falha.
  - `PetSitterOnboarding.tsx:80-84` faz logout em qualquer erro, inclusive timeout, e não valida o tamanho das fotos que anuncia ("até 10 MB") antes de convertê-las para base64.
  - As buscas por `id` nos detalhes não cancelam a requisição anterior, o que gera condição de corrida.

**Acessibilidade e responsividade** (AUD-40)

- Botões só com ícone, sem nome acessível: fechar, menu, início, sino e avatar no `DashboardLayout`; mostrar senha no `LoginPage`; favorito da landing, que ainda fica dentro de um `<Link>`.
- Rótulos não associados aos campos: cartão no checkout, `TutorPets` e motivo da recusa em `Approvals`.
- Os modais feitos à mão não têm `role="dialog"`/`aria-modal`, não prendem o foco e não fecham com Esc.
- `index.html` declara `lang="en"`.
- O teste `a11y.spec.ts` audita só a landing, falha só em violações críticas e roda sem backend; a violação séria de contraste ficou apenas registrada.
- Não há quebra evidente de responsividade: as tabelas usam `overflow-x-auto`, e o E2E de pagamento verifica a ausência de rolagem horizontal em 390 px.

**Segurança no cliente**

- O JWT fica no `localStorage` (`AuthContext.tsx:39,106`), e a CSP está apenas em modo `Content-Security-Policy-Report-Only` (`frontend/vercel.json`). Qualquer XSS leria o token (AUD-41, risco potencial).
- O `console.log` do objeto do usuário a cada renderização (`CartContext.tsx:241-242`) e do e-mail (`Navbar.tsx:126`) pode chegar ao Sentry como breadcrumb, porque `beforeBreadcrumb` só limpa URLs (`frontend/src/lib/sentry.ts:73-78`) (AUD-29).
- `dangerouslySetInnerHTML` aparece só em um componente não utilizado. Não há segredos em variáveis `VITE_*`.

---

## 6. Diagnóstico funcional

### 6.1. Permissões e autorização

- **Regra de aprovação só na interface (crítico).** `LoginUseCase.js:10` exige aprovação apenas para lojista e hotel; o Pet Sitter pendente entra por desenho, para preencher o onboarding. `LoginUseCase.js:44-56` deixa entrar o parceiro `REJEITADO`, para a REC-2. A partir daí, o backend não restringe nada: `POST/PUT /products` só exigem token (`productsRoutes.js:64,84,110`); `CreateProductUseCase.js:19-26` só confere se existe um cadastro de parceiro e grava o produto como `ACTIVE`; a vitrine (`ListActiveProductsUseCase.js:23`), o detalhe e o carrinho não filtram o status do parceiro. O botão "Desativar" do painel grava `REJEITADO` (`Approvals.tsx:143,148`), que libera o login. **Resultado:** quem passa pela moderação, ou foi barrado nela, vende do mesmo jeito.
- **Propriedade de recurso:** bem aplicada em pedidos, pagamentos, serviços, agendamentos, pets, endereços e favoritos (filtros por `customer_id`, `tutor_id`, `user_id`, provider do token).
- **Gates "fail-open":** `req.userRole && req.userRole !== 5` (`CartController.js:108,234`; `CreateOrderUseCase.js:42`) deixam passar um token sem papel. O risco prático é baixo (exige forjar JWT), mas o teste `cartRoutes.test.js` registra esse comportamento como esperado.
- **Sessão:** JWT HS256 de 1 dia sem consulta de estado (`authMiddleware.js:23-29`). Desativação, troca de senha ou recusa não invalidam tokens já emitidos.

### 6.2. Regras de negócio

| Regra | Situação | Evidência |
| --- | --- | --- |
| Um pedido por lojista, com preço congelado e baixa de estoque atômica | Implementada e provada em banco | `CreateOrderUseCase.js:73-175`; `cartOrderDb.test.js` |
| Cancelamento devolve estoque | **Não implementada** | Nenhum `increment` em `backend/src`; `UpdateOrderStatusUseCase.js` |
| Estoque nunca negativo sob concorrência | **Não garantida** (risco potencial) | Leitura seguida de `decrement` incondicional (`ProductRepository.js:35-44`); sem `CHECK` na baseline |
| Só o tutor dono paga o pedido | Contornável com gateway desligado | Lojista transita `AGUARDANDO_PAGAMENTO → PAGO` via `PATCH` (`orderStatus.js:40`) |
| Endereço de entrega no pedido | **Ausente** | `Order` sem endereço (`schema.prisma:244-259`) |
| Total exibido = total cobrado | **Divergente** | `CheckoutPage.tsx:143-144,527,642`; `CartPage.tsx:59-67` |
| Exclusão de pet bloqueada com agendamento ativo | **Inerte** | `PetRepository.js:3` usa `PENDING`/`CONFIRMED`; o sistema grava `PENDENTE`/`AGUARDANDO_CONFIRMACAO`/`CONFIRMADO` |
| Exclusão de endereço bloqueada com pedido em aberto | **Inerte** | `AddressController.js:6` usa `PENDING`/`PREPARING`/`SHIPPED` |
| Valor do agendamento = serviço reservado | **Divergente** | `CalculateAppointmentTotalUseCase.js:105-110` usa `daily_rate`/`hourly_rate` do parceiro |
| Agendamento só com parceiro aprovado, em data futura, sem sobreposição | **Ausente** | `CreateAppointmentUseCase.js:40-48`; `appointmentSchemas.js:8-9` |
| Estorno persistente em recusa/cancelamento de PRE_PAGO | **Ausente** (previsto para PAG-2) | `UpdateAppointmentStatusUseCase.js:121-125` (só na resposta, decidido pela política atual) |
| Política de senha única | **Divergente** | Cadastro aceita 6 caracteres no backend (`authSchemas.js:22-25`) enquanto a tela exige 8 + maiúscula + número (`RegisterPage.tsx:49-53`); troca exige 8 + letra + número; reset exige 8 + maiúscula + número |
| E-mail tratado sem diferenciar maiúsculas | **Divergente** | Cadastro e login usam o texto recebido; `forgot-password` converte para minúsculas (`AuthController.js:46`); coluna única que diferencia maiúsculas (`schema.prisma:23`) |
| Aceite de termos real | **Ausente** | `RegisterUseCase.js:68` |
| Documento validado (CPF por DV; CNPJ por DV) | Parcial | CPF validado; CNPJ só pelo tamanho (`DocumentVerificationService.js`) |

### 6.3. Validação de entradas

Sem validação Zod: login, `forgot-password`, `POST/PUT /products` (preço inválido vira `NaN` e 500, `ProductController.js:79-83`), `PUT /providers/me` e `/profile`, `POST /users/me/evaluations`, rotas de avaliação do admin e os parâmetros `:id` de várias rotas (UUID inválido vira 500). O formulário de correção de cadastro não valida campos: `state` com mais de 2 caracteres estoura `VarChar(2)` e responde 500 (AUD-23).

### 6.4. Estados de interface, feedback e ações duplicadas

- **Bem tratados:** `TutorOrders` e `Orders` (loading, erro com retry, vazio), `Services.tsx` (quatro estados, rollback da política), `CorrecaoCadastro.tsx` (carga com retry, falha parcial), checkout com proteção contra clique duplo (`processing` ref + botão desabilitado) e overlay de processamento.
- **Mal tratados:**
  - **Tela de sucesso fabricada:** mostra "Pedido Confirmado!" mesmo sem pedido, com "Não identificado" (`CheckoutSuccessPage.tsx:11`), status "Pago" fixo e "Prazo estimado: 3 a 5 dias úteis" sem origem.
  - **Mensagens de erro do checkout:** toda falha vira "Ops, algo deu errado" (AUD-19).
  - **`WalkersPage`:** falha da API vira lista vazia silenciosa (`WalkersPage.tsx:60-63`).
  - **Detalhe de produto:** em caso de erro, exibe um produto falso a R$ 0 com o botão de carrinho ativo (`ProductDetailPage.tsx:144-152`).
  - **Botões principais sem ação:** "Reservar agora" e "Agendar agora" não fazem nada nem avisam (`HotelDetailsPage.tsx:533`, `WalkerDetailsPage.tsx:467`).
  - **Seletor de política (SRV-F1):** fica em "Carregando…" se o perfil falhar.
  - **Merge do carrinho anônimo:** sem estado de sincronização nem nova tentativa (`CartContext.tsx:156-178`).
  - **Configurações:** confirmam ações que não acontecem, como "Logout forçado disparado para todos os usuários ativos" (`Settings.tsx:29-44`).
  - **Painel de aprovações:** rotula o motivo da recusa como "(Opcional)", mas a API exige o campo; o admin vê só "Ocorreu um erro".
- **Proteção contra repetição no backend:** pagamento simulado idempotente; webhook idempotente com lock. Faltam: guarda de status no update simulado (`ConfirmOrderPaymentUseCase.js:120-127`), leitura do carrinho dentro da transação (dois `POST /orders` simultâneos podem gerar pedidos duplicados) e consumo atômico do token de reset.

### 6.5. Consistência entre especificações e código

| Tema | Fonte A | Fonte B | Divergência |
| --- | --- | --- | --- |
| Estado inicial do agendamento | AGD-1 e comentários de `appointmentStatus.js:9-16`: nasce `PENDENTE`; `AGUARDANDO_CONFIRMACAO` é a janela após o aceite do parceiro | AGD-2 e `CreateAppointmentUseCase.js:74-77`: nasce `CONFIRMADO` (PRESENCIAL) ou `AGUARDANDO_CONFIRMACAO` (PRE_PAGO) | `PENDENTE` ficou inalcançável; o parceiro não aceita nem recusa agendamento presencial |
| Pagamento do PRE_PAGO | PLANO decisão 3 e PAG-2: paga antes da confirmação | AGD-2: nasce aguardando, sem pagamento | A Sprint 4 herda a ambiguidade sem decisão registrada |
| Texto da política para o parceiro | `frontend/src/lib/constants/paymentPolicy.ts:18-21`: "confirmado assim que você aceita" | AGD-2: presencial nasce confirmado | A interface promete um comportamento que não existe |
| Momento da baixa de estoque | `docs/funcional/03-regras-de-negocio.md` §"Estoque e pagamento": após confirmar o pagamento | `CreateOrderUseCase.js:110`: na criação do pedido | Documento desatualizado |
| Bloqueio de exclusão de pet | `03-regras-de-negocio.md`: status `PENDING`/`CONFIRMED` | Valores gravados em português | O código seguiu o documento desatualizado: causa provável de AUD-11 |
| Painel de aprovação | REC-1: o painel distingue `EM_REVISAO` | `Approvals.tsx:27,175-178`: `PENDENTE` e `EM_REVISAO` juntos | Critério não atendido |
| Configuração da política de cobrança | SRV-F1: em Configurações | Implementada em "Meus Serviços" | A spec não foi atualizada |

---

## 7. Diagnóstico de testes

### 7.1. Resultados

| Camada | Arquivos | Testes | Resultado | Observação |
| --- | --- | --- | --- | --- |
| Backend unitário | 21 | 167 | Aprovados | `node:test`, dependências simuladas |
| Backend integração (rotas) | 10 | 93 | 89 aprovados, 4 ignorados | Supertest sobre o Express real com Prisma ou use cases simulados; os 4 ignorados exigem PostgreSQL |
| Backend com banco real | 1 (`cartOrderDb.test.js`) | 4 | Ignorados localmente; aprovados no CI de 15/10 | Carrinho com snapshot, pedido completo, rollback por trigger, webhooks concorrentes |
| Frontend (Vitest) | 12 | 64 | Aprovados | Serviços e componentes com API simulada |
| E2E (Playwright) | 4 | 13 | Aprovados | Smoke, páginas legais, acessibilidade (só violações críticas), pagamento com API simulada |

**Cobertura do backend** (Node `--experimental-test-coverage`, execução sem banco): **74,17% das linhas, 79,13% dos ramos e 59,64% das funções**. O total inclui os helpers de teste. Arquivos de rota aparecem com 100% só porque são executados ao montar a aplicação; isso não indica teste.

| Bem cobertos (linhas) | Praticamente sem teste (linhas / funções) |
| --- | --- |
| `OrderController` 95%, `PaymentController` 98%, `ServiceController` 94%, use cases de pedidos 95–100%, de agendamento 88–99%, de serviços 83–100%, `ProcessPaymentWebhookUseCase` 82% | `UpdateProviderProfileUseCase` 8,3% · `FavoriteController` 13,8% / 0% · `UpdateProductUseCase` 15,1% · `AddressController` 15,8% / 0% · `ProductController` 16,0% / 0% · `CreateProductUseCase` 16,3% · `UserController` 16,6% / 0% · `RegisterUseCase` 16,9% · `AdminController` 18,4% / 0% · `PetController` 21,6% / 0% · `CepService` 26% |

### 7.2. Qualidade dos testes existentes

- **Testes relevantes e bem construídos:** `cartOrderDb.test.js` (rollback real por trigger e concorrência de webhook em PostgreSQL); `mercadoPagoPayment.test.js` (HMAC real, divergências, duplicidade); `calculateAppointmentTotal.test.js` (virada de mês, fuso, mínimos); `orderRoutes.test.js` (isolamento por dono, 403/404/409/422, transições); `Services.test.tsx` (quatro estados, rollback, confirmação de exclusão).
- **Testes tautológicos:** `appointmentRoutes.test.js` substitui o use case inteiro por um mock. "PRESENCIAL → CONFIRMADO", "tutor B não vê" e "sem `password_hash`" apenas conferem o que o próprio mock devolve. Já `serviceRoutes.test.js` "lista somente ativos" usa um mock que só devolve ativos.
- **Testes que registram defeitos como comportamento esperado:**
  - `providerRejection.test.js` chama `GET /providers` **sem token** e espera 200, o que consagra a exposição de AUD-02.
  - `cartRoutes.test.js` espera 2xx para token sem papel, o que consagra o gate fail-open de AUD-30.
- **Mocks que escondem o comportamento real:**
  - Os testes de pedidos usam ids que não são UUID, o que esconde o 500 por `P2023`.
  - `CorrecaoCadastro.test.tsx` rejeita com `ApiError`, enquanto o serviço real lança `Error`.
  - O E2E de pagamento roda contra API simulada (`page.route`) e só procura o texto "Confirmar Pedido", sem conferir o valor; por isso a divergência de AUD-05 passa.
  - Os fixtures de serviço do agendamento não têm `price`, por isso AUD-06 passa despercebido.
- **Gate de acessibilidade permissivo:** `a11y.spec.ts` falha só em violações **críticas**. Na execução de 22/10 ficou registrada uma violação **séria** de contraste (6 elementos) na landing page, sem falhar o teste.

### 7.3. Lacunas de validação

- **Sem nenhum teste:**
  - Backend: CRUD de pets, endereços, favoritos e perfil; troca de senha; avatar; onboarding e avaliação de sitter; criação e edição de produto (PRD-2 inexistente); perfil comercial; `GET /appointments/:id`, `/my` e `/provider`; `forgot-password` na rota.
  - Frontend: `LoginPage` e a guarda de rotas (`ProtectedRoute`), onde estão AUD-08 e AUD-39; componentes de `CheckoutPage` (CHK-1/2/3), `CheckoutSuccessPage`, `TutorOrders`, `Orders`, `Approvals`, `Settings`, `WalkersPage`, carrinho (gate da CAR-0), cadastro, perfil público, pets, endereços e onboarding.
- **Sem teste com banco real:** agendamentos, listagem de pedidos, pagamento simulado, cancelamento e transições, unicidade de e-mail.
- **Sem teste de concorrência:** venda acima do estoque (oversell), pedido duplicado, consumo do token de reset.
- **Sem E2E com a API real:** nenhuma jornada (compra, recusa e correção, agendamento) roda ponta a ponta contra o backend. QA-2 e QA-3 (Sprint 5) preveem isso.
- **Sem teste de contrato** entre os códigos de erro e respostas do backend e o que o frontend espera.

### 7.4. Avaliação da estratégia

A estratégia tem bons pilares: unitários de regra, testes de rota com Supertest, banco isolado no CI e E2E de fumaça. Porém **o investimento em testes acompanhou quem escreveu cada task, não o risco de cada módulo**. As tasks de backend das Sprints 2 e 3 têm testes densos; as de frontend e os módulos-base quase não têm. Os testes não foram exigidos como critério de "pronto". Exemplo: CHK-1, CHK-2, CHK-3 e UX-2 entraram sem nenhum teste, apesar de as especificações listarem cenários.

---

## 8. Problemas e riscos

Ordenados por severidade. Cada item lista evidências, impacto, módulos afetados e tipo de evidência. Os critérios de aceite estão na seção 11.

### Crítico

**AUD-01 — Aprovação de parceiro aplicada só no frontend; parceiro não aprovado, recusado ou desativado opera pela API.** · *Comprovado*

- **Evidências:**
  - `backend/src/useCases/auth/LoginUseCase.js:10,44-56`
  - `backend/src/routes/productsRoutes.js:64,84,110`
  - `backend/src/useCases/products/CreateProductUseCase.js:19-26,42`
  - `backend/src/useCases/products/UpdateProductUseCase.js:19-25`
  - `backend/src/useCases/products/ListActiveProductsUseCase.js:23`
  - `backend/src/useCases/products/GetProductDetailsUseCase.js:24-31`
  - `backend/src/controllers/CartController.js:68-76`
  - `backend/src/middlewares/authMiddleware.js:23-29`
  - `frontend/src/pages/dashboard/admin/Approvals.tsx:143,148`
- **Impacto:** quebra a decisão de negócio D5 e o marco M3. Um Pet Sitter recém-cadastrado, sem aprovação, publica produtos que entram na vitrine e no checkout; lojista recusado ou desativado continua vendendo. Qualquer funcionalidade nova construída sobre "parceiro aprovado" herda o furo.
- **Módulos:** autenticação, produtos, vitrine, carrinho, checkout, painel admin.
- **Causa provável:** a PRD-2 não foi feita; a REC-2 liberou o login de recusados contando com restrição só no front; "desativar" reaproveita o status de recusa.

### Alto

**AUD-02 — `GET /api/v1/providers` público expõe nome, e-mail, papel e status de todos os parceiros.** · *Comprovado*

- **Evidências:** `backend/src/routes/providerRoutes.js:102`; `backend/src/controllers/ProviderController.js:154-181`; teste que consagra o comportamento em `backend/tests/integration/providerRejection.test.js` (listagem sem token).
- **Regressão associada:** `Approvals.tsx:81,192,322-323` lê `document` dessa rota, mas a SEC-1 passou a removê-lo. A coluna de CPF/CNPJ fica vazia, todos aparecem como "inválido" e a busca por documento não funciona.
- **Impacto:** exposição de dado pessoal de parceiros, inclusive pendentes e recusados (LGPD); painel de moderação degradado.
- **Módulos:** parceiros, admin.

**AUD-03 — Corpo de requisição de até 50 MB, global e anterior à autenticação; imagens em base64 sem limite.** · *Comprovado (configuração) / risco potencial (indisponibilidade)*

- **Evidências:**
  - `backend/src/app.js:82-83`
  - `backend/src/schemas/userSchemas.js:18` (`avatar_url` só exige URL, sem tamanho)
  - `backend/src/useCases/providers/UpdateProviderProfileUseCase.js:26-31,45` (galeria sem validação)
  - `backend/src/controllers/UserController.js:149-156` (fotos do onboarding)
  - Listagens públicas devolvem avatares em base64: `ListActiveProductsUseCase.js:11`, `ProviderController.js:63-66`
- **Impacto:** consumo de memória e banco por requisições anônimas; respostas públicas muito pesadas.
- **Módulos:** API inteira, perfil, parceiros, vitrine.

**AUD-04 — Endereço de entrega descartado no pedido.** · *Comprovado*

- **Evidências:** `frontend/src/lib/services/orderService.ts:199-204` envia `address_id`; `OrderController.create` e `CreateOrderUseCase` ignoram o campo; `Order` não tem endereço (`backend/prisma/schema.prisma:244-259`).
- **Impacto:** o lojista recebe um pedido pago sem saber para onde enviar; a jornada de compra (M2) não fecha.
- **Módulos:** checkout, pedidos, schema.

**AUD-05 — Total exibido antes de confirmar difere do total cobrado.** · *Comprovado*

- **Evidências:**
  - `frontend/src/pages/CheckoutPage.tsx:143-144`: frete de R$ 14,90 abaixo de R$ 199, somado ao botão "Confirmar Pedido — R$ X" na linha 642.
  - `CheckoutPage.tsx:527`: "5% de desconto no PIX!".
  - `frontend/src/pages/CartPage.tsx:59-67`: cupom `PETMAIS15`, desconto só na tela.
  - O backend não conhece frete, desconto nem cupom (`CreateOrderUseCase.js`).
  - No modo simulado, a tela pede número e CVV do cartão com "criptografia SSL" sem informar que o pagamento é simulado (`CheckoutPage.tsx:432,534`).
- **Impacto:** o consumidor vê um preço e é cobrado por outro; as evidências de compra ficam incoerentes.
- **Módulos:** carrinho, checkout, pedidos.

**AUD-06 — Valor do agendamento ignora o preço do serviço cadastrado.** · *Comprovado*

- **Evidências:** `backend/src/useCases/appointments/CreateAppointmentUseCase.js:67-71`; `CalculateAppointmentTotalUseCase.js:105-110` (usa `provider.daily_rate`/`hourly_rate`); os fixtures de teste não têm `price`.
- **Impacto:** o parceiro anuncia "Passeio — R$ 30" (SRV-F1) e o tutor é cobrado pela tarifa geral. PAG-2 e BKG-1 vão cobrar e exibir esse valor.
- **Módulos:** agendamento, serviços.

**AUD-07 — Semântica do agendamento contraditória e incompleta.** · *Comprovado*

- **Evidências:**
  - `CreateAppointmentUseCase.js:74-77` (estado inicial)
  - `backend/src/constants/appointmentStatus.js:9-16,94-98` (comentários e helper sem uso)
  - `UpdateAppointmentStatusUseCase.js:86-104,121-125` (estorno não persistido e decidido pela política **atual** do parceiro, não pela vigente na reserva; marca estorno mesmo sem pagamento)
  - `frontend/src/lib/constants/paymentPolicy.ts:18-21`
  - PLANO decisão 3; `Sprint-4-Agendamento-Avaliacoes/README.md`; especificação da AGD-1
- **Impacto:** PAG-2, BKG-1/2 e SCH-1/2 dependem diretamente dessa máquina. Começar a Sprint 4 sem decisão gera retrabalho e mais divergência.
- **Módulos:** agendamento, pagamento de agendamento, telas da Sprint 4.

**AUD-08 — Jornada de correção de cadastro quebrada para lojista e hotel recusados.** · *Comprovado*

- **Evidências:** `frontend/src/pages/auth/LoginPage.tsx:82-97` honra `returnTo` só para `role_id === 5`. O parceiro recusado vai para `/dashboard`, a guarda o redireciona e o destino de correção se perde.
- **Impacto:** o link do e-mail de recusa (REC-1/EML) não leva o parceiro à tela de correção (REC-2); o fluxo de reenvio depende de o parceiro achar a rota sozinho.
- **Módulos:** autenticação (front), recusa e reenvio.

**AUD-09 — Vitrine pública com dados fabricados, inclusive preços (SRV-Fpub não implementada).** · *Comprovado*

- **Evidências:**
  - `frontend/src/pages/HotelsPage.tsx:75-84`: avaliações com `Math.random()`; **diária padrão de R$ 150** quando o hotel não cadastrou tarifa; distância fixa.
  - `frontend/src/pages/WalkersPage.tsx:45-53`: **R$ 50/hora padrão**; "verificado", "3 anos" e "40 pets" para todos.
  - `frontend/src/pages/HotelDetailsPage.tsx:82-90`: `distance: "3.0 km"`, `rating: 5.0`, `reviews: 12`, preço padrão.
  - `frontend/src/pages/WalkerDetailsPage.tsx:46-69`: serviços com preço, experiência, idade e um depoimento de cliente inventados quando não há dados.
  - `StorePage.tsx:24-25`; ficha técnica e avaliações fixas em `ProductDetailPage.tsx`; avaliações aleatórias e contador de oferta que reinicia sozinho em `LandingPage.tsx:488-506,810-811`.
  - Backend: `backend/src/useCases/providers/GetProviderDetailsUseCase.js:55-56` (`rating: 4.5`, `badge: "Novo"`).
- **Impacto:** o usuário vê preços, avaliações e depoimentos que não existem, sem aviso de demonstração. Contradiz o objetivo da UX-0 ("honestidade dos mocks") e a futura AVL. Um preço inventado na listagem pode divergir do que será cobrado no agendamento.
- **Módulos:** páginas públicas de hotel, sitter, loja e produto; landing; detalhe de parceiro.

### Médio

| ID | Problema | Tipo | Evidências principais | Módulos |
| --- | --- | --- | --- | --- |
| AUD-10 | Erros fora do padrão: `error.message` com status fixo; 403/404 viram 500; mensagens do Prisma expostas; `PATCH /orders/:id/status` responde 500 (Zod 4 `.errors`); `P2023` e JSON malformado viram 500; ~20 respostas 500 fora do Sentry | Comprovado | `AuthController.js:21-22,37,49`; `ProductController.js:20-137`; `ProviderController.js:191-244`; `UpdateProductUseCase.js:30,34`; `OrderController.js:99`; `errorHandler.js` | API (Auth, Product, Provider, User, Order) |
| AUD-11 | Travas de exclusão de pet e endereço inertes (status em inglês) | Comprovado | `PetRepository.js:3`; `AddressController.js:6` | Pets, endereços |
| AUD-12 | Estoque e pagamento: cancelamento não devolve estoque; decremento sem condição e sem `CHECK` (oversell); pedido duplicado em requisições simultâneas; lojista marca `PAGO` via `PATCH`; update simulado e transição de status sem guarda | Comprovado / risco potencial (concorrência) | `UpdateOrderStatusUseCase.js`; `ProductRepository.js:35-44`; `CreateOrderUseCase.js:46,89-110`; `orderStatus.js:40`; `ConfirmOrderPaymentUseCase.js:120-127` | Pedidos, estoque, pagamento |
| AUD-13 | Conta e sessão: política de senha divergente entre fluxos e entre front e back; bcrypt com custos 10 e 12; e-mail sem normalização (quem se cadastrou com maiúsculas não recupera a senha); token não revogado após desativação ou troca de senha; token de reset consumido sem atomicidade | Comprovado | `authSchemas.js:22-25,52-57`; `userSchemas.js:24-29`; `RegisterPage.tsx:49-53`; `AuthController.js:8,46`; `schema.prisma:23`; `authMiddleware.js`; `PasswordResetUseCase.js:101,124-134` | Autenticação, cadastro, recuperação |
| AUD-14 | Cadastro: aceite de termos gravado sempre como `true`, sem data/versão (decisão D6 sem task); CNPJ sem dígito verificador; documento persistido como recebido | Comprovado | `RegisterUseCase.js:12,68,73`; `authSchemas.js:43`; `DocumentVerificationService.js` | Cadastro |
| AUD-15 | Moderação: `PATCH /providers/:id/status` sem máquina de transições; sitter aprovado sem avaliação (D1); avaliação do admin sem validação de status, estado ou papel; onboarding aceita qualquer papel e várias submissões; painel não distingue `EM_REVISAO`; motivo "opcional" na tela contra 422 na API | Comprovado | `ProviderController.js:317-368`; `UserController.js:147-175,265-321`; `serviceAccess.js:39`; `Approvals.tsx:27,143,175-178,416` | Admin, onboarding, parceiros |
| AUD-16 | Agendamento e vitrine sem regras de parceiro e agenda: aceita data passada, duração ilimitada, sobreposição e parceiro não aprovado; detalhe público mostra parceiro não aprovado; id inexistente responde 500 | Comprovado | `CreateAppointmentUseCase.js:40-48`; `appointmentSchemas.js:8-9`; `GetProviderDetailsUseCase.js:5-47`; `ProviderController.js:191` | Agendamento, parceiros |
| AUD-17 | Dados pessoais além do necessário: a agenda do parceiro recebe o registro inteiro do tutor; a vitrine expõe telefone, CEP e endereço de sitter (pessoa física) por lista de exclusão; o detalhe de produto expõe o telefone do parceiro; `/api/metrics` público com cardinalidade ilimitada | Comprovado | `AppointmentRepository.js:10-18`; `appointmentFormatter.js:19-23`; `publicProvider.js:12-16`; `GetProductDetailsUseCase.js:11-16`; `app.js:124`; `metrics.js:34-35` | Agendamento, vitrine, operação |
| AUD-18 | Checkout e carrinho: tela de sucesso com dados fabricados (status "Pago" fixo, prazo, "Pedido Confirmado!" sem pedido); merge do carrinho anônimo sem estado de sincronização nem nova tentativa | Comprovado | `CheckoutSuccessPage.tsx:11,35,64,74-78`; `CartContext.tsx:156-178` | Checkout, carrinho |
| AUD-19 | **Regressão da CHK-3:** mapeia `INSUFFICIENT_STOCK`/`PAYMENT_*`/`CART_EMPTY`, mas o backend emite `CONFLICT`/`BAD_REQUEST`; toda falha vira "Ops, algo deu errado" e a ação "Ir para o carrinho" nunca aparece | Comprovado | `CheckoutPage.tsx:41-89,208-219`; `AppError.js:12-30`; `CreateOrderUseCase.js:48,58-61,94-100` | Checkout |
| AUD-20 | KPIs e listas de pedidos limitados aos 20 mais recentes (a interface não pagina nem lê o total) | Comprovado | `orderSchemas.js:13`; `ListProviderOrdersUseCase.js:14`; `Orders.tsx`; `TutorOrders.tsx` | Pedidos (front) |
| AUD-21 | A interface confirma ações que não acontecem: CFG-1 não implementada (Configurações só exibem toasts, inclusive de "logout forçado", sem aviso de demonstração); formulário de Contato informa "mensagem enviada" sem envio; "Reservar agora" e "Agendar agora" sem ação e sem aviso; sino e busca do painel inertes | Comprovado | `pages/dashboard/Settings.tsx:29-44` (sem alteração desde 07/03/2026); `ContactPage.tsx:221-233`; `HotelDetailsPage.tsx:533`; `WalkerDetailsPage.tsx:467`; `DashboardLayout.tsx:189-203` | Painel admin, páginas públicas |
| AUD-22 | Estados de erro ausentes ou enganosos: CAR-0 incompleta (`WalkersPage` sem erro); detalhes tratam falha de rede como "não encontrado"; **detalhe de produto monta produto falso a R$ 0 com carrinho ativo**; `Account` mostra "Pendente" na falha; onboarding faz logout em qualquer erro e não valida o tamanho das fotos; buscas por `id` sem cancelamento | Comprovado | `WalkersPage.tsx:60-63`; `ProductDetailPage.tsx:144-152`; `Account.tsx:61-77`; `PetSitterOnboarding.tsx:80-84,120-124` | Páginas públicas, perfil, onboarding |
| AUD-23 | Formulário de correção de cadastro sem validação (`state` com mais de 2 caracteres responde 500; nome comercial vazio é aceito) | Comprovado | `pages/parceiro/CorrecaoCadastro.tsx`; `ProviderController.updateMe`; `UpdateProviderAccountUseCase.js` | Recusa e reenvio |
| AUD-24 | Dependências de produção com vulnerabilidades conhecidas (2 críticas, 4 altas no total); auditoria do CI não bloqueante | Comprovado (presença) / risco potencial (exploração) | `npm audit --omit=dev` de 22/10; `.github/workflows/ci.yml` (`continue-on-error: true`) | Backend, frontend, CI |
| AUD-25 | Banco: faltam índices para chaves estrangeiras e consultas frequentes (`orders`, `products`, `appointments`, `services`, `pets`, `order_items`); status como `String` sem `CHECK`; índice parcial de endereço só no SQL (o próximo `migrate dev` pode gerar `DROP INDEX`); SKU sem unicidade e gerado por timestamp | Comprovado / risco potencial | `migrations/20260901000000_init_baseline/migration.sql:243-260`; `schema.prisma`; `CreateProductUseCase.js:28-30` | Schema, migrations |
| AUD-26 | Dívida de testes: módulos-base e telas críticas sem teste; testes de rota tautológicos; testes que consagram defeitos; mocks que escondem erros (seção 7) | Comprovado | Seção 7 | Toda a base |
| AUD-27 | Documentação técnica desatualizada e contraditória: `docs/backend/*.md` (última alteração 12/05/2026) não descreve pedidos, pagamentos, serviços nem agendamentos; `03-regras-de-negocio.md` contradiz o código; specs com referências de linha defasadas | Comprovado | `docs/backend/03-api-endpoints.md`; `docs/funcional/03-regras-de-negocio.md`; specs das Sprints 0–3 | Documentação |
| AUD-28 | Processo: 9 entregas na `main` sem Pull Request; `main` sem proteção; Definition of Done não registrada (nenhum critério marcado em nenhuma spec); decisões sem task (D6, e-mail de compra) | Comprovado | API do GitHub (`branches/main`: `protected=false`); seção 9.2 | Processo |
| AUD-29 | `console.log` com dados de usuário em produção (objeto do usuário a cada renderização; e-mail no `Navbar`), possivelmente enviados ao Sentry como breadcrumbs | Comprovado (log) / risco potencial (Sentry) | `frontend/src/components/cart/CartContext.tsx:241-242`; `frontend/src/components/layout/Navbar.tsx:114-135`; `frontend/src/lib/sentry.ts:73-78` | Frontend, observabilidade |
| AUD-38 | Camada de dados do frontend inconsistente: 22 chamadas `fetch` fora do `httpClient` (sem timeout, sem logout em 401, sem `ApiError`), o que esconde mensagens do backend; sessão lida do `localStorage` em 6 arquivos; login e `/users/me` com formatos diferentes (nome comercial some após recarregar); React Query adotado em parte; cache de pedidos não invalidado após o checkout | Comprovado | `lib/services/providerService.ts`, `productService.ts`, `authService.ts`; `Approvals.tsx:81,105,140`; `CorrecaoCadastro.tsx:78-80,119-123`; `AuthContext.tsx:12-21,94-95`; `LoginUseCase.js:68-76` | Frontend (dados, sessão) |
| AUD-39 | Guardas de rota do frontend sem papel: `/dashboard/*` e `/tutor/*` aceitam qualquer usuário autenticado; `adminOnly` não é usado; `Settings` e `SitterEvaluations` sem verificação de papel; destino pós-login perdido para papéis 1 a 4 | Comprovado | `routes.tsx:272-303,327-332`; `ProtectedRoute.tsx:13,53`; `LoginPage.tsx:82-97` | Frontend (navegação) |
| AUD-40 | Acessibilidade: botões só com ícone sem nome acessível; rótulos não associados; modais sem semântica, foco ou Esc; `lang="en"`; teste axe só na landing e só para violações críticas; violação séria de contraste registrada | Comprovado | `DashboardLayout.tsx:147-214`; `LoginPage.tsx:332-338`; `CheckoutPage.tsx` (cartão); `TutorPets.tsx:229-315`; `index.html:3`; `e2e/a11y.spec.ts` | Frontend |
| AUD-41 | JWT no `localStorage` com CSP apenas em modo Report-Only: um XSS leria o token | Risco potencial | `AuthContext.tsx:39,106`; `httpClient.ts:30-33`; `frontend/vercel.json` | Frontend, segurança |

### Baixo

| ID | Problema | Tipo | Evidências |
| --- | --- | --- | --- |
| AUD-30 | Gates de papel "fail-open" para token sem papel | Comprovado | `CartController.js:108,234`; `CreateOrderUseCase.js:42` |
| AUD-31 | UX-2 parcial: `Finance` e `Orders` fora do design system (cores cruas, tabela manual); "Descartar" volta a um estado anterior ao último salvamento | Comprovado | `Finance.tsx`; `Orders.tsx:147,160,196,259`; `PublicProfile.tsx:356-360` |
| AUD-32 | `validate.js` atribui `req.query` (ignorado no Express 5); `...req.body` espalhado depois de `userId`/`userRole` (seguro hoje porque o Zod remove chaves extras) | Comprovado / risco potencial | `middlewares/validate.js:7-9`; `AppointmentController.js:13-17`; `ServiceController.js:9-13` |
| AUD-33 | Configuração: Swagger exposto; `NODE_ENV` padrão `development`; `frontend/.env.local` versionado apontando para produção; dois lockfiles; `"main"` inválido; `JWT_SECRET` curto só gera aviso | Comprovado | `app.js:89`; `env.js:6,92-97`; `backend/package.json` |
| AUD-34 | Qualidade estática e componentização: 151 avisos de lint no front (66 `any`), 7 no back; chunk principal de 560 kB; código morto (`src/imports` com 7.479 linhas, `src/app/components/ui` com 48 componentes, páginas sem rota); dependências declaradas e não importadas (MUI, Emotion, `react-dnd` e outras); páginas com mais de 800 linhas; duplicação entre detalhes e listas de hotel e sitter | Comprovado | Relatórios de lint e build de 22/10; seção 5.5 |
| AUD-36 | A migration de `Provider.status` rebaixa para `PENDENTE`, sem aviso, valores desconhecidos (ex.: `APPROVED`) | A investigar | `migrations/20260908000000_provider_status_enum/migration.sql` |
| AUD-37 | PGT-1: confirmação depende de `live_mode=false` para usuários de teste; notificações fora de escopo recebem 400/403 e podem gerar reentregas | A investigar | `ProcessPaymentWebhookUseCase.js:32` e retornos do webhook |

> AUD-35 foi incorporado a AUD-12, AUD-13 e AUD-25 durante a consolidação; a numeração foi mantida para preservar as referências cruzadas.

---

## 9. Dívida técnica e maturidade do processo

### 9.1. Dívida técnica que compromete a evolução

1. **Regras de acesso fora do backend (AUD-01, AUD-08).** Enquanto a aprovação, a sessão restrita e a desativação não forem aplicadas na API, toda funcionalidade nova voltada a parceiros (agenda, avaliações, financeiro) nasce com o mesmo furo.
2. **Contratos frontend ↔ backend implícitos (AUD-04, AUD-05, AUD-19, AUD-02).** Quatro defeitos comprovados têm a mesma causa: front e back de uma jornada entregues separadamente, sem contrato escrito nem teste de contrato. A Sprint 4 repete esse formato (PAG-2 no back; BKG-1/2 e SCH-1/2 no front).
3. **Máquina de agendamento sem decisão única (AUD-06, AUD-07).** É a fundação imediata de 5 das 8 tasks da Sprint 4.
4. **Status como texto livre e literais espalhados (AUD-11, AUD-25).** O padrão de constantes existe, mas não é obrigatório; o banco não protege os valores válidos.
5. **Módulos-base sem camadas, sem padrão de erro e sem testes (AUD-10, AUD-26).** São justamente os módulos que a Sprint 4 vai tocar: pets (seleção do pet no agendamento), perfil do parceiro e avaliações de sitter.
6. **Interface que afirma o que não aconteceu (AUD-09, AUD-18, AUD-21, AUD-22).** Somada às telas com `DemoBanner`, dificulta saber o que é real, tanto para usuários quanto para a avaliação acadêmica.
7. **Frontend sem camada de dados e de sessão únicas (AUD-38, AUD-39).** A Sprint 4 acrescenta telas de agendamento e agenda: sem `httpClient` e `useAuth()` como únicas portas, cada tela nova repete os mesmos problemas de erro, sessão e permissão.
8. **Documentação de referência desatualizada (AUD-27),** que já induziu um defeito (AUD-11).

### 9.2. Maturidade do processo (com base no Git e nos documentos)

| Aspecto | Evidência | Avaliação |
| --- | --- | --- |
| Aderência planejamento × implementação | 25 de 28 tasks com entrega; 3 sem nenhum commit (CFG-1, PRD-2, SRV-Fpub); 6 parciais | Boa cobertura de escopo, com lacunas concentradas em gates e em honestidade da interface |
| Prazos dos marcos | M0: entregas até 03/09 · M1: PED-2 em 22/09 · M2: entregas de 04 a 09/10 · M3: entregas de 13 a 15/10 | Atraso recorrente de 1 a 2 semanas; reconhecido pela equipe, apenas registrado aqui |
| Definition of Done do plano (critérios + testes + lint/typecheck limpos + PR revisado) | Nenhum checkbox marcado em nenhuma spec; 9 entregas sem PR (`2c1eaf9`, `c83d4c8`, `84ca021`, `7bd1633`, `81a44a1`, `461a159`, `18ff0e9`, `ae19776`, `c1d53f0`); lint com avisos | **DoD não aplicado de forma verificável** |
| Revisão | `main` sem proteção de branch (`protected=false`); commits diretos após a ponta do marco (CHK-3, AGD-2) | Sem garantia de que outra pessoa revisou antes do merge |
| Escopo dos commits | `176e5a4` junta SRV-1 e PGT-1 (45 arquivos); `ae19776` altera `package-lock.json` sem relação; `c1d53f0` altera `sentry.test.js` sem relação | Revisões mais difíceis e rastreabilidade pior |
| Retrabalho visível | Checkout: CHK-1 → CHK-2 → CHK-3 (com regressão); template de recusa corrigido duas vezes (`0106fe4`, `79a566b`); escopo do CFG-1 parcialmente absorvido pela SRV-F1 | Moderado; parte esperada em entregas incrementais |
| Pendências acumuladas | Decisão D6 sem task; e-mail de compra prometido no README da Sprint 2 sem task; contradição AGD-1 × AGD-2 sem registro | Decisões não viram trabalho rastreável |
| Distribuição | Autoria de commits das entregas: backend comercial e pedidos (Layssa), checkout e UX (Vitor), Sentry, segurança, recusa e telas de serviços (Marcel), infraestrutura, testes, pagamento e serviços (Laura) | Distribuição equilibrada; há poucas revisões cruzadas registradas, e o conhecimento de cada jornada fica concentrado |
| Eficácia dos testes | Testes densos onde quem implementou priorizou; ausentes onde a spec pedia (CHK-1/2/3, UX-2, CAR-0) | Teste não é condição de entrega |
| Eficiência e esforço | — | **Não avaliável:** não há registros de esforço, horas ou fluxo do board no repositório |

### 9.3. Riscos de avançar sem estabilizar

- **Segurança:** a Sprint 4 aumenta a superfície de ações de parceiros (agenda, confirmação, estorno) sobre uma autorização que hoje só existe no front.
- **Retrabalho certo:** PAG-2, BKG e SCH implementados sobre a semântica e o preço atuais do agendamento terão de ser refeitos quando a divergência for resolvida.
- **Evidência acadêmica frágil:** dados fabricados na vitrine, tela de sucesso fixa e totais divergentes contradizem a afirmação de jornadas "integradas"; o CI verde não reflete essas falhas.
- **Acúmulo na Sprint 5:** SEC-2, INF-2, QA-2 e QA-3 já preveem parte das correções; se tudo ficar para o fechamento, o buffer da SEC-2 não comporta o volume identificado.

---

## 10. Plano de estabilização

**Escala de esforço** (a mesma P/M/G das specs, como referência relativa): **P** ≈ até meio dia · **M** ≈ 1 a 2 dias · **G** ≈ 3 dias ou mais de uma pessoa. As estimativas consideram só o tamanho dos arquivos e das regras afetadas; não há histórico de produtividade para calibrá-las. As trilhas sugeridas seguem o plano (R1 Backend Comércio, R2 Backend Plataforma, R3 Front Transacional, R4 Front Painéis & QA). A atribuição final cabe à equipe.

### Fase 0 — Decisões (antes de qualquer código da Sprint 4)

Reunião curta da equipe, com cada decisão registrada no `PLANO-DESENVOLVIMENTO.md` (§3) e nas specs afetadas. Pauta detalhada, com opções e recomendações: [PAUTA-FASE-0-DECISOES-ESTABILIZACAO.md](PAUTA-FASE-0-DECISOES-ESTABILIZACAO.md).

| ID | Decisão necessária | Achados | Impacto na Sprint 4 |
| --- | --- | --- | --- |
| DEC-A | Máquina de agendamento: estado inicial por política; quem aceita ou recusa; quando o PRE_PAGO paga; se o PRESENCIAL pode ser recusado; política congelada no agendamento | AUD-07 | PAG-2, BKG-1/2, SCH-1/2 |
| DEC-B | Fonte do preço do agendamento: `Service.price` × unidade, ou tarifa do parceiro | AUD-06 | PAG-2, BKG-1 |
| DEC-C | Frete, desconto PIX e cupom: implementar no servidor ou remover da interface | AUD-05 | — (compra) |
| DEC-D | "Sitter operacional" exige avaliação aprovada em todo o sistema? | AUD-15 | BKG (quem aparece para agendar) |
| DEC-E | Política de senha única e custo de bcrypt | AUD-13 | — |
| DEC-F | Aceite de termos: versão vigente e onde registrar | AUD-14 | — |
| DEC-G | Desativação como estado próprio (`is_active=false`), separado de `REJEITADO` | AUD-01 | — |

### Fase 1 — Bloqueadores (P0: antes de PAG-2, BKG e SCH)

| ID | Ação | Achados | Depende de | Esforço | Trilha | Relação com tasks existentes |
| --- | --- | --- | --- | --- | --- | --- |
| E-01 | Aplicar aprovação de parceiro no backend: gate de produto (só LOJISTA APROVADO); filtro por parceiro aprovado na vitrine, detalhe, carrinho e checkout; sessão restrita para `REJEITADO`; desativação via `is_active` com verificação no middleware | AUD-01, AUD-16 (parte), AUD-13 (revogação) | DEC-G | G | R2 | Absorve a PRD-2 |
| E-02 | Proteger `GET /providers` (admin) e criar listagem administrativa com documento e motivo; ajustar `Approvals.tsx` e o teste que espera 200 anônimo | AUD-02, AUD-15 (painel) | — | P/M | R2 + R4 | Complementa a SEC-1 |
| E-03 | Reduzir o limite global de corpo; limite próprio só no upload; validar tamanho e quantidade de imagens; tirar base64 das listagens públicas | AUD-03 | — | M | R2 | Antecipa parte da SEC-2 |
| E-04 | Alinhar agendamento conforme DEC-A/DEC-B: estado inicial, preço, política congelada, regras de data, duração, sobreposição e parceiro aprovado; atualizar comentários, specs e textos da UI; testes por política com fixtures realistas | AUD-06, AUD-07, AUD-16 | DEC-A, DEC-B, DEC-D | G | R1 | Pré-requisito da PAG-2 |
| E-05 | Persistir snapshot do endereço no pedido, validando a propriedade; exibir ao lojista | AUD-04 | — | M | R1 + R3 | Fecha critério implícito do M2 |
| E-06 | Igualar total exibido e cobrado conforme DEC-C | AUD-05 | DEC-C | P/M | R3 (+ R1 se implementado no servidor) | — |

### Fase 2 — Integridade e consistência (P1: em paralelo ao início da Sprint 4)

| ID | Ação | Achados | Depende de | Esforço | Trilha | Relação |
| --- | --- | --- | --- | --- | --- | --- |
| E-07 | Padronizar erros: `next(AppError)` em Auth, Product, Provider e User; corrigir `OrderController.js:99`; tratar `P2023`, JSON malformado e corpo grande demais; validar UUID nos `:id` | AUD-10 | — | M | R2 | Antecipa a SEC-2 (itens 1 e 2) |
| E-08 | Estoque e pagamento: devolver estoque no cancelamento; decremento condicional + `CHECK`; ler o carrinho dentro da transação; impedir que o lojista marque `PAGO`; `updateMany` com guarda de status | AUD-12 | — | M | R1 | — |
| E-09 | Conta: senha única (DEC-E) no back e no front; normalizar e-mail em cadastro, login e recuperação, com índice e saneamento dos dados; consumo atômico do token de reset | AUD-13 | DEC-E | M | R2 + R3 | — |
| E-10 | Cadastro: termos obrigatórios com data e versão (DEC-F); dígito verificador do CNPJ; gravar só dígitos do documento (com migração dos dados) | AUD-14 | DEC-F | M | R2 | Cria a task que faltava para D6 |
| E-11 | Moderação: máquina de transições de parceiro; validação Zod e estado na avaliação de sitter; onboarding só para role 4; badge e aba de `EM_REVISAO`; motivo obrigatório na interface | AUD-15 | DEC-D | M | R2 + R4 | Fecha a REC-1 |
| E-12 | Travas de exclusão de pet e endereço com as constantes oficiais, com testes | AUD-11 | — | P | R2 | — |
| E-13 | Retorno pós-login para parceiro `REJEITADO` até `/parceiro/corrigir-cadastro`; validação no formulário de correção | AUD-08, AUD-23 | E-01 | P | R3/R4 | Fecha a REC-2 |
| E-14 | Corrigir o mapeamento de erros da CHK-3 com os códigos reais (ou criar códigos específicos no backend) | AUD-19 | E-07 (se novos códigos) | P | R3 (+ R1) | Fecha a CHK-3 |
| E-15 | Minimização de dados: `select` explícito no tutor do agendamento; lista de campos permitidos no parceiro público (sitter só cidade e UF); proteger `/api/metrics` | AUD-17 | — | M | R2 | Antecipa a SEC-2 (item 3) |
| E-16 | Atualizar dependências vulneráveis e tornar a auditoria bloqueante | AUD-24 | — | P | R1 | Antecipa a INF-2 (itens 4 e 5) |

### Fase 3 — Honestidade da interface e completude (P2: durante a Sprint 4)

| ID | Ação | Achados | Depende de | Esforço | Trilha | Relação |
| --- | --- | --- | --- | --- | --- | --- |
| E-17 | Remover dados e preços fabricados da vitrine, da landing e do detalhe de produto; listar serviços reais com estados vazio e erro; tela sem dado mostra "Sem avaliações" ou oculta o campo | AUD-09 | E-01 (filtro de aprovados) | M | R3 | Executa a SRV-Fpub |
| E-18 | Tela de sucesso baseada no pedido real; estado e nova tentativa no merge do carrinho; invalidar o cache de pedidos após o checkout | AUD-18, AUD-38 (cache) | — | P/M | R3 | Fecha a CHK-2 |
| E-19 | Paginação e totais reais em `Orders` e `TutorOrders` | AUD-20 | — | M | R4 | Complementa a PED-F |
| E-20 | Nenhuma confirmação de sucesso sem resposta 2xx: CFG-1 implementada **ou** marcada como demonstrativa, sem ações de segurança simuladas; Contato envia de verdade ou é marcado; "Reservar/Agendar" desabilitados com aviso até a BKG | AUD-21 | — | M (implementar) / P (marcar) | R4 + R3 | Decide o destino da CFG-1 |
| E-21 | Banco: índices de chaves estrangeiras e consulta; `CHECK` dos status; trazer o índice parcial para uma migration controlada; unicidade de SKU | AUD-25 | — | M | R1 | — |
| E-22 | Higiene: remover `console.log` com dados de usuário e descartar breadcrumbs de console no Sentry; gates sem fail-open; `validate.js` sem atribuir `req.query`; ajustes de configuração (Swagger, `NODE_ENV`, lockfile, `.env.local`) | AUD-29, AUD-30, AUD-32, AUD-33 | — | P | R2 + R3 | — |
| E-23 | UX-2: `Finance` e `Orders` no design system; atualizar o snapshot após salvar | AUD-31 | — | P/M | R4 | Fecha a UX-2 |
| E-31 | Estados de erro honestos: `WalkersPage` com erro e nova tentativa; detalhes distinguem erro de "não encontrado"; sem produto falso no detalhe; `Account` e onboarding sem estados enganosos; limite de tamanho das fotos no cliente | AUD-22 | — | M | R3 + R4 | Fecha a CAR-0 |
| E-32 | Camada de dados única: services sobre `httpClient` (fim do `fetch` direto, com regra de lint); sessão só via `useAuth()`; login e `/users/me` com o mesmo formato de usuário | AUD-38 | — | M | R3 + R2 | — |
| E-33 | Guardas de rota por papel: `allowedRoles` em cada rota de `/dashboard/*` (coerente com a sidebar) e em `/tutor/*`; destino pós-login preservado para todos os papéis; testes de `ProtectedRoute` e `LoginPage` | AUD-39, AUD-08 | E-13 | P/M | R4 | — |
| E-34 | Acessibilidade: nomes acessíveis nos botões de ícone; rótulos associados; modais migrados para o `Dialog` existente; `lang="pt-BR"`; axe em `/login`, `/register`, `/checkout` e `/dashboard`, reprovando também violações sérias | AUD-40 | — | M | R4 | Antecipa parte da QA-3 |
| E-35 | CSP efetiva (sair de Report-Only) após ajustar as fontes necessárias; avaliar a guarda do token | AUD-41 | — | M | R3 + R1 | Relaciona-se à SEC-2 |
| E-36 | Limpeza: remover `src/imports`, `src/app/components/ui`, páginas sem rota e dependências não importadas; carregar `jspdf` sob demanda; tirar `style-guide` de produção | AUD-34 | — | P/M | R4 | — |

### Fase 4 — Prevenção (contínua, começando já)

| ID | Ação | Achados | Esforço |
| --- | --- | --- | --- |
| E-24 | Proteger a `main`: PR obrigatório com 1 aprovação e checks obrigatórios (backend, frontend, E2E) | AUD-28 | P |
| E-25 | Template de PR com checklist do DoD da task (critérios marcados, testes adicionados, spec atualizada, link de evidência) e marcação dos critérios no próprio arquivo da task | AUD-28, AUD-27 | P |
| E-26 | Testes mínimos por risco: rotas sem teste (pets, endereços, favoritos, usuários, produtos); testes de rota com o use case real; fixtures com UUID; banco real para agendamento, cancelamento e concorrência; testes de componente do checkout e de `ProtectedRoute`; corrigir os testes que consagram defeitos | AUD-26 | G (distribuído) |
| E-27 | Contrato entre front e back por jornada: tipos ou schemas compartilhados, ou ao menos um catálogo de códigos de erro e respostas documentado no Swagger e testado | AUD-19, AUD-04, AUD-05 | M |
| E-28 | Catraca de qualidade: `eslint --max-warnings` com teto decrescente; relatório de cobertura no CI (backend com o Node; frontend exige instalar `@vitest/coverage-v8`, a ser aprovado pela equipe); a11y falhando também em violações sérias | AUD-34, AUD-26 | P/M |
| E-29 | Atualizar `docs/funcional/03-regras-de-negocio.md`, `docs/backend/*.md` e as specs com contradições; registrar as decisões da Fase 0 | AUD-27 | M |
| E-30 | Verificações externas pendentes, com evidência datada (ver 11.2) | AUD-36, AUD-37 | M |

### Sequenciamento e dependências

```text
Fase 0 (DEC-A…G) ──┬─> E-04 (agendamento) ──> PAG-2 / BKG-1 / SCH-1
                   ├─> E-06 (totais), E-09 (senha), E-10 (termos), E-11 (moderação)
                   └─> E-01 (gate de parceiro) ──> E-13 (retorno pós-login) ──> E-33 (guardas de rota)
                                                 └─> E-17 (vitrine real)
Independentes, podem começar já: E-02, E-03, E-05, E-07, E-08, E-12, E-15, E-16, E-24, E-25
Frontend, em paralelo à Sprint 4: E-18, E-20, E-31, E-32, E-34, E-36 (E-35 depois de mapear as fontes da CSP)
```

---

## 11. Critérios de aceite da estabilização

### 11.1. Por achado

| Achado | Critério objetivo de resolução |
| --- | --- |
| AUD-01 | Testes de integração: `POST/PUT/DELETE /products` respondem 403 para sitter `PENDENTE`, lojista `PENDENTE`, lojista `REJEITADO`, hotel e tutor; respondem 2xx para lojista `APROVADO`. `GET /products`, `GET /products/:id`, `POST /cart/items` e `POST /orders` não aceitam nem exibem produto de parceiro não aprovado. Token de parceiro `REJEITADO` recebe 403 fora de `GET/PUT /providers/me` e `POST /providers/me/resubmit`. Depois de desativar a conta, a requisição seguinte com o token antigo recebe 401/403 |
| AUD-02 | `GET /providers` sem token responde 401; com token não-admin, 403; com admin, inclui `document` e `rejection_reason`. O painel exibe o documento formatado e a busca por documento funciona. O teste que esperava 200 anônimo foi corrigido |
| AUD-03 | Requisição JSON acima do limite global (≤ 100 kb) responde 413 sem autenticação; upload acima do limite próprio responde 413/422; listagens públicas não trazem base64 |
| AUD-04 | O pedido criado guarda o endereço informado; `address_id` de outro usuário responde 403/404; o lojista vê o endereço no detalhe do pedido; teste de banco cobre o caso |
| AUD-05 | Teste de componente ou E2E: o valor do botão "Confirmar Pedido" é igual ao `total_price` (soma dos pedidos) retornado pela API, para cenários com e sem frete, PIX e cupom |
| AUD-06 | Teste unitário com `service.price` diferente da tarifa do parceiro: o total segue a regra de DEC-B; a regra aparece na spec |
| AUD-07 | DEC-A registrada; comentários de `appointmentStatus.js`, specs AGD-1/AGD-2/PAG-2, README da Sprint 4 e `paymentPolicy.ts` dizem a mesma coisa; política gravada no agendamento; testes por política cobrindo estado inicial, aceite, recusa e cancelamento |
| AUD-08 | E2E ou teste de componente: lojista e hotel `REJEITADO` que fazem login com `returnTo=/parceiro/corrigir-cadastro` chegam à tela de correção |
| AUD-09 | Busca por literais fabricados (`rating: 5.0`, `"3.0 km"`, `Math.random()` em avaliações, nomes de depoimentos, `rating: 4.5`) não retorna ocorrências em páginas públicas e no backend; hotel e sitter listam `services` reais com preço e unidade; estados vazio e erro distintos |
| AUD-10 | Busca por `res.status(500).json({ error: error.message` e por `status(500)` em `backend/src/controllers` não retorna ocorrências; testes: produto inexistente responde 404; produto de outro lojista, 403; `PATCH /orders/:id/status` com `{}`, 422; id não UUID, 400/404; JSON malformado, 400 |
| AUD-11 | Testes: excluir pet com agendamento `CONFIRMADO` futuro responde 409; excluir endereço com pedido `PAGO`/`PREPARANDO`, 409; os literais vêm de `constants/` |
| AUD-12 | Teste de banco: dois pedidos simultâneos pela última unidade resultam em um 201, um 409 e estoque 0. Cancelamento devolve as quantidades na mesma transação. Lojista não consegue `AGUARDANDO_PAGAMENTO → PAGO` (422/403). Duas criações simultâneas do mesmo carrinho resultam em um único conjunto de pedidos |
| AUD-13 | Um único schema de senha usado por cadastro, troca e reset, espelhado no front; custo de bcrypt em uma constante; cadastro com `Maria@X.com` permite login e recuperação com `maria@x.com`; índice único sem distinção de maiúsculas; token de reset reutilizado em paralelo é aceito uma só vez |
| AUD-14 | Cadastro sem `terms_accepted: true` responde 422; data e versão dos termos persistidas; CNPJ com dígito verificador inválido responde 422; documento gravado só com dígitos |
| AUD-15 | Transições de parceiro inválidas respondem 422; sitter só fica operacional conforme DEC-D; avaliação só aceita `APPROVED`/`REJECTED` em avaliação `PENDING` de role 4; painel exibe `EM_REVISAO` separadamente e exige motivo |
| AUD-16 | Testes: agendamento com início no passado, sobreposição ou parceiro não aprovado responde 422/409; detalhe de parceiro inexistente ou não aprovado responde 404 |
| AUD-17 | Respostas de agenda e detalhe de agendamento contêm só id, nome, telefone e e-mail do tutor; vitrine de sitter sem endereço completo nem telefone; `/api/metrics` exige admin |
| AUD-18 | Recarregar a tela de sucesso sem estado redireciona ou busca o pedido; status exibido vem da API; falha no merge do carrinho mostra erro com nova tentativa e o checkout aguarda a sincronização |
| AUD-19 | Teste de componente com `ApiError(409, 'CONFLICT', 'Estoque insuficiente para o produto X')` exibe a mensagem específica e a ação "Ir para o carrinho" |
| AUD-20 | Com mais de 20 pedidos, a lista pagina e os KPIs refletem o total (via agregado ou `X-Total-Count`) |
| AUD-21 | Nenhum toast de sucesso sem resposta 2xx da API. Configurações: alterar, salvar e recarregar mantém os valores (com `PUT` visível na rede), **ou** a tela exibe `DemoBanner` sem ações de segurança simuladas. Botões sem fluxo ficam desabilitados com aviso |
| AUD-22 | Com a API respondendo 500: `WalkersPage` mostra erro com "Tentar novamente"; os detalhes diferenciam erro de "não encontrado"; o detalhe de produto não exibe produto nem botão de carrinho; `Account` não mostra status inventado; o onboarding não faz logout por timeout e recusa fotos acima do limite anunciado |
| AUD-23 | O formulário de correção valida nome comercial, UF (2 letras) e CEP antes de enviar; a API responde 422 (não 500) para dados inválidos |
| AUD-24 | `npm audit --omit=dev --audit-level=high` sem ocorrências (ou exceções documentadas e justificadas); passo do CI sem `continue-on-error` |
| AUD-25 | Migration nova cria os índices e os `CHECK` de status; `prisma migrate diff` sem divergência entre schema e banco; SKU único |
| AUD-26 | Cada rota tem ao menos um teste de sucesso e um de falha de autorização ou validação; nenhum teste de rota substitui o use case por inteiro; testes que consagravam defeitos foram invertidos |
| AUD-27 | `03-regras-de-negocio.md` e `docs/backend/*.md` refletem o código; specs sem contradições abertas; decisões da Fase 0 registradas |
| AUD-28 | `main` com proteção ativa (PR + checks obrigatórios); todo PR traz o checklist do DoD preenchido |
| AUD-29 | Busca por `console.log` com dados de usuário não retorna ocorrências; regra `no-console` ativa; `beforeBreadcrumb` descarta breadcrumbs de console |
| AUD-30 a AUD-34 | Busca por `userRole &&` não retorna ocorrências e token sem papel recebe 403; `validate.js` não atribui `req.query`; Swagger desativado ou protegido em produção; `NODE_ENV=production` exigido no deploy; teto de avisos de lint definido e respeitado; diretórios e dependências mortos removidos, com build e testes verdes |
| AUD-38 | Busca por `fetch(` fora de `httpClient.ts` (e do hook de CEP) não retorna ocorrências; leitura de `localStorage` para o usuário só no `AuthContext`; `CorrecaoCadastro` exibe a mensagem de erro do backend (teste com o serviço real simulado no nível HTTP); nome comercial visível após recarregar |
| AUD-39 | Teste de `ProtectedRoute`: tutor em `/dashboard`, parceiro em `/tutor` e não-admin em rotas de admin são redirecionados; admin deslogado que abre `/dashboard/aprovacoes` volta a essa rota após o login |
| AUD-40 | axe sem violações críticas nem sérias em landing, login, cadastro, checkout e painel; todos os botões de ícone com nome acessível; modais com `role="dialog"`, foco preso e fechamento com Esc; `lang="pt-BR"` |
| AUD-41 | Cabeçalho `Content-Security-Policy` efetivo (não só Report-Only) em produção, sem quebrar as rotas testadas no E2E |
| AUD-36, AUD-37 | Ver 11.2 |

### 11.2. Verificações externas pendentes (procedimento)

| Item | Procedimento | Evidência esperada |
| --- | --- | --- |
| Entrega de e-mails (EML-1, REC-1) | Em staging: disparar `forgot-password` e uma recusa; conferir os logs do Resend; abrir os links recebidos | Prints sem token, status `delivered`, data e commit |
| Mercado Pago sandbox (PGT-1, AUD-37) | Seguir o §4 de `PGT-1-CONFIGURACAO.md`: pagamento aprovado e recusado com comprador de teste; reenviar a notificação pelo painel | `payment_attempts.status=APPROVED`, `orders.status=PAGO`, reenvio sem efeito duplicado |
| Migrations em produção (AUD-36, INF-0) | `prisma migrate status` contra produção; `SELECT status, count(*) FROM providers GROUP BY 1` antes e depois | Sem migrations pendentes; nenhum parceiro rebaixado indevidamente |
| Estratégia de migração no deploy | Conferir na Railway se existe Pre-Deploy Command, além do `start` com `migrate deploy` | Uma única estratégia documentada |
| Rotação de segredos (INF-0) | Datas de alteração das variáveis no painel da Railway e da Vercel | Registro datado da rotação |
| Sentry (UX-0) | `npm run sentry:smoke` com DSN; conferir o evento no painel | Evento recebido, sem PII |

---

## 12. Recomendações para as próximas entregas

**Desenvolvimento**

1. **Contrato antes do código em jornadas divididas entre front e back.** Antes de PAG-2/BKG/SCH, registrar na spec o formato de requisição e resposta, os códigos de erro e os estados, e criar um teste que falhe se o contrato mudar.
2. **Toda regra de acesso no backend; o front só reflete.** Todo endpoint novo de parceiro deve declarar papel, status exigido e verificação de propriedade, com teste de 403.
3. **Constantes de status obrigatórias.** Nenhum literal de status fora de `backend/src/constants`; preferir enum ou `CHECK` no banco para status novos.
4. **Sem dado fabricado fora de tela marcada.** Valor inventado só em tela com `DemoBanner`; sem dados, a interface mostra estado vazio.
5. **Erros sempre via `AppError` e `next(err)`;** nada de `res.status(500).json({ error: error.message })`.

**Validação e testes**

6. **Teste como condição de pronto:** cada critério de aceite da spec vira ao menos um teste automatizado, ou uma evidência manual datada quando depender de serviço externo.
7. **Testes de rota exercitam o use case real** (com Prisma simulado ou banco); simular o use case só para testar o roteamento.
8. **Banco real para regra transacional ou concorrente** (estoque, pagamento, agendamento), aproveitando a infraestrutura da QA-1.
9. **Fixtures realistas:** UUIDs válidos, campos que o código lê (ex.: `price`), dados com acentos e maiúsculas.
10. **Testes que registram defeitos são defeitos:** ao encontrar um, inverter a expectativa junto com a correção.

**Revisão e processo**

11. **Proteção da `main` e PR obrigatório**, com checklist de revisão: autorização, validação Zod, padrão de erro, constantes, dados pessoais na resposta, testes de falha, spec atualizada.
12. **Um PR por task**, sem misturar escopos nem arquivos alheios (lockfiles, testes de outra task).
13. **Spec como documento vivo:** ao concluir, marcar critérios, registrar desvios aceitos e linkar a evidência. Decisões novas viram task ou entrada explícita no plano.
14. **Evidência por versão:** toda evidência (testes, prints, CI) traz data e commit, sem reaproveitar relatórios antigos para versões novas.

---

## 13. Parecer final de prontidão

**O que entregamos até aqui está correto, completo, testado, bem estruturado e suficientemente confiável para servir de base às próximas sprints?**

- **Correto:** *parcialmente.* O fluxo principal de compra e o núcleo de pedidos e pagamentos estão corretos e provados. Há regras de negócio essenciais violadas: aprovação de parceiro, preço do agendamento, endereço e totais.
- **Completo:** *não.* 3 tasks não foram implementadas e 6 estão parciais; os marcos M2 e M3 foram atingidos só parcialmente.
- **Testado:** *de forma desigual.* 333 testes automatizados foram aprovados localmente, e mais 4 com banco foram aprovados no CI; o CI está verde. Mas os testes se concentram nas entregas de backend mais recentes. Módulos-base e telas críticas não têm testes, e alguns testes registram defeitos como comportamento esperado.
- **Bem estruturado:** *nas entregas recentes, sim; nos módulos-base, não.* Há padrões claros (camadas, `AppError`, Zod, constantes), mas eles não são obrigatórios nem verificados na revisão.
- **Confiável como base:** *ainda não.* A autorização de parceiros só no frontend (AUD-01) e a base de agendamento contraditória (AUD-06, AUD-07) atingem diretamente o que a Sprint 4 vai construir.

**Recomendação: prontidão condicional.**

1. **Não iniciar PAG-2, BKG-1/2 e SCH-1/2** antes de concluir a **Fase 0** (decisões) e, no mínimo, **E-01, E-04 e E-02** da Fase 1. Iniciar antes significa construir sobre regras que vão mudar e expor ações de parceiro sem controle no backend.
2. **AVL-1 e STO-1 podem começar em paralelo à estabilização.** Dependem pouco da semântica em aberto; a AVL-1 deve nascer já com o gate de parceiro aprovado e com o padrão de erros.
3. **Fases 1 e 2 cabem antes ou junto da Sprint 4** se itens da SEC-2, INF-2, QA-2 e QA-3 (Sprint 5) forem antecipados: E-03, E-07, E-15 e E-16 já estão previstos nessas tasks. O calendário precisa ser revisto pela equipe; esta auditoria não define nova data.
4. **Adotar a Fase 4 imediatamente** (proteção da `main`, checklist de DoD e testes mínimos), para que as entregas da Sprint 4 não repitam os padrões de falha encontrados.

Com a Fase 0 decidida e os itens P0 concluídos e aceitos pelos critérios da seção 11, a base passa a ser adequada para a Sprint 4.

---

### Apêndice — Reprodução das verificações

```bash
# Snapshot somente leitura da main auditada (fora do projeto)
git archive c1d53f0942cf83e81ac30ff27a8133b7706305fb | tar -x -C <pasta-temporaria>

# Backend (sem banco real)
NODE_ENV=test LOG_LEVEL=silent RUN_DB_INTEGRATION_TESTS=false MERCADO_PAGO_ENABLED=false \
JWT_SECRET=<fictício-32+> DATABASE_URL=postgresql://user:pass@localhost:5432/petplus_test \
FRONTEND_URL=http://localhost:5173 node --test --experimental-test-coverage
npx eslint . && npx prisma validate && npm audit --omit=dev --audit-level=high

# Frontend
npx eslint . && npx tsc --noEmit && npx vitest run && npx vite build && npx playwright test
npm audit --omit=dev --audit-level=high
```
