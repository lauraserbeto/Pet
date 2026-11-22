# Revisão dos requisitos do documento do projeto Pet+

Data: 15/10/2026. Base: imagens enviadas das seções 13, 14 e 15, documentação e código do checkout local, branch `Tasks-Laura`, commit `176e5a4`.

Para atualizar o documento acadêmico, utilizar os [textos prontos para transposição](REQUISITOS-TEXTOS-PARA-DOCUMENTO.md), com descrição, detalhamento, status e prioridade. As regras ainda sujeitas a alinhamento estão identificadas nesse arquivo.

Esta revisão cobre RNE-001 a RNE-008, RF-001 a RF-015 e RNF-001 a RNF-008. O RF-014 aparece em duas imagens, mas é um único requisito. O arquivo original do documento acadêmico não foi fornecido; as sugestões abaixo se referem ao conteúdo visível nas imagens.

O estado da implementação foi determinado por leitura do código. Não houve nova execução de testes, acesso ao banco ou validação de produção nesta revisão. A existência de uma task no planejamento não comprova sua implementação; o status abaixo distingue os dois casos.

## 1. Conclusões principais

1. A lista de requisitos retrata uma versão anterior do projeto: faltam pedidos, checkout autenticado, recuperação por e-mail, favoritos, recusa/reenvio, serviços, pagamentos e agendamentos.
2. Há afirmações incorretas sobre validação de CNPJ, rotas, estados do onboarding, custo do bcrypt e funcionalidades inteiramente implementadas.
3. Há requisitos parcialmente atendidos: o painel possui dados demonstrativos; a avaliação administrativa não renderiza as fotos enviadas; o status de rejeição do onboarding não recebe tratamento completo na tela; a edição do nome comercial apresenta uma divergência entre tela e backend.
4. A própria documentação do repositório está parcialmente desatualizada. Ela ajuda a recuperar o escopo, mas precisa ser confrontada com as rotas, schemas e use cases atuais.
5. Um requisito pode continuar correto como objetivo mesmo quando o código ainda não o atende. Nesse caso, deve-se registrar a pendência de implementação, em vez de mudar a regra para acomodar uma falha.

## 2. Convenção recomendada para o documento

Usar estados como **Implementado**, **Parcialmente implementado**, **Planejado** e **Implementado, aguardando validação externa**. Quando backend e frontend têm entregas separadas, registrar os dois explicitamente.

Separar a descrição do comportamento esperado do detalhamento técnico. Nomes de tabelas, campos, rotas e bibliotecas podem ficar em uma nota de implementação ou matriz de rastreabilidade. Isso evita que uma simples mudança de URL torne o requisito de negócio incorreto.

Manter os IDs existentes para preservar as referências. Os novos IDs sugeridos neste arquivo são provisórios e devem ser ajustados caso haja outros requisitos em páginas que não foram enviadas. As prioridades dos novos itens também são propostas; diferenças de prioridade entre o documento acadêmico e o repositório exigem alinhamento do time, não são erros de código.

## 3. Revisão das regras de negócio existentes

| ID | Avaliação | Ajuste necessário |
| --- | --- | --- |
| RNE-001 | Correta, com complementos | O cadastro público admite tutor e os três tipos de parceiro. A associação 5=tutor, 2=lojista, 3=hotel, 4=sitter está correta. Acrescentar que administrador não é criado pelo cadastro público. E-mail é único no schema; não afirmar normalização ou unicidade sem distinção de maiúsculas sem um contrato específico. |
| RNE-002 | Regra inconsistente entre fluxos | O backend de cadastro aceita 6 caracteres. A tela de cadastro exige 8, uma maiúscula e um número. A recuperação exige esses mesmos três critérios no backend. A troca autenticada exige 8, uma letra e um número, sem exigir maiúscula. Não basta substituir o texto por “8 caracteres” e marcar tudo como atendido: é preciso alinhar os fluxos. |
| RNE-003 | Incorreta como está escrita | Lojista e hotel exigem CNPJ; sitter aceita CPF ou CNPJ. CPF passa por verificação de dígitos. CNPJ recebe apenas checagem de tamanho de 14 dígitos; a consulta externa está desativada. Não há validação matemática completa de CNPJ nem consulta cadastral ativa. A constraint de documento único existe, mas a gravação usa o valor original, apesar de a validação usar apenas os dígitos. Normalização antes da persistência precisa ser considerada para evitar variações de máscara. |
| RNE-004 | Parcialmente correta | O parceiro nasce `PENDENTE`, mas os estados de `Provider` são `PENDENTE`, `APROVADO`, `REJEITADO`, `EM_REVISAO`; não `IN_REVIEW`. O sitter pode autenticar pendente para preencher o onboarding. O rejeitado pode autenticar para corrigir o cadastro. Lojista/hotel pendentes ou em revisão têm o login bloqueado. “Só acessa o painel após aprovação” precisa distinguir painel operacional de acesso ao onboarding/correção. Não generalizar esse bloqueio para todas as operações da API: PRD-2 ainda está pendente no código analisado. |
| RNE-005 | Correta quanto à moderação; ajustar revisão | Aprovar/rejeitar cadastro é ação administrativa protegida por autenticação e `role_id=1`. `EM_REVISAO` representa principalmente o cadastro reenviado pelo próprio parceiro após recusa; não deve ser descrito apenas como uma solicitação de revisão feita pelo administrador. |
| RNE-006 | Correta no objetivo; detalhamento incorreto | O sitter envia experiência, fotos e quiz para avaliação manual. `SitterEvaluation.status` usa `PENDING`, `APPROVED`, `REJECTED`. `IN_REVIEW` pertence ao progresso do usuário (`onboarding_step`), não ao enum da avaliação. A aprovação da avaliação atualiza o progresso para `COMPLETED` e o provider para `APROVADO`. |
| RNE-007 | Correta, com campos opcionais e limites | Nome e espécie são obrigatórios; raça, peso, nascimento e observações são opcionais. Há limite de 10 pets e ownership pelo usuário autenticado. Peso informado deve estar em `(0, 200]` kg e nascimento não pode ser futuro. A cascata existe no schema, mas não equivale a uma funcionalidade de exclusão de conta disponível ao tutor; outras relações também podem restringir exclusões. |
| RNE-008 | Correta, mas incompleta | Há múltiplos endereços por usuário, limite de 5 e escolha de principal. O primeiro vira principal e a troca de principal é transacional. Complemento e número são opcionais no schema de entrada atual. A cascata é um detalhe técnico, não uma jornada de exclusão de conta implementada. Não afirmar bloqueio de exclusão por pedidos em andamento como plenamente consistente: o código ainda consulta status antigos em inglês. |

