# QA-3 — E2E (parte 2) + a11y/responsividade + checklist de release

> Sprint 5 · Semana 11 (02–08/nov) · QA · Prioridade Alta · Esforço G · Responsável R4

## Contexto
QA-2 cobriu integração (pedido, agendamento, auth) e E2E das jornadas de compra e agendamento. Faltam
as jornadas de **recusa/reenvio** de cadastro e de **avaliação** pós-conclusão, além de uma revisão de
**acessibilidade** e **responsividade** sem regressão e do preenchimento/validação do **checklist de
release**. O CI já tem o job `e2e` (Playwright) com `smoke.spec.ts`, `a11y.spec.ts` e `legal.spec.ts` —
esta task estende essa cobertura e usa o `a11y.spec.ts` como base para a revisão de acessibilidade.

## Objetivo
Fechar a cobertura E2E (recusa/reenvio e avaliação), revisar a11y/responsividade sem regressão e preencher
e validar o checklist de release.

## Escopo / Passos
1. **E2E — recusa/reenvio:** jornada ponta a ponta: admin recusa cadastro com motivo → parceiro vê o motivo →
   corrige e reenvia (`EM_REVISAO`) → admin distingue reenvio de novo.
2. **E2E — avaliação:** concluir pedido/agendamento → escrever avaliação → rating real aparece na lista/detalhe
   (validando AVL-F1/AVL-F2).
3. **Acessibilidade:** revisão a11y (foco visível, labels/`aria-*`, contraste, navegação por teclado); estender
   `frontend/e2e/a11y.spec.ts` às telas principais; sem regressão.
4. **Responsividade:** revisar breakpoints principais (mobile/tablet/desktop) nas telas-chave (catálogo, carrinho,
   checkout, dashboards, avaliações) — sem quebras de layout.
5. **Checklist de release:** preencher e validar o [checklist de release consolidado](RELEASE-CHECKLIST.md);
   confirmar todos os itens antes do M5.

## Arquivos envolvidos
- `frontend/e2e/recusa-reenvio.spec.ts` (novo)
- `frontend/e2e/avaliacao.spec.ts` (novo)
- `frontend/e2e/a11y.spec.ts` (estender às telas principais)
- `frontend/playwright.config.ts` (ajustes se necessário)
- `Sprints/Sprint-5-Fechamento/RELEASE-CHECKLIST.md` (preencher e validar)

## Dependências (Depende de / Bloqueia)
- **Depende de:** QA-2 (base de integração/E2E das jornadas). Cobre também AVL-F2 (avaliação) e o fluxo de recusa/reenvio.
- **Bloqueia:** entrega/apresentação do M5 (o checklist aprovado é o gate final).

## Critério de aceite (Definition of Done)
- E2E **completo**: compra, agendamento, recusa/reenvio e avaliação passam no CI.
- a11y e responsividade **revisados** nas telas principais, sem regressão.
- **Checklist de release aprovado** (todos os itens marcados/validados).

## Testes
- `npm run test:e2e` verde com as novas specs (recusa/reenvio, avaliação) além do smoke.
- `a11y.spec.ts` verde nas telas cobertas; verificação manual de teclado/foco/contraste.
- Inspeção responsiva nos breakpoints mobile/tablet/desktop das telas-chave.
- Revisão do `RELEASE-CHECKLIST.md` item a item com evidências.

## Notas técnicas / armadilhas
- Reaproveitar setup do job `e2e` (chromium via `playwright.config.ts`); manter specs determinísticas com dados semeados.
- Recusa/reenvio depende de e-mail (Resend) — no E2E, validar o estado `EM_REVISAO` e a UI, não a entrega real do e-mail.
- Rate limit de `/auth` (20/15min) pode interferir em fluxos com muitos logins — isolar estado por teste.
- a11y: priorizar foco visível, labels e contraste; `aria-label` já existe em algumas telas (ex.: cards de walker) — padronizar.
- O checklist só é "aprovado" com os demais tracks fechados (INF-2, SEC-2, DSH-2, AVL-F2) — coordenar o timing no fim da Semana 11.
