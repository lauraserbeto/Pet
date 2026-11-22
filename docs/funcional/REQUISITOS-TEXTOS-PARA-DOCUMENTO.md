# Textos revisados para o documento do projeto Pet+

Base da revisão: 15/10/2026, commit `176e5a4`. Estes blocos mantêm os IDs e as prioridades apresentados nas imagens. Cada bloco contém os campos para preencher a tabela e o texto para o parágrafo de detalhamento.

Complementação em 16/10/2026: detalhamentos individuais das regras de negócio RNE-009 a RNE-023.

Os status representam a situação identificada na leitura do código, sem nova validação de produção. “Parcialmente implementado” preserva a regra desejada e registra o que falta. Não significa que a regra deva ser reduzida para se adequar a uma falha.

**Ponto de alinhamento antes de copiar:** RNE-002 apresenta uma proposta de política única de senha, ainda não aplicada uniformemente. O time precisa aprovar essa política. Os novos IDs ao final também são sugestões e devem ser conferidos contra o documento completo.

## 13. Regras de negócio: substituição dos itens existentes

### RNE-001

**Descrição:** Todo usuário deve se cadastrar informando nome completo, e-mail, senha e tipo de perfil. O cadastro público deve permitir os perfis Tutor, Lojista, Hotel e Pet Sitter.

**Requisitos relacionados:** RF-001, RNF-001.

**Detalhamento:** Os perfis são identificados por `role_id`: Lojista = 2, Hotel = 3, Pet Sitter = 4 e Tutor = 5. O perfil Administrador, identificado por `role_id = 1`, não pode ser criado pelo cadastro público. O e-mail deve ser único na plataforma. Parceiros também devem informar os dados comerciais exigidos para seu tipo de cadastro.

### RNE-002: proposta sujeita ao alinhamento do time

**Descrição:** A senha do usuário deve possuir no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula e um número. Essa política deve ser aplicada no cadastro, na alteração e na recuperação de senha.

**Requisitos relacionados:** RF-001, RF-007, RF-016, RNF-001, RNF-008.

**Detalhamento:** A validação deve ocorrer no frontend e no backend antes da geração do hash. A implementação atual atende essa política na tela de cadastro e no backend de recuperação, mas o cadastro pela API ainda aceita senhas a partir de 6 caracteres e a alteração autenticada exige uma letra sem obrigatoriedade de maiúscula. A padronização dos fluxos permanece pendente.

### RNE-003

**Descrição:** Lojistas e hotéis devem informar CNPJ no cadastro. Pet Sitters podem informar CPF ou CNPJ. O sistema deve validar o documento conforme o tipo informado e impedir sua duplicação.

**Requisitos relacionados:** RF-001, RNF-001.

**Detalhamento:** O CPF é validado por formato e dígitos verificadores. Na implementação atual, o CNPJ recebe apenas verificação de tamanho de 14 dígitos; a validação matemática completa e a consulta cadastral externa não estão implementadas. Existe restrição de documento único no banco, mas a normalização do valor antes da persistência precisa ser ajustada para evitar duplicações decorrentes de diferenças de máscara. Esta regra está parcialmente atendida.

### RNE-004

**Descrição:** Todo parceiro deve iniciar o cadastro com status PENDENTE. O acesso às funcionalidades operacionais deve depender da aprovação administrativa, preservando o acesso necessário ao onboarding e à correção de cadastro recusado.

**Requisitos relacionados:** RF-002, RF-008, RF-009, RF-011, RF-012, RF-017.

**Detalhamento:** O cadastro comercial utiliza os estados PENDENTE, APROVADO, REJEITADO e EM_REVISAO. Lojistas e hotéis pendentes ou em revisão têm o login bloqueado. Pet Sitters podem autenticar antes da aprovação para preencher o onboarding. Parceiros rejeitados podem autenticar para corrigir os dados. A restrição operacional deve ser aplicada também no backend; o bloqueio completo de criação e publicação de produtos por lojista não aprovado ainda depende da PRD-2.

### RNE-005

**Descrição:** Somente o Administrador deve poder aprovar ou rejeitar cadastros de parceiros e revisar as candidaturas de Pet Sitters.

**Requisitos relacionados:** RF-009, RF-010.

**Detalhamento:** As operações administrativas exigem autenticação e o perfil `role_id = 1`. A recusa de cadastro comercial exige um motivo. O estado EM_REVISAO identifica o cadastro que foi corrigido e reenviado pelo parceiro após uma recusa, aguardando nova análise administrativa.

### RNE-006

**Descrição:** Pet Sitters devem enviar informações sobre experiência, fotos do ambiente e respostas ao questionário de onboarding para avaliação administrativa antes de sua habilitação operacional.

**Requisitos relacionados:** RF-008, RF-010, RF-012.

**Detalhamento:** A candidatura é registrada em `sitter_evaluations`, com experiência, fotos, respostas e status PENDING, APPROVED ou REJECTED. Ao enviar a candidatura, o progresso do usuário passa para IN_REVIEW. A aprovação altera o progresso para COMPLETED e o cadastro comercial para APROVADO. Os estados da avaliação, do progresso do onboarding e do cadastro comercial são controles distintos. A visualização das fotos reais no painel administrativo permanece pendente.

### RNE-007

**Descrição:** O tutor deve poder cadastrar até 10 pets vinculados à sua conta, informando obrigatoriamente nome e espécie. Raça, peso, data de nascimento e observações médicas são opcionais.

**Requisitos relacionados:** RF-004.

**Detalhamento:** O sistema deve restringir consulta, edição e exclusão dos pets ao respectivo proprietário. As espécies aceitas são DOG, CAT e OTHER. Quando informado, o peso deve ser maior que zero e de até 200 kg; a data de nascimento não pode ser futura. A exclusão deve respeitar os agendamentos vinculados. O bloqueio por agendamento ainda utiliza estados antigos em inglês e precisa ser atualizado para os estados atuais.

### RNE-008

