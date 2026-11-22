# E-19 — Paginação e totais reais dos pedidos

Entrega local de 22/11/2026 sobre `d593b03`, branch `codex/retomada-servicos`, preservando todas as alterações anteriores. Sem commit, push, deploy, migration nova ou acesso ao banco publicado.

## Reprodução e correção

`Orders` e `TutorOrders` chamavam a listagem sem página/limite e recebiam os primeiros 20 pedidos. O service descartava os metadados; o parceiro calculava total, pendências, receita e busca sobre esse recorte. Os botões antigos Anterior/Próximo estavam permanentemente desabilitados.

As duas telas passam a navegar por páginas reais de 20 registros, com componente compartilhado `OrdersPagination`, total e posição atuais, limites de navegação e tratamento de carregamento/erro/retry. O cache inclui usuário e página; no parceiro também inclui a busca. Não é reutilizado o recorte anterior como se fosse a página nova. Quando a quantidade de páginas diminui, a página atual é ajustada e consultada novamente. Detalhes, pagamento e avaliações existentes foram preservados.

A busca do parceiro é enviada ao servidor com Enter ou **Buscar pedidos**; limpar o campo restaura a lista. Encontra ID parcial, nome ou e-mail do cliente em todos os pedidos próprios, não só nos carregados. Nova busca volta à página 1. `%`, `_` e barra invertida são tratados literalmente, sem permitir curinga involuntário. O SQL do ID parcial é parametrizado e restrito ao provider autenticado.

O rodapé fictício foi substituído pela paginação funcional, sem dois conjuntos de botões. Os indicadores não dependem da página nem do filtro de busca; a contagem da lista, por outro lado, informa quantos pedidos correspondem à busca.

## Contrato e definições

- `GET /orders?view=page&page=1&limit=20`: `{ orders, total, page, limit, totalPages }` do tutor autenticado.
- `GET /providers/orders?view=page&page=1&limit=20&q=...`: mesmo envelope, com `summary`. `/orders/received` conserva o alias.
- Sem `view`, o corpo continua um array e os cabeçalhos `X-Total-Count`, `X-Page`, `X-Limit`, `X-Total-Pages` permanecem. Consumidores legados não precisam mudar.
- Query inválida retorna 422, em vez de ser silenciosamente substituída pelos padrões. Página máxima de 1.000.000 evita offsets fora da faixa suportada; limite permanece 1–100 e busca tem até 100 caracteres.
- Ordenação: `created_at DESC, id DESC`, com desempate estável quando vários pedidos têm a mesma data.
- `summary.totalOrders`: todos os pedidos da loja, em todos os períodos/estados.
- `summary.pendingOrders`: estados oficiais AGUARDANDO_PAGAMENTO, PAGO, PREPARANDO e ENVIADO, em todos os períodos.
- `summary.monthlyRevenue`: soma reconhecida conforme o helper DSH `paidOrdersWhere`, por criação no mês civil corrente em America/Sao_Paulo, até o momento da consulta. PAGO/PREPARANDO/ENVIADO/CONCLUIDO, com tentativa aprovada ou sem tentativa legada; não inclui cancelamento, pendência, tentativa não aprovada ou registros fora da janela. Não representa saldo disponível nem recebimentos bancários do mês.
- Sem registros, a API informa `total=0`, `totalPages=0`; o controle apresenta página 1 de 1 com navegação desabilitada.

O service valida o novo envelope e os indicadores obrigatórios do parceiro. Resposta antiga/malformada é exibida como erro, não convertida em histórico vazio ou indicadores zero. Erro de carregamento não é confundido com lista vazia. Não há nova rota pública nem ampliação do escopo de dados acessíveis.

## Arquivos

Backend: `OrderController`, `ListCustomerOrdersUseCase`, `ListProviderOrdersUseCase`, `orderSchemas`, documentação Swagger de `orderRoutes`/`providerRoutes`, teste `orderPaginationDb.test.js` e helper `qa-order-pagination-fixture.js`.

Frontend: `orderService`, `Orders`, `TutorOrders`, novo `OrdersPagination`; testes de páginas/contrato, adaptação dos testes existentes de endereço de entrega ao novo método paginado; E2E opt-in `orders-pagination-real.spec.ts`.

## Critérios e evidências

