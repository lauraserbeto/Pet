# SRV-Fpub — Front: exibir serviços reais no detalhe (remover campos fake)

> Sprint 3 · Semana 7 (06–12/out) · Frontend · Prioridade Alta · Esforço M · Responsável R3

## Contexto
As páginas de detalhe público `HotelDetailsPage.tsx` e `WalkerDetailsPage.tsx` (`frontend/src/pages/`) misturam dados reais da API com campos **fabricados** que não têm fonte no backend. Exemplos concretos: `HotelDetailsPage` monta `distance: "3.0 km"`, `rating: 5.0`, `reviews: 12`; `WalkerDetailsPage` traz `rating: 5.0`, `reviews: 24`, `distance: "2.0 km"`, `experience: "3 anos"`, além de um `mockWalker` inteiro de fallback. Com o CRUD de serviços real (SRV-1) e a exposição no detalhe público (`GET /providers/:id`), dá para mostrar os serviços verdadeiros e remover o que é inventado.

## Objetivo
Exibir os **serviços reais** (de SRV-1) com preço no detalhe do hotel e do sitter, e **remover os campos fabricados** que não têm fonte de dados (distância, rating/avaliações, experiência e o mock inteiro).

## Escopo / Passos
1. **Consumir serviços reais:** ler os serviços do parceiro a partir do detalhe (`GET /providers/:id`, que passa a incluir serviços após SRV-1) e renderizar nome, preço e unidade de cobrança (diária/hotel, visita·hora/sitter).
2. **Remover campos fabricados** sem fonte:
   - `HotelDetailsPage`: `distance`, `rating`, `reviews` fixos e a aba/seção de avaliações que depende deles.
   - `WalkerDetailsPage`: `rating`, `reviews`, `distance`, `experience` fixos e o objeto `mockWalker` de fallback.
3. **Tratar ausência de dados:** onde havia número fabricado, ou omitir o elemento, ou mostrar estado vazio honesto ("sem avaliações ainda") — nunca inventar valor.
4. **Estados:** loading/erro/vazio para a lista de serviços; sem fallback mockado que mascare falha da API.
5. Manter apenas os dados que realmente vêm do backend (nome, descrição, endereço, horário, galeria, etc.).

## Arquivos envolvidos
- `frontend/src/pages/HotelDetailsPage.tsx` (remover `distance`/`rating`/`reviews` fabricados; listar serviços)
- `frontend/src/pages/WalkerDetailsPage.tsx` (remover `rating`/`reviews`/`distance`/`experience` e `mockWalker`; listar serviços)
- `frontend/src/lib/services/serviceService.ts` / `providerService.ts` (leitura dos serviços no detalhe)

## Dependências
- **Depende de:** SRV-1 (serviços reais expostos no `GET /providers/:id`).
- **Bloqueia:** nada direto; corrige integridade dos dados exibidos ao público.

## Critério de aceite (Definition of Done)
- Detalhe do hotel e do sitter listam os **serviços reais** com preço (e unidade correta).
- Campos sem fonte (distância, rating/avaliações fabricados, experiência) **removidos** de ambas as páginas.
- Nenhum `mockWalker`/valor fixo mascarando dados ausentes; falha de API mostra erro honesto, não mock.
- Estado vazio quando o parceiro não tem serviços cadastrados.

## Testes
- Manual: parceiro com serviços → detalhe lista os reais com preço; sem serviços → estado vazio.
- Verificar que não restam strings fixas de rating/distância/experiência nas páginas.
- Manual: derrubar a API do detalhe → aparece erro, não o mock antigo.

## Notas técnicas / armadilhas
- Não substituir um número fabricado por outro; **remover** ou mostrar vazio honesto.
- Preço vem como `Decimal` do backend → já convertido para `Number()` em SRV-1; formatar em BRL no front.
- Cuidado com componentes que dependiam de `rating`/`reviews` (abas, estrelas) — ajustar ou remover junto, sem quebrar o layout.
