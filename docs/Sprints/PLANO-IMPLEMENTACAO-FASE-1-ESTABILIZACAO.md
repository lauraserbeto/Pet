# Plano de Implementação — Fase 1 de Estabilização (E-01 a E-06)

> **Status:** planejado e **aprovado em 23/10/2026**, incluindo as recomendações P1 a P6. **Nada foi implementado.** A execução começa pelo E-02, depois que a branch for criada a partir da `main` atualizada, e segue item por item com revisão do diff.
>
> **Base técnica:** `origin/main` em `c1d53f0`; referências de linha valem para esse commit.
>
> **Origem:**
> - itens E-01 a E-06 da [auditoria](AUDITORIA-QUALIDADE-ESTABILIZACAO-PRE-SPRINT-4.md) (seções 10 e 11);
> - decisões DEC-A a DEC-G registradas na [pauta da Fase 0](PAUTA-FASE-0-DECISOES-ESTABILIZACAO.md) e no §3 do [PLANO-DESENVOLVIMENTO](PLANO-DESENVOLVIMENTO.md).
>
> **Objetivo da Fase 1:** eliminar os bloqueadores antes de PAG-2, BKG-1/2 e SCH-1/2. São eles: o crítico AUD-01 (aprovação de parceiro só no frontend) e os altos AUD-02 a AUD-07.

---

## 1. Visão geral

### 1.1. Ordem de execução

| Ordem | Item | Achados | Branch sugerida | Esforço | Depende de | Migration |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Preparação | — | — | P | — | — |
| 1 | **E-02** — Listagem de parceiros só para admin | AUD-02 | `fix/E-02-listagem-parceiros-admin` | P/M | 0 | Não |
| 2 | **E-01** — Gate de parceiro, sessão e desativação | AUD-01, AUD-16 (parte), AUD-13 (revogação) | `fix/E-01-gate-parceiro` | G | E-02 | Não |
| 3 | **E-04** — Agendamento conforme DEC-A/DEC-B | AUD-06, AUD-07, AUD-16 | `fix/E-04-agendamento` | G | E-01 | **Sim** |
| 4 | **E-03** — Limite de requisição e imagens | AUD-03 | `fix/E-03-limites-imagens` | M | E-01 (schemas de produto) | Não |
| 5 | **E-05** — Endereço no pedido | AUD-04 | `fix/E-05-endereco-pedido` | M | 0 | **Sim** |
| 6 | **E-06** — Total exibido = cobrado | AUD-05 | `fix/E-06-totais-checkout` | P/M | E-05 (mesma tela) | Não |

**Por que essa ordem**
- **E-02 primeiro:** é pequeno, fecha logo uma exposição de dados pessoais e cria a listagem de admin que o botão "Desativar" do E-01 vai usar. Os dois mexem em `ProviderController.js` e `Approvals.tsx`; em sequência, não há conflito.
- **E-01 em seguida:** é o único achado crítico. Também cria o verificador único de "parceiro operacional" (DEC-D, DEC-G) que o E-04 consome.
- **E-04 antes de E-03, E-05 e E-06:** é o que libera a Sprint 4 (PAG-2, BKG, SCH). E-03, E-05 e E-06 não bloqueiam a Sprint 4, só precisam estar prontos antes dela terminar.
- **E-05 antes de E-06:** os dois alteram `CheckoutPage.tsx`; em sequência, o diff de cada um fica pequeno.

**Esforço total estimado:** 9 a 14 dias de uma pessoa (P ≈ até meio dia, M ≈ 1–2 dias, G ≈ 3–4 dias). É uma estimativa relativa, sem histórico de produtividade para calibrar.

### 1.2. Pontos de detalhe que precisam da sua confirmação

As decisões DEC-A a DEC-G não descem a estes detalhes. **Todas as recomendações abaixo foram aprovadas em 23/10/2026.**

| # | Item | Ponto | Recomendação |
| --- | --- | --- | --- |
| P1 | E-01 | Rotas liberadas para parceiro `REJEITADO` (sessão restrita) | Só as de correção e de conta própria: `GET/PUT /users/me`, `PATCH /users/me/password`, `GET/PUT /providers/me`, `POST /providers/me/resubmit`. Também `GET /cart` e `GET /favorites/ids`, que o app chama sozinho ao logar; bloqueá-las geraria erros na tela. Todo o resto → 403 `PROVIDER_REJECTED` |
| P2 | E-04 | Conflito de horário | Bloquear **o mesmo pet** em dois agendamentos ativos que se sobrepõem (qualquer parceiro) e **o mesmo Pet Sitter** em dois atendimentos simultâneos. **Hotel não** é bloqueado, porque hospeda vários pets ao mesmo tempo e não há campo de capacidade; capacidade fica no backlog |
| P3 | E-04 | Limites de período | Início no futuro; hotel até **30 diárias**; Pet Sitter até **12 horas** por agendamento. Valores em constantes, fáceis de ajustar |
| P4 | E-05 | Formato do endereço no pedido | **Uma coluna JSON** `shipping_address` com cópia (snapshot) dos campos do endereço (`cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade`, `estado`). Pedidos antigos ficam com o campo vazio |
| P5 | E-06 | Formulário de cartão no modo simulado | **Remover os campos de cartão no modo simulado**: o tutor escolhe Cartão ou PIX só como rótulo e vê o aviso "Pagamento simulado — nenhum valor real é cobrado". Alternativa: manter o formulário da CHK-1 com dados fictícios, o que dá mais código e mantém uma tela que imita coleta de cartão |
| P6 | E-03 | Imagens em base64 nas listagens públicas | **Tirar este ponto do E-03.** Sem um armazenamento de imagens (STO-1), remover o base64 das listagens apagaria os avatares. Proposta: tratar no E-15 com um endpoint de mídia que devolve a imagem binária e cacheável, ou na STO-1. O E-03 fica com limites e validação |