### Evidências das regras

- Cadastro e documentos: `backend/src/schemas/authSchemas.js:24`, `backend/src/useCases/auth/RegisterUseCase.js:39`, `backend/src/services/DocumentVerificationService.js:3` e `backend/prisma/schema.prisma:52`.
- Senhas: `frontend/src/pages/auth/RegisterPage.tsx:49`, `backend/src/schemas/authSchemas.js:54`, `backend/src/schemas/userSchemas.js:24`.
- Aprovação e exceções de login: `backend/src/useCases/auth/LoginUseCase.js:29`, `backend/src/constants/providerStatus.js:1`, `frontend/src/components/auth/ProtectedRoute.tsx:61`.
- Estados da avaliação: `backend/prisma/schema.prisma:100`, `backend/src/controllers/UserController.js:158` e `backend/src/controllers/UserController.js:280`.
- Pets: `backend/src/controllers/PetController.js:4`, `backend/src/schemas/petSchemas.js:5`.
- Endereços: `backend/src/controllers/AddressController.js:5`, `backend/src/schemas/addressSchemas.js:15`.

### Separação dos estados que o documento precisa respeitar

| Entidade | Valores utilizados | Significado |
| --- | --- | --- |
| Cadastro do parceiro (`Provider.status`) | `PENDENTE`, `APROVADO`, `REJEITADO`, `EM_REVISAO` | Aprovação e reanálise do cadastro comercial. |
| Avaliação de candidatura do sitter (`SitterEvaluation.status`) | `PENDING`, `APPROVED`, `REJECTED` | Decisão administrativa sobre experiência, fotos e quiz. |
| Progresso do usuário (`User.onboarding_step`) | `INCOMPLETE`, `IN_REVIEW`, `COMPLETED`, `REJECTED` | Progresso da candidatura e navegação do sitter; campo textual. |
| Pedido (`Order.status`) | `AGUARDANDO_PAGAMENTO`, `PAGO`, `PREPARANDO`, `ENVIADO`, `CONCLUIDO`, `CANCELADO` | Ciclo de compra de produtos. |
| Agendamento (`Appointment.status`) | `PENDENTE`, `AGUARDANDO_CONFIRMACAO`, `CONFIRMADO`, `CONCLUIDO`, `RECUSADO`, `CANCELADO` | Estados modelados para atendimento; a jornada ainda não tem rotas no checkout analisado. |

Os rótulos exibidos ao usuário podem estar em português. Isso não significa que todos os campos persistam os mesmos valores. Avaliação da candidatura do sitter também não é a mesma funcionalidade que avaliação de atendimento pelo tutor.

## 4. Revisão dos requisitos funcionais existentes