| Critério | Verificação |
| --- | --- |
| Mais de 20 pedidos acessíveis | PostgreSQL com 25 pedidos do tutor e 26 da loja; páginas 20+5 e 20+6. Navegador percorre as duas páginas nos dois perfis. |
| Totais globais e isolamento | Loja com 26 pedidos, 25 pendentes e receita 202,00; outra loja com pedido de 800 não entra. Indicadores permanecem ao mudar de página ou buscar. |
| Busca além da primeira página | Cliente exclusivo no pedido mais antigo é localizado por nome e ID parcial; total filtrado 1 sem alterar indicadores globais. `%` não retorna todos os pedidos. |
| Empates | Datas iguais, dois recortes sem duplicação e mesma ordem na repetição da página. |
| Vazio e página excedente | API preserva total mesmo em página sem linhas; conta sem pedidos retorna zero. |
| Compatibilidade e validação | Array/cabeçalhos legados preservados; página/limite/texto inválidos recusados; sem sessão recebe 401. |
| Resiliência da interface | Erro da segunda página aparece com retry; retry recupera a página correta. Resposta sem metadados não vira vazio. |

Resultados finais:

- **554/554 testes backend**, com PostgreSQL 16 e zero ignorados. O teste novo com banco também foi repetido após incluir os casos de página excedente, usuário sem pedidos e limite de offset.
- **198 testes frontend / 41 arquivos**, aprovados; cinco cenários novos de páginas/service, além dos dois testes existentes de detalhes de entrega adaptados.
- Typecheck/build aprovados. Lint completo sem erros: um aviso backend e 124 frontend. Avisos de chunk e terceiro no Zod permanecem.
- **Dois cenários Chromium aprovados**, em 1280 e 390 pixels, com API e PostgreSQL reais locais: tutor/parceiro, próxima página, bloqueio da última, indicadores globais e busca de cliente na segunda página. Quatro capturas com e-mails mascarados foram inspecionadas.

Na primeira regressão completa, o ambiente foi configurado com remetente fictício diferente daquele esperado por dois testes existentes de e-mail; a execução final usou o remetente de teste padrão, sem mudar os testes de e-mail nem enviar mensagens. Os testes antigos da tela do parceiro precisaram de contexto Auth/método paginado, preservando suas asserções de endereço. A inspeção das primeiras capturas identificou o rodapé antigo restante, removido antes da rodada final. Resultados incompletos não foram contados como aprovação.

Logs e capturas estão em `evidencias-e19/`, sem fixture, tokens ou credenciais. O runtime da rodada foi o Node global 24.18.0; não foi alterado globalmente. A referência de CI/INF-2 continua Node 24.22.3/npm 11.19.1.

## Reprodução e limites

Foi criado somente `petplus_e19_test` no PostgreSQL local existente em 127.0.0.1:55432. Os bancos `petplus_dev_test` e `petplus_ci_test` não foram usados nem limpos. As 15 migrations foram aplicadas nesse banco novo. Para reproduzir, usar explicitamente URL local de banco descartável, NODE_ENV=test, RUN_DB_INTEGRATION_TESTS=true e credenciais falsas para os serviços externos; nunca deixar o Prisma/API usar o `.env` publicado.

Executar o teste de banco novo; o helper de fixture pode então exportar as contas dessa massa para um arquivo temporário exclusivo, sem imprimir os tokens. O E2E exige `E19_FIXTURE`, API QA em 3319, build e preview em 4173. Sem a fixture, é explicitamente ignorado. O helper apenas exporta a massa já existente; o teste de integração usa a trava e a limpeza protegida dos helpers de banco.

A paginação usa offset; não cria snapshot congelado de toda a navegação enquanto novos pedidos entram. Não foi realizado benchmark ou criada migration de índice. A revisão geral do design system da tela, do checkout/sucesso, merge do carrinho e cache após compra pertence às próximas pendências. Sem validação de produção, serviços externos ou aceite de toda a sprint.

Encerramento: API/preview de QA parados, banco exclusivo `petplus_e19_test` e fixture com tokens removidos. O container `petplus-dev-local` original foi preservado em execução, sem apagar os outros bancos. HEAD/stash preservados e índice vazio. O diff dos arquivos desta entrega passou na verificação de whitespace; a verificação global identifica um espaço final preexistente em `Navbar.tsx:524`, arquivo não alterado nesta entrega.