---

## 2. Passo 0 — Preparação

1. **Atualizar a base (feito por você, sem execução minha).** A branch `Tasks-Laura` está 8 commits atrás da `main`. Para cada item, criar a branch a partir da `main` atualizada:
   ```bash
   git fetch origin
   ```
   ```bash
   git switch -c fix/E-02-listagem-parceiros-admin origin/main
   ```
   As alterações locais de documentação (`docs/`) acompanham a troca, porque a `main` não altera esses arquivos.
2. **Linha de base:** antes do primeiro item, rodar as verificações (lint, testes, typecheck, build e E2E) na branch nova e registrar o resultado, para separar falhas pré-existentes de regressões.
3. **Banco local:** não há PostgreSQL nesta máquina, o que tem três consequências:
   - as migrations serão geradas **sem banco**, com `prisma migrate diff --from-schema-datamodel <schema anterior> --to-schema-datamodel prisma/schema.prisma --script`, e conferidas com `prisma validate`;
   - a aplicação real das migrations (`migrate deploy`) e os testes com banco (`RUN_DB_INTEGRATION_TESTS=true`) só rodam **no CI do Pull Request**;
   - se quiser validar localmente antes do PR, é preciso instalar PostgreSQL ou Docker (opcional; não faço sem sua autorização).
4. **Consultas prévias em produção (feitas por você, só leitura):**
   - `SELECT status, count(*) FROM appointments GROUP BY status;` define o tratamento de agendamentos antigos no E-04 (seção 5.7).
   - `SELECT id, business_name, rejection_reason FROM providers WHERE status = 'REJEITADO';` mostra se algum parceiro marcado como "recusado" foi, na verdade, **desativado** pelo botão antigo e precisa ser revisado depois do E-01.

### Convenções que valem para todos os itens

- Erros via `next(AppError.xxx(...))`. Nada de `res.status(500).json({ error: error.message })` nos handlers alterados.
- Toda entrada nova ou alterada validada com Zod (`validate({ body, params })`).
- Status sempre vindos de `backend/src/constants/`, nunca como literais.
- Swagger atualizado nas rotas alteradas.
- Testes no mesmo item: cada critério de aceite tem ao menos um teste automatizado ou, quando depender de serviço externo, uma verificação manual descrita.
- Ao fim de cada item, rodar as verificações e apresentar o diff para sua revisão. **Commit, push e PR são feitos por você.**

---

## 3. E-02 — Listagem de parceiros só para admin

**Achado:** AUD-02 · **Esforço:** P/M · **Branch:** `fix/E-02-listagem-parceiros-admin`

### Objetivo
`GET /api/v1/providers` deixa de ser pública e passa a ser a listagem do admin, com os dados de moderação: documento, motivo da recusa e estado da conta. Isso corrige a regressão do painel de aprovações, que hoje mostra todos os parceiros com documento "inválido".

### Arquivos
- `backend/src/routes/providerRoutes.js:102`: `router.get('/', authMiddleware, adminMiddleware, ProviderController.listPartners)` e Swagger com `bearerAuth` e restrição a admin.
- `backend/src/utils/adminProvider.js` (novo): serializador `toAdminProvider` com lista explícita de campos (provider, `document`, `document_type`, `rejection_reason`, `status`, `user: { id, full_name, email, role_id, is_active }`). Sem `password_hash`.
- `backend/src/controllers/ProviderController.js:154-181` (`listPartners`): `select` explícito, serializador novo e `next(err)` no lugar do 500 cru.
- `frontend/src/pages/dashboard/admin/Approvals.tsx`: tipo com `user.id` e `user.is_active` (usados pelo E-01) e mensagem de erro da API.
- `frontend/src/lib/services/providerService.ts:125-135`: remover `fetchAllProviders`, que não tem nenhum uso e passaria a falhar.

### Passos
1. Proteger a rota e trocar o serializador.
2. Ajustar o tipo e a exibição em `Approvals.tsx`. O documento passa a vir preenchido, então a formatação e a validação existentes voltam a funcionar.
3. Remover o serviço sem uso.