**Descrição:** O usuário deve poder manter até 5 endereços vinculados à sua conta, com indicação de endereço principal e acesso restrito ao proprietário.

**Requisitos relacionados:** RF-005.

**Detalhamento:** Os endereços armazenam CEP, rua, número, complemento, bairro, cidade e estado. Número e complemento são opcionais no contrato de entrada atual. O primeiro endereço cadastrado é marcado como principal. A troca de endereço principal desmarca o anterior em uma transação. Ao excluir o principal, havendo outros endereços, o mais recente é promovido. O bloqueio de exclusão do único endereço por pedidos em andamento precisa de ajuste, pois consulta estados antigos em inglês.

## 14. Requisitos funcionais: substituição dos itens existentes

### RF-001

**Descrição:** O sistema deve permitir o cadastro de usuários como Tutor ou Parceiro, nas modalidades Lojista, Hotel e Pet Sitter.

**Status:** Parcialmente implementado.

**Prioridade:** Alta.

**Detalhamento:** O cadastro é realizado por `POST /api/v1/auth/register`, com nome completo, e-mail, senha e tipo de perfil. Parceiros também devem informar nome comercial, documento e tipo de documento. O sistema verifica a existência do e-mail e gera o hash da senha antes da persistência. O fluxo básico está implementado; permanecem pendentes a padronização da política de senha, a validação completa de CNPJ e o registro correto do aceite dos termos.

### RF-002

**Descrição:** O sistema deve autenticar o usuário com e-mail e senha, retornando um token de acesso e os dados necessários à identificação do perfil.

**Status:** Implementado.

**Prioridade:** Alta.

**Detalhamento:** A autenticação ocorre por `POST /api/v1/auth/login`. O sistema valida as credenciais e impede novo login de contas explicitamente desativadas. O JWT contém a identificação e o tipo de perfil do usuário, com expiração de 1 dia. O e-mail e demais dados necessários são retornados no objeto de usuário da resposta, sem exposição do hash da senha. O login de parceiros respeita as exceções de onboarding e correção de cadastro.

### RF-003

**Descrição:** O sistema deve direcionar o usuário após o login conforme seu perfil, o andamento do onboarding e o contexto de navegação que motivou a autenticação.

**Status:** Parcialmente implementado.

**Prioridade:** Alta.

**Detalhamento:** Administradores e parceiros habilitados são direcionados para `/dashboard`. Pet Sitters com onboarding incompleto são direcionados para `/onboarding/sitter`. Tutores acessam a página inicial ou retornam ao destino interno preservado, incluindo o contexto de compra. As páginas pessoais do tutor ficam sob `/tutor/...`. O retorno após login para a correção de cadastro recusado ainda requer ajuste específico para parceiros.

### RF-004

**Descrição:** O tutor deve poder cadastrar, consultar, editar e remover os próprios pets, respeitando os limites e as restrições de vínculo com agendamentos.

**Status:** Parcialmente implementado.

**Prioridade:** Alta.

**Detalhamento:** O CRUD está disponível em `/api/v1/users/me/pets`, com identificação individual por `/:id`. O sistema aplica limite de 10 pets, validações dos campos e verificação de propriedade. O CRUD está implementado; a proteção de exclusão de pets com agendamentos em andamento precisa ser alinhada aos estados atuais de agendamento.

### RF-005

**Descrição:** O usuário deve poder cadastrar, consultar, editar e remover os próprios endereços, além de definir um endereço principal.

**Status:** Parcialmente implementado.

**Prioridade:** Alta.

**Detalhamento:** O CRUD está disponível em `/api/v1/addresses`, com limite de 5 endereços por usuário. A definição do principal utiliza `PATCH /api/v1/addresses/:id/default`. O cadastro consulta o CEP e valida a unidade federativa. O CRUD e a gestão do principal estão implementados; o bloqueio de exclusão do único endereço enquanto houver pedidos em andamento precisa ser alinhado aos estados atuais dos pedidos.

### RF-006

**Descrição:** O tutor deve poder atualizar seus dados pessoais, incluindo nome, telefone e foto de perfil.

**Status:** Implementado.

**Prioridade:** Alta.

**Detalhamento:** Nome e telefone são atualizados por `PUT /api/v1/users/me`. O e-mail não pode ser alterado por essa rota. A foto de perfil pode ser enviada por `POST /api/v1/users/me/avatar`, em formato JPEG, PNG ou WebP, com limite aproximado de 2 MB. As operações atuam sobre o usuário autenticado.

### RF-007

**Descrição:** O usuário autenticado deve poder alterar sua senha mediante confirmação da senha atual, utilizando uma nova senha diferente da anterior.

**Status:** Implementado, com padronização da política de senha pendente.

**Prioridade:** Alta.

**Detalhamento:** A alteração ocorre por `PATCH /api/v1/users/me/password`. O sistema compara a senha atual com o hash armazenado e exige nova senha com mínimo de 8 caracteres, pelo menos uma letra e um número. Após a alteração, os links pendentes de recuperação são invalidados. A exigência de letra maiúscula ainda precisa ser alinhada à política única definida pelo time.

### RF-008

**Descrição:** O Pet Sitter deve poder preencher e enviar o formulário de onboarding com experiência, fotos do ambiente e respostas ao questionário de avaliação.

**Status:** Implementado.

**Prioridade:** Alta.

**Detalhamento:** O formulário é dividido em etapas e enviado por `POST /api/v1/users/me/evaluations`. Os dados são persistidos em `sitter_evaluations`, com status inicial PENDING. Após o envio, o progresso do usuário passa para IN_REVIEW, aguardando avaliação administrativa.

### RF-009

**Descrição:** O Administrador deve poder consultar, aprovar ou rejeitar cadastros de parceiros, incluindo os cadastros corrigidos e reenviados para reanálise.

**Status:** Parcialmente implementado.

**Prioridade:** Alta.

