# Pet+ — prompt de contexto para a próxima IA (22/11/2026)

> **Como usar:** cole este arquivo inteiro como primeira mensagem para a outra IA, ou mande que ela o leia em `docs/CONTEXTO-HANDOFF-IMPLEMENTACOES-2026-11-22.md`. Ele substitui o handoff de 20/11 como ponto de partida. O de 20/11 continua válido como histórico detalhado das entregas anteriores ([CONTEXTO-HANDOFF-IMPLEMENTACOES-2026-11-20.md](CONTEXTO-HANDOFF-IMPLEMENTACOES-2026-11-20.md)).

---

> **Correção do CI após `ed8a142` (22/11), branch atual `tasks-laura`:** a suíte de moderação esperava sempre 200/422 em aprovação/recusa concorrentes, mas a regra DEC-D permite recusa seguida de reconsideração com dois 200. Teste corrigido para as duas serializações válidas e estado final APROVADO sem motivo de recusa; dois casos sequenciais determinísticos acrescentados. Nenhuma regra da API ou migration alterada. Oito testes focados passaram três vezes; regressão completa **561/561**, zero falhas/ignorados/cancelados, PostgreSQL 16 local exclusivo `petplus_ci_fix_test`. Lint dos arquivos alterados e diff-check aprovados. Correção ainda local, sem commit/push e sem nova execução do GitHub Actions. A E-17 continua sendo a próxima frente funcional.

> **Estado mais recente — E-33 concluída localmente (22/11):** matriz compartilhada de permissões entre rotas/menu/retomada, tutor e onboarding restritos por papel, destino pós-login compatível para todos os perfis e 401 preservando query/hash. Guard do sitter não monta conteúdo antes de redirecionar; estado legado inconsistente mostra indisponibilidade sem ciclo de navegação. Backend 559/559; frontend 284/46 arquivos; 39 cenários Chromium (13 com API/PostgreSQL reais), com repetição dos 13 para capturas finais. Typecheck/build/lint sem erros, um aviso backend e 118 frontend. Consulte [E-33](Sprints/Sprint-5-Fechamento/E-33-IMPLEMENTACAO-E-VALIDACAO.md). A próxima frente é **E-17**, reproduzindo o que restar de dados fabricados. Nove frentes técnicas restantes, além de decisões e QA/release. Sem commit/push/deploy ou migration nova. As notas anteriores abaixo são histórico.

> Registro anterior, após E-19: **E-19 entregue localmente**. Última regressão: 554 backend, 198 frontend/41 arquivos, dois E2E reais desktop/celular, typecheck/build/lint sem erros. Consulte [registro E-19](Sprints/Sprint-5-Fechamento/E-19-IMPLEMENTACAO-E-VALIDACAO.md). A fila histórica abaixo deve agora começar pela **E-18**, não repetir E-19. Sem commit/push/deploy. O ambiente temporário desta entrega é independente do container de desenvolvimento e será encerrado ao final.

> Atualização mais recente, após E-18 (22/11): **E-18 e E-19 concluídas localmente**. Última regressão: 559 backend, 213 frontend/43 arquivos, 28 cenários Chromium (dois com API/PostgreSQL reais). Typecheck/build/lint sem erros; um aviso backend e 122 frontend. A próxima frente é **reproduzir E-13**, depois E-33 e a fila restante. Consulte [registro E-18](Sprints/Sprint-5-Fechamento/E-18-IMPLEMENTACAO-E-VALIDACAO.md). Merge agora usa baseline e intenção por conta; não remover esse protocolo nem voltar a DELETE do carrinho após criar Order. Sem commit/push/deploy ou migration nova. Os números e a fila mais abaixo são o histórico anterior a essas duas entregas.

## Prompt

