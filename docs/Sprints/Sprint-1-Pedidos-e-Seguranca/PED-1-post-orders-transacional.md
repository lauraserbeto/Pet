# PED-1 — POST /orders transacional (parte 1)

> Sprint 1 · Semana 2 (01–07/set) · Backend · Prioridade Crítico · Esforço G · Responsável R1

## Contexto
Hoje o checkout não existe de verdade: os modelos `Order` e `OrderItem` (`backend/prisma/schema.prisma:232-259`) estão definidos mas **nunca são criados** — não há rota, controller nem use case de pedidos, e `app.js` não registra nenhum `orderRoutes`. O carrinho já é funcional (`CartRepository` com `findByUser`, `deleteAllItems`, item com `unit_price_snapshot`) e os produtos têm `stock_quantity` (`ProductRepository`). Falta a operação que transforma carrinho em pedido de forma atômica.

## Objetivo
Implementar o endpoint `POST /orders` que, a partir do carrinho do usuário autenticado, cria o pedido e seus itens, faz snapshot do preço, decrementa o estoque e esvazia o carrinho — tudo dentro de uma única transação Prisma que reverte por completo em caso de falha.

## Escopo / Passos
1. Criar `backend/src/routes/orderRoutes.js` com `POST /` protegido por `authMiddleware`.
2. Criar `backend/src/controllers/OrderController.js` (método `create`) seguindo o padrão dos demais controllers (erros via `next(AppError)`).
3. Criar `backend/src/useCases/orders/CreateOrderUseCase.js`:
   - Carregar o carrinho do usuário via `CartRepository.findByUser(userId)`; rejeitar se vazio.
   - Validar disponibilidade: cada `CartItem.quantity <= product.stock_quantity`; senão erro 409/422.
   - Abrir `prisma.$transaction` que:
     - cria `Order` (`customer_id = req.userId`, `provider_id` do(s) produto(s), `total_price` somado, `status` inicial);
     - cria os `OrderItem` com `unit_price` = snapshot do preço no momento (usar `unit_price_snapshot` do carrinho ou `product.price`);
     - decrementa `stock_quantity` de cada `Product` (`decrement`);
     - esvazia o carrinho (`deleteAllItems`).
   - Se qualquer passo falhar, a transação inteira reverte (nada é persistido).
4. Registrar a rota em `backend/src/app.js` (`app.use('/api/v1/orders', require('./routes/orderRoutes'))`).
5. Definir `Order.status` inicial coerente com o fluxo alinhado: `AGUARDANDO_PAGAMENTO` (pagamento SIMULADO primeiro — ver decisão de negócio 7). Ajustar o `@default` do schema se necessário (hoje é `PENDING`).

> **Nota de escopo:** decisão de negócio: um carrinho pode conter produtos de mais de um lojista. Definir com o time se o MVP cria **um Order por provider** (agrupando itens) ou assume **carrinho de um único lojista**. Registrar a escolha aqui antes de codar.

> **Nota de escopo:** decisão de negócio registrada: Adotada a **Opção A (um Order por provider)**. No checkout, os itens do carrinho são agrupados por `provider_id` e é criado 1 `Order` para cada lojista dentro de uma única transação Prisma atômica, retornando `{ order: orders[0], orders: [...] }`.

## Arquivos envolvidos
- `backend/src/routes/orderRoutes.js` (novo)
- `backend/src/controllers/OrderController.js` (novo)
- `backend/src/useCases/orders/CreateOrderUseCase.js` (novo)
- `backend/src/app.js` (registrar rota, ~linha 125 junto às demais `app.use('/api/v1/...')`)
- `backend/src/repositories/CartRepository.js` (consumir `findByUser`, `deleteAllItems`)
- `backend/src/repositories/ProductRepository.js` (consultar/decrementar estoque)
- `backend/prisma/schema.prisma` (`Order`/`OrderItem` ~232-259; eventual ajuste de `status` default)

## Dependências
- **Depende de:** PED-0 (modelagem/decisão do fluxo de pedido).
- **Bloqueia:** PED-2 (listagem e transição de status) e QA-1 (testes de integração de carrinho/pedido).

## Critério de aceite (Definition of Done)
- `POST /orders` autenticado cria `Order` + `OrderItem` atomicamente a partir do carrinho.
- `stock_quantity` de cada produto é decrementado conforme a quantidade pedida.
- O carrinho do usuário fica vazio após sucesso.
- Falha em qualquer passo (ex.: estoque insuficiente) reverte tudo: nenhum pedido, nenhum item, estoque intacto, carrinho preservado.
- Preço do item é congelado (snapshot) no pedido, independente de alterações futuras no produto.

## Testes
- Happy-path: carrinho com N itens → pedido criado, itens corretos, estoque baixado, carrinho vazio (coberto também por QA-1).
- Estoque insuficiente em um item → 409/422 e rollback total (verificar que nada foi persistido).
- Carrinho vazio → erro claro, sem criar pedido.
- Verificar que o `total_price` do pedido bate com a soma `unit_price * quantity`.

## Notas técnicas / armadilhas
- Usar **`prisma.$transaction`** para a operação composta (criar pedido + baixar estoque + limpar carrinho) — regra do projeto para operações compostas.
- `Prisma.Decimal`: converter com `Number()` ao serializar preços na resposta.
- Não retornar `user`/`customer` cru na resposta (vaza `password_hash`) — usar `select` explícito se incluir dados do cliente.
- `OrderItem.product` tem `onDelete: Restrict` — não afeta a criação, mas lembrar disso ao lidar com exclusão de produto (ver STA-1/PRD-1).
- Snapshot de preço: preferir `unit_price_snapshot` já existente no `CartItem` para consistência com o que o usuário viu.