**Detalhamento:** A atualização ocorre por `PATCH /api/v1/providers/:id/status`, restrita ao administrador. A recusa exige motivo e aciona o envio de e-mail com instruções de correção. O reenvio altera o cadastro para EM_REVISAO. Aprovação, recusa e inclusão dos reenviados na listagem estão implementadas; a interface ainda agrupa PENDENTE e EM_REVISAO na aba “Novos”, sem identificação visual específica do reenvio.

### RF-010

**Descrição:** O Administrador deve poder analisar experiência, fotos e respostas do onboarding dos Pet Sitters e aprovar ou rejeitar a candidatura, registrando feedback.

**Status:** Parcialmente implementado.

**Prioridade:** Alta.

**Detalhamento:** As candidaturas são consultadas por `GET /api/v1/users/admin/evaluations` e revisadas por `PATCH /api/v1/users/admin/evaluations/:id`. A interface permite consultar experiência e questionário e registrar aprovação ou rejeição. A exibição das fotos efetivamente enviadas ainda precisa ser implementada, pois o painel utiliza representações demonstrativas nessa seção.

### RF-011

**Descrição:** O parceiro aprovado deve ter acesso a um painel com as funcionalidades de gestão e as informações do negócio correspondentes ao seu perfil.

**Status:** Parcialmente implementado.

**Prioridade:** Alta.

**Detalhamento:** O painel apresenta navegação por perfil e acesso ao cadastro comercial. Lojistas possuem funcionalidades de produtos e pedidos; hotéis e Pet Sitters possuem áreas destinadas à agenda e aos serviços. Parte dos indicadores, do financeiro, da agenda e dos clientes ainda utiliza dados demonstrativos. A presença dessas telas não representa integração concluída com dados reais.

### RF-012

**Descrição:** O sistema deve informar ao Pet Sitter o andamento do onboarding e orientar sobre espera de análise, aprovação, rejeição e necessidade de correção.

**Status:** Parcialmente implementado.

**Prioridade:** Média.

**Detalhamento:** O progresso do onboarding é acompanhado por `onboarding_step`. A interface trata o envio em análise e o encaminhamento após conclusão. O tratamento específico da rejeição, com apresentação do feedback e orientação de correção, ainda precisa ser completado. Os estados do progresso são distintos dos estados do cadastro comercial e da avaliação administrativa.

### RF-013

**Descrição:** O visitante ou tutor deve poder consultar os produtos disponibilizados na plataforma, com informações de preço, categoria e disponibilidade.

**Status:** Implementado para consulta do catálogo.

**Prioridade:** Média.

**Detalhamento:** A interface de shopping consome a API de produtos e permite consulta e filtragem. A listagem utiliza produtos ativos, e o fluxo de compra verifica estoque. A restrição completa da vitrine a produtos de lojistas aprovados permanece pendente na PRD-2. Avaliações ou especificações demonstrativas não devem ser apresentadas como dados reais de clientes ou fabricantes.

### RF-014

**Descrição:** O sistema deve oferecer carrinho de produtos com inclusão, alteração de quantidades, remoção de itens e consulta dos totais, preservando os itens ao autenticar o tutor.

**Status:** Implementado.

**Prioridade:** Média.

**Detalhamento:** Antes do login, o carrinho é mantido no armazenamento local do navegador. Para o tutor autenticado, os itens são persistidos no backend por `/api/v1/cart`. Após o login, o sistema combina os itens locais com o carrinho da conta, respeitando estoque e limites de quantidade. A finalização da compra exige autenticação. Este carrinho atende produtos e não inclui agendamentos de serviços.

### RF-015

**Descrição:** O parceiro deve poder consultar e editar as informações do próprio perfil comercial, incluindo nome comercial, telefone, endereço, descrição e dados específicos do seu tipo de negócio.

**Status:** Parcialmente implementado.

**Prioridade:** Média.

**Detalhamento:** A consulta utiliza `GET /api/v1/providers/me`. As atualizações de dados comerciais utilizam `PUT /api/v1/providers/me` e `PUT /api/v1/providers/profile`, conforme o campo. Descrição, contatos, endereço, horários, galeria e tarifas possuem persistência. A edição do nome comercial no formulário de perfil público precisa de ajuste, pois o endpoint acionado pela tela não persiste esse campo.

## 15. Requisitos não funcionais: substituição dos itens existentes

### RNF-001

**Descrição:** O sistema deve controlar o acesso às operações privadas por autenticação e autorização compatíveis com o perfil e a propriedade dos dados.

**Status:** Parcialmente implementado.

**Prioridade:** Alta.

**Detalhamento:** As rotas privadas utilizam JWT e verificações de perfil e propriedade conforme a operação. Contas explicitamente desativadas são impedidas de realizar novo login. Existem pendências de autorização, como a restrição completa de criação e publicação de produtos por lojistas aprovados, prevista na PRD-2. A presença de autenticação não substitui a validação das permissões de cada operação. Os controles específicos do token e do armazenamento de senhas são detalhados em RNF-007 e RNF-008.

### RNF-002

**Descrição:** A interface deve adaptar o conteúdo e os controles às telas de dispositivos móveis, tablets e computadores, preservando leitura, navegação e execução das ações essenciais.

**Status:** Parcialmente implementado, com validação abrangente pendente.

**Prioridade:** Alta.

**Detalhamento:** O frontend utiliza Tailwind CSS e layouts responsivos. A validação deve verificar as telas essenciais nos tamanhos definidos pelo projeto, sem sobreposição de textos, perda de controles ou rolagem horizontal indevida. A existência de classes responsivas não comprova a adequação de todas as páginas. A revisão abrangente está prevista na QA-3.

### RNF-003

**Descrição:** A interface deve apresentar navegação consistente, campos identificados e retorno compreensível sobre carregamento, sucesso, ausência de dados e erros nas ações essenciais.

**Status:** Parcialmente implementado.

**Prioridade:** Alta.

