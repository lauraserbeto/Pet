# G07 — Plano: Configurações da Plataforma com backend real

Elaborado em 20/11/2026. **Somente planejamento**: nada aqui foi implementado, migrado, commitado ou publicado. Origem: decisão G07 → “Planejar backend” em [FASE0-DECISOES.md](FASE0-DECISOES.md); a tela atual é a versão informativa da Fase 1 ([FASE1-IMPLEMENTACAO-E-VALIDACAO.md](FASE1-IMPLEMENTACAO-E-VALIDACAO.md)). Corresponde à pendência **CFG-1** do [plano de retomada](../../Sprints/PLANO-RETOMADA-E-FECHAMENTO-2026-11-16.md).

Fora da Sprint atual e fora das Fases 2–5 da auditoria. Antes de implementar, reconferir o código: o working tree tem centenas de alterações locais não commitadas e este plano descreve o estado lido em 20/11/2026.

---

## 0. Estado atual verificado

| Item | O que o código mostra hoje |
|---|---|
| Tela | `frontend/src/pages/dashboard/Settings.tsx` é estática: três cartões fixos (“Análise manual”, “Taxas e repasses — Não disponível”, “Segurança das contas — Não disponível”) e um link para `/dashboard/aprovacoes`. Nenhuma chamada de API. |
| Rota | `frontend/src/app/routes.tsx` (`path: "settings"`) usa `dashboardOnly(DASHBOARD_ROLES.ADMIN, <Settings />)`. |
| Versão anterior (HEAD `d593b03`) | Campos “Nome da Plataforma”, “E-mail de Suporte”, switch de aprovação automática, comissões de Hotel/Sitter/Lojista, switch de 2FA e “logout forçado” — todos só disparavam `toast.success`. |
| Backend | Não há modelo, tabela, rota nem controller de configurações. `backend/prisma/schema.prisma` não tem nada equivalente; `backend/src/routes/adminRoutes.js` expõe apenas `GET /api/v1/admin/metrics`. |
| Proteção Admin | `adminRoutes.js` aplica `authMiddleware` + `adminMiddleware` em todo o router. `authMiddleware` valida JWT HS256 e **relê do banco** `is_active`, `role_id` e status do parceiro a cada requisição (`UserRepository.findAuthState`). `adminMiddleware` exige `req.userRole === 1` e responde `AppError.forbidden`. |
| Validação | `backend/src/middlewares/validate.js` aplica schemas Zod em `body`/`query`/`params`; `ZodError` vira 422 `VALIDATION_ERROR` com `details[{path,message,code}]` em `errorHandler.js`. |
| Formato de erro | `{ error: { code, message, details? }, message }`, gerado por `AppError` (`badRequest` 400, `unauthorized` 401, `forbidden` 403, `notFound` 404, `conflict` 409, `validation` 422). P2002 → 409 `UNIQUE_CONSTRAINT`. |
| Paginação admin | `UserController.listUsers` usa `page`/`limit` e cabeçalhos `X-Total-Count`, `X-Page`, `X-Limit`, `X-Total-Pages`. |
| Migrations | 15 em `backend/prisma/migrations`, a última `20261120020000_pet_archive` (local, não publicada). |

### Fluxo de aprovação de parceiros (base para a §5)