| ID | Estado recomendado | Análise e correção |
| --- | --- | --- |
| RF-001 | Implementado, com pendências de regras relacionadas | O cadastro de tutor/parceiro existe em `POST /api/v1/auth/register`. Corrigir a afirmação genérica de validação matemática de CPF/CNPJ conforme RNE-003. O hash é gerado antes da persistência. Há divergência de política de senha e aceite de termos no backend. |
| RF-002 | Implementado | Login por e-mail/senha, retorno de JWT e dados do usuário existem. O JWT contém `id`, `role_id`, emissão e expiração; o e-mail está no objeto de usuário da resposta, não no payload definido para o token. Expiração configurada: 1 dia. Conta explicitamente desativada não faz novo login. |
| RF-003 | Implementado para o fluxo principal; detalhamento precisa correção | Não existem as rotas genéricas `/tutor` e `/admin` descritas nas imagens. Admin e parceiros operacionais usam `/dashboard`; sitter em onboarding usa `/onboarding/sitter`; tutor normalmente retorna para `/` ou para a rota de origem preservada. Existem páginas `/tutor/perfil`, `/tutor/pets`, `/tutor/pedidos` e `/tutor/agendamentos`. Correção de cadastro rejeitado exige atenção específica ao destino após login. |
| RF-004 | Implementado para o CRUD; ressalva na exclusão vinculada a agendamento | A rota correta é `/api/v1/users/me/pets`, não `/api/v1/users/pets`. Nome e espécie obrigatórios, demais campos opcionais. O bloqueio por agendamento ainda usa `PENDING`/`CONFIRMED`, enquanto a modelagem migrou para português; não declarar essa proteção como plenamente validada. |
| RF-005 | Implementado para o CRUD; ressalva na exclusão vinculada a pedido | `/api/v1/addresses` está correto. Acrescentar endereço principal, limite de 5 e ownership. O bloqueio para excluir o único endereço consulta `PENDING`, `PREPARING`, `SHIPPED`, mas pedidos atuais usam português. |
| RF-006 | Implementado no perfil do tutor | Corrigir para `PUT /api/v1/users/me`; não existe `PATCH /api/v1/users/profile`. Foto pode ser enviada por `POST /api/v1/users/me/avatar`, em data URL, com limite aproximado de 2 MB e formatos JPEG/PNG/WebP. O backend de perfil é compartilhado; a tela “Minha Conta” do parceiro não oferece a mesma edição de todos os dados pessoais. |
| RF-007 | Implementado | Corrigir para `PATCH /api/v1/users/me/password`. Exige senha atual válida e nova senha diferente, com mínimo de 8, uma letra e um número. Invalida links de recuperação pendentes. Recuperação sem saber a senha atual é outro requisito, ainda ausente da lista. |
| RF-008 | Implementado no envio; detalhamento precisa ajuste | Formulário e envio de experiência, fotos e quiz existem em `POST /api/v1/users/me/evaluations`. A avaliação nasce `PENDING`, e o progresso do usuário muda para `IN_REVIEW`. A descrição não deve misturar isso com `Provider.status=PENDENTE`. |
| RF-009 | Implementado para aprovar/rejeitar; reanálise com ressalva de UI | A rota `PATCH /api/v1/providers/:id/status` existe e é administrativa. Usar `EM_REVISAO`, não `IN_REVIEW`. Acrescentar motivo obrigatório na recusa, envio de e-mail e reanálise de cadastros reenviados. A interface inclui `PENDENTE` e `EM_REVISAO` juntos na aba “Novos”, sem distinção visual específica de reenvio. |
| RF-010 | Parcialmente implementado, se inclui analisar fotos reais | Listagem, currículo, quiz, aprovação/rejeição e feedback existem. Entretanto, a seção de fotos do admin desenha placeholders; não renderiza as imagens enviadas. Portanto, afirmar revisão completa de todos os documentos/fotos não corresponde ao código. |
| RF-011 | Parcialmente implementado | O painel e a navegação existem, mas Overview, Finance e Schedule ainda têm conteúdo demonstrativo. O menu varia por papel: produtos/pedidos para lojista, agenda para hotel/sitter. Não declarar métricas, financeiro, agenda, clientes e configurações como fluxos reais e completos apenas porque há uma tela. |
| RF-012 | Parcialmente implementado | O onboarding trata `IN_REVIEW` e `COMPLETED`; para os demais estados, retorna ao formulário. A tela não apresenta todo o ciclo de rejeição e feedback como um estado próprio completo. O detalhamento da imagem mistura o status comercial e o progresso do onboarding. |
| RF-013 | Implementado para catálogo conectado | A listagem de produtos já consome a API; o texto “integração completa com backend em desenvolvimento” está desatualizado. Distinguir catálogo real de avaliações/especificações demonstrativas e do gate de lojista aprovado, ainda previsto em PRD-2. |
| RF-014 | Implementado para produtos e integração com backend | Remover “Implementado (front-end)” da descrição. Anônimo mantém carrinho local; tutor autenticado usa API e há merge após login. Inclui adicionar, alterar quantidade, remover, limpar e consultar totais. Checkout exige autenticação. O carrinho atual é de produtos; não afirmar carrinho de agendamentos. |
| RF-015 | Parcialmente implementado no enunciado completo | Há consulta e persistência de descrição, telefone, endereço, horários, galeria e tarifas. Porém, o formulário de perfil público envia `business_name`, e `UpdateProviderProfileUseCase` não persiste esse campo. `PUT /providers/me` aceita nome comercial, mas o formulário público usa `/providers/profile`. Revisar antes de declarar edição do nome comercial pela interface como entregue. |

### Rotas a corrigir diretamente no documento

| Função | Texto das imagens | Contrato atual |
| --- | --- | --- |
| Pets | `/api/v1/users/pets` | `/api/v1/users/me/pets`, com `/:id` para detalhe/edição/exclusão. |
| Perfil | `PATCH /api/v1/users/profile` | `PUT /api/v1/users/me`. |
| Senha autenticada | `PATCH /api/v1/users/password` | `PATCH /api/v1/users/me/password`. |
| Avatar | Sem endpoint específico | `POST /api/v1/users/me/avatar`. |
| Admin após login | `/admin` | `/dashboard`, com páginas administrativas filhas. |
| Tutor após login | `/tutor` | `/` ou destino interno preservado; páginas específicas sob `/tutor/...`. |
| Onboarding | `/onboarding` | `/onboarding/sitter`. |

### Evidências dos funcionais

