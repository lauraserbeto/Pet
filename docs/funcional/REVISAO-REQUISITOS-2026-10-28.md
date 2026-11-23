# Revisão das seções 13, 14 e 15 do documento do projeto Pet+

Data: 28/10/2026. Documento revisado: "PFC Documento" (Google Docs), seções 13 (Regras de Negócio), 14 (Requisitos Funcionais) e 15 (Requisitos Não Funcionais), na versão de 18/10/2026.

Base de verificação: código do commit `45c0e77` (main com o E-06), lido sem alteração; decisões DEC-A a DEC-G em [PAUTA-FASE-0-DECISOES-ESTABILIZACAO.md](../Sprints/PAUTA-FASE-0-DECISOES-ESTABILIZACAO.md); entregas E-01 a E-06 em [PLANO-IMPLEMENTACAO-FASE-1-ESTABILIZACAO.md](../Sprints/PLANO-IMPLEMENTACAO-FASE-1-ESTABILIZACAO.md); revisão anterior em [REVISAO-REQUISITOS-2026-10-15.md](REVISAO-REQUISITOS-2026-10-15.md).

Ponto de partida: os apontamentos do orientador sobre a redação do RF-001 e a associação entre a RNE-001 e o RNF-001.

Esta revisão não alterou o documento. As alterações dependem de aprovação item a item.

## 1. Critérios

### Classificação dos problemas

| Código | Problema |
| --- | --- |
| RED | Redação: ator indefinido, ambiguidade, termo impreciso ou forma não normativa. |
| INC | Texto incompleto ou com lacuna que impede a verificação. |
| DES | Afirmação sobre o sistema desatualizada ou incorreta em relação ao código atual. |
| STA | Status incompatível com a evidência ou com o próprio detalhamento. |
| RAS | Relacionamento incorreto, ausente ou superficial. |
| DUP | Duplicidade ou sobreposição entre itens. |
| CLA | Classificação inadequada (regra, comportamento ou qualidade). |
| VER | Critério de verificação vago. |

### Prioridade

- **P1, necessária:** afirmação falsa, relacionamento sem fundamento, contradição ou texto incompleto. Compromete a consistência do documento.
- **P2, recomendável:** melhora a precisão, a rastreabilidade ou a honestidade do status, sem mudar o comportamento descrito.
- **P3, opcional:** padronização ou clareza. Fica registrada, mas só é aplicada se a equipe pedir.

### Regras seguidas

- A revisão não altera o comportamento nem o escopo. Quando o código não atende a um requisito, a correção vai para o status e o detalhamento, e o requisito fica como está.
- Decisão registrada não é tratada como implementação. As DEC-E (política de senha e custo do bcrypt) e DEC-F (data e versão do aceite) foram decididas e ainda não estão no código.
- Nenhum identificador muda.
- Só os relacionamentos com dependência, implementação, restrição ou impacto demonstrável são mantidos ou propostos.

## 2. Apontamentos do orientador

### 2.1. RF-001

**Atual:** "O sistema deve permitir o cadastro de usuários como Tutor ou Parceiro, nas modalidades Lojista, Hotel e *Pet Sitter*."

**Sugerida pelo orientador:** "O sistema deve permitir que o usuário se cadastre como Tutor ou Parceiro, nas modalidades Lojista, Hotel e *Pet Sitter*."

**Análise.** O apontamento procede. Na redação atual, "o cadastro de usuários" é uma nominalização que não diz quem cadastra. Ela admite duas leituras: o autocadastro e o cadastro feito por terceiros, como um administrador. O sistema implementa só o autocadastro público. A rota `POST /api/v1/auth/register` não exige autenticação (`backend/src/routes/authRoutes.js:37-41`), e não existe cadastro de usuário feito pelo administrador. A versão do orientador nomeia o ator e a ação que ele executa, o que elimina a ambiguidade e permite um teste direto: um visitante consegue se cadastrar como cada um dos quatro perfis. Esse é o critério de "requisito não ambíguo" e "singular" da ISO/IEC/IEEE 29148.

**Ressalva opcional (P3).** Antes do cadastro, a pessoa ainda não é usuária do sistema. O próprio documento chama esse ator de "visitante" no RF-013, no RF-019 e no RF-020. "Permitir que o visitante se cadastre" seria mais consistente. A versão do orientador já está correta. A troca é só uma escolha de consistência terminológica e fica a critério da equipe.

**Proposta (P1):** adotar a redação do orientador. O detalhamento e os relacionamentos não mudam.

### 2.2. RNE-001 → RNF-001

**Conteúdo dos dois itens:**

- A RNE-001 define os dados obrigatórios do cadastro público e os perfis admitidos (Tutor, Lojista, Hotel e *Pet Sitter*), com e-mail único e sem o perfil Administrador.
- O RNF-001 exige que as operações privadas sejam controladas por autenticação e autorização compatíveis com o perfil e com a propriedade dos dados.

**Por que a associação está errada:**

1. O cadastro é uma operação pública. A rota não passa pelo middleware de autenticação, então o controle de acesso do RNF-001 não atua sobre ela.
2. A exclusão do perfil Administrador parece uma regra de autorização, mas é implementada como validação de entrada: a lista de perfis aceitos `SELF_SERVICE_ROLES = [2, 3, 4, 5]` no schema Zod (`backend/src/schemas/authSchemas.js:8,26-31`), com uma segunda verificação no caso de uso (`backend/src/useCases/auth/RegisterUseCase.js:9,17-19`). Ela é parte do comportamento do RF-001, não do mecanismo do RNF-001.
3. A única ligação é indireta: o `role_id` gravado no cadastro é usado depois pela autorização. Isso é semelhança de assunto, não dependência. Com esse critério, quase todo item do documento estaria ligado ao RNF-001.

**O mesmo erro se repete:**

- **RNE-002 → RNF-001.** A política de senha é validação de entrada. A alteração de senha ocorrer em rota autenticada é uma característica do RF-007, não da política.
- **RNE-003 → RNF-001.** A validação e a unicidade do documento acontecem na rota pública de cadastro e na restrição do banco.

**Onde o RNF-001 se aplica e não aparece.** As regras que dizem quem pode fazer o quê são implementadas justamente pelos mecanismos do RNF-001 (JWT, verificação de perfil, de situação do parceiro e de propriedade):

| Regra | Mecanismo |
| --- | --- |
| RNE-004 | Sessão restrita do parceiro recusado (`backend/src/middlewares/authMiddleware.js:10-19,70-78`) e verificador de parceiro operacional (`backend/src/useCases/providers/providerAccess.js:48-121`). |
| RNE-005 | `adminMiddleware` (`backend/src/middlewares/adminMiddleware.js:3`). |
| RNE-009 | Perfil 2 + APROVADO + conta ativa na criação e edição de produtos (`providerAccess.js:103-121`). |
| RNE-010 | Perfil 3 ou 4 + APROVADO + propriedade (`backend/src/useCases/services/serviceAccess.js:11-44`). |
| RNE-011 | Identificação pelo token e verificação de propriedade em cada recurso. |

**Proposta:**

- Remover o RNF-001 da RNE-001, da RNE-002 e da RNE-003 (P1).
- Incluir o RNF-001 na RNE-004, RNE-005, RNE-009, RNE-010 e RNE-011 (P2).

## 3. Diagnóstico das regras de negócio (seção 13)

### 3.1. Itens com alteração proposta

#### RNE-001

- **Original:** "Todo usuário deve se cadastrar informando nome completo, e-mail, senha e tipo de perfil. O cadastro público deve permitir os perfis Tutor, Lojista, Hotel e *Pet Sitter*." Relacionados: RF-001, RNF-001.
- **Problemas:**
  - RAS, P1: associação ao RNF-001 (ver 2.2).
  - RED, P2: "Todo usuário deve se cadastrar" é uma generalização falsa, porque o Administrador não se cadastra (o próprio detalhamento diz isso). A frase também põe a obrigação no usuário, quando a regra é sobre o que o cadastro exige.
- **Sugerida (P2):** "O cadastro público deve exigir nome completo, e-mail, senha e tipo de perfil, e admitir somente os perfis Tutor, Lojista, Hotel e *Pet Sitter*."
- **Relacionados:** RF-001.
- **Evidência:** `authSchemas.js:8,12-31`; `RegisterUseCase.js:9,17-19`.
- **Pendências de código, sem efeito no texto:**
  - O e-mail é único, mas não é convertido para minúsculas no cadastro (`authSchemas.js:17-21`).
  - O nome comercial só é obrigatório na interface (`authSchemas.js:35-40`).

#### RNE-002