- **Cadastro** — `backend/src/useCases/auth/RegisterUseCase.js`: papéis 2/3/4 criam `Provider` sempre com `status: PROVIDER_STATUS.PENDING` (`PENDENTE`). A resposta devolve o `User` sem `password_hash` e **sem** o provider.
- **Login** — `backend/src/useCases/auth/LoginUseCase.js`: para `ROLES_REQUIRING_APPROVAL = [2, 3]` (Lojista/Hotel) sem status aprovado e não recusado, lança 403 “Seu cadastro está em análise…”. O token traz `provider_status` no usuário retornado.
- **Admin aprova/recusa Lojista/Hotel** — `PATCH /api/v1/providers/:id/status` (`providerRoutes.js`, com `authMiddleware` + `adminMiddleware` + Zod) → `ProviderController.updateStatus`; recusa grava `rejection_reason` e envia e-mail (falha de e-mail não reverte).
- **Reenvio** — `ProviderController.resubmit`: `REJEITADO` → `EM_REVISAO`, pelo próprio parceiro.
- **Pet Sitter** — `UserController.submitSitterEvaluation` (só `role_id 4`) cria `SitterEvaluation PENDING` e põe `onboarding_step = IN_REVIEW`; `UserController.reviewEvaluation` (Admin) aprova/recusa, define `onboarding_step` `COMPLETED`/`REJECTED` e, se aprovado, passa o provider para `APROVADO`, tudo em transação. Vitrine/operação do sitter exige provider aprovado **e** avaliação aprovada (`isOperationalSitter` em `backend/src/constants/providerStatus.js`).
- **Frontend** — `LoginPage.tsx` manda sitter sem `COMPLETED` para `/onboarding/sitter` e mostra “Conta em análise” para Lojista/Hotel `PENDENTE`; `RegisterPage.tsx` sempre diz “Sua conta aguarda aprovação do administrador.” para parceiros; `ProtectedRoute.tsx` bloqueia parceiro não aprovado; `Approvals.tsx` lista via `GET /providers` e altera via `PATCH /providers/:id/status`.

---

## 1. Escopo: o que é configurável nesta versão

Critério: só entra como configuração aquilo que (a) já existe como regra no código, (b) pode ser lido pelo backend no ponto de decisão e (c) tem valor padrão que reproduz exatamente o comportamento atual.

### 1.1 Configuráveis propostos

| Chave | Tipo / domínio | Padrão (= hoje) | Onde é lida | Observação |
|---|---|---|---|---|
| `partners.auto_approval_roles` | lista de `role_id` ⊆ `{2, 3}` | `[]` (nenhum papel aprovado automaticamente) | `RegisterUseCase` | **Depende da decisão D1** (§1.4). Pet Sitter (4) é excluído pelo schema: o onboarding exige `SitterEvaluation` aprovada. |
| `support.contact_email` | e-mail (string ≤ 150) | `contato@petplus.com.br` (valor fixo hoje em `frontend/src/pages/ContactPage.tsx`) | endpoint público de leitura; `ContactPage` | Opcional (fase C). Não substitui `EMAIL_FROM`/`EMAIL_REPLY_TO` do `config/env.js`, que continuam em variável de ambiente. |

Sugestão de entrega mínima: só `partners.auto_approval_roles`, se D1 for “sim”; caso contrário, entregar a infraestrutura (modelo, auditoria, endpoints, tela) com `support.contact_email` como primeira chave, ou adiar G07 inteiro. Infraestrutura sem nenhuma chave útil não deve ser entregue.

### 1.2 Candidatos avaliados e **não** recomendados agora

| Regra | Onde está | Por que não agora |
|---|---|---|
| Limite de pets por tutor | `MAX_PETS_PER_TUTOR = 10` em `PetController.js` | Viável tecnicamente, mas reduzir o valor cria tutores acima do limite (precisa de regra para o legado). Sem pedido de produto. |
| Limites do carrinho | `MAX_QTY_PER_ITEM = 99`, `MAX_DISTINCT_SKUS = 50` em `schemas/cartSchemas.js` | Estão dentro de schemas Zod estáticos; torná-los dinâmicos exige refatorar a validação. Sem pedido de produto. |
| Nome da plataforma | Marca “Pet+” espalhada em textos, e-mails e documentos legais | Não é uma regra lida em um ponto; mudar por painel deixaria textos legais e e-mails inconsistentes. |
| Versão dos termos | `backend/src/constants/legalPolicy.js` | Está amarrada aos textos publicados em `/terms` e `/privacy` (E-10). Mudar a versão sem mudar o texto quebra o aceite legal. |
| Limites de requisição | `requestLimits`/rate limit por IP/processo (SEC-2) | Infraestrutura, por processo e sem contador compartilhado; pertence a env/deploy, não ao painel. |

### 1.3 Fora do escopo — dependem de funcionalidade inexistente

