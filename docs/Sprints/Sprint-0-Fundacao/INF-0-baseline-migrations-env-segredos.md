# INF-0 — Baseline de migrations Prisma + validação de env + `.env.example` + rotacionar segredos

> Sprint 0 · Semana 1 (25–31/ago) · Infra · Prioridade Crítico · Esforço M · Responsável R2

## Contexto
O banco não tem histórico de migrations gerenciado pelo Prisma. O que existe hoje são
scripts SQL avulsos em `backend/prisma/migrations/manual/` (`2026_05_11_add_address_default.sql`,
`2026_05_12_add_cart.sql`, `2026_05_12_add_favorites.sql`, `2026_05_12_normalize_pet_species.sql`)
e o deploy é feito com `prisma db push`, que aplica o schema sem registrar versões — o que
já produziu **drift** entre `schema.prisma` e o banco real. Não há como recriar o banco do zero
de forma reprodutível nem reverter mudanças.

Além disso, a validação de ambiente é parcial: `backend/src/config/env.js` só valida
`JWT_SECRET` (fail-fast) e exporta `PORT`/`NODE_ENV`, mas **não valida `DATABASE_URL` nem
`FRONTEND_URL`** — o app pode subir sem banco configurado ou com CORS apontando para lugar
nenhum e só quebrar em runtime. O README cita um `.env.example` que **não existe** no repo,
dificultando o onboarding.

Por fim, as credenciais reais estão em `backend/.env` (gitignorado). Como houve uso de
segredos e conexões em ambiente compartilhado, a senha do banco e o `JWT_SECRET` devem ser
rotacionados no Railway.

## Objetivo
Tornar o provisionamento do banco reprodutível (migrations Prisma versionadas), endurecer a
validação de env no boot e documentar/rotacionar segredos, sem jamais commitar valores reais.

## Escopo / Passos
1. **Baseline de migrations:** gerar a migration inicial a partir do `schema.prisma` atual
   (`prisma migrate dev --name init` em ambiente limpo, ou `migrate diff` + `migrate resolve`
   para marcar o estado atual como baseline sem reaplicar). Incorporar as mudanças dos SQLs
   manuais que ainda não estão no schema, garantindo que o baseline reflita o banco de produção.
2. **Substituir `db push` por `migrate deploy`** no fluxo de deploy (Railway) e no processo local.
3. **Arquivar os SQLs manuais** (mover/marcar como legados) após confirmar que o baseline os cobre.
4. **Validação de env:** em `backend/src/config/env.js`, adicionar validação fail-fast de
   `DATABASE_URL` (presente e não vazio) e de `FRONTEND_URL` (presente; alertar se não for URL
   válida), no mesmo estilo do bloco já existente de `JWT_SECRET`, e exportá-las.
5. **`.env.example`:** criar `backend/.env.example` com todas as chaves esperadas e valores de
   placeholder (sem segredos reais): `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`, `NODE_ENV`.
6. **Rotação de segredos:** documentar (nesta task / runbook) o procedimento de rotação da
   senha do banco e do `JWT_SECRET` no Railway. NÃO copiar valores de `backend/.env` para lugar
   nenhum; NÃO commitar segredos.

## Arquivos envolvidos
- `backend/prisma/schema.prisma` — fonte do baseline de migrations.
- `backend/prisma/migrations/` — nova pasta gerenciada pelo Prisma (migration inicial versionada).
- `backend/prisma/migrations/manual/*.sql` — SQLs avulsos a arquivar após o baseline cobri-los.
- `backend/src/config/env.js` — adicionar validação de `DATABASE_URL` e `FRONTEND_URL`; exportá-las.
- `backend/.env.example` — **criar** com placeholders (versionado).
- `backend/.env` — gitignorado; **não** commitar, **não** copiar valores.
- Documentação de deploy/README — atualizar para `prisma migrate deploy` e citar o `.env.example`.
- `docs/runbooks/rotacao-segredos-railway.md` — procedimento de rotação de `DATABASE_URL`/`JWT_SECRET`.

## Dependências
- Depende de: nenhuma.
- Bloqueia: nenhuma diretamente (mas é pré-requisito de qualquer feature futura que dependa de schema versionado — ex.: enum de `Provider.status`, `payment_policy`, aceite de termos).

## Critério de aceite (Definition of Done)
- [ ] `prisma migrate deploy` aplica o schema em um banco vazio do zero, sem erros.
- [ ] O deploy deixa de usar `db push`; passa a usar `migrate deploy`.
- [ ] Boot falha (fail-fast) com mensagem clara se `DATABASE_URL` estiver ausente; alerta/erro se `FRONTEND_URL` estiver ausente.
- [ ] `backend/.env.example` versionado, com todas as chaves e sem nenhum segredo real.
- [ ] Procedimento de rotação da senha do banco e do `JWT_SECRET` no Railway documentado.
- [ ] `git status` não mostra `backend/.env` como rastreado; nenhum segredo em diff.

## Testes
- Aplicar `prisma migrate deploy` contra um banco descartável (container Postgres limpo) e conferir que todas as tabelas/colunas do schema existem.
- Subir o backend sem `DATABASE_URL` e confirmar que o processo não sobe (mensagem `[CONFIG]`).
- Subir com todas as env definidas e confirmar boot normal.
- `prisma migrate status` reporta o histórico sem drift.

## Notas técnicas / armadilhas
- Se o banco de produção já tem o schema aplicado via `db push`, **não** rodar `migrate dev` contra ele (recria tabelas). Usar `prisma migrate resolve --applied <migration>` para registrar o baseline como já aplicado.
- Manter o mesmo estilo fail-fast do bloco de `JWT_SECRET` já presente em `env.js` (throw com prefixo `[CONFIG]`), para consistência.
- Segredos: nunca em URL/query string, nunca em log, nunca no `.env.example`. O `.env` real permanece gitignorado.
- `FRONTEND_URL` é usada por CORS; em dev local o front usa `VITE_API_URL=http://localhost:3000/api/v1` (o `.env.local` do front aponta para o Railway por padrão).
- Após rotacionar o `JWT_SECRET`, todos os tokens JWT emitidos anteriormente são invalidados (usuários precisarão logar de novo) — comunicar ao time.

## Runbook

Procedimento operacional documentado em
[`docs/runbooks/rotacao-segredos-railway.md`](../../runbooks/rotacao-segredos-railway.md).
