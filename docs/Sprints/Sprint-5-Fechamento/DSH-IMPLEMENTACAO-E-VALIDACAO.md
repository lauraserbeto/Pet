# DSH-1 / DSH-2 — Painéis com dados reais

Implementação local em 19/11/2026 na branch `tasks-laura`, sobre a main `d593b03` e as entregas locais anteriores. Sem commit, push, publicação ou acesso ao banco de produção. Nenhuma migration nova foi necessária nesta etapa.

## Diagnóstico e escopo

O administrador já tinha métricas reais de usuários, parceiros, moderação, catálogo e engajamento. Essa implementação foi preservada. Faltava o bloco comercial, deliberadamente omitido no controller antigo. Os painéis Overview e Finance do parceiro ainda usavam agendamentos, valores, gráficos e transações fixos.

Foram implementados o endpoint privado do parceiro e um repositório compartilhado de comércio, também consumido pelo administrador. Overview e Finance passam a usar o mesmo contrato, com carregamento, erro, nova tentativa, vazio, escolha de período e atualização manual. O administrador recebe os novos indicadores sem perder as seções anteriores.

## Definições dos indicadores

### Período e contagem

- `days` aceita inteiro entre 1 e 365, com padrão 30. A interface oferece 7, 30 e 90 dias.
- A janela começa à meia-noite do primeiro dia civil de **America/Sao_Paulo** e termina no instante capturado no início da requisição. Não depende do fuso configurado no processo Node ou no navegador.
- Pedidos, agendamentos, estados, serviços contratados e registros recentes usam `created_at`. Um atendimento futuro criado no período entra na contagem; isso não significa que foi realizado nesse período.
- A distribuição de serviços inclui todos os estados dos agendamentos, inclusive cancelamentos e recusas. Não é uma contagem de atendimentos concluídos nem uma avaliação dos serviços.
- Os registros recentes têm limite de dez, ordenados por criação e ID. Totais, médias e série diária abrangem a janela completa, sem esse limite. O atendimento também apresenta sua data agendada.
- Os contadores institucionais já existentes no administrador continuam sendo totais globais. Novos usuários, crescimento e comércio usam o período escolhido; não foi apresentada a totalidade desses contadores como se fosse um recorte temporal.

### Vendas reconhecidas de produtos

A especificação antiga dizia “somente status pago”. Aplicar literalmente `status = PAGO` retiraria uma venda do total quando o lojista começasse a preparar ou enviasse o pedido. A regra compartilhada considera os estados canônicos **PAGO, PREPARANDO, ENVIADO e CONCLUIDO**, e exclui cancelados, aguardando pagamento e outros estados.

Quando há `PaymentAttempt`, ela precisa estar APPROVED. Um pedido legado inconsistente em estado pago com tentativa PENDING, por exemplo, não é reconhecido. Pedidos sem tentativa registrada continuam sendo classificados pelo estado: o pagamento simulado de Order não possui um lançamento financeiro próprio persistido, e não se inventou sua origem ou data.

O valor usa `Order.total_price` congelado, nunca o preço atual do produto. O ticket médio divide esse total pela quantidade de pedidos reconhecidos. A série diária soma os valores em centavos por dia, preenchendo dias sem vendas com zero. O total com tentativa aprovada no Mercado Pago Sandbox também é informado separadamente.

**A janela é pela criação do pedido, não pelo pagamento.** Não existe `paid_at` para todos os pedidos atuais, e `updated_at` mudaria ao avançar o status. Por isso a tela utiliza “Vendas reconhecidas”, explica o critério e não apresenta um fluxo de caixa, receita líquida de produção, saldo disponível, comissão ou repasse. O valor pode mudar quando pedidos desse período são pagos ou cancelados.

Os registros do gateway continuam refletindo a conciliação já implementada. Esta entrega não resolve estorno/contestação do gateway que exige conciliação manual, não altera estoque e não fecha os itens de integridade de Order do plano de retomada.

### Pré-pagamentos de agendamentos

Os pagamentos de Appointment da PAG-2 possuem registro próprio e **continuam separados das vendas de produtos**:

- Aprovações no período: soma de `amount` pela data `paid_at`, incluindo pagamentos posteriormente estornados.
- Estornos no período: soma pela data `refunded_at` dos registros REFUNDED.
- Saldo de eventos no período: aprovações menos estornos. Pode ser negativo quando uma devolução atual corresponde a pagamento anterior à janela.
- O modo é SIMULATED. Reservas presenciais não são inferidas como pagas a partir do estado CONCLUIDO.

Lojista visualiza vendas de produtos. Hotel e Pet Sitter visualizam agendamentos e seus pagamentos simulados. O administrador visualiza os dois grupos, sem somá-los em um saldo financeiro único. A tela informa que os valores não representam dinheiro recebido em produção ou saldo para saque.

## Implementação e segurança