| Item do layout antigo | Dependência ausente | O que a tela deve dizer |
|---|---|---|
| Comissões (Hotel, Sitter, Lojista) | Split/repasse e cobrança real. Hoje: pagamento de agendamento **simulado** (PAG-2); pedidos via Mercado Pago sem retenção de comissão; split/repasse listado como fora de escopo no plano de retomada. Uma taxa gravada não seria aplicada a nada. | “Não disponível nesta versão”, sem campo. |
| Autenticação em duas etapas | Não há segundo fator, segredo TOTP, códigos de recuperação nem etapa extra no `LoginUseCase`. | “Não disponível”, sem switch. |
| Logout global / forçado | Não há refresh token nem revogação de JWT (limite registrado na SEC-2 e na E-35). O token vale 1 dia (`expiresIn: '1d'` em `LoginUseCase.js`). Desativar a conta (`SetUserActiveUseCase`) já invalida o acesso na requisição seguinte, porque `authMiddleware` relê `is_active`, mas isso é suspensão individual, não encerramento de sessões. | “Não disponível”; manter a indicação de “Sair da conta”. |

Nota para planejamento futuro (não é parte deste plano): como `authMiddleware` já consulta o banco a cada requisição, uma revogação poderia ser feita com uma coluna do tipo `users.sessions_valid_after` comparada ao `iat` do JWT. Isso é uma funcionalidade de segurança própria (com testes, efeitos sobre troca de senha e reset), e não uma “configuração”; deve ser decidida separadamente.

### 1.4 Decisões pendentes (com Laura, antes da implementação)

- **D1 — Aprovação automática é desejada?** Se sim, para quais papéis (Lojista, Hotel). Riscos na §5.1. Se não, a chave não é criada e o cartão “Aprovação de parceiros” continua informativo.
- **D2 — A aprovação automática vale só para cadastros novos?** Recomendação: sim. Ligar a chave não aprova retroativamente parceiros `PENDENTE`/`EM_REVISAO`; o reenvio após recusa continua indo para `EM_REVISAO` com análise manual.
- **D3 — Entregar `support.contact_email` (fase C)?** Só faz sentido se o e-mail de contato realmente mudar sem novo deploy.

---

## 2. Modelo de dados e migration

### 2.1 Prisma (a adicionar em `backend/prisma/schema.prisma`)

```prisma
// CFG-1: valores vigentes. Uma linha por chave registrada em
// src/constants/platformSettings.js. Ausência da linha = valor padrão do registro.
model PlatformSetting {
  key        String   @id @db.VarChar(80)
  value      Json
  version    Int      @default(1)
  updated_by String?  @db.Uuid
  updated_at DateTime @default(now()) @db.Timestamptz

  updater User?                  @relation("PlatformSettingUpdater", fields: [updated_by], references: [id], onDelete: SetNull)
  audits  PlatformSettingAudit[]

  @@map("platform_settings")
}

// CFG-1: trilha imutável de alterações. Nunca atualizada nem apagada pela API.
model PlatformSettingAudit {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  setting_key   String   @db.VarChar(80)
  old_value     Json?    // null = vinha do padrão (sem linha)
  new_value     Json
  changed_by    String?  @db.Uuid
  changed_by_name String @db.VarChar(150) // snapshot do nome no momento
  request_id    String?  @db.VarChar(100) // ID de correlação já usado nos logs
  changed_at    DateTime @default(now()) @db.Timestamptz

  setting PlatformSetting @relation(fields: [setting_key], references: [key], onDelete: Restrict)
  actor   User?           @relation("PlatformSettingAuditActor", fields: [changed_by], references: [id], onDelete: SetNull)

  @@index([setting_key, changed_at(sort: Desc)])
  @@index([changed_at(sort: Desc)])
  @@map("platform_setting_audits")
}
```

E as relações inversas em `User` (`platformSettingsUpdated`, `platformSettingAudits`).

Escolhas:

- **Chave–valor com registro em código**, e não uma tabela de colunas fixas: cada chave nova não exige migration, mas só chaves declaradas no registro são aceitas (sem “configuração livre”).
- **`version`** para controle otimista de concorrência (dois admins editando).
- **`onDelete: SetNull` + `changed_by_name`**: a trilha sobrevive à exclusão do usuário sem perder quem alterou. Admin hoje não é desativável por rota (`SetUserActiveUseCase`), mas exclusão por banco continua possível.
- **Sem `DELETE` na API** e sem rota de edição de auditoria.
- Valores sensíveis (segredos, chaves de API) **nunca** entram nesta tabela; seguem em env.

