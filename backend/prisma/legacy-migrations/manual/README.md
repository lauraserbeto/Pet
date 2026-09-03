# Manual SQL Migrations Legacy

These SQL files were used before Prisma migrations were versioned.

The changes they contain are now covered by
`backend/prisma/migrations/20260901000000_init_baseline/migration.sql`.
Do not apply these files in the normal deploy flow. Keep them only as historical
context for databases that were already managed manually before the baseline.