| Camada | Alteração |
| --- | --- |
| Utilitário commerceMetrics | Janela/fuso, estados reconhecidos, série monetária e eventos de pagamento/estorno |
| CommerceMetricsRepository | Agregações, contagens, série, serviços e seleções mínimas dos registros recentes |
| GetProviderMetricsUseCase | Papel 2/3/4, parceiro aprovado, escopo pelo usuário autenticado e leitura RepeatableRead |
| ProviderController/routes | GET /api/v1/providers/me/metrics?days=N, autenticação, validação Zod e Swagger |
| AdminController | Acrescenta commerce à resposta existente, com a mesma regra e leitura comercial RepeatableRead |
| adminMetrics | Crescimento diário alinhado ao mesmo fuso; contrato de datas YYYY-MM-DD preservado |
| Serviços/hooks frontend | Tipos compartilhados; httpClient; cache por conta e período; refetch ao voltar à tela e atualização manual |
| Painéis | Componente comum para indicadores, série, tabela diária acessível, estados, serviços e registros recentes |

O cliente não escolhe o provider do endpoint privado. `provider_id` extra na query não substitui o escopo obtido da sessão. Conta ativa e papel atual continuam sendo consultados pelo middleware existente. Perfil não parceiro, parceiro ausente/não aprovado e acesso ao endpoint admin por parceiro são recusados. O admin continua protegido por authMiddleware/adminMiddleware.

Não são retornados hash, documento, endereço, telefone ou dados pessoais do tutor nas métricas. As seleções recentes contêm apenas identificador, datas, estado, valor e nome do serviço quando aplicável. O administrador não recebe a lista recente de cada parceiro.

Uma leitura comercial usa snapshot RepeatableRead para manter seus totais, série e registros consistentes entre si. Os contadores institucionais do admin permanecem consultas independentes; a resposta inteira não foi transformada em um snapshot único. A execução de Promise.all dentro da transação não significa paralelismo de consultas na mesma conexão.

A plataforma administrativa inclui o histórico de todos os parceiros, inclusive cadastros posteriormente bloqueados. A igualdade com a soma dos parceiros exige considerar o mesmo conjunto de proprietários e a mesma janela, não somente os parceiros ainda autorizados a abrir seu painel.

## Interface

Os arrays `appointments`, `revenueData`, `servicesData`, `mockKPIs`, `mockChartData` e `mockTransactions` foram removidos das duas telas do parceiro. Não permanecem saldo/saque, taxa, evolução percentual ou transações inventadas. Também saíram a data fixa, o botão sem ação de Novo Agendamento e controles de extrato/histórico sem funcionalidade.

Os atalhos levam a `/dashboard/orders`, `/dashboard/schedule` ou `/dashboard/financeiro`, conforme perfil e tela. Financeiro possui proteção de rota para os três papéis de parceiro. Um erro de API apresenta nova tentativa, sem ser convertido em uma lista vazia ou valores zero. A lista diária em tabela permite consultar os dados do gráfico sem depender de interação com o desenho. Valores negativos de eventos simulados são apresentados como tais.

## Critérios e evidências executáveis

| Critério | Verificação |
| --- | --- |
| Pedido continua na receita após preparação/envio/conclusão | commerceMetricsDb.test.js: quatro estados reconhecidos no mesmo parceiro |
| Cancelado, não pago, tentativa não aprovada e fora da janela ficam fora | Dataset com valores elevados excluídos; esperado R$ 60,60, cinco pedidos reconhecidos e ticket R$ 12,12 |
| Administrador e parceiro usam a mesma regra | Teste com dois lojistas: R$ 60,60 + R$ 30,30 = R$ 90,90; comparação com soma direta no banco |
| Janela civil e centavos corretos | commerceMetrics.test.js: virada UTC/SP, meia-noite, zero diário e R$ 0,10 + R$ 0,20 |
| Pagamento e estorno mantêm datas próprias | Teste unitário com saldo negativo e teste PostgreSQL com hotel/sitter isolados |
| Escopo e autorização | HTTP real: 401, tutor/admin no endpoint privado, parceiro no endpoint admin, parceiro pendente, query tentando outro provider e days inválido |
| Vazio honesto | Endpoint sem operações; componente com zeros/ausência de registros; navegador do parceiro sem operações |
| Dez recentes não truncam total | Doze pedidos: dez recentes e total/soma dos doze, também no endpoint admin |
| Interface usa contrato real | Dez testes de componentes: valores, períodos, retry, carregamento, cache por usuário, tutor bloqueado e modos de parceiro/admin |
| Persistência chega à tela | metrics-real.spec.ts: lojista, hotel, sitter, parceiro sem operações e admin; API e PostgreSQL locais, sem simulação de resposta comercial |

## Validação local