- **Original:** política de senha (8 caracteres, maiúscula e número). Relacionados: RF-001, RF-007, RF-016, RNF-001, RNF-008.
- **Problemas:**
  - RAS, P1: RNF-001 (ver 2.2).
  - RAS, P2: o RNF-008 trata do armazenamento da senha (hash) e a regra trata da força da senha. Os dois são independentes: mudar um não afeta o outro. A frase "antes da geração do hash" só indica a ordem das etapas.
- **Redação:** a descrição e o detalhamento estão corretos e coerentes com o código. O detalhamento já registra a pendência: o cadastro aceita 6 caracteres (`authSchemas.js:22-25`) e a troca não exige maiúscula (`userSchemas.js:32-37`).
- **Relacionados:** RF-001, RF-007, RF-016. A alteração também remove o ponto final que sobra em "RNF-008.".
- **Incerteza:** a DEC-E agrupou a política e o custo do bcrypt na mesma decisão. Se a equipe quiser manter esse vínculo de decisão, o RNF-008 pode ficar. A recomendação é remover.

#### RNE-003

- **Problema:** RAS, P1: associação ao RNF-001 (ver 2.2).
- **Redação e detalhamento:** corretos. A validação do CNPJ só confere o tamanho (`DocumentVerificationService.js:3-12`), e o documento é gravado sem normalização (`RegisterUseCase.js:43,73`).
- **Relacionados:** RF-001.

#### RNE-004

- **Problemas:**
  - DES, P1: a última frase diz que "o bloqueio completo de criação e publicação de produtos por lojista não aprovado ainda depende da PRD-2". O E-01 absorveu a PRD-2: o back-end bloqueia criação, edição e exclusão de produtos, e a vitrine filtra por parceiro aprovado com conta ativa (`providerAccess.js:103-121`; `CreateProductUseCase.js:29-33`; `ListActiveProductsUseCase.js:26-29`). Desde o E-01, o back-end também restringe a sessão do parceiro recusado às rotas de correção (`authMiddleware.js:10-19,70-78`).
  - RAS, P2: falta o RNF-001.
- **Sugerida (P1):**
  - Trecho atual: "A restrição operacional deve ser aplicada também no *back-end*; o bloqueio completo de criação e publicação de produtos por lojista não aprovado ainda depende da PRD-2."
  - Trecho novo: "A restrição operacional também é aplicada no *back-end*, que limita a sessão do parceiro recusado às rotas de correção e bloqueia a criação, a edição e a exibição de produtos de lojista não aprovado."
- **Relacionados:** RF-002, RF-008, RF-009, RF-011, RF-012, RF-017, RNF-001.

#### RNE-005

- **Problema:** RAS, P2: falta o RNF-001 (`adminMiddleware.js:3`; `providerRoutes.js:57-63`; `userRoutes.js:168,271`).
- **Redação:** correta.
- **Pendente de confirmação:** pela DEC-D, o administrador não deveria conseguir aprovar um *Pet Sitter* sem candidatura aprovada. O código ainda permite isso (`ProviderController.js:290-317`). O documento não afirma o contrário. Incluir essa condição na regra é decisão da equipe.
- **Relacionados:** RF-009, RF-010, RNF-001.

#### RNE-008

- **Problemas:**
  - INC, P1: "manter até endereços" está sem o número. O limite no código é 5 (`AddressController.js:5,29-34`), o mesmo valor do RF-005.
  - RED, P3: "O usuário deve poder manter" descreve uma capacidade, que é o papel de um RF. A regra é o limite e a restrição de acesso.
- **Sugerida (P1):** "O usuário deve poder manter até 5 endereços vinculados à sua conta, com indicação de endereço principal e acesso restrito ao proprietário."
- **Relacionados:** sem alteração (RF-005).

#### RNE-009

- **Problemas:**
  - DES e STA, P1: a última frase diz que a regra está parcialmente atendida por depender da PRD-2. A regra está implementada no back-end (E-01): perfil 2 + APROVADO + conta ativa para criar, editar e excluir, e filtro na vitrine e no detalhe (`providerAccess.js:65-85,103-121`; `CreateProductUseCase.js:29`; `UpdateProductUseCase.js:30`; `GetProductDetailsUseCase.js:28-33`).
  - RAS, P2: falta o RNF-001.
  - RED, P3: "criar/editar" com barra.
- **Sugerida (P1):**
  - Trecho atual: "No código analisado, a restrição completa de perfil e aprovação ainda depende da PRD-2; portanto, esta regra está parcialmente atendida."
  - Trecho novo: "Essas verificações estão implementadas no *back-end*, que também impede a inclusão no carrinho e a compra de produtos de lojista não aprovado."
- **Relacionados:** RF-013, RF-021, RNF-001.

#### RNE-010

- **Problemas:**
  - DES, P1: "a interface de gerenciamento ainda depende da SRV-F1 e da SRV-F2" já era falso quando o texto foi escrito. A tela de serviços, com cadastro, listagem, edição e desativação, existe desde 13/10 (`frontend/src/pages/dashboard/Services.tsx`; rota em `frontend/src/app/routes.tsx:366-371`).
  - RAS, P2: falta o RNF-001.
  - DES, P2: pela DEC-D, "aprovado" para *Pet Sitter* inclui a candidatura aprovada. A gestão de serviços verifica só o status APROVADO (`serviceAccess.js:39-41`).
- **Sugerida (P1):**
  - Trecho atual: "Essas verificações estão implementadas no *back-end* da SRV-1; a interface de gerenciamento ainda depende da SRV-F1 e da SRV-F2."
  - Trecho novo: "Essas verificações estão implementadas no *back-end*, e a interface de gerenciamento de serviços está disponível no painel. Para *Pet Sitters*, a exigência de candidatura aprovada ainda não é verificada nesta operação."
  - Sem a parte P2, a frase final fica de fora.
- **Relacionados:** RF-026, RNF-001.

#### RNE-011

- **Problemas:**
  - RAS, P2: falta o RNF-001. Esta é a regra de negócio que o RNF-001 implementa de forma mais direta.
  - RAS, P3: o RF-023 (pagar os próprios pedidos, com verificação de propriedade em `CreatePaymentPreferenceUseCase.js:20-21`) e o RF-015 (perfil comercial próprio) também se encaixam.
  - RED, P3: a descrição fala em "usuário" e o detalhamento em "tutor".
- **Relacionados:** RF-004, RF-005, RF-014, RF-018, RF-021, RF-024 a RF-028, RNF-001. Com o P3, entram também RF-015 e RF-023.

#### RNE-013

- **Problema:** RAS, P2: falta o RNF-010. A atomicidade da criação do pedido é exatamente a "integridade transacional" do RNF-010 (`CreateOrderUseCase.js:127-220`).
- **Redação e detalhamento:** corretos, inclusive a ressalva sobre concorrência. O decremento de estoque não tem condição, e o banco não tem restrição de estoque não negativo.
- **Relacionados:** RF-022, RNF-010.

#### RNE-017

- **Problemas:**
  - DES, P1: o detalhamento diz que a configuração da política depende de entregas e que o estado inicial e a ordem entre aceite e pagamento precisam ser alinhados. A DEC-A resolveu o alinhamento, e o E-04 implementou:
    - todo agendamento inicia em PENDENTE;
    - a política é copiada para o agendamento na criação (`CreateAppointmentUseCase.js:170-171`);
    - as transições seguem a política (`appointmentStatus.js:62-92`).
    
    A configuração pelo parceiro existe desde 13/10 (`Services.tsx:176-190`; `UpdateProviderAccountUseCase.js:32-37`). Continuam pendentes o pagamento antecipado, o estorno (PAG-2) e a jornada do tutor na interface (`TutorAppointments.tsx` com dados demonstrativos).
  - RED, P2: "estorno deve depender de pagamento prévio e cancelamento ou recusa aplicável" é vago. A DEC-A definiu estorno integral quando houve pagamento.
- **Descrição sugerida (P2):** "A política PRESENCIAL ou PRE_PAGO, registrada no agendamento no momento da criação, deve determinar as condições de pagamento e confirmação do atendimento; a recusa ou o cancelamento de um agendamento já pago deve gerar estorno integral."
- **Detalhamento sugerido (P1):**
  - Trecho atual: "A modelagem da política está disponível, mas sua configuração, a jornada completa e o estorno ainda dependem das entregas de agendamento. O estado inicial e a ordem entre aceite e pagamento precisam ser alinhados entre AGD-1 e AGD-2 antes de se considerar a regra integralmente implementada."
  - Trecho novo: "A política é configurada pelo parceiro e copiada para o agendamento na criação. Todo agendamento inicia em PENDENTE; no PRESENCIAL, o parceiro confirma ou recusa; no PRE_PAGO, a passagem para AGUARDANDO_CONFIRMACAO depende do pagamento. O pagamento antecipado, o estorno e a jornada do tutor na interface ainda não estão implementados."
- **Relacionados:** sem alteração (RF-027 a RF-030).

