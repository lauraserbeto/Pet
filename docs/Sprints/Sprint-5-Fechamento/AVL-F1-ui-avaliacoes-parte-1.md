# AVL-F1 — UI de avaliações (parte 1)

> Sprint 5 · Semana 10 (27/out–01/nov) · Frontend · Prioridade Alta · Esforço G · Responsável R3

## Contexto
As telas exibem rating/reviews fabricados enquanto não havia backend de avaliações. Exemplos
confirmados no código:
- `frontend/src/pages/HotelsPage.tsx:73` — `rating: 5.0, // Mock enquanto não temos sistema de avaliações`
  e `reviews: Math.floor(Math.random() * 50) + 5` (`:74`).
- `frontend/src/pages/WalkersPage.tsx:45-46` — `rating: 5.0, // Mock` e `reviews: Math.floor(Math.random() * 50) + 5`;
  ordenação e exibição usam esse rating fake (`:87`, `:284-287`).
- `frontend/src/pages/ProductDetailPage.tsx` — `Stars rating={4.8}` hardcoded (`:279, :358, :494`),
  `150 avaliações` fixo (`:496`), `ratingDistribution` mock (`:57`) e lista de reviews mock.

Com o backend de avaliações pronto (AVL-2), esta é a primeira leva de integração: escrever avaliação
pós-conclusão e exibir rating real, começando a remover os mocks.

## Objetivo
Consumir o backend de avaliações: permitir que o cliente escreva uma avaliação após a conclusão do
serviço/pedido e exibir o **rating real** nas listas e nos detalhes, removendo a primeira leva de
ratings fake.

## Escopo / Passos
1. **Serviço de avaliações (frontend):** criar `lib/services/reviewService` (sobre `httpClient`) com os
   métodos do backend AVL-2: criar avaliação e buscar rating agregado/lista por alvo (hotel, sitter, produto).
2. **Escrever avaliação pós-conclusão:** disponibilizar a ação de avaliar somente após conclusão
   (pedido entregue / agendamento concluído); usar `react-hook-form` (nota + comentário) e hook React Query
   de mutação; tratar loading/erro/sucesso.
3. **Rating real nas listas:** substituir os ratings fake por dados agregados do backend em `HotelsPage.tsx`
   (`:73-74`) e `WalkersPage.tsx` (`:45-46`), incluindo a ordenação por "Melhor avaliados".
4. **Rating real no detalhe:** em `ProductDetailPage.tsx`, ligar o rating médio e a contagem de avaliações
   ao backend (substituir `4.8`/`150 avaliações`/`ratingDistribution` mock).
5. **Estado vazio inicial:** alvo sem avaliações mostra estado vazio honesto (sem estrelas fabricadas). A
   paginação/estado vazio completos ficam para AVL-F2.

## Arquivos envolvidos
- `frontend/src/lib/services/reviewService.ts` (novo)
- `frontend/src/pages/HotelsPage.tsx` (`:73-74` — remover mock)
- `frontend/src/pages/WalkersPage.tsx` (`:45-46, :87, :284-287` — remover mock)
- `frontend/src/pages/ProductDetailPage.tsx` (`:279, :358, :494-496, :57` — ligar ao backend)
- Componente `Stars` reaproveitado de `ProductDetailPage.tsx:123`

## Dependências (Depende de / Bloqueia)
- **Depende de:** AVL-2 (backend de avaliações — endpoints de criar/listar/agregar).
- **Bloqueia:** AVL-F2 (parte 2 conclui paginação/estado vazio e remove os últimos mocks).

## Critério de aceite (Definition of Done)
- Cliente consegue **escrever uma avaliação** após a conclusão do serviço/pedido, persistida via backend.
- Rating **real** exibido nas listas (Hotéis, Walkers) e no detalhe de produto.
- Primeira leva de ratings fake removida (`HotelsPage.tsx:73`, `WalkersPage`, `ProductDetailPage` rating/contagem).
- Alvo sem avaliações não exibe rating fabricado (estado vazio honesto).

## Testes
- Fluxo: concluir pedido/agendamento → escrever avaliação → rating do alvo atualiza.
- Ação de avaliar **indisponível** antes da conclusão.
- Listas e detalhe renderizam rating do backend (teste com serviço mockado).
- `grep` de regressão: `Math.random`, `rating: 5.0` e `rating={4.8}` removidos das telas tocadas.

## Notas técnicas / armadilhas
- Só permitir avaliar **pós-conclusão** — não expor a ação em qualquer estado.
- Não deixar rating fake como fallback quando não há avaliações — usar estado vazio.
- Reaproveitar o componente `Stars` existente para consistência visual (meia-estrela por `Math.floor`).
- Nota vem como número/`Decimal` no backend — normalizar para exibição (`toFixed(1)`).
- AVL-F2 fecha o restante (paginação, estado vazio completo, últimos mocks) — aqui é a primeira leva.
