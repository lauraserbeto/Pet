# SRV-Fpub — Front: exibir serviços reais no detalhe (remover campos fake)

> Sprint 3 · Semana 7 (06–12/out) · Frontend · Prioridade Alta · Esforço M · Responsável R3

> **Atualizada em 23/10/2026** conforme as decisões DEC-B e DEC-D da Fase 0 de estabilização (`PLANO-DESENVOLVIMENTO.md` §3) e o achado AUD-09 da auditoria. Até essa data a task **não havia sido implementada**. Mudanças:
> - o preço exibido é o do serviço, e é o que será cobrado;
> - as listagens passam a mostrar "a partir de";
> - a visibilidade e a completude do perfil passam a depender de serviço ativo, com ajuste no backend;
> - o escopo se estende aos dados fabricados nas listagens.

## Contexto
As páginas de detalhe público `HotelDetailsPage.tsx` e `WalkerDetailsPage.tsx` (`frontend/src/pages/`) misturam dados reais da API com campos **fabricados** que não têm fonte no backend. Exemplos concretos: `HotelDetailsPage` monta `distance: "3.0 km"`, `rating: 5.0`, `reviews: 12`; `WalkerDetailsPage` traz `rating: 5.0`, `reviews: 24`, `distance: "2.0 km"`, `experience: "3 anos"`, além de um `mockWalker` inteiro de fallback. Com o CRUD de serviços real (SRV-1) e a exposição no detalhe público (`GET /providers/:id`), dá para mostrar os serviços verdadeiros e remover o que é inventado.

## Objetivo
Exibir os **serviços reais** (de SRV-1) com preço no detalhe do hotel e do sitter, e **remover os campos fabricados** que não têm fonte de dados (distância, rating/avaliações, experiência e o mock inteiro).

## Escopo / Passos
1. **Consumir serviços reais:** ler os serviços do parceiro a partir do detalhe (`GET /providers/:id`, que passa a incluir serviços após SRV-1) e renderizar nome, preço e unidade de cobrança: diária para hotel, hora para sitter (DEC-B). O preço exibido é o que será cobrado no agendamento: `Service.price` × unidades.
2. **Remover campos fabricados** sem fonte:
   - `HotelDetailsPage`: `distance`, `rating`, `reviews` fixos, o preço reserva e a aba/seção de avaliações que depende deles.
   - `WalkerDetailsPage`: `rating`, `reviews`, `distance`, `experience`, idade e "Certificado profissional" fixos, os **serviços com preço inventados** quando o sitter não tem serviços e a **avaliação de cliente fictícia**.
3. **Tratar ausência de dados:** onde havia número fabricado, ou omitir o elemento, ou mostrar estado vazio honesto ("sem avaliações ainda") — nunca inventar valor.
4. **Estados:** loading/erro/vazio para a lista de serviços; sem fallback mockado que mascare falha da API. Falha de rede não pode aparecer como "profissional não encontrado".
5. Manter apenas os dados que realmente vêm do backend (nome, descrição, endereço, horário, galeria, etc.).
6. **Listagens públicas** (`HotelsPage`, `WalkersPage`) — DEC-B e AUD-09:
   - Exibir **"a partir de R$ X"**, com X = menor preço entre os serviços ativos do parceiro.
   - Remover os preços padrão inventados (R$ 150/diária e R$ 50/hora quando não há tarifa), as avaliações com `Math.random()`, a distância fixa e os selos e números fixos ("verificado", "3 anos", "40 pets").
   - A ordenação não pode usar valores fabricados.
7. **Ajuste no backend (R2)**, necessário para o passo 6:
   - A visibilidade na vitrine e a completude do perfil (`ProviderController` — `listHotels`, `listSitters`, completude) passam a exigir **ao menos um serviço ativo**, em vez de `daily_rate`/`hourly_rate`.
   - As listagens expõem os serviços ativos ou o menor preço, convertido para número.
   - Remover o `rating: 4.5` e o `badge: "Novo"` injetados em `GetProviderDetailsUseCase`.
   - A tarifa geral do parceiro deixa de ser exibida como preço.

## Arquivos envolvidos
- `frontend/src/pages/HotelDetailsPage.tsx` (remover `distance`/`rating`/`reviews` fabricados e o preço reserva; listar serviços)
- `frontend/src/pages/WalkerDetailsPage.tsx` (remover `rating`/`reviews`/`distance`/`experience`, serviços e avaliação inventados; listar serviços)
- `frontend/src/pages/HotelsPage.tsx` e `frontend/src/pages/WalkersPage.tsx` (listagens: "a partir de" e remoção de valores fabricados)
- `frontend/src/lib/services/serviceService.ts` / `providerService.ts` (leitura dos serviços no detalhe e nas listagens)
- `backend/src/controllers/ProviderController.js` (visibilidade, completude e preço "a partir de" nas listagens)
- `backend/src/useCases/providers/GetProviderDetailsUseCase.js` (remover campos fabricados)

## Dependências
- **Depende de:** SRV-1 (serviços reais expostos no `GET /providers/:id`) e dos itens **E-01**/**E-11** da estabilização: só parceiros operacionais aparecem no público (DEC-D), e o detalhe de parceiro não aprovado ou inexistente responde 404.
- **Bloqueia:** nada direto; corrige integridade dos dados exibidos ao público e dá a base de preço que a BKG-1 usa.

## Critério de aceite (Definition of Done)
- Detalhe do hotel e do sitter listam os **serviços reais** com preço e unidade correta (diária ou hora).
- Listagens mostram "a partir de" calculado pelos serviços ativos; parceiro sem serviço ativo não aparece na vitrine.
- Campos sem fonte (distância, rating/avaliações fabricados, experiência, selos, preços padrão, depoimentos) **removidos** das páginas de detalhe e das listagens.
- Nenhum valor fixo mascarando dados ausentes; falha de API mostra erro honesto, não mock.
- Estado vazio quando o parceiro não tem serviços cadastrados.

## Testes
- Manual: parceiro com serviços → detalhe lista os reais com preço; sem serviços → estado vazio e ausência na vitrine.
- Listagem: hotel com serviços de R$ 60 e R$ 120 → "a partir de R$ 60".
- Verificar que não restam strings fixas de rating/distância/experiência nem `Math.random()` nas páginas.
- Manual: derrubar a API do detalhe → aparece erro, não o mock antigo nem "não encontrado".

## Notas técnicas / armadilhas
- Não substituir um número fabricado por outro; **remover** ou mostrar vazio honesto.
- Preço vem como `Decimal` do backend → já convertido para `Number()` em SRV-1; formatar em BRL no front.
- Cuidado com componentes que dependiam de `rating`/`reviews` (abas, estrelas) — ajustar ou remover junto, sem quebrar o layout.