#### RNE-018

- **Problemas:**
  - DES, P1: o detalhamento diz que o cálculo usa a tarifa diária ou horária do parceiro e que o uso de `Service.price` precisa ser alinhado. Pela DEC-B e pelo E-04, o total é `Service.price` × unidades (`CalculateAppointmentTotalUseCase.js:9-16,113-118`).
  - RED, P2: a descrição não diz qual preço é usado no cálculo.
- **Descrição sugerida (P2):** "O total do agendamento deve ser calculado no servidor a partir do preço do serviço contratado, da unidade de cobrança e da duração: diária para hotel e hora para *pet sitter*."
- **Detalhamento sugerido (P1), três trechos:**
  1. "A regra de cálculo modelada utiliza a tarifa diária ou horária do parceiro." → "O cálculo multiplica o preço do serviço contratado pelo número de unidades cobradas."
  2. "e a tarifa deve ser positiva" → "e o preço do serviço deve ser positivo".
  3. "A definição de uso de \`*Service.price*\` em lugar da tarifa do parceiro precisa ser alinhada antes do fluxo final de contratação." → removido.
- **Relacionados:** sem alteração (RF-026, RF-027).

#### RNE-023

- **Problema:** RAS, P2: falta o RNF-010. A proteção contra efeitos duplicados de eventos repetidos está no RNF-010 (`ProcessPaymentWebhookUseCase.js:47-66`).
- **Redação:** correta.
- **Relacionados:** RF-023, RNF-010.

### 3.2. Itens sem alteração necessária

| ID | Avaliação | Observação |
| --- | --- | --- |
| RNE-006 | Correta e verificada (`UserController.js:153-169,295-327`). | Pendência de código fora do texto: a gestão de serviços não exige candidatura aprovada (ver RNE-010). |
| RNE-007 | Correta. | P3: "O tutor deve poder cadastrar" é forma de RF. O filtro em inglês está corretamente descrito como pendente; hoje a exclusão é bloqueada pela chave estrangeira do banco, havendo qualquer agendamento. |
| RNE-012 | Correta como regra. | Defeito de código: `PATCH /api/v1/cart/items/:id` com quantidade maior que 0 sempre responde 409 (`CartController.js:207-208`). Recomenda-se corrigir o código, não o texto. |
| RNE-014 | Correta (`orderStatus.js:39-46`; `UpdateOrderStatusUseCase.js:36-47`). | — |
| RNE-015 | Correta. | — |
| RNE-016 | Correta, inclusive as duas pendências citadas. | — |
| RNE-019 | Correta; continua planejada. | A unidade de avaliação continua pendente de decisão da equipe. |
| RNE-020 | Correta (`ProviderController.js:19-40,80-82`). | P3: o E-01 também exige conta ativa. |
| RNE-021 | Correta; a DEC-F não está implementada (`schema.prisma:28`). | DUP, P3: o texto é quase igual ao do RF-034. A separação entre política (RNE) e comportamento (RF) justifica manter os dois. |
| RNE-022 | Correta quanto às pendências. | P3: o efeito real hoje é a chave estrangeira para pets e nenhum bloqueio para endereços. O texto já diz que os filtros "precisam ser atualizados". |

### 3.3. Itens de apresentação (P3, fora do escopo de texto)

- Nas tabelas da RNE-010 à RNE-023, a linha de cabeçalho tem só "**ID**", sem "**Descrição**" e "**Requisitos Relacionados**", ao contrário da RNE-001 à RNE-009. Corrigir isso significa preencher células de cabeçalho. É uma decisão de apresentação, e a equipe decide.

## 4. Diagnóstico dos requisitos funcionais (seção 14)

### 4.1. Itens com alteração proposta

#### RF-001

Ver 2.1. **Sugerida (P1):** "O sistema deve permitir que o usuário se cadastre como Tutor ou Parceiro, nas modalidades Lojista, Hotel e *Pet Sitter*."

Ajuste opcional do detalhamento (P2): incluir a obrigatoriedade do nome comercial no back-end entre as pendências. Hoje só a interface exige o campo (`authSchemas.js:35-40`).
- Trecho atual: "a validação completa de CNPJ e o registro correto do aceite dos termos."
- Trecho novo: "a validação completa de CNPJ, o registro correto do aceite dos termos e a exigência do nome comercial no *back-end*."

#### RF-002

- **Problema:** DES, P2: "impede novo login de contas explicitamente desativadas" está incompleto. Desde o E-01, os tokens já emitidos de conta desativada também são recusados na requisição seguinte (`authMiddleware.js:56-64`).
- **Sugerida:**
  - Trecho atual: "O sistema valida as credenciais e impede novo login de contas explicitamente desativadas."
  - Trecho novo: "O sistema valida as credenciais, impede novo login de contas desativadas e recusa, a partir da requisição seguinte, os *tokens* já emitidos para essas contas."

#### RF-013

- **Problemas:**
  - DES, P1: "A restrição completa da vitrine a produtos de lojistas aprovados permanece pendente na PRD-2" está desatualizado. Pelo E-01, a listagem e o detalhe só exibem produtos de lojista aprovado com conta ativa (`ListActiveProductsUseCase.js:28`; `GetProductDetailsUseCase.js:32`).
  - DES, P2: o texto diz que avaliações e especificações demonstrativas "não devem ser apresentadas como dados reais", mas a página de detalhe as exibe sem identificação (`ProductDetailPage.tsx:31-75,240-244`). O documento deve registrar a pendência, e não sugerir que a regra é cumprida.
- **Sugerida:**
  - P1: "A restrição completa da vitrine a produtos de lojistas aprovados permanece pendente na PRD-2." → "A vitrine e o detalhe do produto exibem somente produtos de lojistas aprovados com conta ativa."
  - P2: após "...dados reais de clientes ou fabricantes.", acrescentar "A página de detalhe ainda exibe avaliações e especificações demonstrativas, que precisam ser removidas ou identificadas."

#### RF-017

- **Problema:** RED, P2: "corrigir os dados autenticado" tem concordância ambígua, porque não fica claro se "autenticado" se refere aos dados ou ao parceiro.
- **Sugerida:** "O parceiro recusado deve poder consultar o motivo da recusa e, após autenticar-se, corrigir os dados e reenviar o cadastro para análise."

#### RF-019

- **Problema:** DES, P2: o texto diz que distância e avaliações "não devem ser apresentadas como reais", mas as telas de listagem exibem nota, quantidade de avaliações (sorteada) e distância fixas (`HotelsPage.tsx:75-84`; `WalkersPage.tsx:45-50`).
- **Sugerida:** após a última frase, acrescentar "As telas de listagem ainda exibem notas, quantidades de avaliações e distâncias demonstrativas, que precisam ser removidas ou identificadas."

#### RF-021

- **Problemas:**
  - DES e STA, P1: a pendência da PRD-2 foi resolvida pelo E-01 (`CreateProductUseCase.js:29`; `UpdateProductUseCase.js:30`; `DeleteProductUseCase.js:17`).
  - Status: "Parcialmente implementado" → **"Implementado"**.
- **Sugerida (P1):**
  - Trecho atual: "A restrição completa de criação e edição a lojistas aprovados e a ocultação de produtos de lojistas não aprovados ainda dependem da PRD-2."
  - Trecho novo: "A criação, a edição e a exclusão exigem lojista aprovado com conta ativa, e produtos de lojistas não aprovados não aparecem na vitrine."

#### RF-022

- **Problema:** DES, P1: "O contrato atual não persiste endereço de entrega ou frete no pedido" está desatualizado. Pelo E-05, o pedido exige um endereço do próprio tutor e grava uma cópia dele (`CreateOrderUseCase.js:76-84,185`; `schema.prisma`, `Order.shipping_address`). Pela DEC-C, não há frete neste semestre.
- **Sugerida:**
  - Trecho atual: "O contrato atual não persiste endereço de entrega ou frete no pedido; a geração de pedidos não representa uma integração logística completa."
  - Trecho novo: "O pedido exige um endereço do próprio tutor e grava uma cópia do endereço de entrega. Não há cobrança de frete neste semestre, e a geração de pedidos não representa uma integração logística completa."

#### RF-023

- **Problemas:**
  - RED, P2: "no modo habilitado" não diz quais modos existem.
  - DES, P2: o detalhamento não registra o resultado do E-06 e da DEC-C: no modo simulado, nenhum valor real é cobrado, não há campos de cartão e o total é a soma dos itens (`CheckoutPage.tsx:86-91,120-125`; `CartPage.tsx:217`).
  - STA, P3: "Simulado implementado." foge do padrão dos demais status.