### Testes
- `backend/tests/integration/providerRejection.test.js`: o teste "GET /providers — listPartners inclui EM_REVISAO e PENDENTE" passa a usar token de admin. Novos casos:
  - sem token → 401;
  - tutor e parceiro → 403;
  - admin → 200 com `document` e `rejection_reason`;
  - nenhum item com `password_hash`.
- `frontend/src/pages/dashboard/admin/Approvals.test.tsx` (novo): com a API simulada, a lista mostra o documento formatado e não marca como inválido um CPF/CNPJ válido.

### Critérios de aceite (AUD-02)
- `GET /providers` sem token → 401; com token não-admin → 403; com admin → 200 com `document` e `rejection_reason`.
- O painel exibe o documento formatado, e a busca por documento funciona.
- O teste que esperava 200 anônimo foi corrigido.

---

## 4. E-01 — Gate de parceiro, sessão restrita e desativação

**Achados:** AUD-01 (crítico), AUD-16 (parte: detalhe público), AUD-13 (revogação de token) · **Decisões:** DEC-D, DEC-G · **Esforço:** G · **Branch:** `fix/E-01-gate-parceiro`

### Objetivo
A regra "só parceiro aprovado e ativo opera" passa a valer **no backend**, em todas as camadas: produtos, vitrine, carrinho, checkout e detalhe público. O parceiro recusado só acessa a correção do cadastro, e a desativação de conta (`is_active=false`) bloqueia o acesso na requisição seguinte.

### 4.1. Estado da conta a cada requisição
- `backend/src/repositories/UserRepository.js`: novo `findAuthState(userId)`, que devolve `{ id, role_id, is_active, provider: { status } }`.
- `backend/src/middlewares/authMiddleware.js`: depois de validar o JWT, consulta `findAuthState`:
  - usuário inexistente ou `is_active === false` → 401 com código `ACCOUNT_DISABLED`. O frontend já faz logout em 401 (`httpClient` + `AuthContext`);
  - `req.userRole` passa a vir do banco, não do token;
  - `req.providerStatus` fica disponível para as próximas checagens.
- **Sessão restrita (P1):** um parceiro `REJEITADO` só acessa as rotas liberadas listadas em P1; qualquer outra → 403 `PROVIDER_REJECTED`. O frontend já leva esse parceiro para `/parceiro/corrigir-cadastro` (`ProtectedRoute` com `allowRejectedProvider`).
- **Custo:** uma consulta por requisição autenticada, aceitável na escala atual. Uma alternativa futura é registrar no token uma versão da sessão.

### 4.2. Verificador único de "parceiro operacional" (DEC-D)
- `backend/src/services/providerAccess.js` (novo):
  - `isOperationalProvider(provider)`: status `APROVADO`, conta ativa e, para Pet Sitter, avaliação `APPROVED` (reaproveita `isOperationalSitter`).
  - `operationalProviderWhere()`: filtro Prisma equivalente, para usar em consultas.
  - `assertOperationalProvider(...)`: lança `AppError` 403 `PROVIDER_NOT_OPERATIONAL`.
- Usado agora em produtos, vitrine, carrinho, pedido e detalhe; no E-04, no agendamento; depois, no E-11 e no E-17.

### 4.3. Produtos (decisão 5 do plano)
- `backend/src/schemas/productSchemas.js`: novos `createProductSchema` e `updateProductSchema` (nome obrigatório, preço > 0, estoque inteiro ≥ 0, categoria e tipo de pet, `image_url` como data URL de imagem de até ~2 MB ou URL `https`). Tudo com `.strict()`.
- `backend/src/routes/productsRoutes.js:84,110`: aplicar `validate` nas rotas de criação e edição.
- `backend/src/useCases/products/CreateProductUseCase.js` e `UpdateProductUseCase.js`: exigir papel 2 + parceiro operacional; propriedade do produto na edição; trocar `throw new Error` por `AppError`; receber dependências por parâmetro, como já faz `DeleteProductUseCase`.
- `DeleteProductUseCase.js`: acrescentar a checagem de parceiro operacional.
- `backend/src/controllers/ProductController.js`: `create`, `update`, `getDetails` e `listByProvider` passam a usar `next(err)`, o que corrige os 403/404 que hoje viram 500 nessas rotas.

### 4.4. Vitrine, carrinho e pedido
- `ListActiveProductsUseCase.js:23`: `where` com produto `ACTIVE` **e** parceiro operacional.
- `GetProductDetailsUseCase.js`: 404 (`AppError`) se o produto não existir, estiver inativo ou o parceiro não estiver operacional.
- `backend/src/repositories/CartRepository.js` (`ITEM_INCLUDE`): incluir `provider.status` e `provider.user.is_active`.
- `CartController.js` (`assertProductPurchasable`, `addItem`, `merge`): produto de parceiro não operacional → 409 `PROVIDER_UNAVAILABLE`. No `GET /cart`, o item aparece com aviso de indisponível.
- `CreateOrderUseCase.js` (validação prévia e revalidação na transação): parceiro não operacional → 409 `PROVIDER_UNAVAILABLE`.

