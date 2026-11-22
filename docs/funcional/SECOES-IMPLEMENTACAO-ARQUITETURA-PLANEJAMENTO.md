# Textos para atualização do documento do projeto

Revisão em 17/10/2026, considerando a referência remota `origin/main`, atualizada para o commit `c1d53f0`. A branch de trabalho não foi mesclada nem atualizada com essas alterações; o conteúdo da main foi consultado diretamente pelo Git.

As seções abaixo estão prontas para transposição ao documento acadêmico. Elas distinguem implementação no backend, integração da interface e funcionalidades ainda planejadas. A consulta ao código não representa uma nova validação de produção ou do Mercado Pago Sandbox.

## 22. Implementação do Sistema

### 22.1. Front-end

O frontend do Pet+ é uma aplicação web desenvolvida com React 18, TypeScript e Vite, com estilização baseada em Tailwind CSS 4. A interface utiliza componentes reutilizáveis e apresenta funcionalidades conforme os perfis Administrador, Lojista, Hotel, Pet Sitter e Tutor. Essa organização favorece a manutenção e a evolução da aplicação; a adequação responsiva das telas é acompanhada durante os testes.

O código é organizado em componentes em `src/components/`, páginas em `src/pages/`, serviços de comunicação em `src/lib/services/` e hooks em `src/lib/hooks/`, além de contextos e configurações. A navegação utiliza React Router 7, com carregamento de páginas sob demanda e guardas de autenticação, perfil e andamento do onboarding. TanStack Query é utilizado nos fluxos contemplados para consulta, cache e atualização de dados do servidor.

As interfaces implementadas incluem páginas públicas de produtos e parceiros, cadastro, autenticação, recuperação de senha por e-mail, perfil do tutor, pets, endereços e favoritos. Também estão disponíveis carrinho de produtos, checkout integrado à criação de pedidos, acompanhamento de pedidos pelo tutor e pelo lojista, correção de cadastro recusado e funções administrativas de moderação. Para hotéis e Pet Sitters, a área “Meus Serviços” permite cadastrar, listar, editar e excluir logicamente serviços, além de configurar a política de cobrança presencial ou antecipada.

A comunicação com o backend ocorre por requisições HTTP, com troca de dados em JSON. As operações privadas enviam o JWT armazenado no navegador no cabeçalho de autorização. A autenticação de usuários e a autorização das operações também são verificadas pelo backend. Algumas áreas, como agenda, financeiro e parte dos indicadores, ainda utilizam dados demonstrativos e não devem ser consideradas integralmente integradas.

### 22.2. Back-end

O backend do Pet+ utiliza Node.js e Express 5 e disponibiliza uma API HTTP organizada predominantemente em camadas de responsabilidade. As rotas definem os endpoints e aplicam middlewares; os controllers recebem as requisições e tratam as respostas; os use cases concentram regras de negócio; e os repositories encapsulam parte das operações de persistência. O acesso ao PostgreSQL utiliza Prisma ORM, inclusive em consultas realizadas diretamente por alguns controllers e use cases. Schemas Zod auxiliam a validação das entradas nos fluxos contemplados.

A API atende autenticação, recuperação de acesso, perfil, pets, endereços, favoritos, parceiros, produtos, carrinho, pedidos, serviços e agendamentos. O fluxo de pedidos cria um pedido por lojista e executa a criação dos itens, a baixa de estoque e a limpeza do carrinho em uma transação. O pagamento simulado está disponível, e a integração opcional com Mercado Pago opera em ambiente de teste.

O backend de serviços permite a gestão pelos hotéis e Pet Sitters aprovados. O backend de agendamentos permite criar e consultar atendimentos e alterar seu status, verificando a propriedade dos dados e as transições permitidas. Na criação, a política PRESENCIAL resulta em CONFIRMADO e a política PRE_PAGO resulta em AGUARDANDO_CONFIRMACAO. O estorno apresentado por esse fluxo ainda é simulado e retornado na resposta, sem integração financeira nem registro persistente próprio de estorno.

Os principais contratos incluem:

- **Autenticação e recuperação:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/forgot-password` e `POST /api/v1/auth/reset-password`.
- **Perfil e senha:** `GET/PUT /api/v1/users/me`, `PATCH /api/v1/users/me/password` e `POST /api/v1/users/me/avatar`.
- **Pets:** `GET/POST /api/v1/users/me/pets` e `GET/PUT/DELETE /api/v1/users/me/pets/:id`.
- **Endereços:** `GET/POST /api/v1/addresses`, `PUT/DELETE /api/v1/addresses/:id` e `PATCH /api/v1/addresses/:id/default`.
- **Parceiros:** listagens e detalhes em `/api/v1/providers`; atualização do próprio perfil por `PUT /api/v1/providers/me` e `PUT /api/v1/providers/profile`; moderação administrativa por `PATCH /api/v1/providers/:id/status`.
- **Favoritos:** `GET/POST /api/v1/favorites` e `DELETE /api/v1/favorites/:type/:targetId`.
- **Produtos:** `GET/POST /api/v1/products`, `GET/PUT/DELETE /api/v1/products/:id` e `GET /api/v1/products/provider`.
- **Carrinho:** `GET/DELETE /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH/DELETE /api/v1/cart/items/:itemId` e `POST /api/v1/cart/merge`.
- **Pedidos:** `POST/GET /api/v1/orders`, `GET /api/v1/orders/received` e `PATCH /api/v1/orders/:id/status`.
- **Pagamento de pedidos:** `POST /api/v1/orders/:orderId/pay`, `POST /api/v1/orders/:orderId/payment-preference`, `GET /api/v1/orders/:orderId/payment-status` e `POST /api/v1/orders/webhook`.
- **Serviços:** `GET/POST /api/v1/providers/services` e `PUT/DELETE /api/v1/providers/services/:id`.
- **Agendamentos:** `POST/GET /api/v1/appointments`, `GET /api/v1/appointments/:id` e `PATCH /api/v1/appointments/:id/status`.
- **Diagnóstico:** `GET /api/health`, com verificação de conexão com o banco.

O `authMiddleware` valida o JWT nas rotas privadas, enquanto o `adminMiddleware` restringe operações administrativas. A confirmação por webhook utiliza assinatura própria do provedor. O projeto também possui tratamento centralizado de erros, logs estruturados, métricas, proteção de cabeçalhos HTTP e limitação de requisições de autenticação. A documentação interativa dos endpoints anotados está disponível no Swagger em [Documentação da API Pet+](https://api-petplus.up.railway.app/api-docs/). A presença da rota no código não garante que todo contrato esteja integralmente descrito nas anotações do Swagger.

### 22.3. Integração

A integração utiliza a comunicação HTTP entre a aplicação React e a API Express, com dados em JSON. Ao realizar uma ação, a interface chama o serviço correspondente e processa a resposta para atualizar os dados exibidos e informar carregamento, sucesso ou erro. Nas operações privadas, o JWT é enviado no cabeçalho `Authorization`, no formato `Bearer`. Cadastro, login e solicitação de recuperação são exemplos de operações públicas e não exigem token de sessão prévio.

O backend valida a entrada e as permissões aplicáveis, executa a regra de negócio e utiliza Prisma para consultar ou persistir dados no PostgreSQL. O frontend não se conecta diretamente ao banco nem recebe suas credenciais. A Vercel hospeda a aplicação web, e a Railway hospeda a API e o banco de dados. As configurações variam por ambiente, e as alterações de estrutura do banco são mantidas em migrations versionadas.

Na jornada de compra, o carrinho anônimo é combinado com o carrinho da conta após a autenticação. O checkout cria pedidos reais e acompanha o pagamento no modo disponível. Quando o Mercado Pago Sandbox está habilitado, o usuário é encaminhado ao checkout hospedado, e a confirmação depende de webhook validado e consulta ao provedor; a interface consulta o estado no backend. Resend atende os envios de recuperação de senha e de recusa de cadastro com orientação de correção.

A gestão de serviços já possui integração entre tela e API. Os endpoints de agendamento também foram implementados, mas sua disponibilidade no backend não representa a conclusão das telas de reserva, acompanhamento pelo tutor e agenda do parceiro. A integração dessas jornadas, as avaliações reais de clientes e os painéis alimentados integralmente por dados reais permanecem nas próximas entregas.

## 20. Arquitetura Geral do Sistema

O Pet+ utiliza uma arquitetura cliente-servidor com três camadas principais: apresentação, aplicação e dados. A camada de apresentação corresponde à aplicação web React; a camada de aplicação corresponde à API Node.js/Express, responsável pelas regras de negócio, permissões e integrações; e a camada de dados corresponde ao PostgreSQL, acessado pelo backend por Prisma ORM. Essa divisão separa responsabilidades e favorece manutenção e evolução, sem representar, por si só, uma garantia de escalabilidade ou desempenho.

Os domínios funcionais atravessam frontend e backend. Um módulo de produtos, por exemplo, possui interface no navegador e operações na API. A divisão abaixo identifica suas responsabilidades e o estágio atual da implementação.

### Módulos do back-end

- **Autenticação e usuários:** cadastro público de tutores e parceiros, login, recuperação de senha, identificação de perfil e operações de dados pessoais. As permissões são verificadas conforme a operação e a propriedade dos dados.
- **Parceiros e moderação:** cadastro comercial, perfil público, análise administrativa, candidaturas de Pet Sitters, recusa com motivo e reenvio para revisão.
- **Pets, endereços e favoritos:** manutenção dos dados do tutor e de suas preferências, com verificações de propriedade e validações nos fluxos contemplados.
- **Produtos e carrinho:** catálogo, preço, estoque, gestão de produtos e carrinho persistente, incluindo a combinação dos itens selecionados antes do login. A restrição completa de criação e publicação por lojista aprovado permanece pendente de consolidação na PRD-2.
- **Pedidos e pagamentos:** geração transacional de pedidos por lojista, consulta e atualização de status, pagamento simulado e integração opcional com Mercado Pago Sandbox.
- **Serviços e agendamentos:** gestão de serviços de hotéis e Pet Sitters, configuração da política de cobrança e endpoints de criação, consulta e atualização de atendimentos. O pagamento e o estorno de agendamentos ainda exigem evolução além da resposta simulada existente.
- **Integrações e operação:** envio de e-mails pelo Resend, consulta de CEP, logs, diagnóstico de saúde, métricas e integração opcional com Sentry.

### Módulos do front-end

- **Catálogo e perfis públicos:** apresentação de produtos, hotéis e Pet Sitters, detalhes e favoritos. Alguns campos de avaliação e distância ainda precisam ser removidos ou substituídos por dados reais; a publicação consistente dos serviços no detalhe depende da SRV-Fpub.
- **Conta e dados do tutor:** cadastro, autenticação, recuperação de acesso, perfil, pets e endereços.
- **Carrinho, checkout e pedidos:** seleção de produtos, autenticação para finalizar, criação de pedidos, pagamento no modo habilitado e acompanhamento da compra. Agendamentos seguem um fluxo próprio, separado do carrinho de produtos.
- **Painel do parceiro:** perfil comercial, gestão de produtos e pedidos para lojistas e gestão de serviços e política de cobrança para hotéis e Pet Sitters. Agenda, financeiro e parte dos indicadores ainda possuem conteúdo demonstrativo.
- **Administração e onboarding:** moderação de parceiros, candidaturas de Pet Sitters, consulta de usuários e correção de cadastro recusado. O tratamento completo dos estados e a visualização das fotos das candidaturas ainda possuem ajustes pendentes.

## Parte 02. Planejamento do Semestre

O planejamento do semestre foi organizado em etapas para consolidar a base técnica e evoluir as principais jornadas do Pet+. A fase inicial concentrou-se nas permissões do carrinho, na proteção de dados sensíveis, na padronização dos estados dos parceiros, nas configurações de ambiente, nas migrations do banco e na identificação das telas demonstrativas. Essas frentes formaram a base para os fluxos transacionais implementados posteriormente.

Nas Sprints 2 e 3, a equipe avançou da estrutura inicial para operações integradas de compra e gestão. Foram implementados o checkout conectado à criação de pedidos, o pagamento simulado, o acompanhamento de pedidos pelo tutor e pelo lojista, o envio de e-mails de recuperação e recusa de cadastro e o processo de correção e reenvio. Também foram desenvolvidas a gestão de serviços no backend e na interface, a configuração de política de cobrança, o cálculo e os endpoints de agendamento e os tratamentos de erro do checkout. A integração opcional com Mercado Pago Sandbox foi acrescentada ao fluxo de pedidos e depende do aceite externo do ambiente configurado.

As próximas etapas devem completar a jornada de agendamento nas telas do tutor e do parceiro, evoluir pagamento e estorno de atendimentos pré-pagos e implementar avaliações reais vinculadas a compras ou serviços concluídos. Também permanecem previstas a substituição dos indicadores demonstrativos, a conclusão dos filtros de publicação e aprovação de parceiros, a apresentação consistente dos serviços no detalhe público e a consolidação das regras ainda parcialmente atendidas.

Ao final do semestre, o objetivo é apresentar as jornadas priorizadas de compra e contratação de serviços integradas entre interface, API e banco de dados. O fechamento inclui revisão de segurança, infraestrutura, acessibilidade, responsividade e testes de integração e ponta a ponta. O aceite deve considerar as evidências de funcionamento de cada entrega, distinguindo funcionalidades concluídas, validações externas pendentes e recursos opcionais, sem tratar a conclusão de uma sprint como comprovação automática de todos os seus critérios.

## Situação Atual do Projeto

O Pet+ já possui uma base funcional e fluxos transacionais de compra conectados ao backend. Estão disponíveis autenticação por perfil, recuperação de senha por e-mail, gestão de pets e endereços, favoritos, perfis comerciais e recursos administrativos. A estrutura técnica inclui migrations versionadas, configuração por ambiente, logs, testes automatizados e integração contínua.

O checkout deixou de ser uma simulação exclusivamente visual. Atualmente, o sistema cria pedidos e itens persistidos no PostgreSQL, baixa o estoque e limpa o carrinho em uma transação, gerando um pedido por lojista. O tutor consulta os próprios pedidos, e o lojista acompanha os pedidos recebidos e altera seus estados conforme as regras aplicáveis. O pagamento simulado está implementado; a integração opcional com Mercado Pago Sandbox também possui implementação, mas ainda exige validação externa do fluxo configurado. Isso não equivale à disponibilização de cobrança real ou repasse financeiro aos lojistas.

No relacionamento com parceiros, estão implementados os envios de recuperação de senha e de recusa de cadastro pelo Resend, além do registro de motivo e do reenvio para análise. Hotéis e Pet Sitters aprovados já dispõem da tela de gestão de serviços, com criação, listagem, edição e exclusão lógica, e de configuração da política de cobrança. O backend de agendamento já permite criação, consulta e alteração de estado, com cálculo do valor e verificações de propriedade; o estorno previsto nesse fluxo ainda é apenas simulado e não possui registro persistente próprio.

A jornada de serviços ainda precisa ser concluída na interface de contratação, no acompanhamento dos agendamentos do tutor e na agenda operacional do parceiro. Também permanecem entregas para avaliações reais de clientes, indicadores financeiros e operacionais com dados reais e conclusão dos filtros de aprovação e exposição pública. Há refinamentos específicos em onboarding, dados comerciais, validação de documentos e uniformidade das regras de segurança. Algumas telas continuam demonstrativas, apesar da existência dos recursos correspondentes na modelagem ou na API.

O trabalho atual está concentrado em completar essas integrações e consolidar as jornadas já implementadas. A etapa final deverá incluir evidências de testes e validação de cada fluxo, evitando apresentar como futuras as funcionalidades já entregues ou como concluídos os recursos que ainda dependem de integração, correção ou aceite externo.

## Referência das entregas consideradas nesta atualização

Esta tabela é apoio à atualização do documento e não precisa integrar o texto acadêmico.

| Sprint | Task | Evidência no código consultado |
| --- | --- | --- |
| 2 | PAG-1 | Confirmação simulada de pagamento de pedidos. |
| 2 | EML-1 | Resend integrado à recuperação de senha. |
| 2 | CHK-2 | Checkout cria pedidos e navega para confirmação e acompanhamento. |
| 2 | UX-2 | Histórico de alterações de favoritos e consistência de estado. Não representa uma nova auditoria visual global. |
| 2 | AGD-1 | Estados, política de pagamento e cálculo de agendamento. |
| 2 | REC-1 | Motivo, e-mail de recusa e reenvio para EM_REVISAO. |
| 2 | PED-F | Pedidos de tutor e parceiro consultados na API. |
| 2 | REC-2 | Tela autenticada de correção; ainda há refinamentos de retorno após login. |
| 3 | SRV-1 | CRUD de serviços com restrição de perfil, aprovação e propriedade. |
| 3 | PGT-1 | Gateway opcional para pedidos de produtos, restrito a teste; aceite externo não comprovado nesta revisão. |
| 3 | SRV-F1 | Página Meus Serviços, criação/listagem e seletor de política com persistência. |
| 3 | SRV-F2 | Edição de serviço e exclusão com confirmação pela interface. |
| 3 | CHK-3 | Novos tratamentos de erro e disponibilidade no checkout. |
| 3 | AGD-2 | Rotas, controller, schemas e use cases de agendamento em `/api/v1/appointments`. |
| 3 | PRD-2 | Não consolidada na main consultada: criação ainda verifica existência de provider, e vitrine filtra apenas produto ACTIVE. |
| 3 | SRV-Fpub | Não concluída na main consultada: detalhes públicos ainda mantêm valores fabricados e a integração dos serviços não está consistente entre as telas. |

Fontes principais da consulta: `origin/main:backend/src/app.js`, `origin/main:backend/src/useCases/appointments/`, `origin/main:frontend/src/pages/dashboard/Services.tsx`, `origin/main:frontend/src/pages/CheckoutPage.tsx`, `origin/main:frontend/src/app/routes.tsx`, `origin/main:backend/src/useCases/products/` e os documentos das Sprints 2 e 3.
