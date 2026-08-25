# Sprint 3 — Serviços e Agendamento

> Marco **M3 = 12/out** · Semana 6 (29/set–05/out) + Semana 7 (06–12/out)

## Objetivo do Sprint
Dar vida ao segundo pilar do Pet+ — os **serviços de hotel e pet sitter** e o **agendamento**. Hoje os modelos `Service`/`Appointment` e seus repositórios existem no schema mas são **código morto** (nenhuma rota os usa). Esta sprint expõe o CRUD de serviços (restrito a parceiro aprovado), o fluxo completo de agendamento respeitando a `payment_policy` do parceiro, e leva isso ao frontend (gestão de serviços + detalhe público com dados reais). Em paralelo, endurece a criação de produto (só LOJISTA aprovado) e refina o checkout. Ao fim, hotel/sitter aprovado publica serviços que o tutor agenda, e a loja só mostra produto de lojista aprovado.

## Marco M3 (12/out) — Definition of Done do Sprint
- Serviços e agendamento **existem no backend**: hotel/sitter aprovado gerencia serviços; tutor agenda; status transita conforme a `payment_policy`.
- Agendamento respeita política: **PRESENCIAL** confirma direto; **PRE_PAGO** nasce `AGUARDANDO_CONFIRMACAO` e o parceiro confirma/recusa (recusa/cancelamento → estorno).
- Criação/edição de **produto restrita a LOJISTA aprovado**; loja pública não mostra produto de lojista não-aprovado.
- Frontend: parceiro cadastra/edita/exclui serviços pela UI; detalhe público lista serviços **reais** (campos fabricados removidos); checkout trata bordas (estoque/carrinho vazio/erro).
- Mercado Pago sandbox é **opcional** e não bloqueia o marco; pagamento simulado segue como fallback.

## Tasks (8)
| ID | Título | Trilha | Semana | Prioridade | Esforço | Resp. |
|----|--------|--------|--------|------------|---------|-------|
| AGD-2 | Appointment POST/GET/PATCH respeitando payment_policy (parte 2) | Backend | 6 | Crítico | G | R1 |
| SRV-1 | CRUD /providers/services (só hotel/sitter aprovado) | Backend | 6 | Crítico | G | R2 |
| CHK-3 | Refino de checkout/pedidos (erros/estoque) | Frontend | 6 | Alta | M | R3 |
| SRV-F1 | UI de gestão de Serviços (parte 1) + campo payment_policy | Frontend | 6 | Alta | M | R4 |
| PGT-1 | Mercado Pago sandbox no checkout (OPCIONAL) | Backend | 7 | Opcional | G | R1 |
| PRD-2 | Gate de criação de produto (só lojista aprovado) | Backend | 7 | Alta | M | R2 |
| SRV-Fpub | Front: exibir serviços reais no detalhe (remover campos fake) | Frontend | 7 | Alta | M | R3 |
| SRV-F2 | UI de gestão de Serviços (parte 2) | Frontend | 7 | Alta | M | R4 |

## Ordem e dependências
```
Semana 6:  AGD-2 (dep AGD-1)   SRV-1 (dep STA-1)   CHK-3 (dep CHK-2)   SRV-F1 (dep SRV-1)
                                    │
Semana 7:  PGT-1 (dep PAG-1)   PRD-2 (dep STA-1)   SRV-Fpub (dep SRV-1)   SRV-F2 (dep SRV-1)
```
- **SRV-1 → SRV-F1 / SRV-Fpub / SRV-F2**: o CRUD de serviços no backend precisa existir antes de qualquer UI/consumo.
- **AGD-1 → AGD-2**: a modelagem/migração do agendamento (incl. `payment_policy` no `Provider` e alinhamento dos estados de `Appointment.status`) é pré-requisito herdado.
- **STA-1 → SRV-1 / PRD-2**: o enum de `Provider.status` (APROVADO) já consistente é base do gate de aprovação.
- **CHK-2 → CHK-3** e **PAG-1 → PGT-1**: refino e sandbox partem do checkout/pagamento já existentes.
- **PGT-1 é OPCIONAL** — pode migrar para o próximo semestre sem afetar o M3.

## Convenções do time
- Ninguém commita direto na `main` — todo merge via **Pull Request com revisão**.
- Backend em camadas: routes → controllers → useCases → repositories/prisma; erros via `next(AppError)` + errorHandler central; validação Zod; logger pino.
- Express 5: `req.query` é **somente-leitura** → validar com Zod inline (sem reatribuir). Prisma `Decimal` → `Number()` na saída. Nunca vazar `password_hash`/`document` (CPF/CNPJ).
- Frontend: `lib/services/*` sobre `httpClient`; hooks React Query em `lib/hooks`; sempre tratar loading/erro/vazio/sucesso; `HamsterLoader`.
- Papéis: 1=ADMIN, 2=LOJISTA, 3=HOTEL, 4=PET_SITTER, 5=TUTOR.