### 4.5. Parceiros públicos
- `ProviderController` (`listHotels`, `listSitters`, `listStores`): acrescentar conta ativa ao filtro.
- `GetProviderDetailsUseCase.js` e `ProviderController.getDetails`: id inexistente ou parceiro não operacional → 404 (`AppError`). Validar o UUID em `GET /providers/:id`.

### 4.6. Desativação de conta (DEC-G)
- **Backend:**
  - nova rota `PATCH /api/v1/users/admin/users/:id/active` (admin), com corpo `{ is_active: boolean }` validado por Zod;
  - o admin não pode desativar a própria conta nem outro admin;
  - não envia e-mail;
  - responde com o resumo do usuário.
- **Frontend (`Approvals.tsx`):**
  - na aba de aprovados, "Desativar" abre uma confirmação sem campo de motivo e chama a rota nova;
  - o parceiro fica com o selo "Inativo" e o botão "Reativar";
  - "Recusar" continua usando `PATCH /providers/:id/status` com motivo e e-mail.
  - A tela de usuários já exibe "Inativo"; um botão de ativar/desativar ali é opcional.

### Testes
- **Novo `tests/helpers/authState.js`:** simula `UserRepository.findAuthState` nos testes de rota. Hoje 6 arquivos de integração assinam JWT e passariam a consultar o banco: `appointmentRoutes`, `cartRoutes`, `orderRoutes`, `paymentRoutes`, `providerRejection` e `serviceRoutes`. Todos ganham esse helper.
- **Novo `tests/unit/authMiddleware.test.js`:**
  - conta inativa → 401 `ACCOUNT_DISABLED`;
  - papel lido do banco;
  - `REJEITADO` acessa as rotas liberadas e recebe 403 nas demais;
  - token inválido → 401.
- **Novo `tests/integration/productRoutes.test.js`:**
  - POST/PUT/DELETE `/products` → 403 para sitter `PENDENTE`, lojista `PENDENTE`, lojista `REJEITADO`, lojista inativo, hotel e tutor;
  - lojista `APROVADO` → 201/200;
  - corpo inválido → 422;
  - produto de outro lojista → 403; inexistente → 404.
- **Novo `tests/unit/providerAccess.test.js`:** regras do verificador, incluindo sitter sem avaliação aprovada → não operacional.
- **Vitrine, carrinho e pedido** (testes de rota com Prisma simulado):
  - `GET /products` não lista produto de parceiro não operacional; `GET /products/:id` → 404;
  - `POST /cart/items` → 409;
  - `POST /orders` com item desse parceiro → 409.
- **`GET /providers/:id`:** inexistente, UUID inválido ou não aprovado → 404/422.
- **Desativação:**
  - só admin pode usar a rota; não desativa admin;
  - depois de desativar, a requisição seguinte com o token antigo → 401.
- **Banco (CI):** em `cartOrderDb.test.js`, um caso em que o lojista é desativado entre adicionar ao carrinho e finalizar → 409, sem pedido criado nem estoque alterado.
- **Frontend:** em `Approvals.test.tsx`, "Desativar" chama a rota de ativação (não a de status) e mostra "Inativo"; "Reativar" restaura.

### Critérios de aceite (AUD-01, AUD-16 parte)
- POST/PUT/DELETE `/products` → 403 para sitter `PENDENTE`, lojista `PENDENTE`, lojista `REJEITADO`, hotel e tutor; 2xx para lojista `APROVADO`.
- `GET /products`, `GET /products/:id`, `POST /cart/items` e `POST /orders` não aceitam nem exibem produto de parceiro não operacional.
- Token de parceiro `REJEITADO` → 403 fora das rotas liberadas (P1).
- Depois de desativar a conta, a requisição seguinte com o token antigo → 401.
- `GET /providers/:id` de parceiro inexistente ou não aprovado → 404.
- Busca por `throw new Error(` em `useCases/products/` não retorna ocorrências.

### Riscos e cuidados
- **Refatoração dos testes de rota:** a consulta de conta afeta todos os testes de integração autenticados. Por isso o helper vem antes das mudanças de regra.
- **Dados existentes:** parceiros "desativados" pelo botão antigo estão como `REJEITADO` e são indistinguíveis de recusas reais. Revisar a lista do Passo 0 depois do deploy.
- **Sem migration:** `is_active` já existe (`Boolean?`, padrão `true`); `null` vale como ativo.

---

## 5. E-04 — Agendamento conforme DEC-A e DEC-B

**Achados:** AUD-06, AUD-07, AUD-16 · **Decisões:** DEC-A, DEC-B, DEC-D · **Esforço:** G · **Branch:** `fix/E-04-agendamento` · **Depende de:** E-01 (`providerAccess`)

### Objetivo
Alinhar criação, transições e preço do agendamento às regras registradas no §3 do plano e na seção "Atualização pós-auditoria" da AGD-1. Esta é a base que PAG-2, BKG e SCH vão consumir.

