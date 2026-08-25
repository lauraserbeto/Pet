# AVL-2 — Avaliações backend (parte 2)

> Sprint 4 · Semana 9 (20–26/out) · Backend · Prioridade Alta · Esforço M · Responsável R2

## Contexto
Com o modelo `Review` e o POST/GET criados no **AVL-1**, cada avaliação já existe individualmente vinculada ao alvo (produto/hotel/sitter) e a uma origem concluída. Falta o que o front precisa consumir no Sprint 5: o **rating agregado** — média das notas e contagem de avaliações — disponível diretamente nos endpoints de listagem e detalhe de produtos, hotéis e sitters. Hoje esses valores são inventados no front (`HotelsPage.tsx:73` `rating: 5.0` + `reviews` aleatório); AVL-2 fornece o número real.

## Objetivo
Recalcular e **expor** o rating médio e a contagem de avaliações por alvo (produto/hotel/sitter), integrados aos endpoints de listagem e detalhe já existentes, para que o front consuma valores reais em vez de mock.

## Escopo / Passos
1. Implementar a agregação por alvo (média de `rating` + `count`) a partir de `Review` — via `prisma.review.aggregate`/`groupBy` no repositório correspondente.
2. Decidir a estratégia e registrar aqui:
   - **On-read (recomendado p/ MVP):** calcular a média/contagem na consulta de listagem/detalhe.
   - **Denormalizado (opcional):** manter `rating_avg`/`rating_count` em `Product`/`Provider`, recalculados ao criar/remover review (mais rápido na leitura, exige manter consistência — usar `$transaction`).
3. Expor os campos agregados nas respostas de:
   - listagem/detalhe de **produtos** (`ProductController`/repos),
   - listagem/detalhe de **hotéis/sitters** (`ProviderController`/repos).
4. Alvos sem avaliação retornam agregado neutro (ex.: `rating_avg: null`/`0`, `rating_count: 0`) — sem quebrar o contrato.
5. Garantir performance: evitar N+1 na listagem (agregar em lote por conjunto de ids).

## Arquivos envolvidos
- `backend/src/repositories/ProductRepository.js` e `ProviderRepository` (agregação)
- `backend/src/controllers/ProductController.js` e `ProviderController.js` (expor agregado)
- `backend/src/useCases/reviews/` (função de agregação reutilizável, do AVL-1)
- `backend/prisma/schema.prisma` (apenas se optar por `rating_avg`/`rating_count` denormalizados em `Product`/`Provider`)

## Dependências
- **Depende de:** AVL-1 (modelo `Review` + POST/GET).
- **Bloqueia:** consumo real de rating no front (Sprint 5).

## Critério de aceite (Definition of Done)
- Endpoints de **listagem e detalhe** de produto/hotel/sitter retornam **rating médio real + contagem** de avaliações.
- Alvo sem reviews retorna agregado neutro coerente (não `null` inesperado que quebre o cliente).
- O agregado reflete apenas reviews válidas (origem concluída, do AVL-1).
- Listagem não sofre N+1 perceptível.

## Testes
- Alvo com 3 reviews (4, 5, 3) → `rating_avg = 4`, `rating_count = 3`.
- Alvo sem reviews → `rating_avg` neutro, `rating_count = 0`.
- Nova review altera o agregado exposto na próxima leitura (ou imediatamente, se denormalizado).
- Listagem de N alvos retorna agregados corretos sem consulta por-item excessiva.

## Notas técnicas / armadilhas
- `Prisma.Decimal`/média → serializar com `Number()` e definir arredondamento (ex.: 1 casa decimal) de forma consistente com o que o front vai exibir.
- Se optar por denormalização, recalcular dentro de `$transaction` no create/delete de review para não divergir.
- Não vazar `password_hash`/`document` ao expandir respostas de provider.
- Manter o contrato atual dos endpoints — adicionar campos, não renomear os existentes.
- Erros via `next(AppError)`; logger pino.
