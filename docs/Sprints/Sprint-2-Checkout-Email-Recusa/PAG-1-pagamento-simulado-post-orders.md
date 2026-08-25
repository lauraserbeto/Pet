# PAG-1 — Pagamento simulado no POST /orders

> Sprint 2 · Semana 4 (15–21/set) · Backend · Prioridade Crítico · Esforço M · Responsável R1

## Contexto
O `POST /orders` (entregue em PED-2) cria o pedido a partir do carrinho, mas não há
noção de pagamento: o `Order` nasce e fica em `PENDING` sem forma de evoluir para "pago".
A decisão de negócio é: **primeiro pagamento SIMULADO** (uma ação marca o pedido como pago)
e, só depois, Mercado Pago sandbox opcional (PGT-1). Precisamos introduzir o estado de
pagamento e um endpoint de confirmação já com um **contrato pronto para webhook**, de modo
que plugar o gateway real depois não exija refazer o fluxo.

No schema, `Order.status` hoje é um VarChar livre com comentário `PENDING, PREPARING,
SHIPPED, DELIVERED, CANCELLED` (`prisma/schema.prisma:232-246`).

## Objetivo
Adicionar pagamento simulado ao fluxo do pedido: o pedido criado entra em
`AGUARDANDO_PAGAMENTO`; um endpoint de confirmação simulada move para `PAGO`; a estrutura
(payload, idempotência, ponto de entrada) fica pronta para receber um webhook de gateway
real em PGT-1, sem mudança de contrato para o front.

## Escopo / Passos
1. Definir os estados de pagamento do `Order`: `AGUARDANDO_PAGAMENTO → PAGO` (e `CANCELLED` já existente para falha/cancelamento). Ajustar o `default` de criação para `AGUARDANDO_PAGAMENTO`.
2. Criar migration Prisma para o novo default/estado (o campo `status` já existe; só muda o valor inicial e a semântica documentada).
3. Criar `OrderController` (se ainda não existir) + `routes/orderRoutes.js` e registrar em `app.js` (`/api/v1/orders`).
4. Endpoint `POST /orders/:id/pay` (pagamento simulado): valida dono/estado, marca `PAGO`, retorna o pedido atualizado. Idempotente (repetir em pedido já `PAGO` não quebra).
5. Estruturar a camada de pagamento em useCase (`ConfirmOrderPaymentUseCase`) recebendo um "resultado de pagamento" genérico `{ provider, status, external_id? }` — na simulação é montado internamente; no gateway virá do webhook.
6. Deixar o esqueleto do webhook documentado/rota reservada (`POST /orders/webhook`) para PGT-1, sem implementar o gateway agora.

## Arquivos envolvidos
- `backend/prisma/schema.prisma:232-246` — `Order.status`: novo default `AGUARDANDO_PAGAMENTO` e documentação dos estados de pagamento.
- `backend/src/controllers/OrderController.js` — novo (ou estendido pela PED-2): ação de pagamento simulado.
- `backend/src/useCases/orders/ConfirmOrderPaymentUseCase.js` — novo: lógica de confirmação genérica (simulada e, futuramente, via webhook).
- `backend/src/routes/orderRoutes.js` + `backend/src/app.js:124` — registrar `/api/v1/orders`.
- `backend/prisma/migrations/` — nova migration.

## Dependências (Depende de / Bloqueia)
- Depende de: **PED-2** (`POST /orders` já cria o pedido a partir do carrinho).
- Bloqueia: **CHK-2** (front finaliza a compra chamando pagamento simulado) e **PGT-1** (gateway real reaproveita o contrato).

## Critério de aceite (Definition of Done)
- [ ] Pedido criado nasce em `AGUARDANDO_PAGAMENTO`.
- [ ] `POST /orders/:id/pay` marca o pedido como `PAGO` e retorna o pedido atualizado.
- [ ] Só o dono (customer) do pedido pode pagar; pagar pedido de outro usuário retorna 403/404.
- [ ] Repetir o pagamento de um pedido já `PAGO` é idempotente (não gera erro nem duplica efeito).
- [ ] Contrato de confirmação (`{ provider, status, external_id }`) documentado e pronto para o webhook do gateway.
- [ ] Migration aplica do zero com `prisma migrate deploy`.

## Testes
- `POST /orders/:id/pay` em pedido próprio `AGUARDANDO_PAGAMENTO` → 200 e `status = PAGO`.
- Pagar pedido de outro usuário → 403/404 (sem vazar existência).
- Idempotência: chamar `/pay` duas vezes → segunda resposta consistente, sem efeito colateral.
- Rodar `npm test` no `backend/` (test runner nativo do Node: `node --test`).

## Notas técnicas / armadilhas
- `Order.status` é VarChar livre; alinhar os valores em uma constante compartilhada (padrão de `constants/providerStatus.js`) para não espalhar strings mágicas.
- Prisma `Decimal` (`total_price`) → converter com `Number()` ao serializar para o front.
- Não retornar `customer`/`provider` crus na resposta do pedido (vaza `password_hash`/`document`); usar `select` explícito nos includes.
- Erros seguem `next(AppError)` + errorHandler central — não montar `res` de erro manualmente.
- Manter o webhook apenas reservado nesta task; a assinatura/validação do gateway é escopo de PGT-1.
