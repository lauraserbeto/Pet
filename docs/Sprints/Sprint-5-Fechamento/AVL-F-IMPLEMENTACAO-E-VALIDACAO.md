# AVL-F1 / AVL-F2 — Interface de avaliações reais

Entrega local de 18/11/2026, na branch `tasks-laura`, sobre a main `d593b03` e as entregas locais de SRV-Fpub, PAG-2, BKG, SCH e AVL-2. Sem commit, push, publicação ou acesso ao banco de produção.

## Comportamento implementado

O Tutor encontra a ação de avaliar em Meus Pedidos para cada produto distinto de um pedido CONCLUIDO e em Meus Agendamentos para um atendimento CONCLUIDO. A unidade de avaliação permanece a definida em AVL-1: produto/pedido ou parceiro/agendamento. Uma compra posterior permite uma nova avaliação do mesmo produto; recarregar a mesma origem não permite duplicá-la.

O formulário usa React Hook Form, nota inteira obrigatória de 1 a 5 e comentário opcional de até 2.000 caracteres. A consulta da avaliação já enviada ocorre ao abrir o diálogo, evitando uma requisição por item durante o carregamento inicial do histórico. A API continua sendo responsável pelas verificações de perfil, propriedade, vínculo, conclusão e unicidade.

A mutação bloqueia cliques repetidos, apresenta os erros e preserva o conteúdo após uma recusa de validação. Em timeout, falha de rede ou erro de servidor, não repete o POST automaticamente: oferece uma consulta do envio. Um conflito 409 consulta a avaliação existente. Após sucesso, a avaliação fica disponível somente para leitura e os dados públicos em React Query são invalidados. O cache privado inclui o usuário e a origem.

Meus Pedidos passou a ter proteção de rota para Tutor, em conformidade com seu endpoint. O retorno após expiração de sessão também preserva essa rota. A interface do parceiro não recebe a ação de escrever uma avaliação.

## Exibição pública

- Hotéis e Pet Sitters: médias e contagens reais nos cards e detalhes; ordenação por melhor nota, com alvos sem nota válida no fim e desempate por nome.
- Detalhe de produto: carregamento real via API, erro com nova tentativa e avaliações reais. Foi removido o produto fictício usado como fallback de falha.
- Página inicial: cards de produtos usam os agregados retornados pela API.
- Produto, hotel e Pet Sitter compartilham o painel de avaliações com autor, data, nota, comentário, paginação de cinco itens e distribuição completa das notas.
- Sem avaliações, a interface apresenta estado vazio. Dados ausentes ou inválidos não viram uma nota fictícia.
- Comentários são renderizados como texto pelo React; não há inserção de HTML do autor.
- Estrelas fracionárias representam a média efetiva, com nome acessível. O formulário utiliza controles de rádio e retorna o foco ao botão que abriu o diálogo.

Foram retirados depoimentos fictícios da página inicial e de Sobre, a nota fixa da loja e a estatística fictícia de satisfação da página de parceiros. Não foi criada uma média da loja a partir de avaliações de agendamentos. Outras métricas institucionais ou de dashboards não fazem parte desta entrega e continuam exigindo sua própria revisão.

## Complementos de API

Não foi necessária uma nova migration para esta etapa. Os contratos reaproveitam Review e a correção de unicidade já validada em AVL-2.

| Operação | Contrato |
| --- | --- |
| GET /api/v1/reviews | Array público, com os cabeçalhos existentes X-Total-Count e X-Total-Pages. Ordenação estável por created_at e id decrescentes. |
| GET /api/v1/reviews/summary | Exatamente product_id ou provider_id; retorna rating_avg, rating_count e distribution com as cinco notas. |
| GET /api/v1/reviews/mine | Tutor autenticado; exige produto/pedido ou parceiro/agendamento. Filtra pelo autor da sessão e retorna review ou null. |
| POST /api/v1/reviews | Mantém o contrato existente e as validações de criação. |