- Rotas: `backend/src/app.js:127`, `backend/src/routes/userRoutes.js:47`, `backend/src/routes/userRoutes.js:72` e `frontend/src/app/routes.tsx:324`.
- Redirecionamento: `frontend/src/pages/auth/LoginPage.tsx:78` e `frontend/src/lib/postLoginRedirect.ts:13`.
- Fotos administrativas: `frontend/src/pages/dashboard/SitterEvaluations.tsx:304`.
- Estado do onboarding: `frontend/src/pages/onboarding/PetSitterOnboarding.tsx:63`.
- Painéis demonstrativos: `frontend/src/pages/dashboard/Overview.tsx:102`, `frontend/src/pages/dashboard/Finance.tsx:19`, `frontend/src/pages/dashboard/Schedule.tsx:107` e `frontend/src/pages/dashboard/Customers.tsx:27`.
- Carrinho: `frontend/src/components/cart/CartContext.tsx:67`, `frontend/src/components/cart/CartContext.tsx:159`, `backend/src/controllers/CartController.js:89`.
- Nome comercial: `frontend/src/pages/dashboard/PublicProfile.tsx:356`, `backend/src/useCases/providers/UpdateProviderProfileUseCase.js:6` e `backend/src/useCases/providers/UpdateProviderAccountUseCase.js:16`.

## 5. Revisão dos requisitos não funcionais existentes

| ID | Avaliação | Ajuste proposto |
| --- | --- | --- |
| RNF-001 | Mecanismos centrais implementados; redação ampla demais | JWT e bcrypt existem. Usar “hash de senha” em vez de “criptografia de senha”, pois não há recuperação do texto original. “Salt 10” deve ser “fator de custo 10”; além disso, a recuperação usa custo 12. Não usar este item como prova de toda a segurança/autorização do sistema: PRD-2 ainda não foi aplicado e validação de token não reconsulta `is_active` em toda requisição. |
| RNF-002 | Implementação responsiva presente; validação global pendente | Tailwind fornece recursos, mas seu uso não comprova que todas as telas funcionem em todos os tamanhos. Definir telas e larguras a validar, ausência de rolagem horizontal indevida e preservação de ações. A revisão abrangente já está prevista em QA-3. |
| RNF-003 | Objetivo válido, aceitação subjetiva | Radix e Sonner são decisões técnicas, não evidência suficiente de que o produto seja intuitivo e dispensará treinamento. Definir tarefas observáveis, feedback de erro/sucesso, navegação por teclado e validação com usuários. Estados e telas demonstrativas impedem declarar toda a experiência final como validada. |
| RNF-004 | Acesso web implementado; disponibilidade não mensurada | A implantação em Vercel/Railway está coerente com o projeto. “Qualquer dispositivo” é absoluto; preferir navegadores e dispositivos compatíveis definidos no escopo. Acesso via navegador é compatibilidade/portabilidade; garantia de disponibilidade exige uma meta e medição, que não foram comprovadas nesta análise. |
| RNF-005 | Estrutura em camadas existente; descrição idealizada | Rotas, controllers, use cases e repositories existem. Alguns controllers/use cases consultam Prisma diretamente. Descrever o padrão predominante e a responsabilidade de cada parte, sem afirmar que todo acesso passa obrigatoriamente por repository. |
| RNF-006 | Não comprovado; detalhamento copiado incorretamente | A descrição fala em extensão para novos perfis, mas o detalhamento repete JWT/bcrypt e não explica extensibilidade. Há IDs de papel fixos em vários módulos; novos papéis demandam alterações em schemas, autorização e interface. Reescrever como objetivo de extensibilidade com critérios verificáveis; não marcar como implementado por usar PostgreSQL/Prisma. |
| RNF-007 | Implementado para rotas definidas como privadas | JWT no cabeçalho Bearer, bloqueio 401 para ausência, formato inválido ou token expirado estão implementados. Especificar que rotas públicas continuam públicas e que o webhook de pagamento usa assinatura própria. Pode ser incorporado ao RNF-001 se não houver necessidade de granularidade separada. |
| RNF-008 | Correto no princípio; ajustar termo e custo | Senhas são armazenadas como hash bcrypt, não texto puro. Cadastro e troca autenticada usam custo 10; reset usa 12. Evitar prometer um custo único que não corresponde ao código. Pode ser incorporado ao RNF-001, preservando rastreabilidade dos IDs antigos. |

Evidências: `backend/src/middlewares/authMiddleware.js:4`, `backend/src/useCases/auth/RegisterUseCase.js:60`, `backend/src/controllers/UserController.js:126`, `backend/src/useCases/auth/PasswordResetUseCase.js:123`, `frontend/e2e/a11y.spec.ts:5` e `docs/Sprints/Sprint-5-Fechamento/QA-3-e2e-parte-2-a11y-responsividade-checklist.md`.

O teste de acessibilidade existente verifica violações críticas na landing e reporta as sérias. Ele não comprova conformidade de acessibilidade de todas as telas.

## 6. Requisitos funcionais ausentes da lista enviada

As descrições desta tabela são sugestões de inclusão. “Implementado” significa encontrado no código, sujeito ao aceite do time; não equivale a revalidação de produção nesta revisão.