**Detalhamento:** O frontend utiliza componentes reutilizáveis e notificações visuais. A avaliação do requisito deve considerar a realização das jornadas de cadastro, autenticação, compra e gestão sem perda de contexto ou ações sem resposta. Telas demonstrativas e funcionalidades ainda não integradas devem ser identificadas. A validação global de usabilidade permanece pendente.

### RNF-004

**Descrição:** O sistema deve ser acessível pela web, em navegadores e dispositivos compatíveis com o escopo definido pelo projeto, mediante conexão à internet.

**Status:** Implementado para acesso web.

**Prioridade:** Alta.

**Detalhamento:** O frontend é hospedado na Vercel e o backend e banco de dados utilizam a Railway. O sistema é acessado por navegador, sem necessidade de instalação de aplicativo nativo. A lista de navegadores e versões suportadas deve ser definida e validada pelo time. Este requisito não representa garantia de disponibilidade contínua ou de tempo de recuperação, que dependem de metas próprias e medição operacional.

### RNF-005

**Descrição:** O código deve ser organizado por responsabilidades para facilitar manutenção, rastreabilidade e evolução das funcionalidades.

**Status:** Implementado na estrutura do projeto.

**Prioridade:** Média.

**Detalhamento:** O backend é organizado em rotas, controllers, use cases, repositories, schemas e módulos de configuração. As regras de negócio devem ser concentradas nos use cases quando aplicável, e o acesso ao banco utiliza Prisma. Existem consultas diretas ao Prisma em controllers e use cases. O frontend separa páginas, componentes, serviços, hooks, contextos e configurações.

### RNF-006

**Descrição:** A arquitetura deve permitir a inclusão de funcionalidades e perfis por alterações localizadas nos módulos correspondentes, preservando as jornadas existentes.

**Status:** Planejado, com atendimento ainda não comprovado.

**Prioridade:** Média.

**Detalhamento:** Novos recursos devem seguir as responsabilidades e os contratos dos módulos existentes. A inclusão de um perfil pode exigir alterações em validações, autorização, navegação e persistência. O atendimento deste requisito deve ser demonstrado por uma evolução concreta e pela verificação das jornadas afetadas. O uso de PostgreSQL, Prisma ou JWT, isoladamente, não comprova extensibilidade.

### RNF-007

**Descrição:** O acesso às rotas privadas da API deve exigir JWT válido enviado no cabeçalho Authorization no formato Bearer.

**Status:** Implementado.

**Prioridade:** Alta.

**Detalhamento:** O middleware de autenticação valida o formato, a assinatura e a expiração do token. Requisições sem token ou com token inválido são rejeitadas com HTTP 401. As rotas públicas permanecem acessíveis sem JWT. O webhook do Mercado Pago utiliza validação de assinatura própria, independente da autenticação do usuário.

### RNF-008

**Descrição:** As senhas devem ser armazenadas exclusivamente como hashes, sem persistência ou retorno do texto original nas operações de autenticação e cadastro.

**Status:** Implementado.

**Prioridade:** Alta.

**Detalhamento:** O sistema utiliza bcryptjs para gerar e comparar hashes de senha. Cadastro e alteração autenticada utilizam fator de custo 10; a redefinição por recuperação utiliza fator de custo 12. A comparação é realizada com bcrypt, sem descriptografar a senha. O hash não deve ser exposto nas respostas da aplicação.

## 16. Funcionais novos: textos para inclusão

As prioridades e os IDs abaixo são propostas. Os detalhamentos e os status devem acompanhar a descrição para evitar apresentar funcionalidades planejadas como concluídas.

| ID | Descrição | Status | Prioridade |
| --- | --- | --- | --- |
| RF-016 | O usuário deve poder recuperar o acesso por e-mail, utilizando um link temporário e de uso único para definir uma nova senha diferente da atual. | Implementado. | Alta |
| RF-017 | O parceiro recusado deve poder consultar o motivo da recusa, corrigir os dados autenticado e reenviar o cadastro para análise. | Parcialmente implementado. | Alta |
| RF-018 | O usuário autenticado deve poder adicionar, consultar e remover produtos, hotéis e Pet Sitters dos favoritos. | Implementado. | Média |
| RF-019 | O visitante ou tutor deve poder consultar as listagens de hotéis e Pet Sitters publicados na plataforma. | Implementado para listagem. | Alta |
| RF-020 | O visitante ou tutor deve poder consultar o perfil público do parceiro e seus produtos ou serviços ativos, com preços e dados disponíveis. | Parcialmente implementado. | Alta |
| RF-021 | O lojista aprovado deve poder cadastrar, consultar, editar e excluir os próprios produtos, preservando o histórico dos produtos vinculados a pedidos. | Parcialmente implementado. | Alta |
| RF-022 | O tutor autenticado deve poder finalizar o carrinho e gerar pedidos, com validação de disponibilidade, cálculo no servidor, baixa de estoque e limpeza do carrinho em uma transação. | Implementado para geração de pedidos. | Alta |
| RF-023 | O tutor deve poder pagar os próprios pedidos no modo habilitado e acompanhar a confirmação pelo sistema. | Simulado implementado; sandbox aguardando validação externa. | Alta |
| RF-024 | O tutor deve poder consultar seus pedidos, itens, totais e status e retomar os pedidos aguardando pagamento. | Implementado. | Alta |
| RF-025 | O lojista deve poder consultar pedidos recebidos e atualizar o status dos próprios pedidos conforme as transições permitidas. | Implementado. | Alta |
| RF-026 | Hotéis e Pet Sitters aprovados devem poder cadastrar, listar, editar e desativar os próprios serviços. | Backend implementado; interface pendente. | Alta |
| RF-027 | O tutor deve poder solicitar o agendamento de um serviço para um pet próprio, consultar seus agendamentos e cancelar conforme as regras aplicáveis. | Parcialmente implementado: modelagem disponível. | Alta |
| RF-028 | O hotel ou Pet Sitter deve poder consultar sua agenda e confirmar, recusar, cancelar ou concluir os próprios agendamentos conforme as regras permitidas. | Planejado. | Alta |
| RF-029 | O parceiro de serviços deve poder configurar a política de pagamento presencial ou antecipado, e o agendamento deve respeitá-la. | Parcialmente implementado: modelagem disponível. | Alta |
| RF-030 | O sistema deve permitir pagamento antecipado de agendamentos e registrar estorno quando um atendimento pago for recusado ou cancelado conforme a política. | Planejado. | Alta |
| RF-031 | O tutor deve poder avaliar compras e atendimentos concluídos, e o sistema deve apresentar avaliações e indicadores reais por alvo. | Planejado. | Média |
| RF-032 | O Administrador deve poder consultar usuários e filtrar a listagem por perfil e identificação. | Implementado. | Média |
| RF-033 | O parceiro e o Administrador devem poder consultar indicadores reais de atividade e receita, respeitando o escopo de acesso de cada perfil. | Parcialmente implementado. | Média |
| RF-034 | O sistema deve exigir o aceite dos termos no cadastro e registrar a data e a versão aceitas. | Parcialmente implementado. | Alta |