A distribuição considera todas as avaliações elegíveis do alvo, e não somente a página visível. Listagem e distribuição aplicam o mesmo filtro de origem concluída dos agregados de AVL-2. A listagem não altera o formato de corpo consumido por outros clientes. `httpClient.getWithHeaders` acrescenta acesso aos metadados sem modificar o retorno dos métodos existentes. Cabeçalhos de paginação ausentes ou inválidos geram erro, sem inventar total.

Listagem, contagem e resumo são consultas separadas; uma nova avaliação concorrente pode produzir uma diferença transitória entre as respostas. Não foi implementado um snapshot de paginação, moderação de comentários, edição ou exclusão de avaliações.

## Relação entre critérios e testes

| Critério | Evidência executável |
| --- | --- |
| Avaliar somente após conclusão e com perfil Tutor | Reviews.test.tsx; reviewRoutes.test.js; cenários reais dos históricos com origem pendente e concluída |
| Validar nota, enviar uma vez e refletir o sucesso | Reviews.test.tsx: nota obrigatória, envio único e invalidação dos agregados |
| Manter avaliação após recarregar | Reviews.test.tsx e reviews-real.spec.ts: reabrir origem persistida sem novo formulário |
| Tratar falhas sem duplicar | Reviews.test.tsx: 422, timeout, 409 e falha na consulta inicial |
| Preservar privacidade da consulta própria | reviewRoutes.test.js e reviewAggregationDb.test.js: sessão e filtro de autoria |
| Média e distribuição do conjunto completo | reviewAggregationDb.test.js e Reviews.test.tsx; navegador: 12 notas 4 mais uma nota 5 resultam em 4,1/13 |
| Paginação real e ordenação determinística | reviewAggregationDb.test.js, Reviews.test.tsx e reviews-real.spec.ts: páginas de 5/5/3 registros |
| Ausência de nota fictícia e ordenação real | Reviews.test.tsx, PartnerDirectory.test.tsx e varredura do código de produção |
| Comentário não executa HTML | Reviews.test.tsx: conteúdo é texto, sem elemento HTML injetado |
| Produto, hotel e sitter funcionam com persistência | Três cenários de reviews-real.spec.ts, conectados à API e PostgreSQL locais |

## Verificações desta entrega

- Backend completo: **454 testes aprovados, zero falhas/ignorados**, com PostgreSQL 16 descartável e as dez migrations da base integrada.
- Frontend completo: **139 testes aprovados em 23 arquivos**, com `--pool=threads --maxWorkers=1 --no-file-parallelism --testTimeout=15000`.
- Formulário/painel: os 12 novos testes passaram. Uma primeira execução com forks falhou ao iniciar um worker; a execução com threads concluiu. Um teste de invalidação foi ajustado para manter o cache público durante sua própria asserção, sem alterar o comportamento da aplicação.
- Primeira validação integrada de avaliações: **três cenários Playwright aprovados**, com API/PostgreSQL reais e sem respostas de negócio simuladas. Produto em desktop de 1280 px; hotel e sitter em celular de 390 px. Persistência após reload, leitura pública, distribuição e paginação conferidas. Sem overflow horizontal nos três cenários.
- Capturas do formulário e dos painéis foram inspecionadas. A largura do rótulo das notas foi ajustada para evitar a quebra de “5 estrelas” no celular; o resumo dos parceiros foi posicionado junto ao nome.
- Lint completo do frontend: zero erros e 133 avisos. Lint dos complementos de backend desta etapa: zero erros/avisos. Esses resultados não representam a remoção da dívida de lint do projeto.
- A varredura de ratings, contagens e depoimentos fixos não encontrou resíduos nas telas públicas alteradas. O Math.random remanescente no componente genérico de sidebar controla largura de skeleton, sem relação com avaliações.

- Typecheck e build final aprovados. O Vite mantém o aviso de chunk superior a 500 kB; esta entrega não altera a estratégia global de bundles.
- A primeira regressão completa de navegador teve 32 cenários aprovados e um timeout no hotel. O trace localizou 56,3 segundos dentro de `page.screenshot`: “waiting for fonts to load...” até “fonts loaded”. As requisições de criação e consulta própria da review passaram; o orçamento total do teste se esgotou ao navegar para o detalhe público. O teste novo passou a abortar somente fontes do Google e usar o fallback local nas capturas, preservando as requisições reais de negócio. Não foi alterado o carregamento de fontes da aplicação.