| ID sugerido | Descrição para o documento | Prioridade sugerida | Situação observada / rastreabilidade |
| --- | --- | --- | --- |
| RF-016 | O usuário deve poder recuperar o acesso por e-mail, usando um link temporário e de uso único para definir uma senha diferente da atual. | Alta | Implementado: EML-1, `authRoutes.js` e `PasswordResetUseCase.js`. Resposta de solicitação é genérica para não revelar existência de conta; validade de 1 hora; novo pedido invalida links anteriores. |
| RF-017 | O parceiro recusado deve receber o motivo por e-mail, acessar a correção autenticada, ajustar os dados e reenviar o cadastro para reanálise. | Alta | REC-1/REC-2 e rotas de recusa/reenvio presentes. Backend move `REJEITADO` para `EM_REVISAO`. Registrar revisão pendente do destino após login comum: o retorno preservado é utilizado somente para tutor no `LoginPage`. |
| RF-018 | O usuário autenticado deve poder adicionar, consultar e remover produtos, hotéis e pet sitters de seus favoritos. | Média | Implementado: `/api/v1/favorites`, com unicidade por usuário/tipo/alvo. |
| RF-019 | O visitante ou tutor deve poder consultar e filtrar hotéis e pet sitters publicados na plataforma. | Alta | Listagens reais: `/providers/hotels` e `/providers/sitters`. Aplicam aprovação, completude e avaliação aprovada para sitter. Não prometer distância geográfica ou rating real enquanto houver dados fabricados. |
| RF-020 | O visitante ou tutor deve poder consultar o perfil público do parceiro e seus produtos ou serviços ativos, com os preços e dados disponíveis. | Alta | Endpoint existe; serviços ativos são retornados no backend. Consumo dos serviços na interface e remoção de campos fabricados pertencem a SRV-Fpub, ainda pendente neste checkout. |
| RF-021 | O lojista aprovado deve poder cadastrar, listar, editar e excluir os próprios produtos, informando preço e estoque; produtos vinculados a pedidos devem preservar o histórico. | Alta | CRUD e exclusão com ownership presentes. Gate completo de papel/aprovação em criação/edição e vitrine ainda pendente em PRD-2. Produto ligado a pedido não pode ser excluído fisicamente: retorna conflito. |
| RF-022 | O tutor autenticado deve poder finalizar o carrinho e gerar pedidos com validação de disponibilidade, cálculo no servidor, baixa de estoque e limpeza do carrinho em uma transação. | Alta | PED-1/CHK-2 implementados. Gera um pedido por lojista. Login exigido antes do checkout. O contrato atual não persiste endereço de entrega nem frete no pedido; não declarar logística completa. |
| RF-023 | O tutor deve poder pagar o próprio pedido no modo habilitado e acompanhar a confirmação pelo sistema. | Alta | Simulado implementado; Mercado Pago sandbox implementado como opcional. Validação externa de credenciais/webhook permanece necessária. Cobrança real, repasse/split e estorno automático de pedidos não fazem parte dessa entrega. |
| RF-024 | O tutor deve poder consultar seus pedidos, itens, totais e status e retomar pedidos aguardando pagamento. | Alta | PED-2/PED-F/PGT-1 presentes: API de pedidos e `TutorOrders.tsx` consumindo dados reais. |
| RF-025 | O lojista deve poder consultar pedidos recebidos e atualizar o status dos próprios pedidos conforme as transições permitidas. | Alta | PED-2/PED-F presentes. Com gateway ativo, parceiro não pode marcar manualmente como pago. |
| RF-026 | Hotéis e pet sitters aprovados devem poder cadastrar, listar, editar e desativar os próprios serviços. | Alta | Backend SRV-1 implementado. Tela/menu de criação/listagem dependem de SRV-F1; edição/exclusão na interface dependem de SRV-F2. Estado da funcionalidade completa: parcial. |
| RF-027 | O tutor deve poder solicitar um agendamento de serviço para um pet próprio, consultar seus agendamentos e cancelar conforme as regras aplicáveis. | Alta | Modelagem/cálculo AGD-1 presentes; rotas AGD-2 e jornada BKG-1/BKG-2 não encontradas no checkout. Tela atual de agendamentos do tutor usa mocks. |
| RF-028 | O hotel ou pet sitter deve poder consultar sua agenda e confirmar, recusar, cancelar ou concluir os próprios agendamentos conforme as regras de estado. | Alta | Planejado em AGD-2/SCH-1/SCH-2. `Schedule.tsx` ainda demonstrativo. |
| RF-029 | O parceiro de serviços deve poder configurar a política de pagamento presencial ou antecipado, e o agendamento deve respeitá-la. | Alta | Enum/campo com padrão `PRESENCIAL` existem. Seletor/persistência da configuração e uso no fluxo final ainda pendentes. `PRE_PAGO` é a outra opção; não há opção `SINAL` implementada. |
| RF-030 | O sistema deve permitir o pagamento antecipado de agendamentos e registrar o estorno quando uma reserva paga for recusada ou cancelada conforme a política. | Alta | Planejado em PAG-2 e AGD-2. O sandbox atual atende pedidos de produtos, não agendamentos. Não marcar como entregue. |
| RF-031 | O tutor deve poder avaliar uma compra ou atendimento concluído; o sistema deve listar as avaliações e calcular indicadores reais por alvo. | Média | Planejado em AVL-1/AVL-2/AVL-F1/AVL-F2. Sem modelo `Review` ou rotas correspondentes no checkout analisado. É diferente de `SitterEvaluation`, usada na candidatura do prestador. |
| RF-032 | O administrador deve poder consultar usuários e filtrar a listagem por perfil e identificação. | Média | Implementado em `/api/v1/users/admin/users` e tela administrativa. Não incluir desativar/reativar usuário como entregue apenas porque existe o campo `is_active`. |
| RF-033 | O parceiro e o administrador devem consultar indicadores reais de atividade e receita, respeitando o escopo de acesso de cada perfil. | Média | Parcial: métricas administrativas de usuários/parceiros existem; receita e dashboards comerciais reais ainda dependem de DSH-1/DSH-2. Pode ser uma subdivisão do RF-011 para evitar duplicação. |
| RF-034 | O sistema deve exigir o aceite dos termos no cadastro e registrar a data e a versão aceitas. | Alta | Decisão explícita do plano, mas incompleta: a UI exige aceite, o backend aceita ausência/false e grava `true`; schema não possui data/versão do aceite. Não marcar como implementado. |

