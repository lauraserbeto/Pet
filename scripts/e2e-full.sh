#!/usr/bin/env bash
#
# Roda a suíte E2E completa contra backend + Postgres de verdade (QA-2).
#
# Antes disto, os specs `*-real.spec.ts` passavam porque PULAVAM: exigem fixture
# e API local, e o CI não fornecia nenhuma das duas. Este script monta a pilha e
# é o MESMO caminho usado no CI e na máquina do desenvolvedor — se divergirem,
# o CI volta a ser teatro.
#
# DESENHO: cada cenário isolado tem banco e porta próprios. Três specs já
# chegavam com a porta fixa no código (E-13→3313, E-18→3318, E-19→3319,
# E-33→3333) e várias fixtures recusam rodar fora do banco com nome exato. Os
# cenários que medem agregados (métricas, integridade de pedido) também ficam
# separados: massa de um contamina a contagem do outro.
#
# Uso local (precisa de um Postgres; o mais simples é via Docker):
#   docker run -d --name petplus-e2e-pg -e POSTGRES_USER=user \
#     -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=petplus_test -p 5432:5432 postgres:16
#   ./scripts/e2e-full.sh
#
# Variáveis aceitas: PGHOST, PGPORT, PGUSER, PGPASSWORD.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-user}"
PGPASSWORD="${PGPASSWORD:-pass}"

TRABALHO="$(mktemp -d)"
PIDS=()
limpar() {
  for pid in "${PIDS[@]:-}"; do [ -n "$pid" ] && kill "$pid" 2>/dev/null || true; done
  rm -rf "$TRABALHO"
}
trap limpar EXIT

banco() { echo "postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/$1?schema=public"; }

export NODE_ENV=test
export RUN_DB_INTEGRATION_TESTS=true
export JWT_SECRET="${JWT_SECRET:-e2e-local-secret-com-mais-de-32-caracteres-000}"
export FRONTEND_URL="http://localhost:4173"
# Vários cenários autenticam uma dezena de perfis em sequência; o limite de
# produção (20 por 15 min) os derrubaria. Só vale em NODE_ENV=test.
export QA_AUTH_RATE_LIMIT=500

# Cada cenário roda isolado: banco e API próprios. Quatro specs já chegavam com
# a porta fixa no código (E-13→3313, E-18→3318, E-19→3319, E-33→3333); os demais
# recebem a porta por variável. Compartilhar banco entre cenários quebra os que
# medem agregados e deixa a suíte instável entre execuções.
#
#            nome : banco : porta
CENARIOS=(
  "booking:petplus_bkg_test:3301"
  "schedule:petplus_sch_test:3302"
  "reviews:petplus_avl_test:3303"
  "security:petplus_sec_test:3304"
  "credentials:petplus_auth_test:3305"
  "resource-deletion:petplus_del_test:3306"
  "registration:petplus_reg_test:3307"
  "order-integrity:petplus_ord_test:3308"
  "purchase:petplus_pur_test:3320"
  "metrics:petplus_dsh_test:3330"
  "provider-correction:petplus_e13_test:3313"
  "checkout-recovery:petplus_e18_test:3318"
  "order-pagination:petplus_e19_test:3319"
  "route-access:petplus_e33_test:3333"
)

cd "$RAIZ/backend"
export DATABASE_URL="$(banco petplus_test)"

echo "==> Preparando bancos"
npx prisma generate >/dev/null

# Molde: migrado e NUNCA semeado. Clonar um banco que já recebeu fixture levaria
# a massa junto e as chaves únicas colidiriam no cenário seguinte.
MOLDE=petplus_template_test
node scripts/qa-create-databases.js "$MOLDE" --recriar >/dev/null
DATABASE_URL="$(banco "$MOLDE")" npx prisma migrate deploy >/dev/null

for linha in "${CENARIOS[@]}"; do
  IFS=: read -r _ db _ <<< "$linha"
  node scripts/qa-create-databases.js "$db" --recriar --template "$MOLDE" >/dev/null
done