### 5.1. Migration e schema
- `backend/prisma/schema.prisma` (`Appointment`):
  - campo `payment_policy PaymentPolicy @default(PRESENCIAL)`, com a política congelada na reserva;
  - índices `@@index([provider_id, start_time])` e `@@index([pet_id, start_time])`, para as consultas de conflito.
- Migration nova (`backend/prisma/migrations/<timestamp>_appointment_payment_policy_snapshot/`):
  - gerada por `prisma migrate diff`;
  - mais o preenchimento dos registros existentes: `UPDATE appointments a SET payment_policy = p.payment_policy FROM providers p WHERE a.provider_id = p.id;`.
  - Nenhuma migration existente é editada.

### 5.2. Constantes e regras de transição
- `backend/src/constants/appointmentStatus.js`:
  - reescrever as transições permitidas conforme a tabela da AGD-1, informando **quem** pode fazer cada uma (tutor, parceiro ou sistema), a **política** e o **horário**;
  - nova função `canTransition({ from, to, actor, policy, now, startTime })`, que devolve se pode e o motivo quando não pode;
  - remover `nextStatusAfterPartnerAccepts`, que não tem uso;
  - atualizar os comentários do arquivo.

### 5.3. Criação (`CreateAppointmentUseCase.js`)
- Todo agendamento nasce `PENDENTE`, com `payment_policy` copiada do parceiro.
- Só parceiro operacional recebe agendamento (`assertOperationalProvider`), e o serviço precisa ser de hotel (3) ou Pet Sitter (4).
- **Validação das datas:**
  - o início precisa estar no futuro;
  - o fim precisa ser posterior ao início;
  - duração máxima conforme P3: hotel até 30 diárias, Pet Sitter até 12 horas.
- **Conflito de horário (P2):**
  - o mesmo pet com agendamento ativo (`PENDENTE`, `AGUARDANDO_CONFIRMACAO` ou `CONFIRMADO`) que se sobrepõe → 409 `SCHEDULE_CONFLICT`;
  - o mesmo Pet Sitter com atendimento ativo que se sobrepõe → 409.
- A resposta inclui `payment_policy` e o detalhamento do preço (`unit`, `quantity`, `unitPrice`).

### 5.4. Preço (`CalculateAppointmentTotalUseCase.js`, DEC-B)
- O cálculo passa a receber `{ service, provider, startTime, endTime }` e usa `service.price` × quantidade de unidades. A unidade vem do papel do parceiro: diária para hotel, hora para sitter.
- Mantém as regras de arredondamento e fuso.
- Deixa de depender de `daily_rate`/`hourly_rate`.

### 5.5. Transições (`UpdateAppointmentStatusUseCase.js`)
- Aplica `canTransition` com a política **gravada no agendamento**:
  - **Parceiro:**
    - `CONFIRMADO` ou `RECUSADO` a partir de `PENDENTE` (só PRESENCIAL) ou de `AGUARDANDO_CONFIRMACAO` (PRE_PAGO);
    - `CONCLUIDO` a partir de `CONFIRMADO`, só depois do horário de início;
    - `CANCELADO` a partir de `CONFIRMADO`, só antes do início.
  - **Tutor:** `CANCELADO` a partir de `PENDENTE`, `AGUARDANDO_CONFIRMACAO` ou `CONFIRMADO`, só antes do início.
  - **Ninguém pela rota de status:** `PENDENTE` e `AGUARDANDO_CONFIRMACAO`. Este último só pelo pagamento, que é a PAG-2.
- **Remover o "estorno simulado" que aparece só na resposta.** O estorno de verdade, gravado no banco, é da PAG-2. Consequência até lá: agendamentos PRE_PAGO ficam `PENDENTE`, porque não há como pagar, e o tutor pode cancelá-los. É o comportamento esperado até a PAG-2.
- **Concorrência:** atualizar com `updateMany` filtrando também pelo status atual. Se nenhum registro for alterado, outra requisição mudou o status antes → 409.
- `backend/src/schemas/appointmentSchemas.js`:
  - `start_time` e `end_time` aceitam fuso explícito (`datetime({ offset: true })`);
  - `status` só aceita `CONFIRMADO`, `RECUSADO`, `CONCLUIDO` ou `CANCELADO` (os demais → 422).

### 5.6. Dados expostos e textos da interface
- `backend/src/repositories/AppointmentRepository.js` e `backend/src/utils/appointmentFormatter.js`: o tutor incluído na resposta passa a ter só `id`, `full_name`, `phone` e `email`. Isso antecipa a parte de AUD-17 que toca estes mesmos arquivos.
- `frontend/src/lib/constants/paymentPolicy.ts:18-21`, textos alinhados à DEC-A:
  - **PRESENCIAL:** "Você confirma ou recusa cada solicitação; o tutor paga no local."
  - **PRE_PAGO:** "O tutor paga ao reservar; você confirma ou recusa depois (a recusa gera estorno integral)."

