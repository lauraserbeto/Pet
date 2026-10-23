# PAG-2 — Pagamento no agendamento PRE_PAGO + estorno

> Sprint 4 · Semana 8 (13–19/out) · Backend · Prioridade Crítico · Esforço M · Responsável R1

> **Atualizada em 23/10/2026** conforme as decisões DEC-A e DEC-B da Fase 0 de estabilização (`PLANO-DESENVOLVIMENTO.md` §3; `PAUTA-FASE-0-DECISOES-ESTABILIZACAO.md`). Pré-requisito novo: item **E-04** do plano de estabilização.

## Contexto
O agendamento de serviços (Appointment) já existe no schema (`backend/prisma/schema.prisma:279-297`), e os endpoints de criar/listar/transição de status vêm do **AGD-2** (herdado). O pagamento **SIMULADO** vem do **PAG-1**: um pagamento que apenas registra a intenção/aprovação, sem gateway real (decisão de negócio 7).

Falta amarrar os dois. Hoje o AGD-2 cria o agendamento PRESENCIAL já `CONFIRMADO` e o PRE_PAGO já `AGUARDANDO_CONFIRMACAO`, sem cobrança. O "estorno" só aparece na resposta e não é gravado. A política de pagamento (`payment_policy`: `PRESENCIAL` padrão, `PRE_PAGO`) decide o caminho.

**Fronteira com a estabilização.** O item **E-04** (auditoria, seção 10) corrige o que vem antes desta task:
- estado inicial `PENDENTE`;
- política gravada no agendamento;
- preço pelo serviço reservado;
- quem pode fazer cada transição;
- validações de data e parceiro.

Esta task acrescenta o **pagamento simulado do agendamento** e o **estorno persistido**.

## Objetivo
Fazer o fluxo de agendamento respeitar a `payment_policy` gravada no agendamento.
- **PRE_PAGO:** o tutor paga (pagamento simulado) **antes** da confirmação. O pagamento aprovado é o **único** caminho de `PENDENTE` para `AGUARDANDO_CONFIRMACAO`.
- **PRESENCIAL:** o parceiro confirma ou recusa sem pagamento.
- Recusa ou cancelamento de um agendamento pré-pago já pago dispara **estorno integral** persistido.

## Escopo / Passos
1. **Confirmar o pré-requisito (E-04):** o Appointment nasce `PENDENTE` em qualquer política, guarda a `payment_policy` vigente na reserva e tem `total_price` calculado pelo **preço do serviço** × unidades (DEC-B). A `payment_policy` do `Provider` já existe (AGD-1); não duplicar.
2. **Pagamento simulado do agendamento (PRE_PAGO):** endpoint dedicado (ex.: `POST /api/v1/appointments/:id/pay`).
   - Só o **tutor dono** do pet paga, e só um agendamento PRE_PAGO em `PENDENTE`.
   - O endpoint registra o pagamento aprovado e move para `AGUARDANDO_CONFIRMACAO`, **na mesma transação**.
   - É idempotente: pagar de novo não cria segunda cobrança.
3. **Bloquear atalhos:** `PATCH /appointments/:id/status` não aceita `AGUARDANDO_CONFIRMACAO`. O parceiro não confirma nem recusa um PRE_PAGO ainda `PENDENTE` (não pago).
4. **Estorno:** em `RECUSADO` (parceiro, a partir de `AGUARDANDO_CONFIRMACAO`) ou `CANCELADO` (antes do início) de um agendamento PRE_PAGO já pago:
   - marcar o pagamento como estornado (ex.: `ESTORNADO`), com valor integral, dentro de `prisma.$transaction` junto com a transição de status;
   - decidir o estorno pela **política gravada no agendamento**, não pela política atual do parceiro;
   - devolver o estado do pagamento nas consultas do agendamento.
5. **Modelo de pagamento do agendamento:** registro próprio vinculado ao Appointment, com valor congelado, status, datas de pagamento e estorno. Não reaproveitar o `PaymentAttempt`, que é 1:1 com `Order`.
6. Valor cobrado = `total_price` do Appointment (preço do serviço × diárias para hotel ou horas para sitter).

## Arquivos envolvidos
- `backend/src/useCases/appointments/` (pagamento e estorno do agendamento; estende os use cases do AGD-2)
- `backend/src/controllers/AppointmentController.js` e `backend/src/routes/appointmentRoutes.js` (endpoint de pagamento; transições)
- `backend/src/schemas/appointmentSchemas.js` (validação dos parâmetros)
- `backend/prisma/schema.prisma` (`Appointment`; novo modelo de pagamento do agendamento)
- `backend/prisma/migrations/` (migration nova; nunca editar migration já aplicada)

## Dependências
- **Depende de:** AGD-2 (endpoints de Appointment), PAG-1 (pagamento simulado) e **E-04** da estabilização (estado inicial, política gravada e preço pelo serviço).
- **Bloqueia:** BKG-1/BKG-2 (o front consome o checkout condicional à política) e a Definition of Done do marco M4.

## Critério de aceite (Definition of Done)
- **PRE_PAGO:** sem pagamento aprovado, o agendamento fica em `PENDENTE`; o parceiro não consegue confirmar nem recusar; `AGUARDANDO_CONFIRMACAO` só é alcançado pelo pagamento.
- **PRESENCIAL:** o parceiro confirma ou recusa a partir de `PENDENTE`, **sem** pagamento.
- **Recusa** ou **cancelamento** de PRE_PAGO já pago dispara **estorno integral persistido**, atômico com a transição de status e consultável no agendamento.
- O estorno usa a política **gravada no agendamento**.
- Nenhum caminho deixa um PRE_PAGO `CONFIRMADO` sem pagamento.
- Pagamento e estorno são idempotentes.

## Testes
- PRE_PAGO happy-path: cria (`PENDENTE`) → paga (simulado) → `AGUARDANDO_CONFIRMACAO` → parceiro confirma → `CONFIRMADO`.
- PRE_PAGO não pago: o parceiro tenta confirmar ou recusar → 409/422; `PATCH` manual para `AGUARDANDO_CONFIRMACAO` → rejeitado.
- PRE_PAGO recusado após pago → status `RECUSADO` + pagamento `ESTORNADO`, tudo junto.
- PRE_PAGO cancelado pelo tutor após pago (antes do início) → `CANCELADO` + estorno.
- Pagar duas vezes o mesmo agendamento → um único pagamento; estornar duas vezes → um único estorno.
- O parceiro muda a política depois da reserva → o estorno segue a política gravada no agendamento.
- PRESENCIAL → confirma ou recusa sem registro de pagamento nem estorno.
- Falha no meio da transação (ex.: erro ao estornar) → rollback total (status e pagamento intactos).
- Tutor de outro pet tenta pagar → 403/404.

## Notas técnicas / armadilhas
- Usar **`prisma.$transaction`** para transição de status + estorno numa operação atômica.
- `Prisma.Decimal` → `Number()` ao serializar valores; congelar `total_price` do Appointment.
- Pagamento é **SIMULADO** (PAG-1): estorno é reversão de registro, não chamada a gateway. Mercado Pago sandbox é opcional e não bloqueia esta task.
- Erros sempre via `next(AppError)`; não vazar `password_hash`/`document` ao incluir dados de parceiro/cliente na resposta.
- Idempotência: evitar cobrar duas vezes o mesmo Appointment ou estornar um pagamento já estornado — checar estado antes de transicionar.