### 2.2 Migration nova

- Nome: `backend/prisma/migrations/20261121000000_platform_settings/migration.sql` (posterior à última, `20261120020000_pet_archive`). **Não editar nenhuma migration existente.**
- Conteúdo: `CREATE TABLE platform_settings`, `CREATE TABLE platform_setting_audits`, FKs e índices acima. **Não inserir linhas**: a ausência de linha significa “valor padrão”, então a migration é puramente aditiva e não muda comportamento.
- Geração sem `migrate dev`/`db push`/`reset`: escrever o SQL à mão (padrão das migrations recentes) e conferir com `npx prisma migrate diff --from-schema-datasource <banco de teste descartável já migrado> --to-schema-datamodel prisma/schema.prisma --script`, que deve sair vazio depois de aplicar a migration nova com `migrate deploy` nesse banco descartável (URL contendo `test`, como exigem os helpers de `tests/helpers/dbIntegration.js`).
- Impacto em publicação: o boot do container aplica migrations (INF-2). Esta migration só cria tabelas, mas segue a mesma regra das outras: só entra em banco publicado com autorização explícita e junto do código que a usa.

### 2.3 Registro de chaves e padrões

Novo `backend/src/constants/platformSettings.js`:

```js
// Cada chave: schema Zod do valor, padrão que reproduz o comportamento atual,
// visibilidade (admin | public) e descrição exibida no painel.
const PLATFORM_SETTINGS = Object.freeze({
  'partners.auto_approval_roles': {
    schema: z.array(z.union([z.literal(2), z.literal(3)])).max(2)
      .refine((v) => new Set(v).size === v.length, 'Papéis repetidos'),
    default: [],
    visibility: 'admin',
  },
  // fase C, se D3:
  'support.contact_email': {
    schema: z.string().trim().toLowerCase().email().max(150),
    default: 'contato@petplus.com.br',
    visibility: 'public',
  },
});
```

Novo `backend/src/services/PlatformSettingsService.js` (ou `useCases/settings/`): `get(key, tx?)` → valor da linha ou padrão do registro; `list()`; `update({ key, value, expectedVersion, actor, requestId })`. Sem cache em memória nesta versão (leitura por PK, uma vez por cadastro; evita divergência entre instâncias, já que não há armazenamento compartilhado — vide limite de requisições na SEC-2).

---

## 3. Endpoints (todos sob `/api/v1/admin`, já protegidos por `authMiddleware` + `adminMiddleware`)

Schemas Zod em `backend/src/schemas/adminSchemas.js` (já existe, hoje só `metricsQuery`). Rotas em `adminRoutes.js`, controller em `AdminController.js` (ou `SettingsController.js` dedicado), com Swagger no mesmo estilo dos blocos existentes.

### 3.1 `GET /api/v1/admin/settings`

200:

```json
{
  "settings": [
    {
      "key": "partners.auto_approval_roles",
      "value": [],
      "default": [],
      "is_default": true,
      "version": 0,
      "updated_at": null,
      "updated_by": null
    }
  ],
  "unavailable": ["fees", "two_factor", "global_logout"]
}
```

- `version: 0` quando não há linha (padrão). `updated_by` = `{ id, full_name }` ou `null`; sem e-mail (minimização, padrão SEC-2).
- `unavailable` é uma lista fixa do backend para a tela não precisar “adivinhar” o que não existe.

### 3.2 `PATCH /api/v1/admin/settings/:key`

