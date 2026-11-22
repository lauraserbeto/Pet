# E-11 — Moderação de parceiros e candidaturas de Pet Sitter: implementação e validação

22/11/2026 · branch `codex/retomada-servicos` · alterações locais, **sem commit, push ou deploy**. Sem migration nova.

Origem: auditoria pré-Sprint 4, E-11 / AUD-15 (RF-008, RF-009, RF-010), decisão **DEC-D** (D1 — aprovação do Pet Sitter só pela avaliação; nova candidatura só após recusa, uma de cada vez). Já entregues antes e mantidos: candidatura exclusiva de Pet Sitter, revisão recusando candidatura de outro perfil e transações com rollback (SEC-2); verificador único de "parceiro operacional" exigindo avaliação aprovada (E-01).

## Regras implementadas

**Status do parceiro (admin, `PATCH /providers/:id/status`)** — `ADMIN_PROVIDER_TRANSITIONS` em `backend/src/constants/providerStatus.js`:

| De | Para (permitido) |
|---|---|
| PENDENTE | APROVADO, REJEITADO |
| EM_REVISAO | APROVADO, REJEITADO |
| REJEITADO | APROVADO (“Aprovar novamente”) |
| APROVADO | — (suspender é desativar a conta, `User.is_active` — DEC-G) |

- Transição fora da tabela (inclusive repetir o status atual) → **422 `INVALID_PROVIDER_TRANSITION`**, sem alterar o registro.
- Pet Sitter só vai a APROVADO com avaliação aprovada → **422 `SITTER_APPROVAL_REQUIRES_EVALUATION`** (DEC-D).
- Lock da linha do parceiro (`SELECT … FOR UPDATE`) em transação: decisões simultâneas são serializadas; a segunda recebe 422.
- Reenvio do parceiro (REJEITADO → EM_REVISAO) passou a ser condicional ao status lido: reenvio concorrente com decisão do admin responde **409** em vez de sobrescrever.

**Candidatura do Pet Sitter (`POST /users/me/evaluations`)**
- Bloqueada se já houver candidatura PENDING (**409 `EVALUATION_ALREADY_PENDING`**) ou APPROVED (**409 `EVALUATION_ALREADY_APPROVED`**); permitida na primeira vez ou após recusa.
- Lock da linha do usuário: envios simultâneos criam uma única candidatura.

**Revisão (`PATCH /users/admin/evaluations/:id`)**
- Só candidatura PENDING de Pet Sitter; já revisada → **409 `EVALUATION_ALREADY_REVIEWED`**; lock da linha da avaliação contra decisões simultâneas.
- Recusa exige feedback (422 sem ele).
- Estados coerentes nas três tabelas:

| Momento | SitterEvaluation | User.onboarding_step | Provider.status |
|---|---|---|---|
| Enviada | PENDING | IN_REVIEW | inalterado |
| Aprovada | APPROVED | COMPLETED | APROVADO |
| Recusada | REJECTED (+ feedback) | REJECTED | inalterado (nunca APROVADO sem avaliação aprovada) |

**Interface**
- Aprovações: cadastro reenviado aparece distinto na fila “Para analisar” (selo “Reenviado após correção” e “Recusa anterior: …”); Pet Sitter não tem botão de aprovação direta — atalho “Avaliar candidatura”; recusa exige motivo (botão desabilitado com campo vazio ou só espaços, texto explica que o parceiro recebe o motivo); mensagens de erro reais da API em vez de genéricas.
- Onboarding do Pet Sitter: o 409 reflete o estado real (em análise → tela de espera; já aprovada → painel).
- Avaliações de sitters: já exigia feedback na recusa e só oferecia decisão para PENDING (conferido).

## Arquivos

Backend: `constants/providerStatus.js`, `useCases/providers/UpdateProviderStatusUseCase.js` (novo), `useCases/users/SitterEvaluationUseCases.js` (novo), `controllers/ProviderController.js`, `controllers/UserController.js`, `schemas/userSchemas.js`; testes `tests/integration/moderationDb.test.js` (novo) e `tests/integration/providerRejection.test.js` (adaptado à transação e ao reenvio condicional).
Frontend: `pages/dashboard/admin/Approvals.tsx` (+ teste), `pages/onboarding/PetSitterOnboarding.tsx`.

## Validação

Runtime: Node 24.18.0 global (o validado no handoff é 24.22.3). PostgreSQL 16 local descartável, URL com `127.0.0.1` (ver achado de ambiente da auditoria visual, Fase 3).

- **Backend:** **553/553** aprovados (6 novos de banco em `moderationDb.test.js`: transições válidas/ inválidas sem efeito; sitter só pela avaliação; aprovar × recusar simultâneos; candidatura única e reenvio após recusa; revisão dupla e simultânea com estado coerente; envios simultâneos), zero ignorados. Lint: 0 erros (2 avisos já existentes).
- **Frontend:** 38 arquivos / **191 testes** (3 novos em `Approvals.test.tsx`), typecheck sem erros, lint 0 erros, build aprovado.
- **Navegador + API reais:** **9/9** cenários — selo de reenvio e atalho do sitter, motivo obrigatório, bloqueio de aprovação direta do sitter, transições e repetição, feedback obrigatório na recusa da avaliação, aprovação pela tela seguida de revisão dupla (409), provider APROVADO após a aprovação, candidatura de sitter já aprovado (409). Prints e `resultado.json` em [`evidencias-e11/`](evidencias-e11/), e-mails mascarados.

## Limites

- Dados legados não foram saneados: um Pet Sitter que tenha ficado APROVADO pelo atalho antigo, sem avaliação aprovada, continua não operacional pelo verificador único (E-01), mas o status gravado não foi alterado. Levantar e decidir antes de publicar.
- A exibição das fotos da candidatura (RF-010) não foi reverificada nesta entrega.
- E2E de recusa/correção/reenvio (QA-3) e e-mail real de recusa (Resend) não executados.