- **Descrição sugerida (P2):** "O tutor deve poder pagar os próprios pedidos no modo de pagamento habilitado no ambiente, simulado ou Mercado Pago em *sandbox*, e acompanhar a confirmação pelo sistema."
- **Detalhamento (P2):** após a primeira frase, acrescentar "No modo simulado, nenhum valor real é cobrado, não são solicitados dados de cartão e o valor cobrado é a soma dos itens."
- **Status (P3):** "Implementado no modo simulado; *sandbox* aguardando validação externa."

#### RF-026

- **Problemas:**
  - DES e STA, P1: a interface de serviços existe desde 13/10 (`Services.tsx`; `routes.tsx:366-371`; `Sidebar.tsx:66`).
  - Status: "Backend implementado; interface pendente." → **"Implementado"**.
- **Sugerida (P1):**
  - Trecho atual: "As telas e o menu de gerenciamento dependem das entregas SRV-F1 e SRV-F2."
  - Trecho novo: "A interface de gerenciamento, com cadastro, listagem, edição e desativação dos serviços, está disponível no painel."
- **P2:** acrescentar "Para *Pet Sitters*, a exigência de candidatura aprovada ainda não é verificada nesta operação." (mesma pendência da RNE-010).

#### RF-027

- **Problemas:** DES e STA, P1: o back-end do agendamento foi entregue (AGD-2 e E-04):
  - criação, consulta e cancelamento em `/api/v1/appointments` (`appointmentRoutes.js:73-152`);
  - só tutor, com pet próprio (`CreateAppointmentUseCase.js:47-49,83-95`);
  - início no futuro e limites de duração (`:104-128`);
  - conflito de horário (`:140-161`).
  
  Falta a interface.
- **Status:** "Parcialmente implementado: modelagem disponível." → **"Parcialmente implementado: back-end implementado; interface pendente."**
- **Detalhamento sugerido (P1), substitui as duas primeiras frases:** "A criação, a consulta e o cancelamento de agendamentos estão disponíveis no *back-end* em \`/api/v1/appointments\`, restritos ao tutor e a *pets* próprios, com cálculo do total no servidor, verificação de conflito de horário e transições conforme a política registrada no agendamento. A jornada na interface ainda depende das entregas BKG-1 e BKG-2."
- **Mantém:** a frase "A tela atual de agendamentos do tutor utiliza dados demonstrativos."

#### RF-028

- **Problemas:** DES e STA, P1: a consulta da agenda e a alteração de status estão no back-end, restritas ao parceiro responsável e à máquina de estados (`appointmentRoutes.js:123,203-210`; `UpdateAppointmentStatusUseCase.js:57-106`).
- **Status:** "Planejado" → **"Parcialmente implementado: back-end implementado; interface pendente."**
- **Detalhamento sugerido (P1), substitui as duas primeiras frases:** "A consulta da agenda e a confirmação, a recusa, o cancelamento e a conclusão de agendamentos estão disponíveis no *back-end*, restritos ao parceiro responsável e às transições definidas pelo negócio. A interface depende das entregas SCH-1 e SCH-2."
- **Mantém:** a frase "A tela de agenda atual utiliza dados demonstrativos."

#### RF-029

- **Problema:** DES, P1: a configuração pela interface, a gravação e o uso da política nas transições estão implementados (`Services.tsx:176-190`; `UpdateProviderAccountUseCase.js:32-37`; `CreateAppointmentUseCase.js:171`). A divergência entre AGD-1 e AGD-2 foi resolvida pela DEC-A.
- **Sugerida (P1):**
  - Trecho atual: "A configuração pela interface, sua persistência e a aplicação na jornada de agendamento ainda precisam ser concluídas. O estado inicial e as transições do agendamento devem ser alinhados entre a modelagem AGD-1 e o contrato AGD-2 antes da implementação final."
  - Trecho novo: "A política é configurada na tela de serviços, gravada no cadastro do parceiro e copiada para cada agendamento na criação, e as transições de estado a respeitam. O pagamento antecipado dos agendamentos PRE\_PAGO ainda não está implementado e depende da PAG-2."
- **Status:** mantém "Parcialmente implementado". Sugestão P3: trocar "modelagem disponível" por "pagamento antecipado pendente".

#### RF-032

- **Problemas:**
  - DES, P1: a frase sobre `is_active` está desatualizada. Pelo E-01 e pela DEC-G, existe `PATCH /api/v1/users/admin/users/:id/active` (`userRoutes.js:236-241`; `SetUserActiveUseCase.js:25-47`), e o painel oferece Desativar e Reativar para parceiros na tela de Aprovações (`Approvals.tsx:166-185,404-425`).
  - Pendente de decisão (P3): a desativação de contas não tem um RF próprio. Incluí-la seria acrescentar um requisito (RF-035), o que depende de aprovação da equipe.
- **Sugerida (P1):**
  - Trecho atual: "A existência do campo \`is\_active\` não representa, por si só, uma funcionalidade de desativação ou reativação de conta disponível no painel."
  - Trecho novo: "A desativação e a reativação de contas estão disponíveis no *back-end*; no painel, a ação é oferecida para parceiros aprovados, na tela de Aprovações."

### 4.2. Itens sem alteração necessária

| ID | Avaliação |
| --- | --- |
| RF-003 | Correto, inclusive a pendência do retorno após o login do parceiro recusado (`LoginPage.tsx:83-101`). |
| RF-004, RF-005 | Corretos. As travas de exclusão continuam com estados em inglês, como o texto informa. |
| RF-006 | Correto. P3: o limite é exatamente 2 MB, validado no back-end desde o E-03 ("aproximado" pode sair). |
| RF-007, RF-008, RF-010, RF-012, RF-014, RF-015, RF-016, RF-018, RF-020, RF-024, RF-025, RF-030, RF-031, RF-033, RF-034 | Corretos e verificados no código. |
| RF-009 | Correto. Pendente de confirmação, como na RNE-005: a DEC-D ainda não é aplicada na aprovação de sitter. |
| RF-011 | Correto, mas abrangente (VER, P3). O RF-033 já detalha a parte de indicadores. Não se recomenda reescrever. |

## 5. Diagnóstico dos requisitos não funcionais (seção 15)

### 5.1. Itens com alteração proposta

#### RNF-001

- **Problemas:**
  - DES, P1: a pendência citada como exemplo, a PRD-2, foi resolvida pelo E-01.
  - DES, P2: "Contas explicitamente desativadas são impedidas de realizar novo login" está incompleto (ver RF-002).
- **Status:** mantém "Parcialmente implementado", porque existem outras pendências reais de autorização:
  - o envio da candidatura de *Pet Sitter* não verifica o perfil (`userRoutes.js:150-154`);
  - a gestão de serviços não exige candidatura aprovada (`serviceAccess.js:39-41`).
- **Sugerida (P1):**
  - Trecho atual: "Existem pendências de autorização, como a restrição completa de criação e publicação de produtos por lojistas aprovados, prevista na PRD-2."
  - Trecho novo: "Existem pendências de autorização, como o envio da candidatura de *Pet Sitter* sem verificação de perfil e a gestão de serviços sem exigência de candidatura aprovada."
- **Sugerida (P2):** "Contas explicitamente desativadas são impedidas de realizar novo login." → "Contas desativadas são impedidas de realizar novo login e têm os *tokens* já emitidos recusados a partir da requisição seguinte."

#### RNF-003

- **Problema:** STA, P1: o status "Implementado" contradiz o detalhamento, que diz que "a validação global de usabilidade permanece pendente".
- **Sugerida:** status → **"Parcialmente implementado; validação global pendente"**.
- **Observação (VER, P3):** a descrição usa critérios subjetivos ("consistente", "compreensível"). O próprio detalhamento já aponta as jornadas que servem de critério.

#### RNF-007

- **Problema:** DES, P2: o detalhamento descreve só o token. Desde o E-01, cada requisição autenticada consulta o banco para conferir se a conta está ativa, o perfil e a situação do parceiro. A conta inativa recebe 401 e o parceiro recusado, fora das rotas de correção, recebe 403 (`authMiddleware.js:56-78`).
- **Sugerida:** após "...rejeitadas com HTTP 401.", acrescentar "A cada requisição, o sistema também verifica se a conta permanece ativa e qual é o perfil atual do usuário."
- **Cuidado de formatação:** o detalhamento do RNF-007 está todo em itálico, e o trecho inserido deve ficar em itálico também.

#### RNF-008

- **Problemas:**
  - DES, P1: "fator de custo 10" está parcialmente incorreto. O custo é 10 no cadastro e na troca de senha e 12 na recuperação (`RegisterUseCase.js:60`; `UserController.js:127`; `PasswordResetUseCase.js:123`). O custo único 12 da DEC-E não foi aplicado.
  - RED, P2: a descrição está no indicativo ("nunca são armazenadas"), e não na forma normativa usada nos demais requisitos.
