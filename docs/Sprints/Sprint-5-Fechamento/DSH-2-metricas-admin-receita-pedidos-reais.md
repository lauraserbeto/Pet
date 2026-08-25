# DSH-2 — Métricas admin com receita/pedidos reais

> Sprint 5 · Semana 11 (02–08/nov) · Backend · Prioridade Alta · Esforço M · Responsável R2

## Contexto
O painel admin omite deliberadamente receita, pedidos e agendamentos. O comentário em
`backend/src/controllers/AdminController.js:13-17` documenta o motivo:

> "Só expõe o que tem dado real. Receita, pedidos e agendamentos ficam de fora de propósito:
> não existe checkout (nada cria `Order`) nem rota de agendamento, então esses números seriam
> sempre zero."

O `getMetrics` hoje agrega usuários, parceiros, moderação, catálogo, engajamento e crescimento
(`AdminController.js:26-104`), mas nenhuma métrica de receita/pedidos/agendamentos. Agora que `Order`
e `Appointment` existem e o checkout marca pedidos pagos (e DSH-1 já estabeleceu o cálculo de receita
de pedidos pagos no lado do parceiro), dá para destravar essas métricas no admin.

## Objetivo
Incluir receita, pedidos e agendamentos reais no painel admin, com números que conferem com o banco.

## Escopo / Passos
1. **Agregações no `getMetrics`:** adicionar ao `Promise.all` as contagens/somas: total de pedidos (e por
   status), total de agendamentos (e por status) e **receita** somada de pedidos **pagos**.
2. **Bloco de resposta:** adicionar um bloco (ex.: `commerce`/`finance`) ao JSON de `getMetrics` com
   `orders`, `appointments` e `revenue`; opcionalmente série temporal de receita por dia via `groupByDay`.
3. **Reuso do cálculo:** reaproveitar a lógica de receita de pedidos pagos definida em DSH-1 (mesma regra de
   "somente pagos" e `Decimal` → `Number()`), para os números baterem entre painel do parceiro e do admin.
4. **Remover o disclaimer:** atualizar o comentário `AdminController.js:13-17` para refletir que essas
   métricas agora são expostas.
5. **Frontend admin:** exibir receita/pedidos/agendamentos na Visão Geral do admin (consumindo o `getMetrics`).

## Arquivos envolvidos
- `backend/src/controllers/AdminController.js` (`getMetrics` — novas agregações + bloco de resposta; atualizar comentário `:13-17`)
- `backend/src/schemas/adminSchemas.js` (se o contrato/params mudar)
- `backend/src/utils/adminMetrics.js` (reuso de `groupByDay`/helpers)
- Frontend do painel admin (tela de Visão Geral que consome `/api/v1/admin/...`)

## Dependências (Depende de / Bloqueia)
- **Depende de:** DSH-1 (cálculo de receita de pedidos pagos estabelecido; `Order`/`Appointment` em uso).
- **Bloqueia:** nada diretamente; fecha a entrega dos dashboards para o M5.

## Critério de aceite (Definition of Done)
- Painel admin exibe **receita**, **pedidos** e **agendamentos** reais.
- Receita = soma de pedidos **pagos** (mesma regra do painel do parceiro); os números **conferem com o banco**.
- Comentário `AdminController.js:13-17` atualizado (não mais "omitido de propósito").

## Testes
- Teste de integração de `getMetrics` com seed conhecido: receita/pedidos/agendamentos batem com os valores semeados.
- Conferência cruzada: receita do admin == soma da receita dos parceiros (mesma base de pedidos pagos).
- Banco sem pedidos → métricas retornam zero (sem quebrar o payload).

## Notas técnicas / armadilhas
- **Prisma `Decimal` → `Number()`** ao somar receita.
- **`groupBy` por timestamp** → bucketizar por dia em JS (`groupByDay`), como já feito para `growth`.
- Manter a coerência de "pago" com DSH-1 — divergência de regra faz os números não baterem.
- `getMetrics` já valida `days` (1–365) via `metricsQuery`/Zod e trata `ZodError` — manter esse tratamento ao estender.
- Adicionar as novas queries dentro do mesmo `Promise.all` para não serializar chamadas ao banco.