- Regressão completa posterior: **33 cenários Playwright aprovados, zero falhas/ignorados**, em 2,1 minutos, com um worker e timeout local de 60 segundos. Inclui sete cenários com API/PostgreSQL reais (dois BKG, dois SCH e três AVL); os demais usam as estratégias existentes de smoke e respostas controladas. Os três cenários de avaliações passaram em 5,1/3,2/3,2 segundos. Não houve aumento do timeout na configuração versionada.
- A auditoria axe da landing não encontrou violações críticas, mas registrou uma violação séria de contraste envolvendo oito elementos. Não se declara acessibilidade completa do produto.
- Conferência final sem conflitos de merge, sem arquivos em estágio e sem erros de whitespace no diff rastreado.

### Evidências preservadas

- [Backend — 454 testes](../../evidencias-testes/2026-11-18-avlf-backend-tests.log).
- [Frontend — 139 testes](../../evidencias-testes/2026-11-18-avlf-frontend-tests.log).
- [Navegador — primeira rodada, 32 aprovações e timeout de fonte](../../evidencias-testes/2026-11-18-avlf-e2e-primeira-rodada.log).
- [Navegador — rodada final, 33 aprovações](../../evidencias-testes/2026-11-18-avlf-e2e-final.log).
- [Formulário de produto](../../evidencias-testes/2026-11-18-avlf/produto-formulario.png) e [paginação pública](../../evidencias-testes/2026-11-18-avlf/produto-avaliacoes-publicas.png).
- [Formulário de hotel](../../evidencias-testes/2026-11-18-avlf/hotel-formulario.png) e [avaliação pública](../../evidencias-testes/2026-11-18-avlf/hotel-avaliacoes-publicas.png).
- [Formulário de sitter](../../evidencias-testes/2026-11-18-avlf/sitter-formulario.png) e [avaliação pública](../../evidencias-testes/2026-11-18-avlf/sitter-avaliacoes-publicas.png).

## Reprodução local

1. Usar um PostgreSQL descartável local com nome de banco contendo `test`; aplicar as migrations e gerar o Prisma Client da base integrada.
2. Definir RUN_DB_INTEGRATION_TESTS=true, DATABASE_URL local e JWT_SECRET exclusivo de teste. O gerador recusa bancos fora das regras do helper de integração.
3. Executar `node scripts/qa-reviews-fixture.js <caminho-temporario-json>` em backend. Não versionar o JSON com a sessão fictícia.
4. Iniciar a API em uma porta local. Gerar o build do frontend para o preview em localhost:4173.
5. Definir AVL_E2E_FIXTURE para o JSON e AVL_E2E_API para a URL local terminada em /api/v1.
6. Executar `npx playwright test e2e/reviews-real.spec.ts --workers=1 --timeout=60000` em frontend.

As três jornadas gravam avaliações. Gerar uma fixture nova antes de repetir os testes; não reutilizar uma origem que já foi avaliada. O proxy do teste encaminha as requisições do navegador à API local, preservando respostas reais. Os scripts não enviam e-mails nem acionam um gateway externo.

As capturas dos testes de avaliações usam as fontes de fallback; verificam organização e responsividade, sem comprovar o download das fontes de marca. O timeout de fontes da primeira rodada permanece registrado na evidência, sem ser apresentado como aprovação daquela execução.

## Limites e continuidade

A entrega cobre o comportamento local de AVL-F1/AVL-F2 e não significa aceite de toda a Sprint 5. A publicação depende da revisão e integração de todas as alterações locais, inclusive as migrations de etapas anteriores. Indicadores reais, demais correções de segurança, acessibilidade, infraestrutura e QA final permanecem no plano de retomada.

Os cenários reais de navegador são opt-in: sem as variáveis de fixture/API, são ignorados. A execução local com os três alvos não significa que esse conjunto já esteja provisionado no CI. A integração dessas fixtures ao pipeline e a validação da versão candidata fazem parte do fechamento de QA.