- `params`: `key` ∈ chaves do registro (`z.enum(Object.keys(PLATFORM_SETTINGS))`) → chave desconhecida = 422 `VALIDATION_ERROR` (coerente com o tratamento de UUID inválido em outras rotas). Alternativa aceitável: 404 `NOT_FOUND`; escolher uma e testar.
- `body`: `{ value: <validado pelo schema da chave>, expected_version: int ≥ 0 }`, `.strict()` para recusar campos extras. A validação do `value` depende da chave, então é feita no service com o schema do registro, convertendo falha em `AppError.validation('Valor inválido para esta configuração.', details)`.
- Transação:
  1. `SELECT … FOR UPDATE` da linha (ou ausência) da chave.
  2. Versão atual ≠ `expected_version` → 409 `SETTING_VERSION_CONFLICT` com `details: { current_version }`.
  3. Valor igual ao atual (comparação canônica do JSON; listas ordenadas) → 200 com `changed: false`, **sem** linha de auditoria.
  4. Upsert com `version + 1`, `updated_by`, `updated_at`; insert em `platform_setting_audits` com `old_value` (null se vinha do padrão), `new_value`, ator, nome, `request_id`.
  - Corrida na primeira gravação (duas transações sem linha): o `INSERT` concorrente cai em P2002 → tratar como 409 `SETTING_VERSION_CONFLICT`, não como o 409 genérico `UNIQUE_CONSTRAINT`.
- 200: `{ setting: { …mesmo formato da 3.1 }, changed: true|false }`.
- Log estruturado (`config/logger.js`) com chave, ator e versão; **sem** o valor quando a chave for marcada como sensível (nenhuma é hoje).

### 3.3 `GET /api/v1/admin/settings/audit`

- `query`: `key?` (enum do registro), `page` (≥1, padrão 1), `limit` (1–100, padrão 20).
- 200: array `[{ id, setting_key, old_value, new_value, changed_by: { id, full_name } | null, changed_by_name, changed_at }]`, ordenado por `changed_at desc, id desc`, com cabeçalhos `X-Total-Count`/`X-Page`/`X-Limit`/`X-Total-Pages` como em `listUsers`.

### 3.4 (fase C, se D3) `GET /api/v1/platform/settings/public`

Sem autenticação, só chaves com `visibility: 'public'`: `{ "support.contact_email": "…" }`. Coberto pelo limite geral da API (300/5min). Cache HTTP curto (`Cache-Control: public, max-age=60`).

### 3.5 Erros

| Situação | Status / código |
|---|---|
| Sem token / token inválido | 401 `UNAUTHORIZED` (authMiddleware) |
| Conta desativada | 401 `ACCOUNT_DISABLED` |
| Não Admin | 403 `FORBIDDEN` (adminMiddleware) |
| Chave desconhecida, body malformado, valor fora do domínio, campo extra | 422 `VALIDATION_ERROR` |
| JSON malformado | 400 `INVALID_JSON` (errorHandler) |
| Versão desatualizada / corrida na primeira gravação | 409 `SETTING_VERSION_CONFLICT` |
| Erro inesperado | 500 com ID de correlação, sem SQL/stack (padrão SEC-2) |

---

## 4. Trilha de auditoria

- Quem: `changed_by` (FK, `SetNull`) + `changed_by_name` (snapshot). Vem de `req.userId` já resolvido por `authMiddleware` — nunca do body.
- Quando: `changed_at` (`timestamptz`, `now()` do banco).
- Valor anterior/novo: `old_value`/`new_value` em JSON; `old_value = null` significa “padrão”, e a tela mostra o padrão explicitamente.
- Correlação: `request_id` = `req.id`, o correlation id do pino-http (`backend/src/app.js`) que `errorHandler.js` já devolve como `requestId`.
- Gravada **na mesma transação** da alteração: não existe alteração sem auditoria nem auditoria sem alteração.
- Imutável pela API (sem update/delete). Retenção: indefinida nesta versão; volume esperado é baixo.
- Não registra leituras nem tentativas recusadas (403/422/409); essas ficam só no log.
- Aprovação automática de um parceiro (§5.1) **não** vira linha desta tabela; ela não é alteração de configuração. Ver risco R3.

---

## 5. Impacto nos fluxos existentes

### 5.1 Aprovação automática × análise manual (somente se D1)

