# BKG-1 — Fluxo de agendamento (front) parte 1

> Sprint 4 · Semana 8 (13–19/out) · Frontend · Prioridade Crítico · Esforço G · Responsável R3

## Contexto
Os botões de reserva/agendamento são **placebos**: `HotelDetailsPage.tsx:531` ("Reservar agora") e `WalkerDetailsPage.tsx:502` ("Agendar agora") têm `onClick={() => {}}`. O tutor não consegue montar nem enviar um agendamento pela interface, apesar de os endpoints de Appointment (AGD-2) e o pagamento simulado com política (PAG-1/PAG-2) já existirem no backend. Falta a jornada do front: escolher serviço + pet + período, calcular o total e disparar o checkout conforme a `payment_policy` do parceiro.

## Objetivo
Implementar a **parte 1** do fluxo de agendamento no front: a partir das páginas de detalhe de hotel e sitter, o tutor seleciona serviço, pet e período, vê o **total calculado** e envia a solicitação de agendamento, com checkout condicional à `payment_policy` (PRESENCIAL confirma direto; PRE_PAGO segue para pagamento — conclusão do fluxo fica no BKG-2).

## Escopo / Passos
1. Criar `frontend/src/lib/services/appointmentService.ts` sobre `httpClient`/`getHeaders`, cobrindo criar agendamento e listar pets/serviços necessários (endpoints do AGD-2).
2. Criar hook React Query em `frontend/src/lib/hooks/` (ex.: `useCreateAppointment`) com mutation e invalidação de cache.
3. Substituir os `onClick={() => {}}` por um fluxo de seleção (modal/drawer ou etapa na página):
   - Escolha do **serviço** do parceiro; escolha do **pet** do tutor (reusar `usePets`/`petService`); escolha do **período** (datas para hotel = diárias; data/horário para sitter = visita/hora).
   - Calcular o **total** no front a partir da tarifa (`daily_rate` para hotel, `hourly_rate` para sitter) × período — refletindo a cobrança (hotel por diária, sitter por visita/hora).
4. Enviar a solicitação; ler a `payment_policy` do parceiro para decidir o próximo passo:
   - **PRESENCIAL:** solicitação enviada → feedback de sucesso.
   - **PRE_PAGO:** encaminhar para pagamento (a tela/etapa de pagamento é finalizada no BKG-2).
5. Tratar estados: loading/erro/sucesso, validação de campos (pet e período obrigatórios), `HamsterLoader`.

## Arquivos envolvidos
- `frontend/src/pages/HotelDetailsPage.tsx` (botão "Reservar agora" ~531)
- `frontend/src/pages/WalkerDetailsPage.tsx` (botão "Agendar agora" ~502)
- `frontend/src/lib/services/appointmentService.ts` (novo)
- `frontend/src/lib/hooks/useCreateAppointment.ts` (novo)
- `frontend/src/lib/services/petService.ts` e `providerService.ts` (consumo de pets e detalhes/tarifas do parceiro)
- `frontend/src/components/` (modal/drawer de seleção, se criado)

## Dependências
- **Depende de:** AGD-2 (endpoints de Appointment) — e, para o ramo PRE_PAGO, PAG-2.
- **Bloqueia:** BKG-2 (conclusão do fluxo: pagamento conforme política + confirmação + `TutorAppointments` real).

## Critério de aceite (Definition of Done)
- Tutor monta um agendamento (serviço + pet + período) e **envia** a solicitação a partir de HotelDetailsPage e WalkerDetailsPage.
- **Total calculado** e exibido antes do envio (diária para hotel, visita/hora para sitter).
- Checkout **condicional à `payment_policy`**: PRESENCIAL conclui a solicitação; PRE_PAGO encaminha para pagamento.
- Estados de loading/erro/sucesso tratados; campos obrigatórios validados.
- Nenhum botão de agendar continua como `onClick={() => {}}`.

## Testes
- Manual: reservar hotel (2 diárias) → total = `daily_rate × 2`; enviar → sucesso (PRESENCIAL) / encaminha pagamento (PRE_PAGO).
- Manual: agendar sitter (1h30) → total coerente com `hourly_rate`; enviar.
- Sem pet cadastrado ou período inválido → bloqueio com mensagem clara.
- Erro de rede na criação → estado de erro visível, sem travar a UI.

## Notas técnicas / armadilhas
- `payment_policy` vem do parceiro (backend PAG-2). Não assumir default no front sem ler o valor real.
- Números de tarifa podem chegar como string (`Prisma.Decimal` serializado) — converter antes de calcular o total (ver `providerService.ts` `hourly_rate?: number | string`).
- `frontend/.env.local` aponta para Railway; dev local usa `localhost:3000`.
- Reusar `usePets`/`petService` existentes em vez de refazer busca de pets.
- Não commitar direto na `main` — Pull Request com revisão.