- **Descrição sugerida (P2):** "As senhas dos usuários devem ser armazenadas somente na forma de *hash*, nunca em texto puro."
- **Detalhamento sugerido (P1):**
  - Trecho atual: "O sistema utiliza a biblioteca bcryptjs com fator de custo 10 para gerar o *hash *da senha antes de armazená-la no banco de dados."
  - Trecho novo: "O sistema utiliza a biblioteca bcryptjs para gerar o *hash* da senha antes de armazená-la no banco de dados, com fator de custo 10 no cadastro e na troca de senha e 12 na recuperação. A adoção de um custo único 12, decidida pela equipe, ainda não foi aplicada."

#### RNF-012

- **Problemas:**
  - DES, P2: "O CI executa lint, testes, typecheck, build e testes E2E" é impreciso. O typecheck roda só no front-end, porque o back-end é JavaScript. Os testes E2E são de fumaça, rodam só no Chromium e não usam o back-end real: a API é simulada no teste de pagamento (`ci.yml:78-105`; `playwright.config.ts:17`; `payment.spec.ts:27,78`).
  - CLA, P3: este item é uma restrição de processo de desenvolvimento, não um atributo de qualidade do produto. A categoria é aceitável em contexto acadêmico se for entendida como manutenibilidade e qualidade do processo.
- **Sugerida (P2):**
  - Trecho atual: "O CI executa lint, testes, typecheck, build e testes E2E."
  - Trecho novo: "O CI executa lint, testes unitários e de integração, verificação de tipos do *front-end*, build e testes E2E de fumaça no navegador Chromium."

### 5.2. Itens sem alteração necessária

| ID | Avaliação |
| --- | --- |
| RNF-002 | Correto. VER, P3: "tamanhos definidos pelo projeto" pode citar os breakpoints do `docs/design-system.md` (640, 768, 1024 e 1280 px). |
| RNF-004 | Correto. A lista de navegadores ainda não existe e o texto já diz isso. |
| RNF-005, RNF-006 | Corretos, com status honestos. VER, P3: critérios vagos por natureza; o RNF-006 já registra que não está comprovado. |
| RNF-009, RNF-010, RNF-011, RNF-014 | Corretos e verificados. RNF-014 (P3): reúne dois assuntos, segredos e recuperação de dados. |
| RNF-013 | Correto. P3: pode citar a ferramenta (axe, em três páginas). |

## 6. Matriz de rastreabilidade revisada

A coluna "Requisitos Relacionados" existe só na seção 13. As referências dentro dos detalhamentos (RNF-001 → RNF-007 e RNF-008; RF-033 → RF-011) estão corretas e não mudam.

| Regra | Atual | Proposta | Mudança | Prioridade | Justificativa |
| --- | --- | --- | --- | --- | --- |
| RNE-001 | RF-001, RNF-001 | RF-001 | Remove RNF-001 | P1 | Operação pública; a exclusão do Administrador é validação de entrada (2.2). |
| RNE-002 | RF-001, RF-007, RF-016, RNF-001, RNF-008. | RF-001, RF-007, RF-016 | Remove RNF-001 e RNF-008 | P1 / P2 | Política de força da senha não é controle de acesso nem armazenamento. |
| RNE-003 | RF-001, RNF-001 | RF-001 | Remove RNF-001 | P1 | Validação de documento em rota pública e restrição do banco. |
| RNE-004 | RF-002, RF-008, RF-009, RF-011, RF-012, RF-017 | + RNF-001 | Adiciona | P2 | Gate de parceiro e sessão restrita são autorização por perfil e situação. |
| RNE-005 | RF-009, RF-010 | + RNF-001 | Adiciona | P2 | Restrição ao Administrador implementada pelo `adminMiddleware`. |
| RNE-006 | RF-008, RF-010, RF-012 | mantém | — | — | Envio, análise e acompanhamento da candidatura. |
| RNE-007 | RF-004 | mantém | — | — | — |
| RNE-008 | RF-005 | mantém | — | — | — |
| RNE-009 | RF-013, RF-021 | + RNF-001 | Adiciona | P2 | Autorização por perfil e aprovação no back-end. |
| RNE-010 | RF-026 | + RNF-001 | Adiciona | P2 | Autorização por perfil, aprovação e propriedade. |
| RNE-011 | RF-004, RF-005, RF-014, RF-018, RF-021, RF-024 a RF-028 | + RNF-001 (P2); + RF-015, RF-023 (P3) | Adiciona | P2 / P3 | É a regra de negócio que o RNF-001 implementa. |
| RNE-012 | RF-014, RF-022 | mantém | — | — | — |
| RNE-013 | RF-022 | + RNF-010 | Adiciona | P2 | Atomicidade da criação do pedido. |
| RNE-014 | RF-023, RF-024, RF-025 | mantém | — | — | — |
| RNE-015 | RF-003, RF-014, RF-022 | mantém | — | — | — |
| RNE-016 | RF-009, RF-017 | mantém | — | — | — |
| RNE-017 | RF-027 a RF-030 | mantém | — | — | — |
| RNE-018 | RF-026, RF-027 | mantém | — | — | O preço vem do serviço (RF-026), e o cálculo ocorre na solicitação (RF-027). |
| RNE-019 | RF-031 | mantém | — | — | — |
| RNE-020 | RF-008, RF-010, RF-019 | mantém | — | — | — |
| RNE-021 | RF-001, RF-034 | mantém | — | — | — |
| RNE-022 | RF-004, RF-005 | mantém | — | — | — |
| RNE-023 | RF-023 | + RNF-010 | Adiciona | P2 | Idempotência do processamento do webhook. |

Verificação de consistência:

- Todos os identificadores citados (RF-001 a RF-034, RNF-001, RNF-008 e RNF-010) existem.
- Os intervalos "RF-024 a RF-028" e "RF-027 a RF-030" só incluem itens com relação real.
- RFs sem nenhuma regra associada (RF-006, RF-020, RF-032 e RF-033): não precisam de regra de negócio. Não se propõe relação artificial.

## 7. Proposta consolidada

### P1, necessárias (consistência do documento)

| # | Item | Alteração |
| --- | --- | --- |
| 1 | RF-001 | Redação do orientador. |
| 2 | RNE-001, RNE-002, RNE-003 | Remover RNF-001 dos relacionados. |
| 3 | RNE-008 | Incluir o limite "5" na descrição. |
| 4 | RNE-004, RNE-009 | Retirar a pendência da PRD-2, resolvida pelo E-01. |
| 5 | RNE-010, RF-026 | Interface de serviços disponível. Status do RF-026: "Implementado". |
| 6 | RNE-017, RNE-018, RF-029 | Agendamento conforme DEC-A e DEC-B (E-04). |
| 7 | RF-013, RF-021 | Vitrine e produtos com gate do E-01. Status do RF-021: "Implementado". |
| 8 | RF-022 | Endereço de entrega gravado no pedido (E-05); sem frete (DEC-C). |
| 9 | RF-027, RF-028 | Back-end de agendamento e agenda entregue; status e detalhamento. |
| 10 | RF-032 | Desativação e reativação disponíveis (E-01/DEC-G). |
| 11 | RNF-001 | Substituir a pendência da PRD-2 por pendências reais. |
| 12 | RNF-003 | Status coerente com o detalhamento. |
| 13 | RNF-008 | Custo do bcrypt real (10, 10 e 12). |

### P2, recomendáveis

| # | Item | Alteração |
| --- | --- | --- |
| 14 | RNE-004, RNE-005, RNE-009, RNE-010, RNE-011 | Adicionar RNF-001. |
| 15 | RNE-013, RNE-023 | Adicionar RNF-010. |
| 16 | RNE-002 | Remover RNF-008. |
| 17 | RNE-001 | Redação sem "Todo usuário". |
| 18 | RNE-017, RNE-018 | Descrições com estorno integral e preço do serviço. |
| 19 | RNE-010, RF-026 | Pendência da candidatura aprovada para *Pet Sitter* (DEC-D). |
| 20 | RF-001 | Nome comercial entre as pendências. |
| 21 | RF-002, RNF-001, RNF-007 | Recusa de tokens de conta desativada e verificação por requisição. |
| 22 | RF-013, RF-019 | Registrar dados demonstrativos ainda exibidos. |
| 23 | RF-017 | Concordância de "autenticado". |
| 24 | RF-023 | Modos de pagamento e efeitos do E-06. |
| 25 | RNF-008 | Forma normativa na descrição. |
| 26 | RNF-012 | Descrição exata do CI. |

### P3, opcionais

Só se a equipe pedir:

- "visitante" no RF-001;
- RNE-011 com RF-015 e RF-023;
- forma de RF nas RNE-007 e RNE-008;
- "criar/editar" na RNE-009;
- status do RF-023 e do RF-029;
- "aproximado" no RF-006;
- critérios dos RNF-002, RNF-003, RNF-005, RNF-006 e RNF-013;
- cabeçalhos das tabelas da RNE-010 à RNE-023;
- novo RF para desativação de contas;
- inclusão da DEC-D na RNE-005.

