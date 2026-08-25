# AVL-F2 — UI de avaliações (parte 2) + remover últimos mocks

> Sprint 5 · Semana 11 (02–08/nov) · Frontend · Prioridade Alta · Esforço M · Responsável R3

## Contexto
AVL-F1 ligou a escrita de avaliação pós-conclusão e o rating real nas listas e no detalhe, removendo a
primeira leva de mocks. Restam pendências para uma UI completa e honesta:
- **Paginação e estado vazio** das listas de reviews não estão fechados.
- **Últimos ratings/reviews fabricados:** em `frontend/src/pages/ProductDetailPage.tsx` ainda há
  `allProductsMock` (`:36`) com `rating`/`reviews` fixos, `ratingDistribution` mock (`:57`), lista de reviews
  hardcoded e a seção "Related Products (Mocked)" (`:571`). Varrer todas as telas atrás de qualquer
  rating/review remanescente.

## Objetivo
Concluir a UI de avaliações (paginação e estado vazio) e remover os últimos ratings/reviews fabricados de
qualquer tela.

## Escopo / Passos
1. **Paginação de reviews:** listar avaliações reais com paginação (ex.: "Ver todas as avaliações" /
   paginação incremental) consumindo o backend AVL-2; usar hook React Query.
2. **Estado vazio:** alvo sem avaliações exibe estado vazio claro (sem estrelas/contagem fabricadas), tanto
   na lista quanto no resumo.
3. **Distribuição real:** substituir `ratingDistribution` mock (`ProductDetailPage.tsx:57`) pela distribuição
   real de notas vinda do backend.
4. **Remover últimos mocks:** eliminar `allProductsMock` (`:36`), a lista de reviews hardcoded e os
   "Related Products (Mocked)" (`:571`) — usar dados reais ou remover a seção; varredura final por
   `rating`/`reviews`/`Math.random` em todo `frontend/src/pages`.
5. **Consistência:** garantir que Hotéis, Walkers e detalhe de produto exibam somente rating/review reais.

## Arquivos envolvidos
- `frontend/src/pages/ProductDetailPage.tsx` (`allProductsMock` :36, `ratingDistribution` :57, reviews mock, Related Products :571)
- `frontend/src/pages/HotelsPage.tsx` / `frontend/src/pages/WalkersPage.tsx` (varredura final de resíduos)
- `frontend/src/lib/services/reviewService.ts` (paginação/distribuição, se faltar método)
- Componentes de review/`Stars` reutilizados

## Dependências (Depende de / Bloqueia)
- **Depende de:** AVL-F1 (serviço de reviews + rating real já integrados).
- **Bloqueia:** QA-3 (E2E de avaliação e checklist de release verificam a ausência de mocks).

## Critério de aceite (Definition of Done)
- **Nenhuma tela** exibe rating/review fake (varredura sem resíduos).
- Reviews reais com **paginação** funcionando.
- **Estado vazio** honesto quando o alvo não tem avaliações.
- Distribuição de notas exibida a partir de dados reais (sem `ratingDistribution` mock).

## Testes
- Alvo com muitas avaliações → paginação navega corretamente entre páginas.
- Alvo sem avaliações → estado vazio, sem estrelas/contagem fabricadas.
- `grep` de regressão em `frontend/src/pages`: `Math.random`, `rating: 5.0`, `rating={4.8}`, `allProductsMock`,
  `ratingDistribution`, `Mocked` — sem ocorrências em produção.
- E2E de avaliação (coberto em QA-3) passa ponta a ponta.

## Notas técnicas / armadilhas
- Não deixar fallback mock quando a lista está vazia — sempre estado vazio.
- Paginação via React Query (cursor/página) — tratar loading/erro/vazio em cada página.
- Cuidado com a seção "Related Products" — se não houver fonte real pronta, remover em vez de manter mock.
- Reaproveitar `Stars` (`ProductDetailPage.tsx:123`) para renderizar a distribuição/nota média de forma consistente.
