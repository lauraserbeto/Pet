#!/usr/bin/env bash
#
# Roda a suíte E2E completa contra backend + Postgres de verdade (QA-2).
#
# Antes disto, os 13 specs `*-real.spec.ts` passavam porque PULAVAM: eles exigem
# fixture e API local, e o CI não fornecia nenhuma das duas. Este script monta a
# pilha inteira e é o MESMO caminho usado no CI e na máquina do desenvolvedor —
# se divergirem, o CI vira teatro de novo.
#
# Uso local (precisa de um Postgres; o mais simples é via Docker):
#   docker run -d --name petplus-e2e-pg -e POSTGRES_USER=user \
#     -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=petplus_test -p 5432:5432 postgres:16
#   ./scripts/e2e-full.sh
#
# Variáveis aceitas: PGHOST, PGPORT, PGUSER, PGPASSWORD, API_PORT.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-user}"
PGPASSWORD="${PGPASSWORD:-pass}"
API_PORT="${API_PORT:-3000}"

TRABALHO="$(mktemp -d)"
trap 'rm -rf "$TRABALHO"; [ -n "${API_PID:-}" ] && kill "$API_PID" 2>/dev/null || true' EXIT

banco() { echo "postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/$1?schema=public"; }

# Segredos descartáveis: este script só fala com banco local de teste.
export NODE_ENV=test
export RUN_DB_INTEGRATION_TESTS=true
export JWT_SECRET="${JWT_SECRET:-e2e-local-secret-com-mais-de-32-caracteres-000}"
export FRONTEND_URL="http://localhost:4173"
export PORT="$API_PORT"
export DATABASE_URL="$(banco petplus_test)"

cd "$RAIZ/backend"

echo "==> Preparando bancos"
npx prisma generate >/dev/null
npx prisma migrate deploy >/dev/null
node scripts/qa-create-databases.js

# E-13, E-19 e E-33 exigem bancos próprios, com o nome exato que os scripts validam.
for extra in petplus_e13_test petplus_e19_test petplus_e33_test; do
  DATABASE_URL="$(banco "$extra")" npx prisma migrate deploy >/dev/null
done

echo "==> Gerando fixtures"
for nome in booking schedule reviews metrics security credentials \
            order-integrity resource-deletion checkout-recovery; do
  node "scripts/qa-${nome}-fixture.js" "$TRABALHO/${nome}.json"
done

# Estes dois leem e escrevem nos bancos dedicados.
DATABASE_URL="$(banco petplus_e13_test)" node scripts/qa-provider-correction-fixture.js "$TRABALHO/provider-correction.json"
DATABASE_URL="$(banco petplus_e33_test)" node scripts/qa-route-access-fixture.js "$TRABALHO/route-access.json"

# A fixture E-19 exporta a massa que o teste de integração cria — rodar antes é obrigatório.
DATABASE_URL="$(banco petplus_e19_test)" node --test tests/integration/orderPaginationDb.test.js >/dev/null
DATABASE_URL="$(banco petplus_e19_test)" node scripts/qa-order-pagination-fixture.js "$TRABALHO/order-pagination.json"

echo "==> Subindo a API"
# qa-auth-server é o servidor normal com o envio de e-mail trocado por um arquivo
# de outbox — o cenário de recuperação de senha depende de ler o link enviado.
export QA_AUTH_OUTBOX_FILE="$TRABALHO/outbox.json"
node scripts/qa-auth-server.js > "$TRABALHO/api.log" 2>&1 &
API_PID=$!

for _ in $(seq 1 30); do
  curl -sf -o /dev/null "http://127.0.0.1:${API_PORT}/api/health" && break
  sleep 1
done
curl -sf -o /dev/null "http://127.0.0.1:${API_PORT}/api/health" || {
  echo "API não respondeu:"; cat "$TRABALHO/api.log"; exit 1;
}

echo "==> Rodando E2E"
cd "$RAIZ/frontend"
API="http://localhost:${API_PORT}/api/v1"

# O build precisa apontar para a API local, não para a publicada.
VITE_API_URL="$API" npx vite build >/dev/null

BKG_E2E_FIXTURE="$TRABALHO/booking.json"            BKG_E2E_API="$API" \
SCH_E2E_FIXTURE="$TRABALHO/schedule.json"           SCH_E2E_API="$API" \
AVL_E2E_FIXTURE="$TRABALHO/reviews.json"            AVL_E2E_API="$API" \
ORD_E2E_FIXTURE="$TRABALHO/order-integrity.json"    ORD_E2E_API="$API" \
DSH_E2E_FIXTURE="$TRABALHO/metrics.json"            DSH_E2E_API="$API" \
DEL_E2E_FIXTURE="$TRABALHO/resource-deletion.json"  DEL_E2E_API="$API" \
SEC_E2E_FIXTURE="$TRABALHO/security.json"           SEC_E2E_API="$API" \
AUTH_E2E_FIXTURE="$TRABALHO/credentials.json"       AUTH_E2E_API="$API" \
E18_FIXTURE="$TRABALHO/checkout-recovery.json" \
E19_FIXTURE="$TRABALHO/order-pagination.json" \
E13_FIXTURE="$TRABALHO/provider-correction.json" \
E33_FIXTURE="$TRABALHO/route-access.json" \
REG_E2E_API="$API" \
QA_AUTH_OUTBOX_FILE="$TRABALHO/outbox.json" \
  npx playwright test "$@"