## 8. Pendências de código encontradas durante a revisão

Fora do escopo do documento. Registradas para a equipe:

| Prioridade | Pendência | Evidência |
| --- | --- | --- |
| Alta | `PATCH /api/v1/cart/items/:id` com quantidade maior que 0 sempre responde 409: o produto é buscado sem o parceiro, e o verificador de parceiro operacional recusa. A interface usa essa rota. | `backend/src/controllers/CartController.js:207-208`; `frontend/src/lib/services/cartService.ts:52` |
| Alta | DEC-E não aplicada: cadastro com 6 caracteres, troca sem maiúscula, bcrypt 10, 10 e 12. | `authSchemas.js:22-25`; `userSchemas.js:32-37` |
| Alta | DEC-F não aplicada: `terms_accepted` com padrão `true`, sem data nem versão. | `schema.prisma:28`; `RegisterUseCase.js:68` |
| Alta | DEC-D parcial: aprovação de sitter sem candidatura aprovada e gestão de serviços sem essa exigência. | `ProviderController.js:290-317`; `serviceAccess.js:39-41` |
| Média | Travas de exclusão de pet e endereço com estados em inglês, que nunca disparam. | `PetRepository.js:3`; `AddressController.js:6` |
| Média | Avaliações, distâncias e especificações demonstrativas exibidas sem identificação. | `ProductDetailPage.tsx:31-75`; `HotelsPage.tsx:75-84`; `WalkersPage.tsx:45-50`; `GetProviderDetailsUseCase.js:59` |
| Média | Nome comercial não obrigatório no back-end; e-mail não convertido para minúsculas no cadastro; documento gravado sem normalização. | `authSchemas.js:17-21,35-40`; `RegisterUseCase.js:43,73` |
| Baixa | Decremento de estoque sem condição, permitindo estoque negativo sob concorrência. | `ProductRepository.js:35-44` |

## 9. Aplicação no documento

Em 28/10/2026, a Laura aprovou as correções P1 e P2. As P3 ficaram de fora.

**Como foram aplicadas:**

- No Google Docs, em modo Sugestão, pelo navegador do aplicativo, já que a extensão do Chrome não estava conectada.
- Por "Localizar e substituir" e por digitação sobre o trecho localizado.
- Os termos em itálico do documento (*back-end*, *Pet Sitter*, *tokens*, *hash*, *sandbox*, *front-end*) foram mantidos em itálico.
- Nos detalhamentos do RF-026 ao RF-032, as grafias "backend" e "Pet Sitters" ficaram sem itálico, como no texto original desses itens.

**Verificação:** o texto exportado do documento foi comparado com a cópia de 28/10. As diferenças estão só nas seções 13, 14 e 15, nos itens listados na seção 7 (P1 e P2). Cada alteração aparece como sugestão de Laura Serbêto, para ser aceita ou rejeitada no próprio documento.

**Desvios em relação a este relatório:**

- **RF-001:** a frase do detalhamento ganhou uma vírgula antes de "o registro correto" para manter a enumeração correta.
- **RNE-010:** o trecho final foi digitado sobre a palavra anterior em itálico e herdou o estilo. O itálico foi corrigido logo em seguida, ficando só em *Pet Sitters*.
- **Documento como um todo:** uma digitação acidental fora das seções foi desfeita na hora. A comparação final confirma que nenhum outro trecho mudou.

## 10. Revisão das demais seções: Situação atual, Extensões, Avaliação geral e afins

Pedido da Laura em 28/10: verificar as seções Situação Atual do Projeto, Extensões e Tecnologias Complementares e Avaliação Geral do Projeto Integrador, e outras que precisem de ajuste, usando o mesmo critério das seções 13 a 15.

Base: o código do commit `45c0e77` e as entregas E-01 a E-06. Os textos dessas seções foram escritos antes da Fase 1 de estabilização. A maior parte dos ajustes vem de dois fatos:

- **O E-01 absorveu a PRD-2.** A aprovação de parceiros vale no back-end, na vitrine, no carrinho e no pedido, e existe desativação de contas.
- **O E-04 mudou o agendamento.** Todo agendamento nasce em PENDENTE, e o estorno simulado foi removido: a resposta não traz mais `refund`, e o estorno é da PAG-2.

### 10.1. Parte 02, introdução (antes da seção 5)

| Prioridade | Trecho atual | Trecho novo | Motivo |
| --- | --- | --- | --- |
| P1 | "a conclusão dos filtros de publicação e aprovação de parceiros" | "a exigência de candidatura aprovada para *Pet Sitters* em todas as operações" | Os filtros foram concluídos no E-01 (`providerAccess.js:65-121`). O que falta é a parte da DEC-D na gestão de serviços e na aprovação (`serviceAccess.js:39-41`; `ProviderController.js:290-317`). |

### 10.2. Situação atual do projeto

| Prioridade | Trecho atual | Trecho novo | Motivo |
| --- | --- | --- | --- |
| P1 | "o estorno previsto neste fluxo ainda é apenas simulado e não possui registro persistente próprio." | "o pagamento antecipado e o estorno de agendamentos pagos ainda não estão implementados." | O E-04 removeu o estorno simulado (commit `8d5a733`). O estorno é da PAG-2 (`UpdateAppointmentStatusUseCase.js:27`). |
| P1 | "conclusão dos filtros de aprovação e exposição pública" | "aplicação da exigência de candidatura aprovada para *Pet Sitters* em todas as operações" | Mesmo motivo do 10.1. |
| P2 | (não há) | Parágrafo novo, depois do 3º parágrafo (ver abaixo) | A seção não menciona a auditoria nem a Fase 1, que é o estado mais recente do projeto. |

Parágrafo proposto (P2):

> Antes da *Sprint* 4, a equipe realizou uma auditoria de qualidade e uma fase de estabilização. As decisões pendentes foram registradas: a ordem entre pagamento e aceite no agendamento, a fonte do preço dos serviços, a ausência de frete, cupom e desconto PIX neste semestre, o critério de *Pet Sitter* apto a operar, a política única de senha, o registro do aceite dos termos e a desativação de contas. Em seguida, as correções prioritárias foram implementadas. A aprovação de parceiros passou a ser exigida no *back-end*, inclusive na vitrine, no carrinho e no pedido. A listagem completa de parceiros ficou restrita ao administrador, e contas podem ser desativadas e reativadas. O agendamento passou a registrar a política de cobrança, a calcular o valor pelo preço do serviço e a impedir conflitos de horário. Foram definidos limites para o envio de imagens. O pedido passou a guardar o endereço de entrega, e o total exibido no *checkout* passou a coincidir com o valor cobrado. A política única de senha e o registro da data e da versão dos termos foram decididos, mas ainda não foram implementados.

Evidência: commits `9944a32` (E-02), `03db53f` (E-01), `8d5a733` (E-04), `74e8367` (E-03), `05b76d9` (E-05) e `45c0e77` (E-06). As decisões estão na pauta da Fase 0.

### 10.3. Arquitetura geral do sistema

| Prioridade | Trecho atual | Trecho novo | Motivo |
| --- | --- | --- | --- |
| P1 | "A restrição completa de criação e publicação por lojista aprovado permanece pendente de consolidação na PRD-2." | "Somente lojistas aprovados com conta ativa podem criar, editar e publicar produtos." | E-01 (`providerAccess.js:103-121`). |
| P1 | "O pagamento e o estorno de agendamentos ainda exigem evolução além da resposta simulada existente." | "O pagamento antecipado e o estorno de agendamentos ainda não estão implementados." | E-04. Já não existe resposta simulada. |

### 10.4. Dados e modelagem da informação

| Prioridade | Trecho atual | Trecho novo | Motivo |
| --- | --- | --- | --- |
| P2 | "senha criptografada" | "*hash* da senha" | Mesmo termo do RNF-008: o *hash* não se descriptografa. |
| P2 | Pedido: "o status e as datas de registro e atualização." | "o status, a cópia do endereço de entrega e as datas de registro e atualização." | E-05 (`Order.shipping_address`). |
| P2 | Agendamento: "horários, status, valor total e observações." | "horários, status, política de cobrança registrada, valor total e observações." | E-04 (política gravada na reserva). |

A contagem de "16 tabelas" na modelagem continua correta: `schema.prisma` tem 16 modelos.

### 10.5. Implementação por camadas: 22.2, Back-end

