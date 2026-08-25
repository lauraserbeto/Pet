# QA-1 — Infra de testes de integração (carrinho/pedido)

> Sprint 1 · Semana 3 (08–14/set) · QA · Prioridade Alta · Esforço M · Responsável R4

## Contexto
A suíte de integração atual só cobre **caminhos de rejeição** que não tocam o banco. `backend/tests/integration/authRoutes.test.js` exercita a cadeia real do Express (helmet → rate limit → validate → controller → errorHandler) apenas em respostas 400/404/422 — determinísticas sem DB. Os runners são `node:test` + `supertest` (`package.json` → `"test": "node --test"`), e o CI (`.github/workflows/ci.yml`, job `backend`) roda `npm test` com `JWT_SECRET`/`DATABASE_URL` fake apenas para o boot (não conectam a nada real).

Com PED-1 entregando a criação transacional de pedidos, é hora de ter testes de integração **com banco de teste** cobrindo o happy-path de carrinho e criação de pedido.

## Objetivo
Montar a infraestrutura de testes de integração com um banco PostgreSQL de teste e cobrir o happy-path de carrinho (adicionar item) e de criação de pedido (`POST /orders`), integrando tudo ao CI.

## Escopo / Passos
1. **Banco de teste:** adicionar um serviço PostgreSQL ao job `backend` do CI (`services: postgres:...` no `ci.yml`) e apontar `DATABASE_URL` para ele. Rodar `npx prisma migrate deploy` (ou `db push`) antes dos testes para criar o schema.
2. **Setup/teardown:** criar helpers para semear dados mínimos (usuário tutor, provider/lojista aprovado, produto com estoque) e limpar as tabelas entre testes (truncate ou transação por teste). Isolar do banco de desenvolvimento.
3. **Autenticação nos testes:** helper para registrar/logar um tutor e obter o JWT, reutilizável nos casos com DB.
4. **Casos happy-path:**
   - Adicionar item ao carrinho (`POST /cart/...`) → item persiste com `unit_price_snapshot`.
   - Criar pedido (`POST /orders`) a partir do carrinho → `Order` + `OrderItem` criados, estoque decrementado, carrinho esvaziado.
   - (Se PED-2 estiver pronto) listar pedidos do tutor (`GET /orders`) → retorna o pedido criado.
5. **Guardas de ambiente:** os testes com DB só devem rodar quando `DATABASE_URL` aponta para um banco de teste real; caso contrário, `skip` (para não quebrar quem roda `npm test` local sem DB). Manter os testes de rejeição existentes intactos.
6. **CI:** garantir que o job `backend` sobe o Postgres, migra e roda a suíte completa (rejeição + integração com DB).

## Arquivos envolvidos
- `backend/tests/integration/` (novos arquivos: `cartRoutes.test.js`, `orderRoutes.test.js`)
- `backend/tests/helpers/` (novo: setup de DB, seed, auth token)
- `.github/workflows/ci.yml` (job `backend` — adicionar `services: postgres`, `migrate deploy`)
- `backend/package.json` (eventual script `test:integration` separado, se útil)
- Referência: `backend/tests/integration/authRoutes.test.js` (padrão `node:test` + `supertest`)

## Dependências
- **Depende de:** PED-1 (a criação de pedido precisa existir para ser testada).
- **Bloqueia:** nada; dá rede de segurança para PED-2 e futuras alterações no fluxo de compra.

## Critério de aceite (Definition of Done)
- Existe infraestrutura de testes de integração com banco de teste (setup/seed/teardown isolados).
- Suíte cobre o happy-path de **carrinho** (adicionar item) e **criação de pedido** (atomicidade: pedido criado, estoque baixado, carrinho vazio).
- Os testes rodam no **CI** com um Postgres de serviço, migrando o schema antes de executar.
- Testes de rejeição existentes continuam passando; `npm test` local sem DB não quebra (skip condicional).

## Testes (o que a suíte deve verificar)
- Carrinho: item adicionado aparece com quantidade e snapshot de preço corretos.
- Pedido: após `POST /orders`, `Order`/`OrderItem` existem, `stock_quantity` reduziu na medida certa e o carrinho ficou vazio.
- Rollback: estoque insuficiente → nenhum pedido criado e estoque/carrinho intactos (reforça PED-1).
- Ownership/listagem (se PED-2 pronto): tutor só vê os próprios pedidos.

## Notas técnicas / armadilhas
- Usar um **banco separado** para testes (nunca o de desenvolvimento) — o teardown apaga dados.
- `prisma.$transaction` de PED-1 deve ser exercitado tanto no sucesso quanto no rollback.
- `Prisma.Decimal`: comparar valores com `Number()` nas asserções.
- No CI, esperar o Postgres ficar `healthy` antes de migrar (usar `options: --health-cmd` no service).
- Preferir limpar via `TRUNCATE ... RESTART IDENTITY CASCADE` entre testes para isolamento, ou envolver cada teste em transação revertida ao final.
- Manter `LOG_LEVEL=silent` (como no teste existente) para não poluir a saída do CI.
