# Evidências de testes e rastreabilidade de requisitos

Execução registrada em 18/10/2026, branch `Tasks-Laura`, commit `176e5a42156870d5e18c755fa70e8508099ecff1`, Node.js v24.18.0.

## Resultado efetivamente obtido

| Suíte selecionada | Executados | Aprovados | Falhas | Ignorados |
| --- | --- | --- | --- | --- |
| backend | 104 | 104 | 0 | 0 |
| frontend | 15 | 15 | 0 | 0 |

As contagens foram extraídas dos relatórios JUnit desta execução. Este é um recorte, não a suíte completa. Não foram executados testes com banco real, E2E de navegador ou serviços externos. O código testado é o commit acima da Tasks-Laura; não representa uma execução integral da main mais recente.

Os IDs com asterisco são sugestões de numeração apresentadas em `docs/funcional/REQUISITOS-TEXTOS-PARA-DOCUMENTO.md`. Se o documento acadêmico adotou outros IDs, atualizar os vínculos antes de publicar.

## Matriz de rastreabilidade

| Caso | Requisitos | Cenário | Resultado esperado | Resultado obtido | Evidência |
| --- | --- | --- | --- | --- | --- |
| CT-01 | RF-001; RNE-001 | Tentativa de criar administrador pelo cadastro público. | HTTP 422; operação rejeitada. | APROVADO: asserções do caso satisfeitas. | backend-junit.xml; caso detalhado abaixo. |
| CT-02 | RF-002; RNF-001 | Login de usuário com is_active=false. | Use case rejeita acesso com statusCode 403. | APROVADO: asserções do caso satisfeitas. | backend-junit.xml; caso detalhado abaixo. |
| CT-03 | RF-016* | Redefinição com a mesma senha atual. | Reutilização recusada sem consumir o token. | APROVADO: asserções do caso satisfeitas. | backend-junit.xml; caso detalhado abaixo. |
| CT-04 | RF-014 | Adição de item ao carrinho pelo perfil Tutor. | Resposta de sucesso 2xx. | APROVADO: asserções do caso satisfeitas. | backend-junit.xml; caso detalhado abaixo. |
| CT-05 | RF-022*; RNE-013* | Finalização de carrinho com um lojista. | Criar pedido/itens, registrar preço, baixar estoque e limpar carrinho. | APROVADO: asserções do caso satisfeitas. | backend-junit.xml; caso detalhado abaixo. |
| CT-06 | RF-022* | Pedido com quantidade superior ao estoque disponível. | HTTP 409; pedido não criado. | APROVADO: asserções do caso satisfeitas. | backend-junit.xml; caso detalhado abaixo. |
| CT-07 | RF-024*; RNE-011* | Consulta de pedidos autenticada como tutor A. | Consulta limitada ao tutor A, sem retornar pedidos do tutor B. | APROVADO: asserções do caso satisfeitas. | backend-junit.xml; caso detalhado abaixo. |
| CT-08 | RF-026*; RNE-010* | Parceiro tenta editar serviço de outra conta. | HTTP 403; alteração não autorizada. | APROVADO: asserções do caso satisfeitas. | backend-junit.xml; caso detalhado abaixo. |
| CT-09 | RF-023*; RNE-023* | Repetição de notificação de pagamento aprovado. | Pedido confirmado uma vez, sem reaplicar efeitos. | APROVADO: asserções do caso satisfeitas. | backend-junit.xml; caso detalhado abaixo. |
| CT-10 | RF-023*; RNE-023* | Retorno com aprovação na URL, sem confirmação do backend. | Interface aguarda confirmação e não anuncia pedido pago. | APROVADO: asserções do caso satisfeitas. | frontend-junit.xml; caso detalhado abaixo. |
| CT-11 | RF-017*; RNE-016* | Parceiro salva correções e solicita reanálise. | Salvar os dados antes de chamar o reenvio. | APROVADO: asserções do caso satisfeitas. | frontend-junit.xml; caso detalhado abaixo. |

## Fichas prontas para transposição

### CT-01 — Cadastro público

**Requisito relacionado:** RF-001; RNE-001.

**Cenário executado:** Tentativa de criar administrador pelo cadastro público.

