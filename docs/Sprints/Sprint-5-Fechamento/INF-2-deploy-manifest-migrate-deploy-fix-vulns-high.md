# INF-2 — Deploy manifest + migrate deploy no boot + fix vulnerabilidades high

> Sprint 5 · Semana 10 (27/out–01/nov) · Infra · Prioridade Alta · Esforço M · Responsável R1

## Contexto
O backend não tem um manifesto de deploy reproduzível: não há `Dockerfile`, `railway.json`,
`Procfile` nem `nixpacks.toml` no repositório (confirmado — nenhum desses arquivos existe). O
script de release só sobe o servidor (`"start": "node src/server.js"`), sem `prisma generate`
nem `prisma migrate deploy`, então o banco de produção pode ficar defasado em relação ao schema.
O `backend/package.json` também **não fixa `engines.node`**, deixando a versão do runtime ao acaso
do provedor. Por fim, o gate de auditoria do CI é apenas informativo: em `.github/workflows/ci.yml`
os dois jobs rodam `npm audit --audit-level=high` com `continue-on-error: true`, ou seja, vulns
high não quebram o build. Vulnerabilidades high conhecidas: `react-router` (CSRF), `undici`,
`ip-address`, `js-yaml`.

## Objetivo
Ter um deploy reproduzível a partir do repositório, com migrações aplicadas automaticamente no
release, versão de Node fixada, e o CI **bloqueando** merges com vulnerabilidades high.

## Escopo / Passos
1. **Manifesto de deploy:** adicionar um manifesto reproduzível para o backend (`Dockerfile` ou
   `railway.json`/`nixpacks.toml`, conforme o provedor de deploy). O build deve rodar `npm ci` +
   `npx prisma generate`.
2. **Migrate deploy no release:** garantir que `npx prisma migrate deploy` rode na fase de release
   (release command do provedor, ou um script `start` que faça `prisma migrate deploy && node src/server.js`).
   Nunca usar `migrate dev` em produção.
3. **Fixar runtime:** adicionar `"engines": { "node": "20.x" }` ao `backend/package.json` (alinhado ao
   `node-version: 20` do CI).
4. **Fix de vulnerabilidades high:** rodar `npm audit fix` e/ou subir as versões afetadas (`react-router`
   pela correção do CSRF, `undici`, `ip-address`, `js-yaml`) no backend e no frontend; revalidar com
   `npm audit --audit-level=high`.
5. **Gate bloqueante no CI:** remover `continue-on-error: true` do passo de auditoria nos jobs `backend`
   e `frontend` (`.github/workflows/ci.yml`), mantendo `--audit-level=high`.

## Arquivos envolvidos
- `backend/Dockerfile` **ou** `backend/railway.json`/`nixpacks.toml` (novo — manifesto de deploy)
- `backend/package.json` (`engines.node`; opcionalmente `start`/`release` com `migrate deploy`)
- `frontend/package.json` / `backend/package.json` (upgrades das deps vulneráveis)
- `.github/workflows/ci.yml` (remover `continue-on-error` dos passos de `npm audit`)

## Dependências (Depende de / Bloqueia)
- **Depende de:** INF-0 (baseline de migrações, env e segredos).
- **Bloqueia:** entrega final (M5) — deploy do release depende deste manifesto.

## Critério de aceite (Definition of Done)
- Deploy reproduzível a partir do repositório (o provedor constrói e sobe usando o manifesto versionado).
- `prisma migrate deploy` roda no release; o banco de produção fica em sincronia com o schema após o deploy.
- `engines.node` fixado; runtime alinhado ao CI (Node 20).
- `npm audit --audit-level=high` retorna **zero** vulnerabilidades high no backend e no frontend.
- Passo de auditoria do CI é **bloqueante** (sem `continue-on-error`) para high nos dois jobs.

## Testes
- Build local do manifesto (ex.: `docker build`) conclui sem erro.
- Executar `npx prisma migrate deploy` contra um banco limpo aplica todas as migrações.
- `npm audit --audit-level=high` em `backend/` e `frontend/` → sem findings high.
- Abrir um PR com uma dependência high forçada → job de CI **falha** no passo de auditoria (validação do gate).

## Notas técnicas / armadilhas
- `migrate deploy` (produção) ≠ `migrate dev` (desenvolvimento) — nunca rodar `dev`/`reset` em produção.
- `prisma generate` precisa acontecer no build (a pasta gerada não é versionada); sem ele o servidor não sobe.
- Ao subir `react-router` no frontend, revalidar as rotas com lazy loading (code splitting por rota já existe) e o build.
- Fixar `engines.node` pode fazer o provedor recusar versões divergentes — alinhar com o `node-version` do CI (20).
- Alguns highs podem só ter fix em major da dependência transitiva; usar `overrides` no `package.json` quando o fix direto não existir, e registrar o motivo.