### Detalhamento do RF-016

A solicitação utiliza `POST /api/v1/auth/forgot-password`, com resposta genérica para evitar exposição da existência da conta. O link é enviado por e-mail, possui validade de 1 hora e só pode ser utilizado uma vez. A redefinição utiliza `POST /api/v1/auth/reset-password`, valida o token e impede reutilização da senha atual. Um novo pedido de recuperação invalida os links anteriores ainda pendentes.

### Detalhamento do RF-017

A recusa administrativa registra motivo e aciona envio de e-mail com link de correção. A correção exige autenticação. O reenvio utiliza `POST /api/v1/providers/me/resubmit` e altera o cadastro de REJEITADO para EM_REVISAO. O retorno à correção após login comum ainda precisa de ajuste na navegação do parceiro.

### Detalhamento do RF-018

As operações utilizam `/api/v1/favorites` e são vinculadas ao usuário autenticado. O sistema suporta os tipos PRODUCT, HOTEL e SITTER. Favoritar novamente o mesmo alvo não deve criar duplicação para o mesmo usuário.

### Detalhamento do RF-019

As listagens utilizam `GET /api/v1/providers/hotels` e `GET /api/v1/providers/sitters`. A publicação depende da aprovação comercial e da completude do perfil. Para Pet Sitters, também é exigida uma avaliação de candidatura aprovada. Distância geográfica e avaliações de clientes não devem ser apresentadas como reais quando não houver fonte de dados correspondente.

### Detalhamento do RF-020

O detalhe utiliza `GET /api/v1/providers/:id`. O backend disponibiliza produtos e serviços ativos do parceiro e seus preços. A apresentação de serviços reais na interface e a remoção de valores fabricados ainda dependem da SRV-Fpub.

### Detalhamento do RF-021

O CRUD utiliza `/api/v1/products`, com verificação de propriedade na edição e na exclusão. A tentativa de excluir produto vinculado a pedidos retorna conflito para preservar o histórico. A restrição completa de criação e edição a lojistas aprovados e a ocultação de produtos de lojistas não aprovados ainda dependem da PRD-2.

### Detalhamento do RF-022

A criação utiliza `POST /api/v1/orders` e os itens do carrinho mantido no servidor. O sistema cria um pedido por lojista. Criação dos pedidos e itens, baixa de estoque e limpeza do carrinho ocorrem em uma transação. O contrato atual não persiste endereço de entrega ou frete no pedido; a geração de pedidos não representa uma integração logística completa.

### Detalhamento do RF-023

O sistema disponibiliza pagamento simulado e integração opcional com Mercado Pago em ambiente de teste. No sandbox, a confirmação depende de webhook validado e consulta do pagamento ao provedor; o retorno do navegador não comprova pagamento. O aceite externo do sandbox permanece pendente. Cobrança real, repasse aos lojistas e estorno automático de pedidos não estão implementados nesta entrega.

### Detalhamento do RF-024

O histórico do tutor consome `GET /api/v1/orders`, restrito à conta autenticada. A interface apresenta dados reais e permite retomar pedidos aguardando pagamento. A consulta do estado de pagamento utiliza `GET /api/v1/orders/:orderId/payment-status`.

### Detalhamento do RF-025

O lojista consulta pedidos por `GET /api/v1/orders/received` ou `GET /api/v1/providers/orders`. A alteração utiliza `PATCH /api/v1/orders/:id/status`, com verificação de propriedade e transições permitidas. Quando o Mercado Pago está habilitado, a confirmação de pagamento não pode ser feita manualmente pelo parceiro.

### Detalhamento do RF-026

O backend disponibiliza criação, listagem, edição e exclusão lógica em `/api/v1/providers/services`. Apenas hotéis e Pet Sitters aprovados podem gerenciar os próprios serviços. A unidade de cobrança retornada é diária para hotel e hora para sitter. As telas e o menu de gerenciamento dependem das entregas SRV-F1 e SRV-F2.

### Detalhamento do RF-027

A modelagem de agendamento, os estados e o cálculo por duração estão disponíveis no backend. A criação e a consulta autenticadas, a validação do pet do tutor e a jornada da interface ainda dependem das entregas AGD-2, BKG-1 e BKG-2. A tela atual de agendamentos do tutor utiliza dados demonstrativos.

### Detalhamento do RF-028

As operações de agenda devem ser restritas ao parceiro responsável pelo atendimento e respeitar a máquina de estados definida pelo negócio. O fluxo real depende da AGD-2 e das entregas SCH-1 e SCH-2. A tela de agenda atual utiliza dados demonstrativos.

### Detalhamento do RF-029

As opções modeladas são PRESENCIAL, definida como padrão, e PRE_PAGO. A configuração pela interface, sua persistência e a aplicação na jornada de agendamento ainda precisam ser concluídas. O estado inicial e as transições do agendamento devem ser alinhados entre a modelagem AGD-1 e o contrato AGD-2 antes da implementação final.

### Detalhamento do RF-030