**Tipo e ambiente:** Integração HTTP; rejeição antes do acesso ao banco.

**Resultado esperado:** HTTP 422; operação rejeitada.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `backend-junit.xml`, teste “POST /register com role_id 1 (ADMIN) → 422 e não cria admin (PET-01)”.

**Arquivo do teste:** `backend/tests/integration/authRoutes.test.js`.

### CT-02 — Controle de acesso

**Requisito relacionado:** RF-002; RNF-001.

**Cenário executado:** Login de usuário com is_active=false.

**Tipo e ambiente:** Unitário; repositório e comparação de senha simulados.

**Resultado esperado:** Use case rejeita acesso com statusCode 403.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `backend-junit.xml`, teste “Usuário com is_active = false é bloqueado com 403”.

**Arquivo do teste:** `backend/tests/unit/loginUseCase.test.js`.

### CT-03 — Recuperação de senha

**Requisito relacionado:** RF-016*.

**Cenário executado:** Redefinição com a mesma senha atual.

**Tipo e ambiente:** Unitário; persistência simulada; não envia e-mail real.

**Resultado esperado:** Reutilização recusada sem consumir o token.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `backend-junit.xml`, teste “reset de senha rejeita reutilizar a senha atual sem consumir o token”.

**Arquivo do teste:** `backend/tests/unit/passwordResetUseCase.test.js`.

### CT-04 — Carrinho do tutor

**Requisito relacionado:** RF-014.

**Cenário executado:** Adição de item ao carrinho pelo perfil Tutor.

**Tipo e ambiente:** Integração HTTP com Prisma simulado; não é teste com PostgreSQL.

**Resultado esperado:** Resposta de sucesso 2xx.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `backend-junit.xml`, teste “addItem: TUTOR (5) retorna sucesso (2xx)”.

**Arquivo do teste:** `backend/tests/integration/cartRoutes.test.js`.

### CT-05 — Geração de pedidos

**Requisito relacionado:** RF-022*; RNE-013*.

**Cenário executado:** Finalização de carrinho com um lojista.

**Tipo e ambiente:** Integração HTTP com Prisma/repositórios simulados.

**Resultado esperado:** Criar pedido/itens, registrar preço, baixar estoque e limpar carrinho.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `backend-junit.xml`, teste “POST /api/v1/orders: Sucesso (Happy-Path Single Provider) cria Order + OrderItems, congela preço, baixa estoque e limpa carrinho”.

**Arquivo do teste:** `backend/tests/integration/orderRoutes.test.js`.

### CT-06 — Validação de estoque

**Requisito relacionado:** RF-022*.

**Cenário executado:** Pedido com quantidade superior ao estoque disponível.

**Tipo e ambiente:** Integração HTTP com dependências simuladas; rejeição na validação prévia.

**Resultado esperado:** HTTP 409; pedido não criado.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `backend-junit.xml`, teste “POST /api/v1/orders: 409 e rollback se estoque for insuficiente na validação prévia”.

**Arquivo do teste:** `backend/tests/integration/orderRoutes.test.js`.

### CT-07 — Pedidos do tutor

**Requisito relacionado:** RF-024*; RNE-011*.

**Cenário executado:** Consulta de pedidos autenticada como tutor A.

**Tipo e ambiente:** Integração HTTP; consulta/persistência simuladas.

**Resultado esperado:** Consulta limitada ao tutor A, sem retornar pedidos do tutor B.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `backend-junit.xml`, teste “GET /api/v1/orders: isolamento de tutor — tutor A não vê pedidos de tutor B”.

**Arquivo do teste:** `backend/tests/integration/orderRoutes.test.js`.

### CT-08 — Propriedade do serviço

**Requisito relacionado:** RF-026*; RNE-010*.

**Cenário executado:** Parceiro tenta editar serviço de outra conta.

**Tipo e ambiente:** Integração HTTP com Prisma/repositórios simulados.

**Resultado esperado:** HTTP 403; alteração não autorizada.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `backend-junit.xml`, teste “PUT /providers/services/:id: bloqueia serviço de outro parceiro”.

**Arquivo do teste:** `backend/tests/integration/serviceRoutes.test.js`.

### CT-09 — Pagamento idempotente