| Prioridade | Trecho atual | Trecho novo | Motivo |
| --- | --- | --- | --- |
| P1 | "Na criação, a política PRESENCIAL resulta em CONFIRMADO e a política PRE\_PAGO resulta em AGUARDANDO\_CONFIRMACAO. O estorno apresentado por esse fluxo ainda é simulado e retornado na resposta, sem integração financeira nem registro persistente próprio de estorno." | "Todo agendamento é criado em PENDENTE, com a política de cobrança do parceiro registrada no próprio agendamento e o valor calculado pelo preço do serviço. No PRESENCIAL, o parceiro confirma ou recusa; no PRE\_PAGO, a confirmação depende do pagamento antecipado, que ainda não está implementado, assim como o estorno." | DEC-A e E-04 (`appointmentStatus.js:9-33,62-92`; `CreateAppointmentUseCase.js:170-171`). O texto atual descreve a máquina anterior. |
| P2 | "Parceiros: listagens e detalhes em \`/api/v1/providers\`;" | "Parceiros: listagens públicas em \`/api/v1/providers/hotels\`, \`/sitters\` e \`/stores\`, detalhe em \`/api/v1/providers/:id\` e listagem completa restrita ao administrador;" | E-02 (`providerRoutes.js`). |
| P2 | "Agendamentos: \`POST/GET /api/v1/appointments\`, \`GET /api/v1/appointments/:id\`" | "Agendamentos: \`POST/GET /api/v1/appointments\`, \`GET /api/v1/appointments/my\`, \`GET /api/v1/appointments/provider\`, \`GET /api/v1/appointments/:id\`" | `appointmentRoutes.js`. |
| P2 | (não há) | Novo item na lista de contratos: "Administração de usuários: \`GET /api/v1/users/admin/users\` e \`PATCH /api/v1/users/admin/users/:id/active\`." | E-01 e DEC-G (`userRoutes.js:236-241`). |

### 10.6. Implementação por camadas: 22.4, Organização do código e repositório

| Prioridade | Trecho atual | Trecho novo | Motivo |
| --- | --- | --- | --- |
| P1 | "sendo o *front-end* a parte já implementada da aplicação e o *back-end* uma estrutura de apoio ainda em desenvolvimento para serviços complementares" | "com o *front-end* responsável pela interface e o *back-end* responsável pela API, pelas regras de negócio e pelo acesso ao banco de dados" | Afirmação incorreta. O back-end é a API completa descrita na seção 22.2. |

### 10.7. Qualidade do software e testes

| Prioridade | Trecho atual | Trecho novo | Motivo |
| --- | --- | --- | --- |
| P2 | "Existem verificações de acessibilidade na página inicial" | "Existem verificações automatizadas de acessibilidade na página inicial e nas páginas de termos e de privacidade" | `e2e/a11y.spec.ts` e `e2e/legal.spec.ts`. |

**Pendente de confirmação.** A legenda da figura de rastreabilidade cita "relatórios de execução de 14/10/2026". O `README.md` em `docs/evidencias-testes/2026-10-18/` registra a data de 18/10/2026, o commit `176e5a4` e a branch `Tasks-Laura`. A Laura precisa confirmar qual data vale.

Os 119 testes (104 + 15) estão corretos para aquele recorte, mas ele é anterior à Fase 1: não inclui os testes de agendamento, de limite de envio nem de acesso de parceiros. Uma nova execução na main atualizaria a evidência. Fica registrado como sugestão, fora desta revisão.

### 10.8. Segurança da informação

| Prioridade | Trecho atual | Trecho novo | Motivo |
| --- | --- | --- | --- |
| P1 | "e contas explicitamente desativadas são impedidas de realizar novo login. A aplicação completa das restrições de criação e publicação de produtos por lojistas aprovados permanece como ponto de melhoria." | "Contas desativadas são impedidas de realizar novo login e têm os *tokens* já emitidos recusados a partir da requisição seguinte, e somente lojistas aprovados com conta ativa podem criar e publicar produtos. A exigência de candidatura aprovada para *Pet Sitters* ainda não é aplicada em todas as operações." | E-01 (`authMiddleware.js:56-78`; `providerAccess.js`). |
| P2 | JWT: após "...com HTTP 401." | Acrescentar: "A cada requisição, o *middleware* também consulta o banco para verificar se a conta permanece ativa e qual é o perfil atual do usuário." | E-01 (`authMiddleware.js:56-68`). |
| P2 | Validação e exposição: após "...nas respostas para reduzir a exposição de informações sensíveis." | Acrescentar: "As requisições têm limite de tamanho por rota, e as imagens enviadas têm formato e tamanho validados no *back-end*." | E-03 (`middlewares/bodyLimits.js`; `schemas/imageSchemas.js`). |
| P2 | Validação de documentos: "a uniformização da política de senhas permanecem como melhorias identificadas." | "a uniformização da política de senhas, já decidida pela equipe (8 caracteres, uma letra maiúscula e um número, com fator de custo 12), permanecem como melhorias identificadas." | DEC-E decidida, não implementada. |

### 10.9. Extensões e tecnologias complementares

Sem alteração necessária. O texto está coerente com o código:

- Resend para recuperação de senha e recusa de cadastro;
- Mercado Pago só em *sandbox*;
- Sentry dependente do ambiente;
- integração contínua no GitHub Actions;
- nenhuma funcionalidade de IA, IoT ou visão computacional.

### 10.10. Avaliação geral do Projeto Integrador

| Prioridade | Trecho atual | Trecho novo | Motivo |
| --- | --- | --- | --- |
| P1 | "o estorno apresentado no fluxo de agendamentos ainda é simulado" | "o pagamento antecipado e o estorno de agendamentos ainda não foram implementados" | E-04. |
| P2 | Decisões mais relevantes: após a última frase | Acrescentar: "Antes da etapa final, a equipe também registrou decisões formais para pontos que estavam ambíguos, como a ordem entre pagamento e aceite no agendamento pré-pago, a fonte do preço dos serviços e a ausência de frete, cupom e desconto PIX neste semestre." | Pauta da Fase 0. |
| P2 | Avanços alcançados: após a última frase | Acrescentar: "Na fase de estabilização, a aprovação de parceiros e a desativação de contas passaram a ser aplicadas no *back-end*, e o agendamento passou a seguir as regras definidas pela equipe para política de cobrança, preço e conflito de horários." | E-01 e E-04. |
| P3 | Dificuldades enfrentadas | Mencionar que a auditoria revelou regras declaradas na interface e ainda não aplicadas no *back-end*. | Opcional. |

### 10.11. Sumário e numeração das seções

Os títulos acima foram usados no lugar dos números porque a numeração do documento não está consistente em três pontos:

1. **O sumário não bate com os títulos do corpo.** O sumário vai até "27 Avaliação Geral do Projeto Integrador" e numera "23 Organização do Código e Repositório" como seção própria. No corpo, essa parte aparece como "22.4", e "Qualidade do Software e Testes" leva o número "23" digitado à mão.
2. **Os links do sumário apontam para outro arquivo.** Eles levam ao documento `1JeDFmBmA77zruAg3-V1Z0nZ-WR4xlnN0Wi_riMl4cnM`, e não ao "PFC Documento". O sumário parece ter sido copiado de uma versão anterior.
3. **A numeração usada pela equipe é outra.** A Laura se refere a "24 Extensões" e "25 Avaliação".

**Recomendação (P2, apresentação):** atualizar o sumário pelo próprio Google Docs (clicar no sumário e em "Atualizar") e conferir a numeração dos títulos. A conferência e a correção ficam com a equipe, porque não aparecem na exportação em texto e mexem na estrutura do documento.

### 10.12. Aplicação

Em 28/10/2026, a Laura aprovou os ajustes P1 e P2 desta seção. O P3 da avaliação geral e o sumário ficaram de fora.

**Como foram aplicados:** no Google Docs, em modo Sugestão, pelo navegador do aplicativo, como na seção 9.

**Diferenças de grafia em relação às tabelas acima.** Nos trechos de Segurança da Informação e de Avaliação Geral, termos como "backend", "tokens", "middleware" e "Pet Sitters" ficaram sem itálico. Esses parágrafos já usam essas grafias sem itálico, e o objetivo foi manter o estilo de cada um. Nos demais trechos, os termos que o documento costuma italicizar foram mantidos em itálico: *Pet Sitters*, *back-end*, *front-end*, *Sprint*, *checkout* e *hash*.

**Correções durante a aplicação:**

- **Segurança, autenticação com JWT:** a frase sobre a verificação a cada requisição foi inserida antes de "inválidos ou expirados" por causa de um clique fora de hora. Ela foi retirada e inserida de novo depois de "HTTP 401.".
- **Modelo de dados, Usuário:** a palavra *hash* e o trecho "da senha" ficaram com o itálico trocado. A formatação foi corrigida.
- **Situação atual:** o recuo de três espaços do parágrafo "A jornada de serviços..." foi recolocado depois da inserção do parágrafo novo antes dele.

