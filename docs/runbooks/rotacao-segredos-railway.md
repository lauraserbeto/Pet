# Runbook: rotação de segredos no Railway

Use este procedimento quando houver troca de responsável, suspeita de exposição
de credenciais ou criação do baseline de migrations em um ambiente já existente.
Nunca cole valores reais em issues, PRs, docs ou mensagens.

## Escopo

- `DATABASE_URL`: credencial de conexão do PostgreSQL no Railway.
- `JWT_SECRET`: segredo de assinatura dos tokens JWT.

## Antes de rotacionar

1. Avise o time sobre a janela de manutenção.
2. Gere um backup/snapshot do banco antes de trocar credenciais.
3. Confirme que o deploy atual usa o schema versionado em
   `backend/prisma/migrations`.

## Banco já provisionado antes do baseline

Se o banco já foi criado por `prisma db push` ou SQL manual, registre a migration
inicial como aplicada antes do primeiro deploy com Prisma Migrate:

```bash
cd backend
npx prisma migrate resolve --applied 20260901000000_init_baseline
npx prisma migrate status
```

Depois disso, os próximos releases devem usar:

```bash
npx prisma migrate deploy
```

## Rotação da senha do banco

1. No Railway, gere ou altere a senha do serviço PostgreSQL.
2. Atualize a variável `DATABASE_URL` do serviço backend com a nova connection
   string.
3. Redeploy o backend.
4. Rode `npx prisma migrate status` apontando para o banco de produção e confirme
   que não há migrations pendentes inesperadas.
5. Faça um health check em `/api/health`.

## Rotação do JWT_SECRET

1. Gere um segredo novo e longo:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Atualize `JWT_SECRET` no Railway.
3. Redeploy o backend.
4. Comunique o time: todos os tokens JWT emitidos antes da rotação deixam de ser
   válidos, então usuários precisarão fazer login novamente.

## Depois de rotacionar

1. Confirme que `backend/.env` não foi alterado com valores de produção.
2. Confirme que `git diff` não contém segredos.
3. Registre no board apenas que a rotação foi concluída, sem valores.