- `RegisterUseCase`: ler `partners.auto_approval_roles` antes do `prisma.user.create` e usar `status: roles.includes(role_id) ? APPROVED : PENDING` no `provider.create`. Para `role_id 4` o resultado é sempre `PENDENTE` (o schema não aceita 4), preservando o onboarding do sitter.
- Leitura fora da transação do cadastro é aceitável: o valor vale para o cadastro que o leu. Documentar no código.
- A aprovação automática **não** dispensa as demais regras: documento continua validado e único (`normalizeDocument`, índice canônico de E-10; `DocumentVerificationService.verifyCNPJ` valida apenas formato/dígitos, não a existência da empresa), aceite legal continua obrigatório e a vitrine continua exigindo perfil completo (`ProviderController#isProfileComplete` / decisão G12). Um parceiro aprovado automaticamente entra no painel, mas só aparece na vitrine depois de completar o perfil.
- `LoginUseCase`: nenhuma mudança; ele já libera quem está `APROVADO`.
- `ProviderController.updateStatus`: continua permitindo ao Admin recusar depois (status `REJEITADO`, motivo e e-mail). `resubmit` continua indo para `EM_REVISAO` (análise manual), independentemente da chave (D2).
- Parceiros já `PENDENTE`/`EM_REVISAO` não mudam quando a chave é ligada (D2).
- Contrato do cadastro: hoje a resposta não traz o status do provider; incluir `provider_status` (ou `provider: { status }`) na resposta de `POST /auth/register` para a tela não afirmar “aguarda aprovação” quando não aguarda. Mudança aditiva; conferir testes de contrato em `tests/integration/authRoutes.test.js` e `registrationIntegrityDb.test.js`.
- Métricas admin (`AdminController.getMetrics`) contam pendentes por status; com a chave ligada o número cai naturalmente, sem ajuste.

### 5.2 Onboarding do Pet Sitter

Inalterado. `submitSitterEvaluation` → `reviewEvaluation` continua sendo o único caminho para o sitter ficar `APROVADO` + avaliação `APPROVED` (`isOperationalSitter`). Qualquer automação aqui exigiria decidir o que substitui a análise da candidatura (fotos, quiz) e fica fora deste plano. Teste de regressão obrigatório (§7).

### 5.3 E-mail de contato (fase C)

`ContactPage.tsx` passa a buscar o valor público; em falha de rede, usa o mesmo padrão embutido (`contato@petplus.com.br`) — que é o valor real do padrão, não um sucesso simulado. `EmailService` e `EMAIL_REPLY_TO` não mudam.

### 5.4 Interações com o restante da pendência

- E-11 (candidaturas/onboarding) foi concluída em 22/11/2026 ([registro](../../Sprints/Sprint-5-Fechamento/E-11-IMPLEMENTACAO-E-VALIDACAO.md)); ao implementar G07, garantir que §5.1 não toque nos caminhos de `SitterEvaluation`.
- G12 (Fase 3) mexe em `isProfileComplete`/`/providers/completeness`; a aprovação automática depende dessa regra continuar barrando a vitrine. Testar juntos se as entregas se cruzarem.

---

## 6. Frontend (sem sucesso simulado)

- Novo `frontend/src/lib/services/settingsService.ts` (`list`, `update`, `listAudit`), usando `httpClient.ts` como os demais serviços; tipos espelhando §3. Query/mutation com o `queryClient` existente.
- `Settings.tsx`:
  - Carrega `GET /admin/settings`; estados de carregamento, erro (mensagem da API + “Tentar novamente”) e vazio. Em erro, **não** exibir valores de fallback como se fossem os vigentes.
  - Cartão “Aprovação de parceiros”: checkboxes Lojista/Hotel (Pet Sitter exibido como “sempre por candidatura”, desabilitado com explicação). Alteração exige confirmação explícita (“Novos cadastros de Hotel passarão a entrar aprovados. Parceiros já pendentes não mudam.”).
  - Botão “Salvar” habilitado só com alteração; desabilitado durante o envio (sem reenvio duplo); envia `expected_version`.
  - Toast de sucesso **somente após 200** da API e com o valor devolvido pelo servidor; `changed: false` → mensagem neutra “Nada mudou”.
  - 409 → aviso “Outra pessoa alterou esta configuração”, recarregar o valor atual e manter a edição local visível para comparação; 422 → erro por campo; 401/403 → fluxo padrão de sessão/permissão.
  - Cartões “Taxas e repasses” e “Segurança das contas” continuam informativos, guiados por `unavailable`; sem campos, switches nem botões.
  - Bloco “Histórico de alterações” (paginado, §3.3): data/hora em São Paulo, autor, valor anterior → novo, “padrão” quando `old_value` é nulo.
  - Texto do cabeçalho deixa de dizer “Ainda não há configurações editáveis” quando houver ao menos uma chave.
