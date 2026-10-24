# BKG-1 — Fluxo de agendamento (front) parte 1

> Sprint 4 · Semana 8 (13–19/out) · Frontend · Prioridade Crítico · Esforço G · Responsável R3

> **Atualizada em 23/10/2026** conforme as decisões DEC-A, DEC-B e DEC-D da Fase 0 de estabilização (`PLANO-DESENVOLVIMENTO.md` §3). Mudanças principais: o total usa o **preço do serviço escolhido**; o PRESENCIAL fica `PENDENTE` até o parceiro confirmar; só parceiros operacionais recebem agendamento.

## Contexto
Os botões de reserva/agendamento são **placebos**: `HotelDetailsPage.tsx:531` ("Reservar agora") e `WalkerDetailsPage.tsx:502` ("Agendar agora") têm `onClick={() => {}}`. O tutor não consegue montar nem enviar um agendamento pela interface, apesar de os endpoints de Appointment (AGD-2) e o pagamento simulado com política (PAG-1/PAG-2) já existirem no backend. Falta a jornada do front: escolher serviço + pet + período, calcular o total e disparar o checkout conforme a `payment_policy` do parceiro.

## Objetivo
Implementar a **parte 1** do fluxo de agendamento no front: a partir das páginas de detalhe de hotel e sitter, o tutor seleciona serviço, pet e período, vê o **total calculado** e envia a solicitação de agendamento, com checkout condicional à `payment_policy` (PRESENCIAL confirma direto; PRE_PAGO segue para pagamento — conclusão do fluxo fica no BKG-2).

## Escopo / Passos
1. Criar `frontend/src/lib/services/appointmentService.ts` sobre `httpClient`/`getHeaders`, cobrindo criar agendamento e listar pets/serviços necessários (endpoints do AGD-2).
2. Criar hook React Query em `frontend/src/lib/hooks/` (ex.: `useCreateAppointment`) com mutation e invalidação de cache.
3. Substituir os `onClick={() => {}}` por um fluxo de seleção (modal/drawer ou etapa na página):
   - Escolha do **serviço** do parceiro; escolha do **pet** do tutor (reusar `usePets`/`petService`); escolha do **período** (datas para hotel = diárias; data/horário para sitter = horas).
   - Exibir a **prévia do total** a partir do **preço do serviço escolhido** (`Service.price`) × período: diárias para hotel, horas para sitter, hora iniciada conta inteira (DEC-B; mesmas regras de arredondamento da AGD-1). O valor definitivo é o `total_price` devolvido pelo backend; se divergir da prévia, prevalece o do backend.
4. Enviar a solicitação. O agendamento é criado em `PENDENTE` (DEC-A). O próximo passo depende da `payment_policy`:
   - **PRESENCIAL:** "Solicitação enviada — aguardando confirmação do parceiro" (status `PENDENTE`). Não informar que está confirmado.
   - **PRE_PAGO:** encaminhar para o pagamento simulado (etapa finalizada no BKG-2). Sem pagamento, o agendamento continua `PENDENTE`.
5. Tratar estados: loading/erro/sucesso, validação de campos (pet e período obrigatórios), `HamsterLoader`.

## Arquivos envolvidos
- `frontend/src/pages/HotelDetailsPage.tsx` (botão "Reservar agora" ~531)
- `frontend/src/pages/WalkerDetailsPage.tsx` (botão "Agendar agora" ~502)
- `frontend/src/lib/services/appointmentService.ts` (novo)
- `frontend/src/lib/hooks/useCreateAppointment.ts` (novo)
- `frontend/src/lib/services/petService.ts` e `providerService.ts` (consumo de pets e dos serviços do parceiro com preço)
- `frontend/src/components/` (modal/drawer de seleção, se criado)

## Dependências
- **Depende de:** AGD-2 (endpoints de Appointment) ajustado pelo item **E-04** da estabilização (estado inicial `PENDENTE`, preço pelo serviço, parceiro operacional) — e, para o ramo PRE_PAGO, PAG-2.
- **Bloqueia:** BKG-2 (conclusão do fluxo: pagamento conforme política + confirmação + `TutorAppointments` real).

## Critério de aceite (Definition of Done)
- Tutor monta um agendamento (serviço + pet + período) e **envia** a solicitação a partir de HotelDetailsPage e WalkerDetailsPage.
- **Prévia do total** exibida antes do envio, calculada pelo **preço do serviço escolhido** (diária para hotel, hora para sitter); após o envio, a tela usa o `total_price` do backend.
- Checkout **condicional à `payment_policy`**: no PRESENCIAL, a solicitação fica `PENDENTE`, aguardando o parceiro, com mensagem honesta; no PRE_PAGO, o tutor é encaminhado para o pagamento.
- Parceiro não operacional (backend responde 403/422) → mensagem clara, sem travar a tela.
- Estados de loading/erro/sucesso tratados; campos obrigatórios validados.
- Nenhum botão de agendar continua como `onClick={() => {}}`.

## Testes
- Manual: reservar hotel (2 diárias) no serviço de R$ X/diária → prévia = X × 2; enviar → `PENDENTE` com "aguardando confirmação" (PRESENCIAL) ou encaminha para pagamento (PRE_PAGO).
- Manual: agendar sitter (1h30) no serviço de R$ Y/hora → prévia = Y × 2 (hora iniciada conta inteira); enviar.
- Hotel com dois serviços de preços diferentes → a prévia muda conforme o serviço escolhido.
- Sem pet cadastrado ou período inválido (passado, fim antes do início) → bloqueio com mensagem clara.
- Erro de rede na criação → estado de erro visível, sem travar a UI.

## Notas técnicas / armadilhas
- `payment_policy` vem do parceiro (backend). Não assumir default no front sem ler o valor real; a política que vale para o agendamento é a gravada nele, devolvida pelo backend.
- Preços podem chegar como string (`Prisma.Decimal` serializado) — converter antes de calcular a prévia. A tarifa geral do parceiro (`daily_rate`/`hourly_rate`) **não** é a base do valor (DEC-B).
- `frontend/.env.local` aponta para Railway; dev local usa `localhost:3000`.
- Reusar `usePets`/`petService` existentes em vez de refazer busca de pets.
- Não commitar direto na `main` — Pull Request com revisão.
