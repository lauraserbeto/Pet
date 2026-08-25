# SCH-2 — Schedule do parceiro (parte 2)

> Sprint 4 · Semana 9 (20–26/out) · Frontend · Prioridade Alta · Esforço M · Responsável R4

## Contexto
O **SCH-1** já trocou o mock de `frontend/src/pages/dashboard/Schedule.tsx` pela agenda real e habilitou **confirmar/recusar**. Falta completar o ciclo de vida do agendamento pela agenda: **concluir** um atendimento, refinar todos os **estados** (loading/vazio/erro) e tornar a **visão por dia/semana** coerente com os dados reais (o `Schedule.tsx` já tem estrutura de calendário e slots de horário, antes alimentada por mock).

## Objetivo
Completar a gestão do agendamento pela agenda do parceiro: além de confirmar/recusar (SCH-1), permitir **concluir** (`CONCLUIDO`), tratar todos os estados de carregamento/vazio/erro e apresentar uma visão por dia/semana consistente com os Appointments reais.

## Escopo / Passos
1. Adicionar a ação **Concluir** (`CONFIRMADO → CONCLUIDO`) à agenda, via `useUpdateAppointmentStatus` (SCH-1), com invalidação de cache.
2. Refinar estados:
   - **loading** com `HamsterLoader` nas transições e na carga;
   - **vazio** por período (dia/semana sem agendamentos);
   - **erro** com mensagem e possibilidade de retry, sem perder o contexto da tela.
3. Tornar a **visão por dia/semana** coerente: mapear `start_time`/`end_time` reais para os slots do calendário existente; navegação entre dias/semana (os controles `ChevronLeft/Right` já existem) filtrando os agendamentos do período.
4. Badges/cores por status alinhados ao fluxo (`PENDENTE`, `AGUARDANDO_CONFIRMACAO`, `CONFIRMADO`, `CONCLUIDO`, `RECUSADO`, `CANCELADO`).
5. Garantir que ações inválidas para o status atual fiquem desabilitadas (ex.: não "concluir" um `PENDENTE`).

## Arquivos envolvidos
- `frontend/src/pages/dashboard/Schedule.tsx` (concluir + estados + visão dia/semana)
- `frontend/src/lib/services/appointmentService.ts` (transição `concluir`, se ainda não coberta)
- `frontend/src/lib/hooks/useUpdateAppointmentStatus.ts` (estende SCH-1)

## Dependências
- **Depende de:** SCH-1 (agenda real + confirmar/recusar).
- **Bloqueia:** fecha a Definition of Done do marco M4 no lado do parceiro.

## Critério de aceite (Definition of Done)
- Parceiro **gerencia o ciclo completo** pela agenda: confirmar, recusar e **concluir**.
- Estados **loading/vazio/erro** tratados em todas as ações e na carga.
- Visão por **dia/semana** coerente com os horários reais dos Appointments; navegação funciona.
- Ações inválidas para o status atual ficam indisponíveis.

## Testes
- Confirmar → Concluir um agendamento: transições refletidas na UI e persistidas.
- Semana sem agendamentos → estado vazio claro; navegar entre dias/semana filtra corretamente.
- Erro na transição → mensagem + retry, sem quebrar a agenda.
- Botão "Concluir" desabilitado para status não elegíveis.

## Notas técnicas / armadilhas
- Só é possível avaliar após `CONCLUIDO` (regra de negócio das avaliações) — concluir corretamente aqui é o que habilita reviews no Sprint 5.
- `start_time`/`end_time` chegam como ISO (UTC/timestamptz) — cuidar de timezone ao encaixar nos slots (usar `date-fns`/`ptBR` já importados).
- `total_price` string (Decimal) → converter ao exibir.
- Reusar os hooks/serviço do SCH-1; não duplicar mutations.
- `frontend/.env.local` → Railway; dev local `localhost:3000`. Não commitar direto na `main` — Pull Request.