O pagamento de agendamentos pré-pagos e o registro do estorno dependem da conclusão do fluxo de agendamento e da PAG-2. A integração Mercado Pago sandbox disponível atualmente atende pedidos de produtos e não representa pagamento ou estorno de agendamentos já implementado.

### Detalhamento do RF-031

A avaliação deve ser vinculada a uma compra ou atendimento concluído do próprio autor, com nota válida e prevenção de duplicação. A funcionalidade depende de AVL-1, AVL-2, AVL-F1 e AVL-F2. As avaliações de clientes são diferentes das candidaturas de Pet Sitters registradas em `sitter_evaluations`. A unidade de avaliação de pedidos com vários produtos precisa ser definida pelo time.

### Detalhamento do RF-032

A consulta utiliza `GET /api/v1/users/admin/users`, com filtros, paginação e acesso administrativo. A existência do campo `is_active` não representa, por si só, uma funcionalidade de desativação ou reativação de conta disponível no painel.

### Detalhamento do RF-033

Existem indicadores administrativos de usuários e parceiros. Indicadores reais de receita e atividade comercial ainda dependem de DSH-1 e DSH-2. As telas com valores demonstrativos devem permanecer identificadas até a integração. Este requisito detalha a parte de indicadores do RF-011.

### Detalhamento do RF-034

A interface exige marcação do aceite antes do cadastro. Entretanto, o backend grava `terms_accepted = true` sem validar o valor recebido, e o schema atual não registra a data nem a versão dos termos. O atendimento completo depende da validação e da persistência dessas informações no servidor.

## 17. Regras novas: textos para inclusão

Os RFs relacionados nesta tabela consideram a numeração proposta na seção 16. As regras expressam o comportamento esperado; sua implementação deve ser acompanhada pelos status dos RFs correspondentes.

| ID | Descrição | Requisitos relacionados |
| --- | --- | --- |
| RNE-009 | Somente lojistas aprovados podem criar, editar e publicar produtos; produtos de lojistas não aprovados não devem aparecer na vitrine. | RF-013, RF-021 |
| RNE-010 | Somente hotéis e Pet Sitters aprovados podem gerenciar serviços, e cada parceiro só pode alterar ou desativar os próprios serviços. | RF-026 |
| RNE-011 | A consulta e a gestão de dados privados devem respeitar a propriedade dos recursos e as permissões do perfil autenticado. | RF-004, RF-005, RF-014, RF-018, RF-021, RF-024 a RF-028 |
| RNE-012 | O carrinho deve aceitar somente produtos ativos e com estoque, respeitando o limite de 99 unidades por item e 50 produtos distintos. | RF-014, RF-022 |
| RNE-013 | A criação de pedidos, os itens, a baixa de estoque e a limpeza do carrinho devem ocorrer atomicamente, gerando um pedido por lojista. | RF-022 |
| RNE-014 | O pedido deve iniciar em AGUARDANDO_PAGAMENTO e seguir somente transições permitidas até conclusão ou cancelamento. | RF-023, RF-024, RF-025 |
| RNE-015 | A finalização de compra deve exigir tutor autenticado, preservando o carrinho e o contexto de compra após o login. | RF-003, RF-014, RF-022 |
| RNE-016 | A recusa comercial deve registrar motivo; o reenvio autenticado de cadastro corrigido deve alterar o estado de REJEITADO para EM_REVISAO. | RF-009, RF-017 |
| RNE-017 | A política PRESENCIAL ou PRE_PAGO deve determinar as condições de pagamento e confirmação do agendamento; estorno deve depender de pagamento prévio e cancelamento ou recusa aplicável. | RF-027 a RF-030 |
| RNE-018 | O total do agendamento deve ser calculado no servidor conforme a unidade de cobrança e a duração: diária para hotel e hora para sitter. | RF-026, RF-027 |
| RNE-019 | Somente o tutor responsável por uma compra ou atendimento concluído deve poder avaliá-lo, sem duplicação da unidade de avaliação definida pelo negócio. | RF-031 |
| RNE-020 | A publicação de um Pet Sitter na listagem deve exigir aprovação comercial, candidatura aprovada e perfil completo. | RF-008, RF-010, RF-019 |
| RNE-021 | O cadastro deve exigir aceite real dos termos e registrar a data e a versão aceitas. | RF-001, RF-034 |
| RNE-022 | A exclusão de pets e endereços deve respeitar os vínculos e as restrições de atendimentos e pedidos em andamento. | RF-004, RF-005 |
| RNE-023 | A confirmação do pagamento deve validar origem, titularidade, valor e moeda; eventos repetidos não podem duplicar seus efeitos. | RF-023 |

### Detalhamento da RNE-009

O sistema deve verificar no backend que o usuário é Lojista, identificado por `role_id = 2`, e que seu cadastro comercial está APROVADO antes de permitir a criação ou edição de produtos. A listagem pública e o detalhe do produto também devem considerar a aprovação do lojista, além da situação do próprio produto. A verificação não pode depender apenas da exibição do menu no frontend. No código analisado, a restrição completa de perfil e aprovação ainda depende da PRD-2; portanto, esta regra está parcialmente atendida.

### Detalhamento da RNE-010

O gerenciamento de serviços deve ser permitido somente a Hotéis e Pet Sitters, identificados pelos perfis 3 e 4, com cadastro comercial APROVADO. O parceiro responsável deve ser obtido a partir do usuário autenticado. A listagem deve retornar os serviços ativos desse parceiro, e a edição ou exclusão deve verificar se o serviço pertence a ele. A exclusão é lógica, alterando `is_active` para falso e mantendo o registro no banco. Essas verificações estão implementadas no backend da SRV-1; a interface de gerenciamento ainda depende da SRV-F1 e da SRV-F2.

### Detalhamento da RNE-011

