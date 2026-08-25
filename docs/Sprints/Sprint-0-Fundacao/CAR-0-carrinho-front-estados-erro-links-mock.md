# CAR-0 — Corrigir carrinho (front) + estados de erro + links mock

> Sprint 0 · Semana 1 (25–31/ago) · Frontend · Prioridade Crítico · Esforço P · Responsável R3

## Contexto
Quatro problemas de front minam a jornada do TUTOR e a honestidade das telas:

1. **Gate de papel do carrinho (mesmo bug do PED-0, no front):** em
   `frontend/src/components/cart/CartContext.tsx:243`, `addItem` faz
   `if (user && user.role_id !== 1)` e mostra um toast bloqueando o uso. Como **role 1 = ADMIN**
   e **role 5 = TUTOR**, o cliente real (tutor) é justamente quem fica bloqueado.
2. **Erro engolido em listagens:** em `frontend/src/pages/HotelsPage.tsx` (`.catch` na linha 91,
   só `setLoading(false)` na 93) e `frontend/src/pages/WalkersPage.tsx` (`.catch` na 60,
   `setLoading(false)` na 62) o `catch` apenas desliga o loading, sem estado de erro — a falha
   vira uma **lista vazia silenciosa**, indistinguível de "não há resultados".
3. **Fallback para dado mock:** `frontend/src/pages/WalkerDetailsPage.tsx` define `mockWalker`
   (linha 77) e usa `const walker = apiWalker || mockWalker` (linha 145) — quando a API não
   retorna o sitter, a tela mostra um walker inventado em vez de "não encontrado".
4. **Links quebrados:** `frontend/src/pages/ProductDetailPage.tsx:585` renderiza os relacionados
   com `to={`/shopping/${rp.id}`}` a partir de `allProductsMock` (IDs mock inexistentes na loja
   real), levando a rotas quebradas.

## Objetivo
Destravar o carrinho para o tutor no front e substituir mascaramentos (lista vazia silenciosa,
walker mock, links mock) por estados reais de erro / não encontrado.

## Escopo / Passos
1. **Gate:** em `CartContext.tsx:243`, trocar `user.role_id !== 1` por `user.role_id !== 5`
   (bloquear quem NÃO é tutor). Manter o curto-circuito `user && ...` (anônimo segue permitido).
2. **HotelsPage / WalkersPage:** adicionar `error` state; no `.catch`, setar a mensagem de erro
   além de `setLoading(false)`; renderizar UI de erro real (com retry) distinta de estado vazio.
3. **WalkerDetailsPage:** remover o `mockWalker` como fallback; quando `apiWalker` for nulo após
   o carregamento, renderizar estado "não encontrado" (mensagem + link de volta à lista).
4. **ProductDetailPage:** corrigir/remover a seção de relacionados que aponta para `/shopping/:id`
   com IDs mock — ou remover a seção, ou passar a consumir produtos reais e linkar rota válida.
5. Garantir os quatro estados em cada tela tocada: loading (`HamsterLoader`), erro, vazio, sucesso.

## Arquivos envolvidos
- `frontend/src/components/cart/CartContext.tsx:243` — gate `role_id !== 1` → `!== 5`.
- `frontend/src/pages/HotelsPage.tsx:91-93` — adicionar estado de erro no `.catch`.
- `frontend/src/pages/WalkersPage.tsx:60-62` — adicionar estado de erro no `.catch`.
- `frontend/src/pages/WalkerDetailsPage.tsx:77,145` — remover `mockWalker`; estado "não encontrado".
- `frontend/src/pages/ProductDetailPage.tsx:585` — corrigir/remover links `to=/shopping/:id` (mock).

## Dependências
- Depende de: nenhuma.
- Bloqueia: nenhuma. (PED-0 corrige o gate no backend; esta task corrige o front, de forma independente.)

## Critério de aceite (Definition of Done)
- [ ] TUTOR (role 5) usa o carrinho no front sem toast de bloqueio; papéis 1–4 seguem bloqueados; anônimo segue permitido.
- [ ] HotelsPage e WalkersPage exibem UI de erro real quando a API falha (não lista vazia silenciosa).
- [ ] WalkerDetailsPage mostra "não encontrado" quando o sitter não existe; não há mais `mockWalker` no fluxo.
- [ ] Não há links apontando para IDs mock inexistentes (`/shopping/1`, `/shopping/2`, etc.) no ProductDetailPage.

## Testes
- Simular falha de rede (ou 500) em Hotels/Walkers e verificar o estado de erro + retry.
- Acessar detalhe de um sitter inexistente e verificar o estado "não encontrado".
- Logar como tutor e adicionar item; logar como lojista/hotel/sitter e confirmar bloqueio.
- Verificar que os relacionados no ProductDetailPage não geram rota quebrada (ou a seção foi removida).

## Notas técnicas / armadilhas
- Reaproveitar o padrão de estados do projeto: `HamsterLoader` no loading; toasts para feedback pontual; estado de erro dedicado para falha de carregamento (não confundir com toast).
- `user.role_id` vem do `AuthContext`; garantir que o valor 5 corresponde a TUTOR no tipo/enum usado no front.
- O `role_id === 5` deve espelhar o gate `!== 5` do backend (PED-0) — manter os dois consistentes evita divergência de comportamento.
- Preferir remover mocks a mantê-los como fallback silencioso: mock que "funciona" esconde a integração faltante.