- `RegisterPage.tsx`: mensagem de sucesso de parceiro passa a depender do `provider_status` devolvido (aprovado → “Cadastro aprovado. Faça login para acessar o painel.”; pendente → texto atual).
- `LoginPage.tsx` e `ProtectedRoute.tsx`: sem mudança (já se baseiam em `provider_status`).
- Acessibilidade: rótulos associados, foco no primeiro erro, confirmação em diálogo acessível, cores conforme G03 (`primary-700` para texto/botão).

---

## 7. Testes

### 7.1 Backend — unitários (`backend/tests/unit/`)

- `platformSettings.test.js`: schemas do registro (aceita `[]`, `[2]`, `[2,3]`; recusa `[4]`, `[1]`, `[2,2]`, string, null); padrão de cada chave.
- `platformSettingsService.test.js` (repositório/prisma mockado): `get` sem linha devolve padrão; `update` com versão errada → 409; valor igual → `changed:false` sem auditoria; P2002 na primeira gravação → 409 `SETTING_VERSION_CONFLICT`.
- `RegisterUseCase` (extensão dos testes existentes de cadastro): com `[]` → `PENDENTE` para 2/3/4; com `[3]` → Hotel `APROVADO`, Lojista e Sitter `PENDENTE`; resposta inclui `provider_status`.
- `adminSchemas`: `expected_version` negativo/ausente, campo extra, chave desconhecida.

### 7.2 Backend — integração HTTP e DB (`backend/tests/integration/`)

- `settingsRoutes.test.js`: 401 sem token, 403 para papéis 2–5, 200 para Admin; formato de erro `{error:{code,message,details}, message}`; Swagger sem quebrar.
- `platformSettingsDb.test.js` (exige `NODE_ENV=test`, `RUN_DB_INTEGRATION_TESTS=true`, URL com `test`):
  - migration aplica em banco vazio e em banco com as 15 anteriores; sem linhas iniciais;
  - alteração grava setting + auditoria na mesma transação (falha simulada no insert de auditoria → nada persiste);
  - dois PATCH concorrentes com a mesma `expected_version` → exatamente um 200 e um 409, uma única linha de auditoria;
  - exclusão do usuário autor → `changed_by` nulo, `changed_by_name` preservado;
  - cadastro real com a chave ligada/desligada; sitter continua dependente de `reviewEvaluation`; `resubmit` continua indo para `EM_REVISAO`.
- Regressão: suíte atual inteira (última comprovada: 541 testes backend) sem alteração de resultado.

### 7.3 Frontend — unitários (`Settings.test.tsx`, `RegisterPage.test.tsx`)

- Carregamento/erro/vazio; nenhum toast de sucesso sem resposta 200 (mock que falha → nenhum `toast.success`); 409 recarrega; botão desabilitado durante envio; cartões indisponíveis sem controles; histórico renderiza “padrão”.
- `RegisterPage`: mensagem conforme `provider_status`.

### 7.4 E2E (`frontend/e2e/`)

- `settings.spec.ts` (API controlada): Admin abre, altera, confirma, vê sucesso e histórico; não Admin é barrado pela rota.
- `settings-real.spec.ts` (opt-in, API + PostgreSQL reais, padrão dos `*-real.spec.ts`): Admin liga auto-aprovação para Hotel → novo Hotel cadastra e entra no painel sem passar por Aprovações → Admin desliga → novo Hotel volta a “Conta em análise”; Pet Sitter segue para `/onboarding/sitter` nos dois casos. Desktop e celular. Ao final, restaurar o padrão no banco descartável.
- `a11y.spec.ts`: incluir `/dashboard/settings`.

---