As operações privadas devem identificar o usuário pelo token autenticado e verificar sua relação com o recurso consultado ou alterado. O tutor deve acessar os próprios pets, endereços, carrinho, favoritos e pedidos; o parceiro deve gerir os próprios produtos, serviços, pedidos recebidos e atendimentos, conforme as permissões do perfil. O envio de um identificador no corpo, na URL ou na consulta não pode conceder acesso aos dados de outra conta. Operações administrativas devem exigir o perfil autorizado. As verificações já existem em diversos fluxos, mas o atendimento integral depende da conclusão das funcionalidades pendentes e da revisão de suas permissões.

### Detalhamento da RNE-012

O sistema deve verificar se o produto está ACTIVE e possui estoque antes de adicioná-lo ao carrinho. A quantidade acumulada por produto deve respeitar o menor valor entre 99 unidades e o estoque disponível; quando necessário, o backend ajusta a quantidade e informa essa condição ao cliente. O carrinho deve conter no máximo 50 produtos distintos. A atualização da quantidade para zero remove o item. A combinação do carrinho anônimo com o autenticado deve respeitar os mesmos limites e informar os itens ignorados ou ajustados. Essas regras estão implementadas no backend do carrinho.

### Detalhamento da RNE-013

A finalização deve utilizar os itens do carrinho do tutor mantido no servidor, validar a disponibilidade dos produtos e agrupar os itens por lojista. O sistema deve criar um pedido para cada lojista, registrar seus itens e preços unitários, baixar o estoque e limpar o carrinho em uma única transação. Se qualquer etapa falhar, as alterações da transação devem ser desfeitas. Na implementação atual, a baixa de estoque ocorre na criação do pedido, antes da confirmação do pagamento. A reposição automática de estoque por abandono de pagamento não está implementada; a proteção de concorrência deve ser verificada separadamente da atomicidade da transação.

### Detalhamento da RNE-014

Todo pedido criado deve iniciar em AGUARDANDO_PAGAMENTO. As transições permitidas são: de AGUARDANDO_PAGAMENTO para PAGO ou CANCELADO; de PAGO para PREPARANDO, ENVIADO ou CANCELADO; de PREPARANDO para ENVIADO ou CANCELADO; e de ENVIADO para CONCLUIDO. CONCLUIDO e CANCELADO são estados finais, sem novas transições nessa máquina. A alteração operacional deve respeitar a propriedade do pedido. Quando o Mercado Pago estiver habilitado, o estado PAGO deve resultar da confirmação validada do pagamento, sem confirmação manual pelo parceiro ou por parâmetros da URL de retorno.

### Detalhamento da RNE-015

Visitantes podem selecionar produtos e manter um carrinho local antes da autenticação. Ao tentar finalizar a compra, devem ser encaminhados ao login e informados sobre a necessidade de acessar uma conta de tutor. Após autenticar, o sistema deve combinar os itens locais com o carrinho da conta, respeitando disponibilidade e limites, e preservar o destino interno relacionado à compra para permitir sua retomada. Outros perfis não devem finalizar compras como tutores. A navegação e o backend já possuem controles para o fluxo de compra autenticada.

### Detalhamento da RNE-016

A recusa de um cadastro comercial deve ser realizada por administrador autenticado, com registro obrigatório do motivo em `rejection_reason`. O sistema deve acionar o envio de e-mail ao parceiro, com o motivo e o link da tela de correção. O parceiro deve autenticar para corrigir os próprios dados e solicitar o reenvio. O reenvio é permitido a partir de REJEITADO e altera o estado para EM_REVISAO, sem conceder aprovação automática. O backend e a tela de correção estão disponíveis; permanecem pendentes o ajuste do retorno após login comum do parceiro e a identificação visual específica de cadastros reenviados no painel administrativo.

### Detalhamento da RNE-017

O parceiro de serviços deve possuir uma política de pagamento PRESENCIAL ou PRE_PAGO, sendo PRESENCIAL o valor padrão. No pagamento presencial, a confirmação do atendimento não deve depender de cobrança online. No pagamento antecipado, a confirmação deve respeitar a exigência de pagamento e as decisões do parceiro previstas na máquina de estados. A recusa ou o cancelamento de um atendimento já pago deve seguir a regra de estorno definida para esse fluxo. A modelagem da política está disponível, mas sua configuração, a jornada completa e o estorno ainda dependem das entregas de agendamento. O estado inicial e a ordem entre aceite e pagamento precisam ser alinhados entre AGD-1 e AGD-2 antes de se considerar a regra integralmente implementada.

### Detalhamento da RNE-018

A regra de cálculo modelada utiliza a tarifa diária ou horária do parceiro. Para hotel, conta noites entre datas de calendário no fuso America/Sao_Paulo, com mínimo de uma diária. Para sitter, considera horas iniciadas, com mínimo de uma hora; por exemplo, 90 minutos correspondem a duas horas cobradas. A data de término deve ser posterior à de início, e a tarifa deve ser positiva. A definição de uso de `Service.price` em lugar da tarifa do parceiro precisa ser alinhada antes do fluxo final de contratação. Cobrança separada por visita não está implementada.

### Detalhamento da RNE-019

A avaliação de compra ou atendimento deve ser feita pelo tutor vinculado à transação e somente após sua conclusão. O sistema deve verificar a origem, o alvo avaliado e a propriedade da transação, exigir nota entre 1 e 5 e impedir avaliação duplicada conforme a unidade definida pelo negócio. Para pedidos com vários produtos, o time deve definir se a unidade de avaliação será o pedido, o item ou outra combinação antes de fechar a restrição de unicidade. Essas avaliações são diferentes da candidatura de Pet Sitter registrada em `sitter_evaluations`. A implementação está prevista nas entregas AVL-1, AVL-2, AVL-F1 e AVL-F2.

### Detalhamento da RNE-020

Para aparecer na listagem pública de Pet Sitters, o parceiro deve possuir cadastro comercial APROVADO e pelo menos uma avaliação de candidatura com status APPROVED. O perfil também deve apresentar descrição, telefone, cidade e CEP preenchidos, tarifa horária positiva e ao menos uma modalidade de atuação em `sitter_roles`. Aprovação comercial isolada não é suficiente para publicação. Esses filtros estão implementados na listagem de sitters; sua existência não deve ser tomada como comprovação da mesma validação em todas as rotas públicas ou de gerenciamento.

