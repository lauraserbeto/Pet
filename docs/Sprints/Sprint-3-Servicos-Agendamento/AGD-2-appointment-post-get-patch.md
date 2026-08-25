# AGD-2 — Appointment POST/GET/PATCH respeitando payment_policy (parte 2)

> Sprint 3 · Semana 6 (29/set–05/out) · Backend · Prioridade Crítico · Esforço G · Responsável R1

## Contexto
O modelo `Appointment` e o `AppointmentRepository` (`backend/src/repositories/AppointmentRepository.js`) já existem, mas são **código morto**: nenhuma rota os importa. O repositório já expõe `create`, `findByProviderId`, `findByCustomerId`, `findById` e `update` com os `include` corretos (pet→tutor, service, provider). A modelagem e migração do fluxo — incluindo o campo `payment_policy` no `Provider` e o alinhamento dos estados de `Appointment.status` — são de **AGD-1** (pré-requisito). Esta task expõe o fluxo ponta a ponta.

## Objetivo
Criar `appointmentRoutes` + `AppointmentController` + useCases que dão vida ao `AppointmentRepository`, permitindo ao tutor agendar um serviço e ao parceiro (hotel/sitter) gerir seus agendamentos, sempre respeitando a `payment_policy` do parceiro e a propriedade (ownership) dos dados.

## Escopo / Passos
1. **Criar agendamento** (`POST`) — tutor autenticado envia `service_id`, `pet_id`, `start_time`, `end_time`, `notes`. O useCase resolve o `provider_id` a partir do serviço, valida que o pet pertence ao tutor, calcula `total_price` (hotel = diária × nº diárias; sitter = valor da visita/hora) e define o status inicial pela política:
   - **PRESENCIAL** (padrão) → `CONFIRMADO` (confirma sem pagamento online).
   - **PRE_PAGO** → `AGUARDANDO_CONFIRMACAO` (paga antes; parceiro confirma depois).
2. **Listar** (`GET`) — dois recortes: agendamentos do tutor logado (`findByCustomerId(req.userId)`) e da agenda do parceiro logado (`findByProviderId`), cada um restrito ao dono.
3. **PATCH status** — transições válidas: parceiro `confirmar`/`recusar` (de `AGUARDANDO_CONFIRMACAO`), qualquer lado `cancelar`, parceiro `concluir` (de `CONFIRMADO` → `CONCLUIDO`). Recusa/cancelamento de PRE_PAGO dispara estorno (simulado; ver PGT-1/PAG-1).
4. Validar transições permitidas por estado; bloquear saltos inválidos com `AppError`.
5. Registrar rotas em `app.js` sob `/api/v1/appointments` com `authMiddleware`.

## Arquivos envolvidos
- `backend/src/routes/appointmentRoutes.js` (novo)
- `backend/src/controllers/AppointmentController.js` (novo)
- `backend/src/useCases/appointments/CreateAppointmentUseCase.js` (novo)
- `backend/src/useCases/appointments/ListAppointmentsUseCase.js` (novo)
- `backend/src/useCases/appointments/UpdateAppointmentStatusUseCase.js` (novo)
- `backend/src/repositories/AppointmentRepository.js` (existente — usar; hoje morto)
- `backend/src/app.js` (registrar rota)
- `backend/prisma/schema.prisma` (referência: `Appointment`, `Service`, `Provider.payment_policy`)

## Dependências
- **Depende de:** AGD-1 (modelagem/migração: `payment_policy` no `Provider`, estados de `Appointment.status` alinhados ao negócio).
- **Bloqueia:** consumo de agendamento no frontend em sprints futuras; usa serviços criados em SRV-1.

## Critério de aceite (Definition of Done)
- Tutor cria agendamento; PRESENCIAL nasce `CONFIRMADO` e PRE_PAGO nasce `AGUARDANDO_CONFIRMACAO`.
- Tutor lista só os próprios agendamentos; parceiro lista só a própria agenda (ownership respeitado).
- Parceiro confirma/recusa/conclui e ambos cancelam conforme transições válidas; saltos inválidos retornam erro.
- Recusa/cancelamento de PRE_PAGO marca estorno.
- Nenhuma resposta vaza `password_hash`/`document` do tutor ou do parceiro incluído.

## Testes
- Integração: POST com política PRESENCIAL → `CONFIRMADO`; com PRE_PAGO → `AGUARDANDO_CONFIRMACAO`.
- Ownership: tutor A não vê/edita agendamento do tutor B; parceiro só vê a própria agenda.
- Transições: confirmar/recusar só a partir de `AGUARDANDO_CONFIRMACAO`; concluir só a partir de `CONFIRMADO`; transição inválida → 4xx.
- Serialização: `total_price` numérico; sem campos sensíveis no payload.

## Notas técnicas / armadilhas
- **`Appointment.status` no schema tem default `PENDING` (inglês)**; o negócio usa `PENDENTE → AGUARDANDO_CONFIRMACAO → CONFIRMADO → CONCLUIDO` e `RECUSADO/CANCELADO`. Confirmar com AGD-1 que a migração alinhou os valores; não misturar idiomas.
- Prisma `Decimal` (`total_price`, `price`, `daily_rate`, `hourly_rate`) → converter com `Number()` na saída.
- `req.userId`/`req.userRole` vêm do `authMiddleware` (role: 3=HOTEL, 4=PET_SITTER, 5=TUTOR).
- Erros via `next(AppError)` + errorHandler central; validar body com Zod.
