# PAG-2 — Pagamento no agendamento PRE_PAGO + estorno

> Sprint 4 · Semana 8 (13–19/out) · Backend · Prioridade Crítico · Esforço M · Responsável R1

## Contexto
O agendamento de serviços (Appointment) já existe no schema (`backend/prisma/schema.prisma:279-297`), e os endpoints de criar/listar/transição de status vêm do **AGD-2** (herdado). O pagamento **SIMULADO** vem do **PAG-1**: um pagamento que apenas registra a intenção/aprovação, sem gateway real (decisão de negócio 7). Falta amarrar os dois: hoje o Appointment vai direto a confirmação sem passar por cobrança, e não há estorno quando um agendamento pré-pago é recusado ou cancelado. A política de pagamento do parceiro (`payment_policy`: `PRESENCIAL` padrão, `PRE_PAGO`) decide o caminho.

## Objetivo
Fazer o fluxo de agendamento respeitar a `payment_policy`: **PRE_PAGO** cobra (via pagamento simulado do PAG-1) **antes** da confirmação, deixando o Appointment em `AGUARDANDO_CONFIRMACAO`; **PRESENCIAL** confirma sem passar por pagamento. Recusa ou cancelamento de um agendamento pré-pago dispara **estorno** (reversão do pagamento simulado).

## Escopo / Passos
1. Garantir que o parceiro tenha `payment_policy` (`PRESENCIAL` | `PRE_PAGO`, default `PRESENCIAL`) — se ainda não existir no schema, adicionar campo + migração (dado herdado do AGD-2; confirmar antes de duplicar).
2. No use case de criação/confirmação de agendamento (AGD-2), ramificar por política:
   - **PRESENCIAL:** Appointment segue `PENDENTE → CONFIRMADO` sem cobrança.
   - **PRE_PAGO:** criar o pagamento simulado (PAG-1) vinculado ao Appointment; ao aprovar, mover para `AGUARDANDO_CONFIRMACAO`; só então o parceiro pode `CONFIRMADO`.
3. Criar/estender `backend/src/useCases/services/` com a lógica de estorno: em `RECUSADO`/`CANCELADO` de um Appointment PRE_PAGO já pago, reverter o pagamento simulado (marcar `ESTORNADO`/`REEMBOLSADO`) dentro de `prisma.$transaction` junto com a transição de status.
4. Expor a mudança nos endpoints de transição (confirmar/recusar/cancelar) já existentes do AGD-2, sem quebrar contrato.
5. Cálculo do valor cobrado coerente com a cobrança: **hotel por diária**, **sitter por visita/hora** (decisão de negócio 4) — reaproveitar `total_price` do Appointment.

## Arquivos envolvidos
- `backend/src/useCases/services/` (lógica de confirmação/estorno do agendamento — estender AGD-2/PAG-1)
- `backend/src/controllers/` (controller de Appointment/serviços do AGD-2)
- `backend/src/routes/` (rotas de transição de status do AGD-2)
- `backend/prisma/schema.prisma` (`Appointment` ~279-297; campo `payment_policy` no `Provider` ~49-83 se ainda não existir; modelo de pagamento do PAG-1)
- `backend/prisma/migrations/` (migração se houver ajuste de schema)

## Dependências
- **Depende de:** AGD-2 (endpoints de Appointment) e PAG-1 (pagamento simulado).
- **Bloqueia:** BKG-1/BKG-2 (o front consome o checkout condicional à política) e a Definition of Done do marco M4.

## Critério de aceite (Definition of Done)
- Agendamento **PRE_PAGO** exige pagamento **antes** de confirmar: sem pagamento aprovado, não passa de `AGUARDANDO_CONFIRMACAO`.
- Agendamento **PRESENCIAL** confirma **sem** passar por pagamento.
- **Recusa** ou **cancelamento** de agendamento PRE_PAGO já pago dispara **estorno** (pagamento simulado revertido), atômico com a transição de status.
- Nenhum caminho deixa Appointment `CONFIRMADO` sem pagamento quando a política é PRE_PAGO.

## Testes
- PRE_PAGO happy-path: cria → paga (simulado) → `AGUARDANDO_CONFIRMACAO` → parceiro confirma → `CONFIRMADO`.
- PRE_PAGO recusado após pago → status `RECUSADO` + pagamento `ESTORNADO`, tudo revertido junto.
- PRE_PAGO cancelado pelo tutor após pago → `CANCELADO` + estorno.
- PRESENCIAL → confirma direto, sem registro de pagamento nem estorno.
- Falha no meio da transação (ex.: erro ao estornar) → rollback total (status e pagamento intactos).

## Notas técnicas / armadilhas
- Usar **`prisma.$transaction`** para transição de status + estorno numa operação atômica.
- `Prisma.Decimal` → `Number()` ao serializar valores; congelar `total_price` do Appointment.
- Pagamento é **SIMULADO** (PAG-1): estorno é reversão de registro, não chamada a gateway. Mercado Pago sandbox é opcional e não bloqueia esta task.
- Erros sempre via `next(AppError)`; não vazar `password_hash`/`document` ao incluir dados de parceiro/cliente na resposta.
- Idempotência: evitar cobrar duas vezes o mesmo Appointment ou estornar um pagamento já estornado — checar estado antes de transicionar.