### Detalhamento da RNE-021

O cadastro deve depender de uma manifestação explícita de aceite dos termos pelo usuário. O backend deve validar o valor recebido e registrar a data e a versão dos termos correspondentes ao aceite, sem presumir consentimento por um valor padrão. A interface atual exige a marcação, mas o backend grava `terms_accepted = true` sem validar o valor enviado, e o schema não contém data ou versão do aceite. O atendimento completo desta regra permanece pendente.

### Detalhamento da RNE-022

A exclusão deve verificar a propriedade do recurso e a existência de vínculos que impeçam a operação. Pets com agendamentos futuros em estados que bloqueiem a remoção não devem ser excluídos. A exclusão do único endereço do usuário deve considerar pedidos em andamento; quando o endereço principal for removido e houver outros, o mais recente deve assumir essa condição. O código atual consulta estados antigos em inglês para os bloqueios de pets e endereços, enquanto a modelagem utiliza estados em português. Os filtros precisam ser atualizados, e os estados exatos que devem bloquear cada exclusão precisam ser alinhados ao fluxo atual antes de declarar a proteção completa.

### Detalhamento da RNE-023

No sandbox, o webhook deve ter assinatura válida e o pagamento deve ser consultado na API do Mercado Pago. O resultado precisa corresponder ao vendedor de teste, ao pedido, à tentativa registrada, ao valor e à moeda esperados, com `live_mode` desativado. Apenas um pagamento aprovado e compatível com o estado do pedido deve confirmá-lo como PAGO. O processamento deve impedir efeitos duplicados de notificações repetidas e evitar que notificações antigas substituam um estado mais recente. Parâmetros de sucesso do navegador não comprovam pagamento. Os controles estão implementados, mas a validação externa do sandbox continua necessária; estornos e situações que exigem conciliação não possuem automação completa na entrega atual.

## 18. Não funcionais novos: textos para inclusão

| ID | Descrição | Status | Prioridade |
| --- | --- | --- | --- |
| RNF-009 | Respostas e registros operacionais devem limitar a exposição de dados pessoais e proteger senhas, documentos, tokens e credenciais. | Parcialmente implementado; revisão abrangente pendente. | Alta |
| RNF-010 | Operações de compra e confirmação de pagamento devem preservar integridade transacional e impedir efeitos duplicados de eventos repetidos. | Implementado nos fluxos de pedido e sandbox; validação externa pendente. | Alta |
| RNF-011 | A aplicação deve disponibilizar diagnóstico de saúde, logs correlacionados e mecanismos de registro de erros para investigação operacional. | Implementado no código; ativação externa depende do ambiente. | Média |
| RNF-012 | O projeto deve possuir verificações automatizadas e testes de integração com banco isolado, além de migrations versionadas para evolução do banco. | Implementado. | Alta |
| RNF-013 | As telas essenciais devem permitir uso por teclado, apresentar campos identificados e foco perceptível e preservar o conteúdo nos tamanhos de tela definidos pelo projeto. | Parcialmente implementado; validação abrangente pendente. | Alta |
| RNF-014 | Segredos devem ser configurados por ambiente e não expostos ao frontend; migração e recuperação de dados devem possuir procedimentos documentados e verificáveis. | Parcialmente implementado. | Alta |

**Detalhamento do RNF-009:** O projeto utiliza seleção explícita de campos em respostas e filtros de informações sensíveis em mecanismos de observabilidade. A cobertura integral das rotas e dos registros precisa de revisão antes de afirmar atendimento completo.

**Detalhamento do RNF-010:** A geração de pedidos utiliza transação e o processamento do webhook do sandbox possui controles contra repetição de efeitos. A integridade deve ser verificada também em falhas e concorrência. A existência de uma transação não comprova isoladamente proteção completa contra venda acima do estoque.

**Detalhamento do RNF-011:** Existem rotas de saúde e métricas, logs estruturados e integração opcional com Sentry. A coleta externa de erros depende da configuração do ambiente e não deve ser considerada ativa apenas pela presença do SDK.

**Detalhamento do RNF-012:** O CI executa lint, testes, typecheck, build e testes E2E. Os testes de integração utilizam PostgreSQL separado e aplicam migrations versionadas. A auditoria de dependências existente no CI é não bloqueante.

**Detalhamento do RNF-013:** A verificação deve abranger as telas essenciais e os estados de carregamento, erro e sucesso, considerando navegação por teclado e adequação visual. A verificação automatizada atual de acessibilidade não representa validação de todas as telas. A revisão abrangente está prevista na QA-3.

**Detalhamento do RNF-014:** Variáveis de ambiente, validação de configuração no início da aplicação, migrations e runbook de rotação de segredos estão disponíveis. A validação operacional de backup e restauração ainda precisa ser registrada; a existência de migrations não comprova capacidade de recuperação de dados.

## Observações para fechar a versão do documento

1. Aprovar a política proposta na RNE-002 antes de tratá-la como regra definitiva do projeto.
2. Definir se a validação completa de CNPJ continua no escopo; enquanto fizer parte da regra, manter seu atendimento como parcial.
3. Alinhar os estados iniciais e as transições de agendamento entre AGD-1 e AGD-2; os textos acima não escolhem uma das versões conflitantes como final.
4. Confirmar a fonte de tarifa da contratação de serviços e a unidade de unicidade das avaliações.
5. Conferir os novos IDs no documento completo e atualizar as referências cruzadas caso a numeração mude.
6. Manter os detalhamentos de pendências ao transpor os blocos. Copiar somente a descrição e marcar tudo como implementado voltaria a ocultar as diferenças encontradas.

O relatório de análise e suas evidências estão em [Revisão dos requisitos](REVISAO-REQUISITOS-2026-10-15.md).
