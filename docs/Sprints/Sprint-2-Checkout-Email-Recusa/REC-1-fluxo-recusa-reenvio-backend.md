# REC-1 — Fluxo recusa/reenvio (backend)

> Sprint 2 · Semana 5 (22–28/set) · Backend · Prioridade Alta · Esforço M · Responsável R2

## Contexto
Hoje o admin recusa um parceiro em `ProviderController.updateStatus` (`:272-290`), que já
grava `status` e `rejection_reason` — mas **nada é comunicado ao parceiro** e não há
caminho de correção. Falta: disparar e-mail com o motivo e link para a tela de correção
(REC-2), um endpoint de reenvio que devolva o cadastro à fila, e distinção no painel do
admin entre quem foi recusado e reenviou (`EM_REVISAO`) e quem nunca foi avaliado
(`PENDENTE`). Decisões alinhadas: `Provider.status` passa a usar
`PENDENTE/APROVADO/REJEITADO/EM_REVISAO`, onde `EM_REVISAO` = reenvio após recusa.

## Objetivo
Fechar o fluxo de recusa/reenvio no backend: ao recusar, gravar `rejection_reason` +
`REJEITADO` e enviar e-mail (via `EmailService`) com o motivo e link para a tela de
correção; criar endpoint de reenvio que move o status para `EM_REVISAO`; e garantir que o
painel do admin diferencie `EM_REVISAO` de `PENDENTE`.

## Escopo / Passos
1. Em `ProviderController.updateStatus:272-290`, ao definir `status = REJEITADO`: exigir/validar `rejection_reason`, persistir e disparar `EmailService.sendRejection(user.email, { reason, correctionUrl })`.
2. Montar o link de correção como `${FRONTEND_URL}/<rota-de-correcao>` (rota definida em REC-2), levando ao cadastro do parceiro logado.
3. Criar endpoint de reenvio (ex.: `POST /providers/me/resubmit`) que valida que o parceiro está `REJEITADO`, aplica as correções e move o status para `EM_REVISAO`.
4. Padronizar os valores de status em `constants/providerStatus.js` incluindo `EM_REVISAO` (hoje há `PENDENTE/APROVADO/REJEITADO`).
5. Garantir que a listagem do admin (`listPartners`) exponha `status` de forma que o painel distinga `EM_REVISAO` de `PENDENTE` (o painel já consome esse endpoint).
6. Extrair o e-mail de recusa como template do `EmailService` (reuso do serviço da EML-1).

## Arquivos envolvidos
- `backend/src/controllers/ProviderController.js:272-290` — recusa grava motivo + dispara e-mail.
- `backend/src/controllers/ProviderController.js` — novo handler de reenvio (`resubmit` → `EM_REVISAO`).
- `backend/src/routes/providerRoutes.js` — rota de reenvio autenticada.
- `backend/src/services/EmailService.js` — template `sendRejection` (criado em EML-1).
- `backend/src/constants/providerStatus.js:7-11` — incluir `EM_REVISAO`.

## Dependências (Depende de / Bloqueia)
- Depende de: **EML-1** (`EmailService` reutilizável) e **STA-1** (padronização dos status do Provider).
- Bloqueia: **REC-2** (tela de correção usa o link do e-mail e o endpoint de reenvio).

## Critério de aceite (Definition of Done)
- [ ] Recusar um parceiro grava `rejection_reason` + `status = REJEITADO` e envia e-mail com o motivo e link de correção.
- [ ] Recusar sem `rejection_reason` é rejeitado (validação) — não envia e-mail vazio.
- [ ] Endpoint de reenvio move o cadastro de `REJEITADO` para `EM_REVISAO` após correção.
- [ ] O painel do admin distingue `EM_REVISAO` de `PENDENTE`.
- [ ] Reenvio só é permitido ao próprio parceiro autenticado e apenas a partir de `REJEITADO`.

## Testes
- Recusar com motivo → status `REJEITADO`, `rejection_reason` salvo, e-mail disparado (mock do `EmailService`).
- Recusar sem motivo → 400/validação, sem envio.
- Reenvio a partir de `REJEITADO` → `EM_REVISAO`; reenvio a partir de outro status → bloqueado.
- Listagem admin retorna `EM_REVISAO` distinto de `PENDENTE`.
- Rodar `npm test` no `backend/` (`node --test`), mockando o `EmailService`.

## Notas técnicas / armadilhas
- `Provider.status` é VarChar livre; usar as constantes de `providerStatus.js` para não espalhar strings mágicas, e lembrar que "aprovado" é testado por CONJUNTO (`APPROVED_PROVIDER_STATUSES`).
- Não vazar `document`/`password_hash` nas respostas de provider/user; usar `select` explícito.
- Falha no envio de e-mail não deve reverter a recusa já persistida; logar via pino e seguir (o admin pode reenviar o e-mail depois).
- Reaproveitar o campo `rejection_reason` do `Provider` (`schema.prisma:71`) — há também um em `User`, não confundir.
- Erros via `next(AppError)` + errorHandler central; validação com Zod.
