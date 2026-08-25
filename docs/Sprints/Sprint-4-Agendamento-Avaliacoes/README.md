# Sprint 4 — Agendamento e Avaliações

> Semana 8 (13–19/out) + Semana 9 (20–26/out) · Marco **M4 = 26/out** · Pet+ (marketplace de pets: loja + hotéis + pet sitters)

## Objetivo do Sprint
Fechar o **agendamento ponta a ponta** de serviços de hotel e pet sitter, respeitando a política de pagamento do parceiro, e nascer o **sistema real de avaliações** no backend. Ao fim do Sprint 4 o tutor consegue montar e enviar uma solicitação de agendamento (com total calculado e checkout condicional a `payment_policy`), acompanhar seus agendamentos com status real e o parceiro gerencia o ciclo (confirmar/recusar/concluir) pela sua agenda — sem mocks. Em paralelo, as avaliações passam a existir de verdade no backend (modelo `Review` + rating agregado), preparando o consumo pelo front no Sprint 5.

## Marco M4 (26/out) — Definition of Done do Sprint
- [ ] Tutor monta um agendamento (serviço + pet + período), vê o total calculado e envia a solicitação.
- [ ] Política de pagamento respeitada: **PRESENCIAL** confirma sem pagamento; **PRE_PAGO** cobra antes (→ `AGUARDANDO_CONFIRMACAO`) e estorna em recusa/cancelamento.
- [ ] Parceiro vê a agenda real de Appointments e confirma/recusa/conclui com estados tratados (loading/vazio/erro).
- [ ] `TutorAppointments` mostra agendamentos reais com status; mocks (`Schedule.tsx`, `TutorAppointments.tsx`) removidos.
- [ ] Backend de avaliações: `Review` vinculado a pedido/agendamento **CONCLUÍDO**, com POST/GET e rating médio + contagem agregados por alvo (produto/hotel/sitter).

## Tasks (8)
| ID | Título | Trilha | Semana | Prioridade | Esforço | Resp. |
|----|--------|--------|--------|------------|---------|-------|
| PAG-2 | Pagamento no agendamento PRE_PAGO + estorno | Backend | 8 | Crítico | M | R1 |
| AVL-1 | Avaliações backend (parte 1) | Backend | 8 | Alta | G | R2 |
| BKG-1 | Fluxo de agendamento (front) parte 1 | Frontend | 8 | Crítico | G | R3 |
| SCH-1 | Schedule do parceiro real (parte 1) | Frontend | 8 | Alta | M | R4 |
| STO-1 | Storage de mídia (Cloudinary) — OPCIONAL | Infra | 9 | Opcional | M | R1 |
| AVL-2 | Avaliações backend (parte 2) | Backend | 9 | Alta | M | R2 |
| BKG-2 | Fluxo de agendamento (front) parte 2 + TutorAppointments real | Frontend | 9 | Crítico | G | R3 |
| SCH-2 | Schedule do parceiro (parte 2) | Frontend | 9 | Alta | M | R4 |

## Ordem e dependências
```
Semana 8:  PAG-2 (dep AGD-2, PAG-1)   AVL-1 (dep AGD-2)   BKG-1 (dep AGD-2)   SCH-1 (dep AGD-2)
              │                          │                   │                   │
Semana 9:  STO-1 (—, OPCIONAL)        AVL-2 (dep AVL-1)   BKG-2 (dep BKG-1)   SCH-2 (dep SCH-1)
```
- **AGD-2** (endpoints de Appointment: criar/listar/transição de status) e **PAG-1** (pagamento SIMULADO) são pré-requisitos herdados dos sprints anteriores; PAG-2, AVL-1, BKG-1 e SCH-1 dependem deles.
- **PAG-1 → PAG-2**: o pagamento simulado precisa existir antes de acoplá-lo ao fluxo PRE_PAGO e ao estorno.
- **AVL-1 → AVL-2**: o modelo `Review` e o POST/GET precisam existir antes de agregar rating médio + contagem.
- **BKG-1 → BKG-2** e **SCH-1 → SCH-2**: as parte 2 completam o fluxo iniciado na parte 1.
- **STO-1** é **OPCIONAL** (pode migrar de semestre), sem dependências; não bloqueia o marco M4.
- As trilhas Backend (PAG/AVL), Frontend (BKG/SCH) e Infra (STO) correm em paralelo dentro de cada semana.

## Decisões de negócio deste Sprint
- `payment_policy` do parceiro: **PRESENCIAL** (padrão) e **PRE_PAGO** (paga antes → `AGUARDANDO_CONFIRMACAO`; recusa/cancelamento → estorno).
- Cobrança: **hotel por diária**, **sitter por visita/hora**.
- Pagamento **SIMULADO primeiro**; Mercado Pago sandbox opcional.
- `Appointment.status`: `PENDENTE → AGUARDANDO_CONFIRMACAO (PRE_PAGO) → CONFIRMADO → CONCLUIDO`; ramos `RECUSADO/CANCELADO`. Avaliação só liberada após `CONCLUIDO`.

## Convenções do time
- Ninguém commita direto na `main` — todo merge via **Pull Request com revisão**.
- Backend em camadas: routes → controllers → useCases → repositories/prisma; erros via `next(AppError)` + errorHandler central; validação Zod (Express 5 tem `req.query` read-only → validar inline); logger pino.
- Frontend: `lib/services/*` sobre `httpClient` tipado; hooks React Query em `lib/hooks`; sempre tratar loading/erro/vazio/sucesso; `HamsterLoader`.
- Nunca vazar `password_hash`/`document`; `Prisma.Decimal` → `Number()` ao serializar.
- `frontend/.env.local` aponta para Railway; dev local usa `localhost:3000`.