### E-mail de confirmação de compra

Existe um HTML `docs/email-templates/resend/order-payment-approved.html`, mas não foi encontrada chamada de envio desse template nos fluxos atuais de pagamento. A existência do arquivo não comprova envio automático. Se essa comunicação for desejada no escopo, criar um RF próprio ou incluí-la no RF-023 e registrar como pendente. Os envios explicitamente integrados hoje são recuperação de senha e recusa de cadastro.

## 7. Regras de negócio ausentes da lista enviada

Estas são regras a documentar como comportamento esperado; a coluna final distingue cobertura atual de pendência. Relacionamentos usam os novos RFs propostos acima.

| ID sugerido | Regra sugerida | RFs relacionados | Cobertura atual |
| --- | --- | --- | --- |
| RNE-009 | Somente lojista aprovado pode criar/editar produtos e publicar seu catálogo; produtos de lojista não aprovado não devem aparecer na vitrine. | RF-013, RF-021 | Decisão do plano; PRD-2 pendente no código. |
| RNE-010 | Somente hotel ou pet sitter aprovado pode gerenciar serviços; edição e exclusão são restritas ao proprietário. | RF-026 | Implementado no backend SRV-1. |
| RNE-011 | O usuário só pode gerir seus pets, endereços, carrinho, pedidos e favoritos; o parceiro só pode gerir seus recursos e atendimentos. | RF-004, RF-005, RF-014, RF-018, RF-021, RF-024 a RF-028 | Ownership presente em vários fluxos; agenda depende de implementação e a revisão de permissões não foi uma auditoria integral de todas as rotas. |
| RNE-012 | Apenas produtos ativos e com estoque podem ser adicionados ao carrinho; quantidades devem respeitar estoque e limites definidos pelo sistema. | RF-014, RF-022 | Implementado: até 99 unidades por item e 50 produtos distintos; merge considera os mesmos limites. |
| RNE-013 | Gerar pedido, seus itens, baixar estoque e limpar carrinho deve ocorrer atomicamente; a compra é dividida em um pedido por lojista. | RF-022 | Implementado; baixa ocorre na criação do pedido, antes do pagamento. Não confundir atomicidade com garantia de ausência de venda excedente em toda concorrência. |
| RNE-014 | Pedido deve iniciar aguardando pagamento e seguir somente transições permitidas até conclusão ou cancelamento. | RF-023 a RF-025 | Máquina em `orderStatus.js`; valor de estado vindo da URL de retorno não comprova pagamento. |
| RNE-015 | A finalização de compra exige tutor autenticado; após login o carrinho deve ser sincronizado e o contexto de compra preservado. | RF-003, RF-014, RF-022 | Implementado para o contexto de compra; carrinho anônimo pode existir antes do login. |
| RNE-016 | Recusa de cadastro exige motivo; o parceiro recusado pode corrigir os dados autenticado e reenviar, passando para `EM_REVISAO`. | RF-009, RF-017 | Backend e tela de correção presentes; revisar experiência de retorno após login comum. |
| RNE-017 | Política presencial e pré-paga determinam a confirmação e o pagamento do agendamento; estorno depende de pagamento prévio e estado permitido. | RF-027 a RF-030 | Regra planejada; fluxo ainda incompleto. Resolver as divergências de estados indicadas adiante. |
| RNE-018 | Hotel é cobrado por diária e sitter por hora/visita conforme contrato definido; o sistema calcula o total no servidor. | RF-026, RF-027 | Cálculo AGD-1: diária por noite de calendário, mínimo 1; sitter por hora iniciada, mínimo 1. Hoje usa tarifas do provider, não `Service.price`. Cobrança por visita separada não foi implementada. |
| RNE-019 | Avaliação do tutor só é permitida após compra/atendimento concluído, com autoria e origem válidas e sem duplicação. | RF-031 | Planejado em AVL-1/AVL-2. Definir a unidade de unicidade para pedidos com vários produtos antes de fechar o requisito. |
| RNE-020 | Para aparecer na listagem de sitters, o cadastro comercial e a avaliação de candidatura devem estar aprovados e o perfil completo. | RF-008 a RF-012, RF-019 | Implementado na listagem pública de sitters; não extrapolar automaticamente para todas as rotas de detalhe/gestão. |
| RNE-021 | Cadastro exige aceite real dos termos, com registro de data e versão. | RF-001, RF-034 | Pendência de backend, apesar de já constar no planejamento. |
| RNE-022 | Definir limites e validações de pets/endereços e impedir exclusões que violem atendimentos ou compras em andamento. | RF-004, RF-005 | Limites e ownership existem; filtros de estados de bloqueio precisam de atualização para português. |
| RNE-023 | Confirmação de pagamento deve validar sua origem, titularidade, valor e moeda, e eventos repetidos não podem duplicar efeitos. | RF-023 | Implementado para sandbox de pedidos; aceite externo ainda necessário. Eventos que exigem estorno/conciliação não possuem fluxo automático completo. |