> Atualização posterior: **E-13 concluída localmente em 22/11**. Login de lojista/hotel recusado vai direto à correção; formulário valida UF real/limites, apresenta erros persistentes e atualiza a sessão após reenvio. Backend 559/559; frontend 229 testes/44 arquivos; quatro cenários reais e 25 de regressão de navegador aprovados. Typecheck/build/lint sem erros, um aviso backend e 121 frontend. Consulte [E-13](Sprints/Sprint-5-Fechamento/E-13-IMPLEMENTACAO-E-VALIDACAO.md). A próxima frente é **E-33**. Sem commit/push/deploy ou migration nova. Esta nota substitui a sugestão anterior de começar pela E-13.

Você vai continuar o desenvolvimento local do **Pet+**, um marketplace pet acadêmico (Projeto Integrador 2026). Nele, tutores compram produtos e agendam hotel e pet sitter, e parceiros (lojista, hotel, pet sitter) são moderados por um admin. Quem decide é a Laura (responsável pelo repositório). Fale com ela em **português**.

Seu trabalho é fechar as pendências da Sprint 5 **uma de cada vez**, nesta ordem:
1. Ler este documento.
2. Conferir o estado do repositório (§2).
3. Propor à Laura a próxima pendência (§6) e esperar o "sim".
4. Reproduzir o problema antes de mexer no código.
5. Implementar, testar (unitário, banco real, navegador real) e registrar.

Não declare a sprint ou o projeto concluídos.

### 1. Regras invioláveis

Estas regras valem até a Laura dizer o contrário, explicitamente, no chat:

1. **Não commitar, não fazer push, não fazer deploy, não abrir PR.** Todo o trabalho está no working tree (cerca de 375 entradas no `git status`) e precisa continuar lá.
2. **Não usar `git add .`**, `git stash`, `git checkout -- <arquivo>`, `git reset`, `git clean` nem nada que descarte ou esconda alterações. **Não apagar arquivos não rastreados**: são implementações, migrations, testes, documentos e evidências.
3. **O stash `stash@{0}` (`codex-backup-antes-main-avl1-2026-11-18`, hash `ca63bf00…`) não deve ser reaplicado nem apagado.** O conteúdo já está integrado.
4. **O banco de produção é intocável.**
   - `backend/.env` aponta para o PostgreSQL publicado no Railway (`monorail.proxy.rlwy.net`).
   - Nunca rodar a API, testes, scripts, Prisma ou `npm start` com esse `.env` sem sobrescrever `DATABASE_URL`. **`npm start` executa `prisma migrate deploy`**, ou seja, aplicaria as migrations locais em produção.
   - Nunca rodar `prisma migrate dev`, `migrate reset`, `db push`, `migrate resolve`, seed demonstrativo ou saneamento de dados contra nada que não seja o banco local descartável.
5. **O frontend deve apontar para a API local.** `frontend/.env.local` tem `VITE_API_URL=http://localhost:3000/api/v1`, e a linha de produção está comentada. O erro que abriu esta sessão foi justamente o painel local falando com a API publicada. Não trocar.
6. **Dados pessoais:**
   - Não imprimir e-mails, documentos (CPF/CNPJ), tokens nem senhas em relatórios ou logs de evidência.
   - Mascarar e-mails nas capturas de tela.
   - Não versionar `ux-accounts.json`, outbox, fixtures com tokens, `.env`, `node_modules`, `dist` nem `test-results`.
7. **Não editar migrations já existentes.** Uma migration nova só com a aprovação da Laura e sem aplicá-la fora do banco local.
8. **Decisões de produto são da Laura.** Quando a pendência depender de uma escolha (texto, regra de negócio, o que fica fora), pergunte com opções e uma recomendação. Não decida sozinha.
9. Validação local não é publicação. Mock não comprova serviço externo (Resend, Sentry, Mercado Pago, proxy real). Escreva sempre o que foi e o que **não** foi verificado.

### 2. Estado atual

