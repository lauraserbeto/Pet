# UX-2 — Consistência visual + favoritar persistente + fix reload

> Sprint 2 · Semana 4 (15–21/set) · Frontend · Prioridade Média · Esforço M · Responsável R4

## Contexto
Três dívidas de UX se acumularam no front:
1. **Duas linguagens visuais.** `dashboard/Finance.tsx` e `dashboard/Orders.tsx` usam
   tabela/CSS manual e cores cruas (`bg-blue-50`, `#3b82f6` inline), enquanto o resto do
   app usa o design system shadcn com tokens `var(--color-primary-*)`.
2. **Favoritar não persiste.** `HotelDetailsPage.tsx:37` e `WalkerDetailsPage.tsx:29`
   controlam o coração com `useState(false)` local (`setIsFav(!isFav)` em
   `HotelDetailsPage.tsx:222` / `WalkerDetailsPage.tsx:206`) — some ao recarregar, mesmo
   já existindo `FavoritesContext` com persistência via API.
3. **Reload bruto.** `dashboard/PublicProfile.tsx` usa `window.location.reload()` no botão
   "Descartar" (por volta da linha 802), recarregando a página inteira em vez de resetar o
   estado do formulário.

## Objetivo
Unificar a linguagem visual no design system, fazer o favoritar persistir via
`FavoritesContext` e trocar o reload bruto por atualização de estado, sem alterar backend.

## Escopo / Passos
1. **Finance/Orders:** substituir cards/tabelas manuais e cores cruas por componentes shadcn (`Card`, `Table`/`Badge`) e tokens `var(--color-primary-*)`, alinhando ao restante dos dashboards. Preservar o banner "Ambiente de Demonstração" onde a tela ainda for mock (Orders passa a ser integrada em PED-F).
2. **Favoritos (Hotel):** em `HotelDetailsPage.tsx`, remover `useState(false)` do `isFav`; usar `useFavorites()` — `isFavorite("HOTEL", id)` e `toggle("HOTEL", id)`.
3. **Favoritos (Walker):** idem em `WalkerDetailsPage.tsx` com `target_type = "SITTER"`.
4. **Reload:** em `PublicProfile.tsx`, trocar `onClick={() => window.location.reload()}` por um reset de estado do formulário (ex.: `form.reset(valoresIniciais)` / restaurar snapshot carregado da API).
5. Revisar se há outras telas com o mesmo padrão de cor crua e alinhar tokens onde for barato.

## Arquivos envolvidos
- `frontend/src/pages/dashboard/Finance.tsx` — migrar para design system (cards/cores).
- `frontend/src/pages/dashboard/Orders.tsx` — migrar cards/tabela para shadcn (mantém banner mock até PED-F).
- `frontend/src/pages/HotelDetailsPage.tsx:37,222` — `isFav` local → `FavoritesContext` (`"HOTEL"`).
- `frontend/src/pages/WalkerDetailsPage.tsx:29,206` — `isFav` local → `FavoritesContext` (`"SITTER"`).
- `frontend/src/pages/dashboard/PublicProfile.tsx:~802` — `window.location.reload()` → reset de estado.
- `frontend/src/contexts/FavoritesContext.tsx` — consumido (sem alteração esperada).

## Dependências (Depende de / Bloqueia)
- Depende de: nenhuma.
- Bloqueia: nenhuma (independente; toca telas que outras tasks também alteram — coordenar com PED-F em `Orders.tsx`).

## Critério de aceite (Definition of Done)
- [ ] `Finance.tsx` e `Orders.tsx` usam o mesmo vocabulário visual do design system (componentes shadcn + tokens `--color-primary-*`), sem cores cruas inline.
- [ ] Favoritar hotel/sitter persiste: recarregar a página mantém o coração marcado (via API do `FavoritesContext`).
- [ ] Sem login, favoritar exibe o aviso do contexto ("Faça login para favoritar.") em vez de marcar localmente.
- [ ] "Descartar" em `PublicProfile` reseta o formulário sem `window.location.reload()`.

## Testes
- Favoritar um hotel logado → recarregar → permanece favoritado; desfavoritar → some após reload.
- Favoritar deslogado → toast de login, sem marcação persistida.
- Editar a vitrine e clicar "Descartar" → campos voltam ao carregado, sem recarga de página.
- Inspeção visual de Finance/Orders lado a lado com um dashboard shadcn de referência (cores/tokens coerentes).

## Notas técnicas / armadilhas
- `FavoritesContext` já faz otimismo + rollback e trata deslogado — não reimplementar; apenas consumir `isFavorite`/`toggle`.
- O `target_type` correto é `"HOTEL"` para hotéis e `"SITTER"` para pet sitters (enum do back: `PRODUCT/HOTEL/SITTER`).
- Ao migrar Orders para shadcn, não remover o banner de demonstração antes de PED-F integrar os dados reais.
- Reset de formulário: preferir restaurar o snapshot vindo da API a limpar tudo, para não perder dados não relacionados à edição.
- Evitar regressão de acessibilidade nos botões de favorito (`aria-label` já existe — mantê-lo condicional ao estado).