## 8. Complementos sugeridos para os não funcionais

Adicionar somente metas que o time aceite e consiga verificar. Não inventar números de desempenho, disponibilidade ou cobertura para preencher o documento.

| ID sugerido | Requisito / critério sugerido | Situação e evidência |
| --- | --- | --- |
| RNF-009 | Respostas e registros operacionais devem proteger senhas, tokens, documentos e credenciais, com exposição de dados pessoais limitada à finalidade da rota. | Selects públicos, redatores de logs e filtros do Sentry existem; revisão integral da exposição de dados ainda deve ocorrer. Ter JWT não substitui essa obrigação. |
| RNF-010 | Operações de compra e confirmação de pagamento devem preservar integridade transacional e idempotência nos eventos repetidos. | Transação de pedidos e confirmação do sandbox existem. Acrescentar evidência de concorrência/rollback; a transação sozinha não prova proteção completa de estoque concorrente. |
| RNF-011 | A aplicação deve disponibilizar diagnóstico de saúde, logs correlacionados e registro de erros para investigação operacional. | `/api/health`, `/api/metrics`, pino e Sentry opcional existem. Ativação efetiva do Sentry depende das variáveis do ambiente. |
| RNF-012 | Alterações devem passar por verificação automatizada, e testes de integração devem usar banco isolado; estrutura do banco deve evoluir por migrations versionadas. | CI com lint, testes, typecheck, build, E2E e PostgreSQL de teste; migrations versionadas presentes. Auditoria de dependências no CI é não bloqueante. |
| RNF-013 | Telas essenciais devem permitir uso por teclado, ter rótulos e foco perceptível e apresentar conteúdo sem sobreposição nos tamanhos acordados. | Base de a11y existe, cobertura global prevista em QA-3. Pode ser absorvido por RNF-002/RNF-003 se houver critérios claros. |
| RNF-014 | Segredos devem ser configurados por ambiente e não expostos ao cliente; migração e recuperação de dados devem ter procedimento documentado. | Configuração por ambiente, fail-fast e runbook de rotação existem. Não declarar backups/restauração operacionais comprovados apenas pela existência de migrations ou de instruções. |

Disponibilidade, desempenho e compatibilidade também precisam de critérios observáveis: navegadores suportados, cenários de carga, tempo de resposta e recuperação aceitáveis. Esses valores devem ser acordados com o time antes de se declarar atendimento.

## 9. O que aproveitar da documentação existente

| Fonte | Utilidade | Cuidado |
| --- | --- | --- |
| `docs/Sprints/PLANO-DESENVOLVIMENTO.md` | Papéis, decisões de negócio e escopo geral. Seção 3 é a principal referência de decisões. | Seção 2 é uma fotografia de agosto; não representa a entrega de outubro. A menção a “Mercado Pago real” no backlog não corresponde ao sandbox implementado. |
| `docs/funcional/04-requisitos.md` | IDs dos RFs existentes e categorias de RNF. | Lista curta e antiga; RF-014 ainda mistura carrinho de compra/agendamento. Falta grande parte do escopo transacional. |
| `docs/funcional/03-regras-de-negocio.md` | Completude, limites de pets/endereços, favoritos e carrinho. | Status legados e momento da baixa de estoque estão desatualizados. |
| `docs/backend/03-api-endpoints.md` | Rotas atuais de pets, perfil, senha, endereços e favoritos. | Ainda fala em provider `ATIVO`, avaliação enviada por tutor e status ingleses de pedidos/agendamentos; faltam contratos novos de pedidos/pagamentos/serviços. |
| `docs/backend/04-seguranca-e-testes.md` | Autenticação, estrutura de segurança e entrada de dados. | Custo bcrypt não é único; CNPJ não tem a validação alegada; estratégia de testes vai além dos testes manuais descritos. |
| `docs/Sprints/Sprint-1-Pedidos-e-Seguranca/` | Criação transacional, histórico, estados de pedidos e testes de integração. | Critério de aceite é referência do objetivo; conferir se cada implementação atende ao critério. |
| `docs/Sprints/Sprint-2-Checkout-Email-Recusa/` | Recuperação real, compra, recusa/reenvio, pagamento simulado e modelagem de agenda. | Não confundir modelagem AGD-1 com jornada de agendamento pronta. |
| `docs/Sprints/Sprint-3-Servicos-Agendamento/` | Divisão backend/UI de serviços, sandbox, gate de produtos e contrato previsto de agenda. | SRV-1 não inclui SRV-F1/SRV-F2; PRD-2 e AGD-2 não estão implementados neste checkout. |
| `docs/Sprints/Sprint-3-Servicos-Agendamento/PGT-1-CONFIGURACAO.md` | Limites reais do sandbox e checklist de aceite externo. | Pedidos de produtos, sem pagamento de agenda, cobrança real ou estorno automático. |
| `docs/Sprints/Sprint-4-Agendamento-Avaliacoes/` | Requisitos futuros de agendamento completo e reviews. | Não marcar como entregue por haver schemas/repos ou telas demonstrativas. |
| `docs/Sprints/Sprint-5-Fechamento/` | Dashboards reais, a11y, QA, segurança e release. | Mostra justamente por que alguns RNFs e o painel ainda não devem ter aceite global. |
| `docs/funcional/05-jornadas-de-usuario.md` | Ajuda a organizar os requisitos por perfil e jornada. | Inclui capacidade de hotel, calendário e check-in/out que não foram encontrados implementados. Usar como intenção, não como evidência de entrega. |