- Workspace Windows: `C:\PI - 2026\Pet`. Shell: PowerShell, com Git Bash disponível.
- Branch `codex/retomada-servicos`, HEAD `d593b03` (merge do PR #52, AVL-1). Índice vazio.
- Runtime validado no handoff anterior: Node 24.22.3 / npm 11.19.1 (`.nvmrc`). O Node global da máquina é 24.18.0; as últimas validações rodaram nele sem problema.
- 15 migrations, sete delas novas e locais (lista no handoff de 20/11, §5). Publicar exige preflight e conciliação autorizados (E-09/E-10: `backend/scripts/audit-email-identities.js` e `audit-registration-identities.js`, somente leitura).
- **Última validação (22/11):**
  - Backend: **553/553**, com PostgreSQL 16 local, zero ignorados. Lint: 0 erros, 2 avisos antigos.
  - Frontend: **193 testes / 39 arquivos**. Typecheck, lint (0 erros) e build aprovados. Avisos antigos de lint continuam (cerca de 129).
  - Chunk acima de 500 kB e aviso de terceiro no Zod já existiam.

**Entregas acumuladas** (todas locais, cada uma com registro detalhado):

| Bloco | Registro |
|---|---|
| SRV-Fpub, PAG-2, BKG-1/2, SCH-1/2, AVL-1/2, AVL-F1/F2, DSH-1/2 | [Plano — registros de entregas](Sprints/PLANO-RETOMADA-E-FECHAMENTO-2026-11-16.md) (seção "Execução iniciada em 16/11/2026" em diante) |
| E-08, E-09, E-10, E-12, E-07/E-14/E-15 + SEC-2, E-16/INF-2 | `docs/Sprints/Sprint-5-Fechamento/*-IMPLEMENTACAO-E-VALIDACAO.md` |
| **E-11** — moderação de parceiros e candidatura do Pet Sitter (22/11) | [E-11](Sprints/Sprint-5-Fechamento/E-11-IMPLEMENTACAO-E-VALIDACAO.md) |
| **E-20** — nenhum sucesso sem resposta 2xx: Contato via `mailto:`, "Limpar carrinho" (22/11) | [E-20](Sprints/Sprint-5-Fechamento/E-20-IMPLEMENTACAO-E-VALIDACAO.md) |
| **Auditoria visual e de usabilidade**, Fases 0–5 (20–22/11) | [`docs/auditoria-visual/2026-11-20/`](auditoria-visual/2026-11-20/) — `index.html` (relatório), `FASE0-DECISOES.md`, `FASE1…5-IMPLEMENTACAO-E-VALIDACAO.md` |

**Decisões da Laura já aplicadas** (não reabrir):
- **G03 (contraste):** botões e links com texto usam `primary-700` (#b35602, 4,94:1) e hover `primary-800`. O `primary-500` fica só em ícones e decoração.
- **G12 (perfil visível):** campos mínimos bloqueiam; os demais são "recomendados" e não bloqueiam.
- **G20 (textos promocionais inventados):** removidos.
- **DEC-D (E-11):**
  - O Pet Sitter só é aprovado pela avaliação.
  - Transições de parceiro: PENDENTE/EM_REVISAO → APROVADO|REJEITADO e REJEITADO → APROVADO; APROVADO não muda (suspender = desativar a conta).
  - Nova candidatura só depois de recusa; recusa exige motivo.
- **E-20 / Contato:** abre o e-mail do usuário com a mensagem pronta. Os canais de contato (endereço, telefone, redes) são fictícios e **ficam assim** (projeto acadêmico).

### 3. Ambiente local que funciona

- **Banco:** container Docker `petplus-dev-local` (PostgreSQL 16), em `127.0.0.1:55432`, usuário `petplus`.
  - `petplus_dev_test`: API local e fixtures de tela.
  - `petplus_ci_test`: suíte do backend.
  - Para descobrir a senha: `docker inspect petplus-dev-local` (não imprimir em relatório). Se o container não existir, crie outro equivalente, local e descartável, e aplique as migrations com `npx prisma migrate deploy` **e a `DATABASE_URL` local explícita**.
- **Use `127.0.0.1`, nunca `localhost`, na `DATABASE_URL`.** Com `localhost`, o Windows resolve IPv6 primeiro e os testes de concorrência falham com Prisma **P2028** (timeout de transação). Foram 12 falhas falsas até descobrir isso.
- **API local** (de `backend/`, sobrescrevendo o `.env`):
  ```powershell
  $env:DATABASE_URL = "postgresql://petplus:<senha>@127.0.0.1:55432/petplus_dev_test"; $env:FRONTEND_URL = "http://localhost:5173"; $env:PORT = "3000"; $env:TRUST_PROXY_HOPS = "1"; node src/server.js
  ```
  Use `node src/server.js`, **não** `npm start`. Antes de subir, confira se a URL contém `127.0.0.1:55432/petplus_dev_test` e aborte se não contiver.
- **Frontend:** `npx vite --port 5173 --strictPort` em `frontend/`. Podem existir processos Vite (5173) e API (3000) da sessão anterior ainda vivos; confira as portas antes de subir outros.
- **Testes do backend** (de `backend/`):
  ```powershell
  $env:DATABASE_URL = "postgresql://petplus:<senha>@127.0.0.1:55432/petplus_ci_test"; $env:NODE_ENV = "test"; $env:RUN_DB_INTEGRATION_TESTS = "true"; $env:FRONTEND_URL = "http://localhost:5173"; node --test --test-concurrency=2
  ```
  Os helpers recusam URL que não seja local e não contenha `test`. Não desligue essa trava.
- **Testes do frontend:** `npx vitest run --pool=forks --maxWorkers=2`. Com threads, a suíte já travou sem progresso.
- **Typecheck/lint/build:** `npx tsc --noEmit -p .`, `npx eslint <arquivos>`, `npx vite build`.
- **Docker Desktop** às vezes falha ao iniciar (exit 150). Tente de novo antes de concluir que o ambiente está quebrado.
- **Scripts de QA preservados** em [`docs/qa-scripts/2026-11-22/`](qa-scripts/2026-11-22/README.md): fixture de contas por papel (**faz TRUNCATE do banco de teste**), capturas e verificações reais E-11/E-20. Leia o README antes de usar.

### 4. Erros já cometidos e corrigidos: não repetir

| Armadilha | Como evitar |
|---|---|
| Painel local mostrando erro porque o front usava a API publicada | Manter `VITE_API_URL` local (§1.5). Ao ver dados ou erros estranhos, olhar primeiro a aba Network |
| P2028 e transações expirando nos testes de banco | `127.0.0.1` na `DATABASE_URL` |
| `X-Forwarded-For` via `extraHTTPHeaders` do Playwright quebrava o CORS (preflight no Vite) | Injetar só nas requisições da API: `ctx.route('http://localhost:3000/**', r => r.fallback({ headers: {...r.request().headers(), 'x-forwarded-for': ip} }))`. Variar o IP entre cenários por causa do rate limit. A API precisa de `TRUST_PROXY_HOPS=1` |
| Toast de sucesso disparado antes da resposta da API ("Limpar carrinho", Contato falso) | Sucesso só depois do `await` com 2xx. Funções de contexto devolvem `boolean`/resultado para a tela decidir. Nunca simular envio, salvamento ou logout |
| Teste de componente falhando com `AnimatePresence` (framer-motion `mode="wait"`) | Depois de trocar de tela, usar `await screen.findByText(...)`, não `getByText` |
| Radix Select e animações `whileInView` no jsdom | Stub de `IntersectionObserver`, `hasPointerCapture`, `releasePointerCapture` e `scrollIntoView`. Abrir o Select com `fireEvent.keyDown(trigger, {key: "Enter"})` e clicar na `option` (ver `frontend/src/pages/ContactPage.test.tsx`) |
| `window.location.href = "mailto:..."` em teste | Redefinir `window.location` com getter/setter no `beforeEach` e restaurar no `afterEach`. No navegador real, capturar via CDP `Page.frameRequestedNavigation` |
| Fixture de teste com tipo errado (`WalkerDetailsPage.test`) | Montar o objeto com o tipo real do service (incluir `id`, `created_at`, `user`) em vez de campos inventados |
| Mudar a assinatura de uma função de contexto e quebrar o typecheck | Atualizar a interface do contexto junto e rodar `tsc` antes da suíte |
| Scripts com aspas e CRLF quebrando no PowerShell/Bash | Editar arquivos com a ferramenta de edição, não com `sed`/heredoc complexos. Para scripts Node, escrever em arquivo e executar, não usar `node -e` com aspas aninhadas |
| `git diff` com autocrlf desligado mostrando o arquivo inteiro alterado | Não desligar a normalização; os avisos "LF will be replaced by CRLF" são esperados. Não reformatar o repositório |
| Declarar uma task concluída pelo título do commit ou por check verde | Reproduzir o comportamento no código e na tela; conferir critério por critério da spec |
| Recriar algo que já existe | Antes de implementar, procurar no working tree e nos registros `*-IMPLEMENTACAO-E-VALIDACAO.md` |

### 5. Padrão de cada entrega (como as últimas foram feitas)

1. Reproduzir o achado (código, API local, navegador) e mostrar à Laura o que está errado e o que você propõe, com as opções se houver decisão.
2. Implementar o mínimo coerente: backend com use case, transação e lock quando houver concorrência, erros com `AppError` e código (`422 INVALID_...`, `409 ..._ALREADY_...`) e validação Zod; frontend mostrando a mensagem real da API (`apiErrorMessage`).
3. Testes:
   - unitários e de rota;
   - **de banco real** para regras de estado e concorrência (ver `backend/tests/integration/moderationDb.test.js`);
   - de componente no frontend.
4. Rodar a suíte inteira dos dois lados, mais typecheck, lint e build.
5. Verificação real no navegador (Playwright em Chromium) contra a API e o banco locais, com prints mascarados e `resultado.json` em `docs/Sprints/Sprint-5-Fechamento/evidencias-<task>/`.
6. Registrar:
   - `docs/Sprints/Sprint-5-Fechamento/<TASK>-IMPLEMENTACAO-E-VALIDACAO.md`, com regras, arquivos, validação com números reais e **limites**;
   - uma linha "> Acompanhamento de <data>" no topo de `docs/Sprints/AUDITORIA-QUALIDADE-ESTABILIZACAO-PRE-SPRINT-4.md`;
   - uma entrada "### Décima sexta entrega local - …" no fim de `docs/Sprints/PLANO-RETOMADA-E-FECHAMENTO-2026-11-16.md`.
7. Encerrar o que abriu (processos e containers temporários) e informar o que ficou rodando.

### 6. Pendências, em ordem sugerida

Cada uma precisa ser **reproduzida antes**. Parte delas foi tratada de passagem em outras entregas e nas Fases da auditoria visual. Definições completas na tabela da auditoria pré-Sprint 4 (linhas E-13 a E-36).

**Funcionais (prioridade):**
E-19, E-18, E-13 e E-33 foram concluídas localmente; consultar seus registros, sem refazer os achados antigos.

1. **E-17:** reproduzir os dados fabricados ainda presentes; parte foi removida pelas entregas anteriores e pelas fases visuais. Não reintroduzir mocks nem presumir ausentes as avaliações/indicadores reais.
2. Conferir o que resta de **E-23** (Finance/Orders no design system), **E-31** (estados de erro honestos), **E-34** (acessibilidade: a última verificação registrou uma violação séria de contraste em dois elementos da landing) e **E-35** (CSP efetiva).

**Higiene (depois das funcionais, ou se a Laura preferir):**
- **E-22:** `console.log` com dados de usuário, breadcrumbs de console no Sentry, gates sem fail-open, `validate.js` sem atribuir `req.query`, Swagger/`NODE_ENV`.
- **E-32:** services só via `httpClient` (fim do `fetch` direto, com regra de lint) e sessão só via `useAuth()`.
- **E-36:** remover `src/imports`, `src/app/components/ui`, páginas sem rota, dependências não importadas e `components/ServiceCard.tsx` (não usado; tem um botão "Agendar" solto); `jspdf` sob demanda; `style-guide` fora de produção.
- **E-21 (banco):** índices de FK, `CHECK` de status, índice parcial em migration controlada, unicidade de SKU. **Exige migration nova**: pedir aprovação antes.

**Aguardando a Laura:**
- **G07 / CFG-1, configurações com backend real:** o plano está em [G07-PLANO-BACKEND-CONFIGURACOES.md](auditoria-visual/2026-11-20/G07-PLANO-BACKEND-CONFIGURACOES.md) e faltam as decisões **D1** (aprovação automática? para quais papéis), **D2** (só para cadastros novos?) e **D3** (e-mail de contato configurável?). A tela atual é informativa e sem ações simuladas.
- Legado: Pet Sitter que ficou APROVADO sem avaliação aprovada (atalho antigo). Não é operacional, mas o status gravado não foi saneado. Levantar no banco local e decidir com a Laura; **nada em produção**.

**QA e release (fim da sprint):**
- **QA-3** ([spec](Sprints/Sprint-5-Fechamento/QA-3-e2e-parte-2-a11y-responsividade-checklist.md)): E2E de recusa → correção → reenvio, acessibilidade (axe em `/login`, `/register`, `/checkout`, `/dashboard`) e responsividade.
- **[RELEASE-CHECKLIST.md](Sprints/Sprint-5-Fechamento/RELEASE-CHECKLIST.md): 33 itens, nenhum marcado.** Marcar só com evidência.
- Regressão integrada global (compra, agendamento, avaliação, painéis) com API e banco reais sobre o mesmo candidato a commit.
- Validações externas, no ambiente que a Laura autorizar: Resend (inclusive o e-mail de recusa), Sentry, Mercado Pago Sandbox, proxy real, Railway (Root `/backend`, `railway.json`) e Vercel (npm ci / Node 24).
- Preflight e conciliação das migrations antes de publicar. Upgrade do plugin Sentry (4 vulnerabilidades moderadas restantes no frontend; não afirmar zero).
- Processo (E-24 a E-30): proteção da `main`, template de PR, testes por risco, contrato front/back, catraca de lint/cobertura, documentação funcional e verificações externas.
- **Preparar os commits** só quando a Laura autorizar. Seguir a orientação do handoff de 20/11, §8: separar por bloco, sem `git add .`, sem separar migration do código que depende dela, sem incluir `docs/qa-scripts/**/ux-accounts.json`.

**Fora do escopo sem nova decisão:** compra anônima, cobrança real, split/repasse, gateway real de agendamento, IA, chat/realtime, cupons/frete, capacidade hoteleira, redesign amplo, refresh token/revogação geral de JWT, rate limit compartilhado entre instâncias, exclusão integral de dados pessoais. Não prometer esses itens na documentação.

**Pontos menores anotados:** o FAQ da página de Contato ainda cita "Reportar Problema" e "5 dias úteis", sem revisão. A exibição das fotos da candidatura do sitter (RF-010) não foi reverificada na E-11.

### 7. Primeira resposta esperada de você

1. Confirme que leu e resuma em até 5 linhas o estado e as regras.
2. Rode só comandos de leitura: `git status --short | Measure-Object`, `git stash list`, `git log -1 --oneline`, a porta 55432 do container e o conteúdo de `frontend/.env.local` (só a linha da API).
3. Proponha a próxima pendência (sugestão: **E-17**) com o que pretende reproduzir, respeitando a autorização já dada pela Laura na sessão.

Em uma frase: as jornadas principais, a segurança, a infraestrutura, a moderação e a revisão visual estão implementadas e testadas localmente, e falta fechar as pendências funcionais restantes e o QA de release, sem perder o grande conjunto ainda não commitado e sem tocar em produção.
