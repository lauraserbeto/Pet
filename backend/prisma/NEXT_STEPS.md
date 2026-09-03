# Próximas etapas Prisma

## Banco novo ou descartável

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

Depois, rode:

```bash
npm test
```

## Banco já existente criado com `db push`

Não rode `migrate dev` nem recrie tabelas.

```bash
cd backend
npx prisma migrate resolve --applied 20260901000000_init_baseline
npx prisma migrate status
```

Nos próximos deploys, use sempre:

```bash
npx prisma migrate deploy
```

## Produção Railway

1. Fazer backup/snapshot do banco.
2. Conferir `DATABASE_URL`, `JWT_SECRET` e `FRONTEND_URL`.
3. Registrar o baseline com `migrate resolve` se o banco já existir.
4. Rodar `migrate deploy` nos próximos releases.
5. Nunca commitar `.env` real.