**Requisito relacionado:** RF-023*; RNE-023*.

**Cenário executado:** Repetição de notificação de pagamento aprovado.

**Tipo e ambiente:** Unitário; banco e gateway simulados; não comprova sandbox externo.

**Resultado esperado:** Pedido confirmado uma vez, sem reaplicar efeitos.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `backend-junit.xml`, teste “webhook consulta pagamento e marca pedido PAGO atomicamente; duplicação não reaplica”.

**Arquivo do teste:** `backend/tests/unit/mercadoPagoPayment.test.js`.

### CT-10 — Confirmação na interface

**Requisito relacionado:** RF-023*; RNE-023*.

**Cenário executado:** Retorno com aprovação na URL, sem confirmação do backend.

**Tipo e ambiente:** Componente com respostas de API simuladas.

**Resultado esperado:** Interface aguarda confirmação e não anuncia pedido pago.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `frontend-junit.xml`, teste “retorno aprovado na URL aguarda webhook e não anuncia pedido pago”.

**Arquivo do teste:** `frontend/src/pages/CheckoutPaymentPage.test.tsx`.

### CT-11 — Correção de cadastro

**Requisito relacionado:** RF-017*; RNE-016*.

**Cenário executado:** Parceiro salva correções e solicita reanálise.

**Tipo e ambiente:** Componente com serviços simulados.

**Resultado esperado:** Salvar os dados antes de chamar o reenvio.

**Resultado obtido:** APROVADO. As asserções do teste foram satisfeitas durante a execução registrada.

**Evidência:** relatório `frontend-junit.xml`, teste “salva as correções e só então reenvia — o endpoint de reenvio não grava dados”.

**Arquivo do teste:** `frontend/src/pages/parceiro/CorrecaoCadastro.test.tsx`.

## Texto para acrescentar à seção 23

Para relacionar os testes aos requisitos do Pet+, foi elaborada uma matriz de rastreabilidade contendo o identificador do requisito, o cenário exercitado, o resultado esperado, o resultado obtido e a referência da evidência. Em uma execução local de um recorte dos testes automatizados, foram registrados 119 testes, com 119 aprovações, 0 falhas e 0 casos ignorados. Os resultados incluem verificações de cadastro, acesso, recuperação de senha, carrinho, pedidos, serviços e comportamento de componentes da interface. Os relatórios JUnit e as fichas dos casos permitem localizar o teste correspondente a cada requisito e identificar se houve uso de dependências simuladas. A aprovação de um cenário demonstra o comportamento exercitado, mas não representa, isoladamente, o atendimento integral do requisito nem comprova o funcionamento do ambiente de produção ou de serviços externos.

**Legenda da figura:** Figura X — Exemplos da relação entre requisitos, cenários de teste executados e resultados obtidos no Pet+. Fonte: elaboração própria, com base nos relatórios de execução de 18/10/2026, commit 176e5a4.

## Evidências complementares a reunir

- CI: captura ou link da execução, identificando commit, data e jobs concluídos. Um print verde comprova os jobs daquela execução; os casos e asserts precisam ser vinculados à matriz.
- PostgreSQL: execução de `cartOrderDb.test.js` em banco isolado, quando disponível, com relatório próprio. Não usar esta execução com mocks como comprovação de transação no banco real.
- E-mail: teste manual registrado, com mensagem recebida e resultado do link, removendo dados pessoais e tokens das imagens.
- Sandbox: pagamento de teste e webhook aceito, com estado correspondente do pedido e identificação do caso. Não usar teste de gateway simulado como prova de pagamento externo.
- Usabilidade/responsividade: identificar tela, tamanho, passos, resultado e evidência; manter falhas e pendências registradas.

## Modelo para casos ainda não executados

**Caso:** preencher identificador.

**Requisito:** preencher ID e descrição.

**Data, ambiente e versão:** preencher após a execução.

**Pré-condições e passos:** descrever conta, dados de teste e ações.

**Resultado esperado:** definir antes de executar.

**Resultado obtido:** NÃO EXECUTADO até haver execução registrada.

**Evidência:** indicar relatório, captura ou execução do CI.

**Pendência:** registrar falha ou limitação e ação necessária.