**Verificação:** o texto exportado do documento foi comparado com a cópia de 28/10. Fora das seções 13 a 15, só mudaram os trechos listados de 10.1 a 10.10.

Alguns desses trechos foram aceitos pela Laura durante a revisão e já aparecem incorporados ao texto.

## 11. Novos apontamentos: REGIS, Módulo de Recomendação e arquivos `.env`

Pedido da Laura em 28/10: validar quatro apontamentos no documento e no código e sugerir correção só quando ela se aplicar ao estado atual.

### 11.1. REGIS na Arquitetura Geral do Sistema

**Situação:**

- O texto da seção descreve só a arquitetura cliente-servidor em três camadas e não menciona REGIS.
- REGIS não aparece no código nem na documentação do repositório.
- O único registro é a pendência anotada pela equipe em 22/10/2026: o material da disciplina que define REGIS não foi fornecido.

**Conclusão:** o apontamento procede, porque a seção não trata do tema.

A correção não pode ser escrita sem o material da disciplina. Inventar o significado da sigla, suas dimensões ou uma equivalência com as três camadas seria pior do que a ausência.

**Pendente:** a Laura enviar o slide, o trecho ou o modelo de REGIS usado na disciplina. Com ele, é possível propor um texto que relacione cada elemento do modelo às partes do Pet+, como camadas, módulos, integrações e dados.

Atualização de 28/10: a Laura não tem material sobre REGIS. Uma busca na web por "REGIS" como modelo ou sigla de arquitetura de software também não encontrou nada. O próximo passo é perguntar ao orientador o que a sigla designa e qual material da disciplina usar. O documento fica sem alteração até essa resposta. Por decisão da Laura em 28/10, este ponto fica fora desta revisão.

### 11.2. Módulo de Recomendação na arquitetura

**Situação no documento:**

- O texto da seção não cita recomendação.
- O diagrama da seção traz, entre os "Módulos de Negócio", a caixa "Recomendação (Sugestões personalizadas)".
- Nenhum RF, RNE, objetivo ou etapa do cronograma prevê recomendação.
- A seção de Extensões e a de Avaliação Geral tratam "recomendações personalizadas" como possibilidade futura.

**Situação no código (`45c0e77`):** não existe módulo, rota, tabela ou caso de uso de recomendação. A busca por "recomend" e "recommend" em `backend/src` e `frontend/src` só encontra textos de interface e de política de privacidade.

**Conclusão:** os dois apontamentos procedem. A recomendação não faz parte do produto atual, e o diagrama é a única peça que diz o contrário.

**Correção sugerida (P1): manter a recomendação como possibilidade futura e tirá-la do diagrama da arquitetura atual.**

- Assim, Extensões, Avaliação Geral, requisitos e cronograma ficam coerentes sem nenhuma alteração.
- Formalizar o módulo, a alternativa citada pelo orientador, exigiria criar requisitos, planejamento e implementação que não existem. Isso foge do escopo do semestre.
- A imagem precisa ser refeita pela equipe. A edição de imagens não é feita por esta revisão.

Ao refazer o diagrama, convém alinhar os "Módulos de Negócio" com a lista do próprio texto da seção (P2):

| Caixa sugerida | Observação |
| --- | --- |
| Autenticação e usuários (JWT + bcryptjs) | Já existe no diagrama. |
| Parceiros e moderação | Ausente no diagrama atual. |
| Pets, endereços e favoritos | Ausente no diagrama atual. |
| Produtos, carrinho e pedidos | A caixa atual "Produtos (Estoque e Compras)" pode ser renomeada. |
| Pagamentos (simulado e Mercado Pago *sandbox*) | Ausente no diagrama atual. |
| Serviços e agendamentos | A caixa atual diz "Serviços e Lembretes". Não há lembretes implementados: a busca por "lembrete" e "reminder" só encontra um texto de divulgação em `PartnersPage.tsx:52`. Retirar "Lembretes". |
| Integrações (Resend, ViaCEP, Sentry opcional) | Ausente no diagrama atual. |

**Diagrama refeito (28/10):** os arquivos estão em `docs/funcional/diagramas/arquitetura-petplus-2026-10-28.png` e `.svg`. O diagrama mantém as três camadas e retira a caixa "Recomendação" e os "Lembretes". Os módulos de negócio seguem a lista da tabela acima e do texto da seção.

A troca da imagem no Google Docs fica com a Laura: clicar com o botão direito na imagem atual, escolher "Substituir imagem" e depois "Fazer upload do computador". O texto da seção 20 não precisa de ajuste, porque não menciona recomendação.

**Fora do documento:** a política de privacidade do aplicativo (`frontend/src/content/legal/privacy.ts:62`) cita "Personalização: recomendar serviços e produtos relevantes". A página de parceiros (`frontend/src/pages/PartnersPage.tsx:52`) anuncia "Lembretes via WhatsApp automáticos". Nenhum dos dois recursos existe. Ajustar esses textos é tarefa de código, fora do escopo desta revisão.

### 11.3. Arquivos `.env` no repositório

**Situação atual (`git ls-files`):**

- **`frontend/.env.local` está versionado.** O conteúdo atual tem só `VITE_API_URL`, a URL pública da API, e o `VITE_SENTRY_DSN` comentado. Não há segredo na versão atual.
- **`backend/.env.example` está versionado.** É um modelo, só com valores de exemplo como `replace-with-a-random-se…`. Manter um `.env.example` é a prática recomendada, e o apontamento não trata desse arquivo.
- **Nenhum `.env` nem `.env.development` está versionado.**

**Histórico (`git log --all`):**

- **`.env.local`, que depois virou `frontend/.env.local`:** entre os commits `304f1dc` (06/03/2026) e `19c0c96` (17/04/2026) o arquivo continha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Os valores ficam no histórico e podem ser lidos por quem tem acesso ao repositório. Esta revisão não os transcreve.
- **`backend/.env` ou outro `.env` com segredos de servidor:** nunca foram commitados.

**`.gitignore`:**

- O repositório não tem `.gitignore` na raiz.
- `backend/.gitignore` ignora `.env`.
- `frontend/.gitignore` não ignora nenhum arquivo `.env`.

**Conclusão:** o apontamento procede para `frontend/.env.local`. Ele está versionado hoje e teve chaves do Supabase no histórico, e o `frontend/.gitignore` não protege esses arquivos.

**Correção sugerida.** Mexe em código e no Git, então fica com a Laura ou com a sessão de código, e não com esta revisão.

1. **Antes de remover o arquivo:** confirmar que `VITE_API_URL` está configurada nas variáveis de ambiente da Vercel, para Production e Preview. Sem ela, o *front-end* usa `http://localhost:3000/api/v1` como padrão (`frontend/src/lib/api.ts:2`), e o *build* publicado deixaria de acessar a API.
2. **Revogar ou trocar a chave anônima do Supabase**, ou desativar o projeto Supabase se ele não é mais usado. A chave já foi publicada, e apagar o histórico não desfaz cópias que já existam.
3. **Parar de versionar o arquivo, mantendo a cópia local:** `git rm --cached frontend/.env.local`.
4. **Proteger os arquivos em `frontend/.gitignore`**, e também em um `.gitignore` na raiz, se a equipe preferir:

   ```gitignore
   .env
   .env.*
   !.env.example
   ```

5. **Opcional, apagar o histórico:** usar `git filter-repo --path .env.local --path frontend/.env.local --invert-paths` em um clone novo, seguido de *push* forçado de todas as branches e tags. Essa operação reescreve todos os commits e obriga a equipe a clonar o repositório de novo. Os PRs antigos do GitHub podem continuar mostrando os commits até um pedido de limpeza ao suporte. Por isso o passo 2, revogar a chave, é a medida que efetivamente protege.

Nesta revisão não foram executados `git rm`, *commit*, reescrita de histórico nem *push*, e o `.gitignore` está fora de `docs/`. Os passos acima ficam para a Laura, junto com as alterações de código.

**Aplicado em 28/10, com autorização da Laura:** o passo 4. Foram acrescentadas ao `frontend/.gitignore` as regras `.env`, `.env.*` e `!.env.example`. Com `git check-ignore`, `.env`, `.env.local` e `.env.development` aparecem ignorados, e `.env.example` não. O `frontend/.env.local` continua versionado até o `git rm --cached` do passo 3, porque o `.gitignore` não retira arquivos que já estão no repositório.

**Situação em 28/10:**

- A Laura informou que fez os passos 1 a 4 até a abertura do PR.
- O commit `de08b4b`, na branch `chore/remove-env-local`, remove o `frontend/.env.local` do repositório e inclui o `.gitignore`. A cópia local do arquivo continua existindo.
- Falta fazer o merge do PR e conferir o deploy.
- A Laura descartou o passo 5, a limpeza do histórico.