- PostgreSQL 16 descartável em 127.0.0.1:55445, banco petplus_test; dez migrations da base integrada aplicadas e Prisma Client gerado. Nenhuma migration adicional da DSH.
- **462 testes de backend aprovados, zero falhas/ignorados.** Inclui quatro novos testes unitários e quatro testes com API/PostgreSQL reais.
- **149 testes de frontend aprovados em 24 arquivos.** Execução com threads, um worker, sem paralelismo entre arquivos e limite local de 15 segundos por teste.
- Dez testes dos painéis aprovados. O ambiente jsdom precisou de ResizeObserver simulado para os componentes Recharts; o gráfico da aplicação não foi modificado para satisfazer o teste.
- As primeiras tentativas dos novos testes de banco usaram dois helpers internos que não eram exportados. Foram corrigidas para usar o helper público de lojista e contas de teste; a execução completa acima passou após o ajuste.
- Typecheck/build aprovados. Mantido o aviso do Vite de chunk acima de 500 kB.
- Lint completo: backend com zero erros/quatro avisos; frontend com zero erros/129 avisos. A remoção dos mocks não representa uma limpeza de todo o lint.
- Varredura das telas/componentes novos sem dados mock, data fixa, saldo disponível, saque ou extrato fictício.

- Navegador sobre o build final: **31 cenários aprovados, zero falhas e sete ignorados**, em 1,4 minuto. Foram habilitados os cinco cenários DSH com API/PostgreSQL reais; os sete BKG/SCH/AVL reais não receberam suas fixtures nesta rodada e não foram apresentados como reexecutados. Os outros 26 cenários usam as estratégias existentes de smoke, acessibilidade e respostas controladas.
- Os cinco cenários DSH conferiram os totais conhecidos, mudança de período com resposta HTTP 200, atualização, navegação entre painéis e ausência de overflow horizontal. Lojista/admin em 1280 px; hotel/sitter/loja sem operações em 390 px. As capturas foram inspecionadas.
- Conferência adicional da série: os mesmos cinco cenários passaram novamente (28,5 segundos), incluindo caminho SVG efetivamente desenhado e tabela diária com R$ 60,60 no lojista e R$ 90,90 no admin. As duas capturas de gráfico/tabela foram inspecionadas. Esse reteste não foi somado aos 31 casos únicos da regressão.
- A auditoria existente da landing permanece com uma violação séria de contraste em oito elementos, sem violações críticas. Não foi declarada conformidade completa de acessibilidade.

### Evidências

- [Backend — 462 testes](../../evidencias-testes/2026-11-19-dsh-backend-tests.log).
- [Frontend — 149 testes](../../evidencias-testes/2026-11-19-dsh-frontend-tests.log).
- [Regressão de navegador — 31 aprovações e sete cenários opt-in ignorados](../../evidencias-testes/2026-11-19-dsh-e2e-regressao.log).
- [Financeiro do lojista](../../evidencias-testes/2026-11-19-dsh/lojista-financeiro.png), [hotel](../../evidencias-testes/2026-11-19-dsh/hotel-financeiro.png), [sitter](../../evidencias-testes/2026-11-19-dsh/sitter-financeiro.png) e [loja sem operações](../../evidencias-testes/2026-11-19-dsh/vazio-financeiro.png).
- [Indicadores institucionais e comércio no administrador](../../evidencias-testes/2026-11-19-dsh/admin-overview.png).
- [Reteste dos cinco painéis com a série diária](../../evidencias-testes/2026-11-19-dsh-e2e-paineis.log), [gráfico/tabela do lojista](../../evidencias-testes/2026-11-19-dsh/lojista-serie-diaria.png) e [gráfico/tabela do admin](../../evidencias-testes/2026-11-19-dsh/admin-serie-diaria.png).

## Reprodução

1. Usar PostgreSQL local descartável e uma base de teste vazia com as migrations aplicadas. O gerador não limpa registros existentes: dados anteriores alteram os totais globais esperados pelo teste do admin.
2. Definir RUN_DB_INTEGRATION_TESTS=true, DATABASE_URL local e JWT_SECRET de teste.
3. Em backend, executar `node scripts/qa-metrics-fixture.js <arquivo-json-temporario>` e iniciar a API local com a mesma chave/banco. O helper recusa host não local ou nome de banco sem test.
4. Gerar o build do frontend; o Playwright usa preview em localhost:4173.
5. Definir DSH_E2E_FIXTURE para o JSON e DSH_E2E_API para a URL local terminada em /api/v1. Executar `npx playwright test e2e/metrics-real.spec.ts --workers=1 --timeout=60000`.
6. Remover a fixture com sessões fictícias e encerrar os recursos locais ao terminar. Não usar credenciais ou registros de produção.

O novo teste usa fonte de fallback nas capturas para não depender da rede do Google Fonts, mantendo as respostas reais de negócio. Os cenários de banco usam o helper existente para trava e limpeza isolada; não se destinam ao ambiente publicado.

## Limites e continuidade

O aceite é local, sem publicação. Os testes reais de navegador são opt-in e ainda precisam de provisionamento no CI. Os cálculos não foram benchmarkados em volume de produção; a série agrupa os timestamps do período e bucketiza os dias na aplicação, conforme a estratégia do projeto.

Continuam no plano os demais itens de integridade de pedidos, política de senha/termos/documentos, exclusões, hardening, infraestrutura, acessibilidade e QA global. Esta entrega não declara toda a Sprint 5 concluída nem valida o envio de e-mails ou o Mercado Pago externo.
