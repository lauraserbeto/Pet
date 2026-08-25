# PED-0 — Corrigir gate de papel do carrinho (backend)

> Sprint 0 · Semana 1 (25–31/ago) · Backend · Prioridade Crítico · Esforço P · Responsável R1

## Contexto
As rotas de escrita do carrinho barram o TUTOR por engano. Em
`backend/src/controllers/CartController.js` o guard é `if (req.userRole && req.userRole !== 1)`.
Como no domínio **role 1 = ADMIN** e **role 5 = TUTOR**, a condição joga um `AppError.forbidden`
(403) para qualquer papel diferente de ADMIN — ou seja, exatamente o TUTOR, que é quem
deveria comprar, toma 403 ao adicionar item (`addItem`, linha 108) e ao fundir o carrinho
anônimo após login (`merge`, linha 234). O efeito prático: nenhum cliente real consegue usar
o carrinho pela API; só um admin passaria pelo gate, o que é o oposto da intenção.

Papéis: 1=ADMIN, 2=LOJISTA, 3=HOTEL, 4=PET_SITTER, 5=TUTOR.

## Objetivo
Inverter o gate para permitir o TUTOR e bloquear os demais papéis: comprar é papel de
cliente (TUTOR), então a regra correta é "bloquear quem NÃO é tutor" (`!== 5`).

## Escopo / Passos
1. Em `addItem` (linha 108), trocar `req.userRole !== 1` por `req.userRole !== 5`.
2. Em `merge` (linha 234), aplicar a mesma correção (`!== 5`).
3. Manter o curto-circuito `req.userRole && ...` (requisições anônimas, sem role, seguem permitidas — o carrinho anônimo é intencional).
4. Revisar se há outra rota de escrita do carrinho com o mesmo padrão (ex.: `updateItem`, `removeItem`) e alinhar o gate.
5. Adicionar teste cobrindo os papéis.

## Arquivos envolvidos
- `backend/src/controllers/CartController.js:108` — gate do `addItem`: `!== 1` → `!== 5`.
- `backend/src/controllers/CartController.js:234` — gate do `merge`: `!== 1` → `!== 5`.
- `backend/test/` (ou pasta de testes equivalente) — novo teste de integração/unidade do CartController.

## Dependências
- Depende de: nenhuma.
- Bloqueia: nenhuma (CAR-0 corrige o mesmo bug no front, mas de forma independente).

## Critério de aceite (Definition of Done)
- [ ] TUTOR (role 5) adiciona item ao carrinho sem receber 403.
- [ ] TUTOR (role 5) faz `merge` do carrinho anônimo sem receber 403.
- [ ] LOJISTA (2), HOTEL (3), PET_SITTER (4) e ADMIN (1) continuam recebendo 403 nas duas rotas.
- [ ] Requisição anônima (sem `req.userRole`) continua permitida.
- [ ] Teste automatizado cobre todos os casos acima e passa em `npm test`.

## Testes
- Teste do `addItem`: para cada papel 1–4 espera 403; papel 5 espera sucesso (2xx); sem role espera sucesso.
- Teste do `merge`: mesma matriz de papéis.
- Rodar `npm test` no `backend/` (test runner nativo do Node: `node --test`).

## Notas técnicas / armadilhas
- Erros seguem o padrão do projeto: `throw AppError.forbidden(...)` capturado pelo errorHandler central via `next` — não retornar `res` manualmente do controller.
- Não retornar o objeto `user` cru em nenhuma resposta do carrinho (vaza `password_hash`); usar `select` explícito onde houver join.
- A troca é de um único caractere por linha, mas o teste é o que garante que o significado do gate não regrida de novo — priorizar a cobertura dos 6 casos.