echo "==> Gerando fixtures"
for linha in "${CENARIOS[@]}"; do
  IFS=: read -r nome db _ <<< "$linha"
  if [ "$nome" = "registration" ]; then
    # Sem fixture: o spec cria as contas pela própria API. Mas o banco vem do
    # molde limpo e precisa dos papéis, que as outras fixtures semeiam junto.
    DATABASE_URL="$(banco "$db")" node -e "
      require('./tests/helpers/testSeed').seedRoles()
        .then(() => require('./src/config/database').\$disconnect());
    "
    continue
  fi
  if [ "$nome" = "order-pagination" ]; then
    # Esta fixture exporta a massa que o teste de integração cria.
    DATABASE_URL="$(banco "$db")" node --test tests/integration/orderPaginationDb.test.js >/dev/null
  fi
  DATABASE_URL="$(banco "$db")" node "scripts/qa-$nome-fixture.js" "$TRABALHO/$nome.json"
done

echo "==> Subindo as APIs"
# credentials sobe por qa-auth-server: é o servidor normal com o envio de e-mail
# trocado por um arquivo de outbox, de que o cenário de senha depende.
export QA_AUTH_OUTBOX_FILE="$TRABALHO/outbox.json"
for linha in "${CENARIOS[@]}"; do
  IFS=: read -r nome db porta <<< "$linha"
  if [ "$nome" = "credentials" ]; then
    DATABASE_URL="$(banco "$db")" PORT="$porta" node scripts/qa-auth-server.js > "$TRABALHO/api-$nome.log" 2>&1 &
  else
    DATABASE_URL="$(banco "$db")" PORT="$porta" node src/server.js > "$TRABALHO/api-$nome.log" 2>&1 &
  fi
  PIDS+=("$!")
done

for linha in "${CENARIOS[@]}"; do
  IFS=: read -r nome _ porta <<< "$linha"
  for _ in $(seq 1 40); do
    curl -sf -o /dev/null "http://127.0.0.1:${porta}/api/health" && break
    sleep 1
  done
  curl -sf -o /dev/null "http://127.0.0.1:${porta}/api/health" || {
    echo "API '$nome' (porta $porta) não respondeu:"; cat "$TRABALHO/api-$nome.log"; exit 1;
  }
done

echo "==> Rodando E2E"
cd "$RAIZ/frontend"
API="http://localhost:3000/api/v1"

# O build precisa apontar para a API local, não para a publicada.
VITE_API_URL="$API" npx vite build >/dev/null

BKG_E2E_FIXTURE="$TRABALHO/booking.json"                      BKG_E2E_API="http://localhost:3301/api/v1" \
SCH_E2E_FIXTURE="$TRABALHO/schedule.json"                     SCH_E2E_API="http://localhost:3302/api/v1" \
AVL_E2E_FIXTURE="$TRABALHO/reviews.json"                      AVL_E2E_API="http://localhost:3303/api/v1" \
SEC_E2E_FIXTURE="$TRABALHO/security.json"                     SEC_E2E_API="http://localhost:3304/api/v1" \
AUTH_E2E_FIXTURE="$TRABALHO/credentials.json"                 AUTH_E2E_API="http://localhost:3305/api/v1" \
DEL_E2E_FIXTURE="$TRABALHO/resource-deletion.json"            DEL_E2E_API="http://localhost:3306/api/v1" \
ORD_E2E_FIXTURE="$TRABALHO/order-integrity.json"              ORD_E2E_API="http://localhost:3308/api/v1" \
PUR_E2E_FIXTURE="$TRABALHO/purchase.json"                     PUR_E2E_API="http://localhost:3320/api/v1" \
DSH_E2E_FIXTURE="$TRABALHO/metrics.json"                      DSH_E2E_API="http://localhost:3330/api/v1" \
REG_E2E_API="http://localhost:3307/api/v1" \
E13_FIXTURE="$TRABALHO/provider-correction.json" \
E18_FIXTURE="$TRABALHO/checkout-recovery.json" \
E19_FIXTURE="$TRABALHO/order-pagination.json" \
E33_FIXTURE="$TRABALHO/route-access.json" \
QA_AUTH_OUTBOX_FILE="$TRABALHO/outbox.json" \
  npx playwright test "$@"
