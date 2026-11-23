# Auditoria visual — Fase 4 (P2): implementação e validação

22/11/2026 · branch `tasks-laura` · alterações locais, **sem commit, push ou deploy**.

Origem: [relatório](index.html), grupos G16–G21, com a decisão G20 (“remover”) da [Fase 0](FASE0-DECISOES.md). Nenhuma mudança de backend nesta fase.

## O que mudou

| Grupo | Mudança | Onde |
|---|---|---|
| G16 | Filtros do diretório: no celular a busca ocupa a largura toda e “Serviço”/“Ordenar por” ficam lado a lado (antes a busca encolhia e o placeholder era cortado); a partir de `sm`, uma linha. Foco visível no campo de busca. | `components/PartnerDirectory.tsx` |
| G17 | Aprovações do Admin: abaixo de `md`, cada linha da tabela vira um card com rótulos (`data-label`) e as ações Aprovar/Recusar visíveis, sem rolagem lateral — mesma marcação, só CSS, sem duplicar a lógica. Sidebar móvel fechada sem sombra vazando na borda e fora do foco de teclado (`invisible`). | `admin/Approvals.tsx`, `DashboardLayout.tsx` |
| G18 | Avaliações: painel na largura da coluna da página (Hotel 720 px; Produto com o mesmo recuo da página); aviso de vazio só no resumo; paginação some quando há uma única página; link do histórico em `primary-700`, levando visitantes ao login com retorno. | `reviews/ReviewsPanel.tsx`, `HotelDetailsPage.tsx`, `ProductDetailPage.tsx` |
| G19 | Busca do cabeçalho (desktop e menu móvel) agora funciona: leva a `/shopping?q=…`, e o Shopping lê e acompanha o parâmetro; texto passa a dizer “Buscar produtos no Shopping”. Removidos “Buscar no painel…” e o sino com ponto vermelho fixo (sem backend). `/search` redireciona ao Shopping preservando o termo; `/appointments` a “Meus Agendamentos”. Favoritar no card de produto da landing usa os favoritos reais (antes: estado local e toast de sucesso falso; visitante agora recebe “Faça login para favoritar”) e saiu de dentro do link da imagem. | `Navbar.tsx`, `ShoppingPage.tsx`, `DashboardLayout.tsx`, `app/routes.tsx`, `LandingPage.tsx` |
| G20 | Removidas promessas sem base: parcelamento “10x sem juros”, “Frete Rápido / Entrega garantida”, “Ambiente 100% blindado” (trocados pela regra real DEC-C: entrega pela loja, sem frete da Pet+); página de Parceiros reescrita com o que existe (sem clínicas, prontuário, receitas, WhatsApp, seguro, diário de bordo, comissão, carteira ou repasse; sem “+150k”, “98%”, “milhares”, “centenas”); painel ilustrativo rotulado “Exemplo ilustrativo”; FAQ alinhada às regras atuais (cadastro gratuito, sem comissão nem repasse, pagamento de agendamento simulado, CNPJ/CPF). Landing, Shopping e Sobre sem “entrega rápida”, “ofertas diárias”, “descontos imperdíveis”, “farmácia”, “conforto garantido”. | `ProductDetailPage.tsx`, `PartnersPage.tsx`, `LandingPage.tsx`, `ShoppingPage.tsx`, `AboutPage.tsx` |
| G21 | Detalhe do Pet Sitter: preço inicial com a unidade do serviço mais barato (`BILLING_UNIT_LABELS`) em vez do texto fixo “a partir de /hora”; unidade também na lista de serviços; CTA primário (antes azul) e rótulo “Agendar”, que é o que o botão faz (antes “Ver serviços”). Carregamento e botão de voltar sem o azul fora da paleta. | `WalkerDetailsPage.tsx` |
| — | Botões de telefone/WhatsApp do Hotel com nome acessível específico. | `HotelDetailsPage.tsx` |

## Validação

Runtime: Node 24.18.0 global (a referência do projeto é 24.22.3, em `.nvmrc`).

- **Frontend:** 38 arquivos / **188 testes** aprovados (novos: busca do cabeçalho em `Navbar.test.tsx`, `WalkerDetailsPage.test.tsx`; ajustado o teste de estado vazio de avaliações para o comportamento decidido). Typecheck sem erros; lint 0 erros (avisos 128 → 126); build aprovado.
- **Backend:** sem alterações nesta fase (última suíte: 547/547 na Fase 3).
- **Navegador com API e PostgreSQL locais e descartáveis (URL com `127.0.0.1`):** **14/14** cenários em desktop 1440 e celular 390 — layout dos filtros, aprovações no celular (botão dentro da tela, sidebar fechada invisível) e no desktop, largura/paginação das avaliações, busca do cabeçalho filtrando o Shopping, redirecionamentos, painel sem busca/sino, favorito da landing pedindo login, ausência das promessas em produto/parceiros/shopping, unidade e CTA do Pet Sitter. Prints e `resultado.json` em [`fase4/`](fase4/). Uma rodada intermediária teve uma checagem com seletor errado no script e outra com tempo esgotado no carregamento do Vite; a rodada final passou inteira.

## Pendências e observações

- Página Sobre mantém o título narrativo “De uma ideia a milhares de pets felizes”; avaliar com a equipe.
- Contagens fixas das categorias da landing (`count`) existem nos dados, mas não são exibidas.
- E2E do Playwright (`npm run test:e2e`) e login real com senha não executados.
- Restam os itens da Fase 5 (G22–G26) e os anotados nas Fases 2 e 3.