## 8. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R1 | Auto-aprovação libera painel para parceiro sem verificação humana (CNPJ só é validado matematicamente). | Padrão desligado; D1 explícita; confirmação na tela; vitrine continua exigindo perfil completo; Admin pode recusar depois. |
| R2 | Ligar a chave por engano afeta cadastros até alguém notar. | Histórico visível na tela; log estruturado; métricas de pendentes. |
| R3 | Não há registro de *quem/como* um provider foi aprovado (manual × automático). | Fora do escopo mínimo; se necessário, decisão separada (ex.: coluna `approval_source` em `providers`, nova migration). Não inferir pela data. |
| R4 | Corrida entre dois admins. | `expected_version` + `FOR UPDATE` + tratamento de P2002. |
| R5 | Migration publicada no boot sem autorização. | Mesma regra das demais 7 migrations locais: só com autorização e junto do código. |
| R6 | Expansão para “configuração de tudo” (taxas, 2FA) gerando novos controles sem efeito. | Registro fechado em código; §1.3 como critério; revisão recusa chave sem leitor no backend. |
| R7 | Sobreposição com E-11/G12 em andamento. | Ordem da §9; testes de regressão do onboarding e da vitrine. |
| R8 | Sem cache: leitura a cada cadastro. | Custo desprezível (PK). Se houver cache no futuro, precisa de invalidação entre instâncias. |

---

## 9. Ordem de entrega

0. **Decisões D1–D3** com Laura. Se D1 = não e D3 = não, encerrar G07 mantendo a tela informativa.
1. **Fase A — base** (backend): modelo Prisma, migration `20261121000000_platform_settings`, registro de chaves, service, endpoints §3.1–3.3, Swagger, testes §7.1/7.2 (exceto cadastro). Nenhum fluxo muda de comportamento.
2. **Fase B — aprovação automática** (se D1): leitura em `RegisterUseCase`, `provider_status` na resposta do cadastro, testes de cadastro/onboarding, mensagem de `RegisterPage`.
3. **Fase C — tela**: `settingsService.ts`, `Settings.tsx` real, histórico, testes §7.3, E2E §7.4.
4. **Fase D — e-mail de contato** (se D3): chave pública, endpoint §3.4, `ContactPage`.
5. Registro de implementação e evidências em `docs/evidencias-testes/` com prefixo próprio; atualizar os registros da sprint (CFG-1).

Cada fase termina com suíte completa verde e **sem commit/push/deploy** até autorização explícita. Backend (A/B) e tela (C) devem entrar juntos em qualquer commit futuro: a tela sem endpoint quebraria, e endpoint sem tela é aceitável só como passo local.

---

## 10. Critérios de aceite

1. `GET/PATCH /api/v1/admin/settings` e `GET /api/v1/admin/settings/audit` existem, respondem 401/403 para não autenticado/não Admin e seguem o formato de erro do projeto.
2. Toda alteração bem-sucedida gera exatamente uma linha de auditoria com autor, data, valor anterior e novo, na mesma transação; alterações sem mudança e tentativas recusadas não geram linha.
3. Com o banco recém-migrado (sem linhas em `platform_settings`), o comportamento de cadastro, login, aprovação, reenvio e onboarding é idêntico ao atual — comprovado pela suíte existente sem alterações de expectativa.
4. (Se D1) Com Hotel/Lojista na chave, novos cadastros desse papel entram `APROVADO`; Pet Sitter sempre `PENDENTE` até `reviewEvaluation`; parceiros pré-existentes não mudam; reenvio vai para `EM_REVISAO`.
5. Edição concorrente resulta em um 200 e um 409, sem perda silenciosa.
6. A tela só mostra sucesso após 200 da API; falhas mostram erro e não alteram o valor exibido; não há campos, switches ou botões para taxas, 2FA ou logout global.
7. Nenhuma migration existente foi editada; a nova migration é aditiva e aplicada apenas em banco descartável durante o desenvolvimento.
8. Testes unitários, DB, frontend e E2E da §7 passam e estão registrados com evidência real, distinguindo API controlada de API/banco reais.

---

## Não verificado neste plano

- Comportamento em banco publicado ou em produção (não consultado).
- Se algum outro ponto do frontend, além de `ContactPage.tsx`, exibe o e-mail de contato fixo (a busca encontrou também `content/legal/privacy.ts` e `terms.ts`, que são textos legais e não devem ser alterados por configuração).
- Cobertura atual dos testes de `RegisterUseCase` para o status inicial do provider.
