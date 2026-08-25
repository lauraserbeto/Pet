# BKG-2 — Fluxo de agendamento (front) parte 2 + TutorAppointments real

> Sprint 4 · Semana 9 (20–26/out) · Frontend · Prioridade Crítico · Esforço G · Responsável R3

## Contexto
O **BKG-1** entregou a seleção de serviço + pet + período, o total calculado e o envio da solicitação a partir de `HotelDetailsPage`/`WalkerDetailsPage`, com o ramo PRESENCIAL concluído. Falta fechar o ramo **PRE_PAGO** (pagamento antes da confirmação, apoiado no PAG-2) e trocar a tela de acompanhamento do tutor, que ainda é mock: `TutorAppointments.tsx:4-11` define `mockHotels`/`mockSitters` hardcoded e renderiza a partir deles. O tutor não vê seus agendamentos reais nem o status atual.

## Objetivo
Concluir o fluxo de agendamento no front (pagamento conforme `payment_policy` + confirmação) e ligar `TutorAppointments` aos agendamentos **reais** do tutor, exibindo status atualizado; remover os mocks.

## Escopo / Passos
1. **Fechar o ramo PRE_PAGO** do fluxo do BKG-1:
   - Após montar a solicitação, quando `payment_policy = PRE_PAGO`, conduzir o tutor à etapa de **pagamento simulado** (PAG-1/PAG-2); ao aprovar, o Appointment vai para `AGUARDANDO_CONFIRMACAO`.
   - Refletir na UI o status resultante (aguardando confirmação do parceiro) e o feedback de sucesso.
   - PRESENCIAL permanece como no BKG-1 (sem pagamento).
2. **TutorAppointments real:**
   - Remover `mockHotels`/`mockSitters` (`TutorAppointments.tsx:4-11`).
   - Consumir `appointmentService` (do BKG-1/SCH-1) para listar os agendamentos do tutor autenticado, nas duas abas (hotéis e sitters).
   - Exibir status real (`PENDENTE`, `AGUARDANDO_CONFIRMACAO`, `CONFIRMADO`, `CONCLUIDO`, `RECUSADO`, `CANCELADO`) com badges coerentes; mostrar pet, parceiro, período e valor.
   - Permitir cancelar quando aplicável (dispara estorno no backend se PRE_PAGO pago — PAG-2).
3. Tratar estados: loading (`HamsterLoader`), vazio, erro; hooks React Query com invalidação.

## Arquivos envolvidos
- `frontend/src/pages/HotelDetailsPage.tsx` e `WalkerDetailsPage.tsx` (etapa de pagamento PRE_PAGO)
- `frontend/src/pages/tutor/TutorAppointments.tsx` (remover mock ~4-11; dados reais)
- `frontend/src/lib/services/appointmentService.ts` (listagem do tutor + cancelar — estende BKG-1)
- `frontend/src/lib/hooks/` (ex.: `useTutorAppointments`, `useCancelAppointment`)

## Dependências
- **Depende de:** BKG-1 (seleção + envio; serviço/hook base) — e PAG-2 para o pagamento/estorno.
- **Bloqueia:** fecha a Definition of Done do marco M4 no lado do tutor.

## Critério de aceite (Definition of Done)
- Tutor **conclui** um agendamento: PRE_PAGO paga antes (→ `AGUARDANDO_CONFIRMACAO`); PRESENCIAL sem pagamento.
- `TutorAppointments` mostra **dados reais** com status atual nas abas de hotéis e sitters.
- Mocks `mockHotels`/`mockSitters` **removidos**.
- Cancelamento (quando permitido) reflete o novo status; se PRE_PAGO pago, o backend estorna.
- Estados de loading/vazio/erro tratados.

## Testes
- Manual: agendar hotel PRE_PAGO → paga → aparece em TutorAppointments como `AGUARDANDO_CONFIRMACAO`.
- Manual: agendar sitter PRESENCIAL → aparece como `PENDENTE`/`CONFIRMADO` sem etapa de pagamento.
- Parceiro confirma (via SCH-2) → status muda para `CONFIRMADO` na visão do tutor.
- Cancelar PRE_PAGO pago → status `CANCELADO`; estorno disparado no backend.
- Lista vazia e erro de rede tratados.

## Notas técnicas / armadilhas
- Pagamento é **SIMULADO** — não integrar gateway real; Mercado Pago sandbox é opcional.
- `total_price`/tarifas podem vir como string (Decimal) — converter antes de exibir.
- Ler a `payment_policy` real do parceiro; não assumir default no front.
- Reaproveitar `appointmentService` já criado em BKG-1/SCH-1 em vez de duplicar chamadas.
- `frontend/.env.local` → Railway; dev local `localhost:3000`. Não commitar direto na `main` — Pull Request.
