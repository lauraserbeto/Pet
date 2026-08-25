# PED-F — TutorOrders + Orders do parceiro (front)

> Sprint 2 · Semana 5 (22–28/set) · Frontend · Prioridade Crítico · Esforço M · Responsável R3

## Contexto
As duas telas de pedidos são 100% mock. `frontend/src/pages/tutor/TutorOrders.tsx:3` define
um `mockOrders` fixo (dois pedidos hardcoded) e renderiza a partir dele.
`frontend/src/pages/dashboard/Orders.tsx:13,30` usa `mockKPIs` e `mockOrders` e exibe o
banner "Ambiente de Demonstração". Com o `POST /orders` (PED-2) e o pagamento simulado
(PAG-1/CHK-2) criando pedidos reais, essas telas precisam consumir os endpoints reais:
`GET /orders` (pedidos do tutor) e `GET /providers/orders` (pedidos recebidos pelo parceiro).

## Objetivo
Substituir os mocks das duas telas por dados reais via `orderService`, tratando
loading/erro/vazio: o tutor acompanha seus pedidos com status real; o parceiro vê os
pedidos recebidos; o banner de demonstração é removido de `Orders.tsx`.

## Escopo / Passos
1. Estender `frontend/src/lib/services/orderService.ts` (criado em CHK-2) com `listMyOrders()` (`GET /orders`) e `listProviderOrders()` (`GET /providers/orders`).
2. Em `TutorOrders.tsx`, remover `mockOrders` (linha 3) e consumir `listMyOrders` via hook React Query; tratar loading (`HamsterLoader`), erro (retry) e vazio (empty state já existente).
3. Em `Orders.tsx`, remover `mockKPIs`/`mockOrders` (linhas 13/30), consumir `listProviderOrders`, derivar os KPIs (total, pendentes, receita) dos dados reais e **remover o banner "Ambiente de Demonstração"** (linhas ~86-96).
4. Mapear os campos do back (`id`, `status`, `total_price`, `created_at`, itens, cliente) para o layout existente; formatar `Decimal`/datas em pt-BR.
5. Alinhar os rótulos de status aos valores reais do `Order` (`AGUARDANDO_PAGAMENTO`, `PAGO`, etc.), mantendo o mapeamento de cores/badges.
6. Manter a busca por ID/cliente em `Orders.tsx` operando sobre os dados reais.

## Arquivos envolvidos
- `frontend/src/lib/services/orderService.ts` — `listMyOrders`, `listProviderOrders`.
- `frontend/src/pages/tutor/TutorOrders.tsx:3` — remover mock, consumir `GET /orders`.
- `frontend/src/pages/dashboard/Orders.tsx:13,30,86-96` — remover mocks + banner, consumir `GET /providers/orders`.

## Dependências (Depende de / Bloqueia)
- Depende de: **PED-2** (`GET /orders` e `GET /providers/orders`); consome pedidos criados por **CHK-2**.
- Bloqueia: nenhuma.

## Critério de aceite (Definition of Done)
- [ ] `TutorOrders` lista os pedidos reais do tutor autenticado, com status vindo do back.
- [ ] `Orders` (parceiro) lista os pedidos recebidos e deriva os KPIs dos dados reais.
- [ ] Estados de loading, erro (com retry) e vazio tratados nas duas telas.
- [ ] Mocks (`mockOrders`, `mockKPIs`) removidos e banner "Ambiente de Demonstração" retirado de `Orders.tsx`.
- [ ] Valores monetários e datas formatados em pt-BR; status com rótulos/cores coerentes.

## Testes
- Tutor com pedidos → lista reflete o back; tutor sem pedidos → empty state.
- Parceiro com pedidos → lista + KPIs corretos; busca por ID/cliente filtra os dados reais.
- Falha de rede → estado de erro com retry, sem quebrar a tela.
- Após concluir uma compra (CHK-2), o pedido aparece em `TutorOrders` e (para o lojista) em `Orders`.

## Notas técnicas / armadilhas
- `total_price` chega como `Decimal` (número/string) — formatar em BRL no front, sem recalcular.
- Coordenar com **UX-2**, que migra `Orders.tsx` para o design system: alinhar a ordem dos PRs para evitar conflito (idealmente UX-2 primeiro no visual, PED-F depois nos dados).
- Não assumir os rótulos antigos do mock (`Em Separação`, `Enviado`); mapear a partir dos status reais do `Order`.
- Sempre os quatro estados (loading/erro/vazio/sucesso); usar `HamsterLoader`.
- `GET /providers/orders` deve exigir papel de parceiro; tratar 401/403 redirecionando/avisando.