### 5.7. Agendamentos já existentes (depende da consulta do Passo 0)
- **Se não houver registros, ou forem só de teste:** cancelar os de teste, com sua confirmação, antes do deploy.
- **Se houver registros reais criados pela regra antiga:** manter como estão (legado) e tratar caso a caso. Por exemplo, um PRE_PAGO em `AGUARDANDO_CONFIRMACAO` sem pagamento não pode ser confirmado depois da PAG-2.
- Nenhuma alteração de dados em produção é feita por mim.

### Testes
- **`unit/appointmentStatus.test.js`:** reescrito para as novas regras (quem pode, política e horário), incluindo: PRE_PAGO `PENDENTE` → `CONFIRMADO` pelo parceiro é recusado; `AGUARDANDO_CONFIRMACAO` pela rota de status é recusado.
- **`unit/calculateAppointmentTotal.test.js`:**
  - passa a usar `service.price`;
  - novo caso: hotel com dois serviços de preços diferentes e o mesmo período dá totais diferentes;
  - o caso "rejeita parceiro sem tarifa" sai, porque o preço do serviço é obrigatório.
- **`unit/appointmentUseCases.test.js`:**
  - criação nasce `PENDENTE` com a política copiada;
  - parceiro não operacional → 403;
  - início no passado → 422; duração acima do limite → 422;
  - conflito do mesmo pet → 409; conflito do mesmo Pet Sitter → 409; hotel com agendamentos simultâneos → permitido;
  - parceiro muda a política depois da reserva → a transição usa a política gravada;
  - concluir antes do início → 422; cancelar depois do início → 422;
  - conflito de concorrência (nenhum registro alterado) → 409;
  - os fixtures de serviço passam a ter `price`.
- **`integration/appointmentRoutes.test.js`:** os casos de criação e de transição passam a exercitar **os use cases reais**, com o Prisma simulado, em vez de substituir o use case inteiro (resolve a parte de AUD-26 deste módulo). Novos casos de 422 para status e datas inválidos.
- **Banco (CI, recomendado):** novo `appointmentDb.test.js` cobrindo criação com política congelada, conflito e transição concorrente.
- **Frontend:** `Services.test.tsx` ajustado aos novos textos da política.

### Critérios de aceite (AUD-06, AUD-07, AUD-16)
- Teste com `service.price` diferente da tarifa do parceiro: o total segue o preço do serviço.
- Todo agendamento novo nasce `PENDENTE` com a `payment_policy` gravada; a mudança da política do parceiro não altera agendamentos existentes.
- Nenhum caminho leva a `AGUARDANDO_CONFIRMACAO` pela rota de status; PRE_PAGO não pago não pode ser confirmado nem recusado pelo parceiro.
- Início no passado, conflito ou parceiro não operacional → 422/409/403.
- Comentários de `appointmentStatus.js`, specs e `paymentPolicy.ts` dizem a mesma coisa.

---

## 6. E-03 — Limite de requisição e validação de imagens

**Achado:** AUD-03 · **Esforço:** M · **Branch:** `fix/E-03-limites-imagens` · **Depende de:** E-01 (schemas de produto)

### Contexto
As imagens são enviadas e gravadas como data URL base64 dentro do JSON:
- avatar: `POST /users/me/avatar`;
- avatar e galeria do perfil: `PUT /providers/profile`;
- imagem do produto: `POST/PUT /products`;
- fotos do onboarding: `POST /users/me/evaluations`.

Por isso o limite global é de 50 MB (`backend/src/app.js:82-83`). A correção reduz o limite global e libera um valor maior **só nessas rotas**.

### Arquivos e passos
1. **`backend/src/middlewares/bodyLimits.js` (novo):** escolhe o tamanho máximo do corpo JSON por método e rota:

   | Rota | Limite |
   | --- | --- |
   | Padrão | **100 kb** |
   | `POST /users/me/avatar` | 3 MB |
   | `POST` e `PUT /products` | 3 MB |
   | `PUT /providers/profile` | ~24,5 MB (avatar + 8 fotos de 2 MB) |
   | `POST /users/me/evaluations` | ~16,5 MB (6 fotos de 2 MB) |

   Substitui os dois `app.use(express.json/urlencoded({ limit: '50mb' }))` em `app.js`.

   > **Ajuste na implementação (24/10/2026):** os 16 MB previstos não cabiam o máximo que as próprias regras permitem (uma imagem de 2 MB vira ~2,7 MB em base64). Os limites das rotas de upload passaram a ser calculados a partir do número máximo de imagens × 2 MB, mais uma folga para os demais campos (`backend/src/middlewares/bodyLimits.js`).