### Divergências que exigem alinhamento antes da versão final

1. **Senha:** escolher política única e aplicar em cadastro, troca e recuperação. Uma proposta coerente com as telas atuais é mínimo 8, uma maiúscula e um número; isso é proposta, não descrição uniforme do código existente.
2. **CNPJ:** manter a validação completa como requisito pendente ou assumir formalmente apenas validação estrutural no MVP. A consulta oficial não deve constar como implementada.
3. **Agenda:** o plano/AGD-2 dizem que PRESENCIAL nasce confirmado e PRE_PAGO aguardando confirmação; as constantes AGD-1 começam em `PENDENTE` e descrevem avanço após aceite do parceiro. Há divergência também sobre recusar em `AGUARDANDO_CONFIRMACAO`. Resolver a máquina antes de fechar os RFs de agenda.
4. **Preço de agenda:** SRV-1 guarda `Service.price`; AGD-1 calcula por `Provider.daily_rate/hourly_rate`. Definir a fonte oficial da tarifa antes de prometer preço por serviço na contratação.
5. **Entrega de produtos:** o checkout seleciona endereço, mas `Order` não possui endereço/snapshot de entrega e `CreateOrderUseCase` não o persiste. O sandbox não adiciona frete. Se compra com entrega é parte do escopo, documentar esta lacuna.
6. **Termos:** o plano exige valor real, data e versão; o código não atende integralmente. Deve ser pendência explícita.

## 10. Pendências de código identificadas durante a revisão

Esta seção registra divergências verificáveis, sem alterar o código nesta análise.

| Prioridade | Pendência | Evidência |
| --- | --- | --- |
| Alta | Política de senha varia entre cadastro/backend, tela de cadastro, troca e recuperação. | `backend/src/schemas/authSchemas.js:24`, `backend/src/schemas/userSchemas.js:24`, `frontend/src/pages/auth/RegisterPage.tsx:49`. |
| Alta | CNPJ não recebe validação matemática/consulta externa e documento não é normalizado na persistência. | `backend/src/services/DocumentVerificationService.js:3`, `backend/src/useCases/auth/RegisterUseCase.js:73`. |
| Alta | Aceite de termos é forçado como verdadeiro e não armazena data/versão. | `backend/src/useCases/auth/RegisterUseCase.js:68`, `backend/prisma/schema.prisma:28`. |
| Alta | Gate de lojista aprovado ausente em criação/edição de produtos e na vitrine. | `backend/src/useCases/products/CreateProductUseCase.js:20`, `backend/src/useCases/products/UpdateProductUseCase.js:19`, `backend/src/useCases/products/ListActiveProductsUseCase.js:23`. |
| Alta | Bloqueios de exclusão de pet/endereço consultam status antigos e podem deixar de reconhecer registros com os valores atuais. | `backend/src/repositories/PetRepository.js:3`, `backend/src/controllers/AddressController.js:6`. |
| Média | Fotos da candidatura não são exibidas de fato ao avaliador administrativo. | `frontend/src/pages/dashboard/SitterEvaluations.tsx:304`. |
| Média | Rejeição e feedback não são apresentados como ciclo completo na tela do onboarding. | `frontend/src/pages/onboarding/PetSitterOnboarding.tsx:63`. |
| Média | Nome comercial editável no formulário público não é persistido pelo use case acionado. | `frontend/src/pages/dashboard/PublicProfile.tsx:356`, `backend/src/useCases/providers/UpdateProviderProfileUseCase.js:6`. |
| Média | Link de correção exige revisão de retorno após login para parceiro: a retomada da rota de origem no login está condicionada a tutor. | `frontend/src/pages/auth/LoginPage.tsx:92`, `frontend/src/app/routes.tsx:306`. |

As pendências acima não devem desaparecer do documento por meio de uma mudança de texto. O documento deve indicar o comportamento desejado, o atendimento parcial e a tarefa que falta.

## 11. Ordem prática para atualizar o documento acadêmico

1. Manter RF-001 a RF-015 e corrigir rotas, estados e os detalhamentos indicados na seção 4.
2. Revisar RNE-002/RNE-003 com o time, deixando explícitas as diferenças entre regra pretendida e implementação atual.
3. Marcar os RFs amplos de painel, avaliação administrativa, status do onboarding e perfil comercial como parciais, ou subdividi-los por entregas verificáveis.
4. Acrescentar os requisitos ausentes, destacando backend/UI, pagamentos simulados/sandbox e planejados.
5. Remover a repetição entre RNF-001/RNF-007/RNF-008 ou mantê-los com escopos diferentes e referências cruzadas. Reescrever RNF-006.
6. Acrescentar critérios de aceite, evidência e rastreabilidade para cada requisito, evitando afirmar atendimento global por usar uma biblioteca ou ter uma tela.
7. Atualizar os documentos antigos do repositório após fechar a versão revisada, para que descrevam as mesmas regras do documento acadêmico.
