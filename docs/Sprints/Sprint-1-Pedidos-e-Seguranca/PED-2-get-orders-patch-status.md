# PED-2 — GET /orders + PATCH status (parte 2)

> Sprint 1 · Semana 3 (08–14/set) · Backend · Prioridade Crítico · Esforço M · Responsável R1

## Contexto
Com a criação transacional de pedidos entregue em PED-1 (`POST /orders`), falta o restante do CRUD de pedidos: listar os pedidos do tutor, listar os pedidos recebidos pelo parceiro e permitir a transição de status pelo lojista. Hoje `Order.status` é uma string livre com valores herdados do schema (`PENDING, PREPARING, SHIPPED, DELIVERED, CANCELLED` — `backend/prisma/schema.prisma:237`), enquanto o fluxo de negócio alinhado sugere `AGUARDANDO_PAGAMENTO → PAGO → ENVIADO/CONCLUIDO → CANCELADO` (decisão de negócio 7).

## Objetivo
Completar o CRUD de pedidos com listagem para tutor e parceiro e um `PATCH` de status com validação de transição e checagem de ownership.

## Escopo / Passos
1. **`GET /orders`** — pedidos do tutor logado (`customer_id = req.userId`), ordenados por `created_at desc`, com itens e dados essenciais do produto. Tratar paginação se a lista puder crescer (seguir o padrão de `products` com headers `X-Total-*`).
2. **`GET /providers/orders`** (ou `GET /orders/received`) — pedidos recebidos pelo parceiro logado (`provider_id` do provider do usuário). Resolver o `provider_id` a partir de `req.userId` (o usuário é dono de um `Provider`).
3. **`PATCH /orders/:id/status`** — troca de status com:
   - **validação de transição**: definir a máquina de estados permitida (ex.: `AGUARDANDO_PAGAMENTO → PAGO → ENVIADO → CONCLUIDO`; `→ CANCELADO` a partir de estados iniciais). Rejeitar transições inválidas (422).
   - **ownership**: só o parceiro dono do pedido pode alterá-lo (comparar `order.provider_id` com o provider do `req.userId`); senão 403.
4. Adicionar as rotas em `orderRoutes.js` (e/ou `providerRoutes.js`) com `authMiddleware`.
5. Criar use cases: `ListCustomerOrdersUseCase`, `ListProviderOrdersUseCase`, `UpdateOrderStatusUseCase`.
6. Centralizar os status válidos e as transições permitidas em um `constants/orderStatus.js` (espelhando o padrão de `constants/providerStatus.js`).

## Arquivos envolvidos
- `backend/src/routes/orderRoutes.js` (estender — criado em PED-1)
- `backend/src/routes/providerRoutes.js` (se optar por `GET /providers/orders`)
- `backend/src/controllers/OrderController.js` (estender — `listMine`, `listReceived`, `updateStatus`)
- `backend/src/useCases/orders/ListCustomerOrdersUseCase.js` (novo)
- `backend/src/useCases/orders/ListProviderOrdersUseCase.js` (novo)
- `backend/src/useCases/orders/UpdateOrderStatusUseCase.js` (novo)
- `backend/src/constants/orderStatus.js` (novo)
- `backend/prisma/schema.prisma` (`Order.status` :237 — alinhar valores)

## Dependências
- **Depende de:** PED-1 (pedidos precisam existir para serem listados/transicionados).
- **Bloqueia:** telas de "Meus Pedidos" (tutor) e "Pedidos Recebidos" (dashboard do parceiro) — fora do Sprint 1.

## Critério de aceite (Definition of Done)
- Tutor lista apenas os próprios pedidos via `GET /orders`.
- Parceiro lista apenas os pedidos recebidos.
- `PATCH /orders/:id/status` altera o status somente quando: (a) o solicitante é o parceiro dono do pedido e (b) a transição é permitida; caso contrário retorna 403/422.
- Nenhuma resposta vaza `password_hash` do cliente (usar `select` explícito).

## Testes
- Tutor A não vê pedidos do tutor B.
- Parceiro só vê e altera pedidos com seu `provider_id`.
- Transição válida (`PAGO → ENVIADO`) → 200; transição inválida (`CONCLUIDO → AGUARDANDO_PAGAMENTO`) → 422.
- `PATCH` por usuário que não é dono → 403.
- Cobrir no QA-1/integração o par criação→listagem quando possível.

## Notas técnicas / armadilhas
- **Express 5:** `req.query` é read-only → validar paginação com Zod inline, nunca reatribuir `req.query`.
- `Prisma.Decimal` → `Number()` ao serializar `total_price`/`unit_price`.
- Não retornar `customer` cru (vaza `password_hash`) — `select` explícito.
- Ownership do parceiro: o vínculo é `User (req.userId)` → `Provider` → `Order.provider_id`. Resolver o `provider` do usuário antes de comparar.
- Manter os status coerentes com o valor inicial gravado em PED-1; se mudar o vocabulário do schema, alinhar a migração com STA-1 para não conflitar migrações.
