# SCH-1 — Schedule do parceiro real (parte 1)

> Sprint 4 · Semana 8 (13–19/out) · Frontend · Prioridade Alta · Esforço M · Responsável R4

## Contexto
A agenda do parceiro é **100% mock**: `frontend/src/pages/dashboard/Schedule.tsx:44` declara `appointmentsData` fixo (Rex/Luna/Thor com horários e status hardcoded) e o componente renderiza a partir desse array. Os Appointments reais já existem no backend (schema `Appointment` ~279-297) e são expostos pelo AGD-2, mas o parceiro não os vê nem age sobre eles. Esta é a **parte 1**: exibir a agenda real e permitir confirmar/recusar (o ciclo completo — concluir, visões dia/semana, estados — fica no SCH-2).

## Objetivo
Trocar o mock de `Schedule.tsx` pela **agenda real** de Appointments do parceiro autenticado, permitindo **confirmar** e **recusar** cada agendamento a partir da tela.

## Escopo / Passos
1. Criar/estender `frontend/src/lib/services/appointmentService.ts` com listagem de agendamentos do parceiro e transições `confirmar`/`recusar` (endpoints AGD-2/PAG-2).
2. Criar hooks React Query em `frontend/src/lib/hooks/` (ex.: `usePartnerAppointments`, `useUpdateAppointmentStatus`) com invalidação após mutação.
3. Em `Schedule.tsx`:
   - Remover `appointmentsData` mock e o tipo local acoplado ao mock; mapear os campos reais (pet, serviço, `start_time`/`end_time`, `status`, `total_price`).
   - Renderizar a lista/grade a partir dos dados reais.
   - Ações **Confirmar** e **Recusar** por agendamento, chamando a mutation e refletindo o novo status.
4. Tratar estados básicos: loading (`HamsterLoader`), lista vazia e erro (os refinamentos avançados de estado e visão por dia/semana ficam no SCH-2).
5. Mapear os status do backend (`PENDENTE`, `AGUARDANDO_CONFIRMACAO`, `CONFIRMADO`, `CONCLUIDO`, `RECUSADO`, `CANCELADO`) para os badges/cores da UI.

## Arquivos envolvidos
- `frontend/src/pages/dashboard/Schedule.tsx` (remover mock ~44; ligar a dados reais)
- `frontend/src/lib/services/appointmentService.ts` (novo/estendido — compartilhado com BKG-1)
- `frontend/src/lib/hooks/usePartnerAppointments.ts` e `useUpdateAppointmentStatus.ts` (novos)

## Dependências
- **Depende de:** AGD-2 (listagem e transição de status de Appointment).
- **Bloqueia:** SCH-2 (parte 2: concluir, estados completos, visão dia/semana).

## Critério de aceite (Definition of Done)
- O parceiro vê seus **agendamentos reais** na agenda (sem dados hardcoded).
- É possível **confirmar** e **recusar** um agendamento pela tela, com o status atualizando.
- `appointmentsData` mock **removido** de `Schedule.tsx`.
- Estados de loading, vazio e erro presentes (versão básica).

## Testes
- Manual: parceiro com agendamentos vê a lista real; sem agendamentos → estado vazio.
- Confirmar um `PENDENTE`/`AGUARDANDO_CONFIRMACAO` → vira `CONFIRMADO` na UI.
- Recusar → vira `RECUSADO` (e, se PRE_PAGO pago, o backend PAG-2 estorna).
- Erro na mutation → mensagem de erro, sem perder o estado da tela.

## Notas técnicas / armadilhas
- O tipo `Appointment` local em `Schedule.tsx` (id numérico, campos `owner`/`color`) é do mock — substituir pelo shape real (ids UUID, `start_time` ISO, `total_price` possivelmente string do Decimal).
- Converter `total_price` string→número antes de exibir.
- Recusar de agendamento PRE_PAGO dispara estorno no backend (PAG-2); no front basta refletir o status retornado.
- `frontend/.env.local` → Railway; dev local `localhost:3000`.
- Não commitar direto na `main` — Pull Request.
