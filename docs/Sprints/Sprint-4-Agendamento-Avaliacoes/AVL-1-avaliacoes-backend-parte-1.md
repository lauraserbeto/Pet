# AVL-1 — Avaliações backend (parte 1)

> Sprint 4 · Semana 8 (13–19/out) · Backend · Prioridade Alta · Esforço G · Responsável R2

## Contexto
Hoje **não existe sistema de avaliações**: todo rating/review no front é FAKE — `HotelsPage.tsx:73` fixa `rating: 5.0` e `reviews: Math.floor(Math.random()...)`, `ProductDetailPage` traz specs/reviews mock e `WalkerDetailsPage` idem. No backend não há modelo, rota nem use case de reviews. Já existem os alvos avaliáveis: `Product` (loja), `Provider` (hotel/sitter) e as transações que os concluem (`Order` ~232-259 e `Appointment` ~279-297). Esta task cria o sistema **real** no backend; o front passa a consumir no Sprint 5.

## Objetivo
Criar o modelo `Review` e os endpoints POST/GET, vinculando cada avaliação a um pedido/agendamento **CONCLUÍDO** e ao seu alvo (produto/hotel/sitter). Impedir avaliação sem conclusão da transação e permitir listar reviews por alvo.

## Escopo / Passos
1. Modelar `Review` em `backend/prisma/schema.prisma`:
   - `author_id` (User/tutor), alvo polimórfico controlado (`product_id?` / `provider_id?`) e origem (`order_id?` / `appointment_id?`).
   - `rating` (Int 1–5), `comment` (Text opcional), `created_at`.
   - Índices por alvo (`product_id`, `provider_id`) para a listagem; unicidade por origem para evitar avaliação duplicada do mesmo pedido/agendamento.
2. Gerar migração Prisma (`prisma migrate`).
3. Criar `backend/src/routes/reviewRoutes.js` (`POST /`, `GET /`) e registrar em `app.js` junto às demais `app.use('/api/v1/...')` (~linhas 117-125).
4. Criar `backend/src/controllers/ReviewController.js` (`create`, `list`) no padrão dos controllers (erros via `next(AppError)`).
5. Criar `backend/src/useCases/reviews/CreateReviewUseCase.js`:
   - Validar Zod (rating 1–5, alvo/origem coerentes).
   - Verificar que a origem existe, pertence ao autor e está **`CONCLUIDO`/`DELIVERED`** — senão rejeitar (403/409).
   - Impedir review duplicada da mesma origem.
6. `ListReviewsUseCase`: filtrar por `product_id` ou `provider_id` (query param), retornar reviews do alvo. Express 5: `req.query` read-only → validar com Zod inline.

## Arquivos envolvidos
- `backend/prisma/schema.prisma` (novo `model Review`)
- `backend/prisma/migrations/` (nova migração)
- `backend/src/routes/reviewRoutes.js` (novo)
- `backend/src/controllers/ReviewController.js` (novo)
- `backend/src/useCases/reviews/CreateReviewUseCase.js` e `ListReviewsUseCase.js` (novos)
- `backend/src/app.js` (registrar `app.use('/api/v1/reviews', ...)`)
- `backend/src/schemas/` (schema Zod da review)

## Dependências
- **Depende de:** AGD-2 (Appointment concluído é uma das origens da review).
- **Bloqueia:** AVL-2 (agregação de rating médio depende do modelo `Review`).

## Critério de aceite (Definition of Done)
- Cliente cria review **somente após** a conclusão do pedido/agendamento correspondente; tentativa antes disso é rejeitada.
- Review vinculada corretamente ao alvo (produto/hotel/sitter) e à origem (order/appointment).
- Não é possível avaliar duas vezes a mesma origem.
- `GET /reviews?product_id=` / `?provider_id=` lista as reviews do alvo.
- `rating` fora de 1–5 é recusado.

## Testes
- Criar review de `Order` DELIVERED → sucesso; de `Order` ainda PENDING → 403/409.
- Criar review de `Appointment` `CONCLUIDO` → sucesso; status anterior → rejeitado.
- Review duplicada da mesma origem → erro.
- Autor tentando avaliar pedido/agendamento de outro usuário → 403.
- `GET` por alvo retorna apenas reviews daquele alvo; rating inválido rejeitado.

## Notas técnicas / armadilhas
- Alvo polimórfico: preferir colunas nuláveis explícitas (`product_id?`/`provider_id?`) com validação de exatamente-um-preenchido no use case, em vez de string genérica.
- Unicidade por origem via `@@unique` (ex.: `order_id`/`appointment_id`) para bloquear duplicata no banco.
- Nunca vazar `password_hash`/`document` ao incluir o autor na resposta — usar `select` explícito (ex.: `full_name`, `avatar_url`).
- Erros via `next(AppError)`; logger pino.
- O front continua mock nesta sprint (consumo real no Sprint 5) — não alterar `HotelsPage.tsx`/`ProductDetailPage`/`WalkerDetailsPage` aqui.