2. **`backend/src/middlewares/errorHandler.js`:** corpo grande demais → 413 `PAYLOAD_TOO_LARGE`; JSON malformado → 400 `INVALID_JSON`. Hoje os dois viram 500.
3. **`backend/src/schemas/providerSchemas.js`:** novo `updateProviderProfileSchema`:
   - `avatar_url`: data URL de imagem (JPEG, PNG ou WebP) de até ~2 MB, ou URL `https`;
   - `gallery_images`: no máximo 8 itens, cada um com as mesmas regras;
   - demais campos com tipos básicos e chaves desconhecidas descartadas.

   Aplicado em `providerRoutes.js:192`.
4. **`backend/src/schemas/userSchemas.js`:**
   - `avatar_url` do `PUT /users/me` passa a aceitar só URL `https` (o avatar é enviado pela rota própria; nenhuma tela ativa envia base64 por aqui);
   - novo schema das fotos da avaliação: no máximo 6, cada uma com até ~2 MB.

   As regras de papel e de estado da avaliação ficam para o E-11.
5. **Frontend:** checagem de tipo e tamanho (≤ 2 MB) antes de converter para base64:
   - `PublicProfile.tsx`: avatar e galeria (máx. 8);
   - `Products.tsx`: imagem do produto;
   - `PetSitterOnboarding.tsx`: fotos (máx. 6). O texto "até 10 MB" passa a dizer 2 MB.
6. **Fora deste item (P6):** remover o base64 das listagens públicas.

### Testes
- **Integração:**
  - JSON acima de 100 kb em `/auth/login` → 413, sem autenticação;
  - JSON malformado → 400;
  - avatar acima de 3 MB → 413; data URL com tipo não permitido → 422;
  - galeria com 9 imagens → 422; `PUT /users/me` com `avatar_url` `javascript:` ou `data:` → 422;
  - produto com imagem válida de ~2 MB → 201.
- **Unitários:** schemas de imagem (tipo, tamanho, quantidade).
- **Frontend:** teste de componente do upload no `PublicProfile` recusando arquivo acima de 2 MB.

### Critérios de aceite (AUD-03, sem a parte das listagens)
- Requisição JSON acima de 100 kb → 413 antes da autenticação; nas rotas de upload, acima do limite próprio → 413/422.
- Toda imagem aceita pela API é de tipo permitido e tem até ~2 MB; galeria e fotos respeitam a quantidade máxima.
- Nenhuma tela de upload envia arquivo acima do limite, e todas avisam o usuário.

---

## 7. E-05 — Endereço de entrega no pedido

**Achado:** AUD-04 · **Esforço:** M · **Branch:** `fix/E-05-endereco-pedido`

### Objetivo
Gravar no pedido uma cópia do endereço escolhido no checkout, validando que ele pertence ao tutor, e exibi-la para o lojista e para o tutor. Hoje o frontend já envia `address_id` (`CheckoutPage.tsx:191`), mas o backend o ignora.

### Arquivos e passos
1. **Migration e schema:**
   - `Order.shipping_address Json?` em `backend/prisma/schema.prisma:244-259`, no formato definido em P4;
   - migration gerada por `prisma migrate diff`;
   - pedidos antigos ficam com `NULL`.
2. **Validação da entrada:** `backend/src/schemas/orderSchemas.js` ganha `createOrderSchema = { address_id: uuid }` (obrigatório), aplicado em `orderRoutes.js:49`.
3. **Controller:** `backend/src/controllers/OrderController.js:12-23` passa `address_id` ao use case.
4. **Use case:** `backend/src/useCases/orders/CreateOrderUseCase.js`:
   - busca o endereço com `{ id, user_id: userId }`; se não existir ou for de outro usuário → 404 (sem revelar a existência);
   - copia os campos para `shipping_address`, a mesma cópia em cada pedido criado (um por lojista).
5. **Formatação da resposta:** `backend/src/utils/orderFormatter.js` expõe `shipping_address`. As consultas de pedido (`ListCustomerOrders`, `ListProviderOrders`, `UpdateOrderStatus`, `ConfirmOrderPayment`) já devolvem o pedido inteiro; conferir cada uma.
6. **Frontend:**
   - tipo `Order.shipping_address` em `frontend/src/lib/services/orderService.ts`;
   - endereço exibido no detalhe do pedido em `Orders.tsx` (lojista) e `TutorOrders.tsx` (tutor);
   - o checkout continua exigindo endereço selecionado (`CheckoutPage.tsx:156`).

### Testes
- **`integration/orderRoutes.test.js`:**
  - criação envia `address_id` e simula a busca do endereço;
  - sem `address_id` → 422; endereço de outro usuário → 404;
  - cada pedido criado traz o mesmo `shipping_address`.
- **`integration/cartOrderDb.test.js` (CI):** o seed passa a ter endereço; o pedido criado no banco guarda a cópia; apagar o endereço depois não altera o pedido.
- **Frontend:** `orderService.test.ts` com o tipo novo e teste de componente do detalhe do pedido exibindo o endereço.

### Critérios de aceite (AUD-04)
- O pedido criado guarda o endereço informado; `address_id` de outro usuário → 404; sem endereço → 422.
- O lojista vê o endereço no detalhe do pedido.
- Teste com banco cobre a cópia do endereço.

### Observação
Gravar uma cópia faz com que excluir ou editar o endereço depois não altere pedidos já criados. Isso também tira o peso da trava de exclusão de endereço (AUD-11, que é o E-12).

---

## 8. E-06 — Total exibido igual ao cobrado (DEC-C)

**Achado:** AUD-05 · **Esforço:** P/M · **Branch:** `fix/E-06-totais-checkout` · **Depende de:** E-05

### Arquivos e passos
1. **`frontend/src/pages/CartPage.tsx`:**
   - remover o cupom (`coupon`, `discount`, `applyCoupon`, campo e mensagens, linhas 37-38, 58-65, 238 e 260-263);
   - remover o frete (linhas 67-68 e 267-278);
   - o total exibido passa a ser `totals.total`, vindo do carrinho no servidor.
2. **`frontend/src/pages/CheckoutPage.tsx`:**
   - remover `shipping` e `finalTotal` (linhas 143-144); o total é a soma dos itens;
   - remover a linha de frete do resumo (≈398-399, 680-688);
   - remover "5% de desconto no PIX!" e o texto de QR Code (≈524-527);
   - remover "criptografia SSL" (≈534);
   - no modo simulado, mostrar o aviso "Pagamento simulado — nenhum valor real é cobrado" e, conforme P5, deixar de pedir dados de cartão (a escolha Cartão/PIX vira só rótulo);
   - o modo Mercado Pago não muda.
3. Texto do botão: "Confirmar Pedido — R$ {soma dos itens}".

### Testes
- **Novo `frontend/src/pages/CheckoutPage.test.tsx`:**
  - o total do botão é igual à soma dos itens do carrinho simulado;
  - não aparece "Frete", "desconto no PIX" nem "SSL";
  - o aviso de pagamento simulado aparece no modo simulado e não aparece no Mercado Pago.
- **Novo `frontend/src/pages/CartPage.test.tsx`:** sem campo de cupom; o total é igual a `totals.total`.
- **`frontend/e2e/payment.spec.ts`:** conferir que o botão mostra "R$ 90,00", o total do carrinho simulado, e que o pedido simulado devolve o mesmo `total_price`.

### Critérios de aceite (AUD-05)
- O valor do botão "Confirmar Pedido" é igual ao `total_price` somado dos pedidos retornados, em todos os cenários testados.
- Busca por `PETMAIS15`, `14.9` e "desconto no PIX" no frontend não retorna ocorrências.
- O aviso de pagamento simulado está presente no modo simulado.

---

## 9. Verificações por item e encerramento da Fase 1

**Em cada item** (na branch do item):
```bash
cd backend && npm run lint && npx prisma validate && npm test
```
```bash
cd frontend && npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
```
- Resultado registrado e diff apresentado para sua revisão antes do commit (feito por você).
- O PR de cada item roda no CI as migrations (`migrate deploy`) e os testes com banco, que não rodam localmente.

**Encerramento da Fase 1:**
- critérios de aceite de AUD-01 a AUD-07 (seção 11 da auditoria) atendidos, com AUD-03 sem a parte das listagens (P6);
- CI verde nos 6 PRs;
- **verificação manual em staging ou produção** (por você), sem dados reais sensíveis em prints:
  1. Sitter pendente tenta criar produto pela API → 403.
  2. Admin desativa um lojista → a próxima requisição dele → 401 e os produtos somem da vitrine.
  3. Parceiro recusado faz login e só acessa a correção.
  4. Compra com endereço → o lojista vê o endereço; o total exibido é igual ao cobrado.
  5. Agendamento pela API (Swagger) nasce `PENDENTE` com o preço do serviço.

**Depois da Fase 1:** liberar PAG-2, BKG-1/2 e SCH-1/2. Em paralelo, seguir a Fase 2 da auditoria (E-07 a E-16). Algumas partes já foram absorvidas aqui: erros nos handlers de produto (E-01), 413/400 no `errorHandler` (E-03) e dados do tutor no agendamento (E-04).

## 10. Riscos gerais

| Risco | Mitigação |
| --- | --- |
| A consulta de conta no middleware quebra muitos testes de rota | Criar o helper de simulação no início do E-01 e ajustar os 6 arquivos antes de mudar as regras |
| Migrations validadas só no CI | Gerar com `prisma migrate diff` sem banco, revisar o SQL no diff e abrir o PR cedo para o CI aplicar no PostgreSQL |
| Dados antigos de produção (agendamentos da regra antiga; desativados gravados como recusados) | Consultas do Passo 0; decisão caso a caso com você; nenhuma alteração de dados feita por mim |
| Conflitos entre branches (`ProviderController`, `CheckoutPage`) | Seguir a ordem da seção 1.1 e criar cada branch a partir da `main` depois do merge do item anterior |
| PRE_PAGO sem como pagar entre E-04 e PAG-2 | Comportamento esperado e documentado; agendamentos ficam `PENDENTE` e podem ser cancelados pelo tutor |
