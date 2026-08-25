# SEC-2 — Hardening final + buffer

> Sprint 5 · Semana 11 (02–08/nov) · Segurança · Prioridade Alta · Esforço M · Responsável R1

## Contexto
Endurecimento residual de segurança antes da entrega. Pontos confirmados no código:
- **not-found vira 500 em vez de 404:** o `notFoundHandler` existe e devolve `AppError.notFound`
  (`backend/src/middlewares/errorHandler.js`), mas rotas com `:id` malformado (UUID inválido) atingem o
  Prisma e caem no fallback `INTERNAL_ERROR` (500) do `errorHandler`, em vez de 404 — daí a necessidade de
  validar UUID nos `:id`.
- **erros crus:** Auth/Product/Provider ainda usam `res.status(...)` cru em alguns pontos, em vez de
  `next(AppError)` + `errorHandler` central.
- **`GET /api/metrics` público:** em `backend/src/app.js` a rota `app.get('/api/metrics', metricsHandler)`
  não tem middleware de autenticação — expõe métricas RED sem proteção.
- **rate limit só em `/auth`:** o `authLimiter` é aplicado apenas em `app.use('/api/v1/auth', authLimiter, ...)`;
  não há limite global.

Serve também de **buffer** para pendências dos demais tracks.

## Objetivo
Fechar as arestas de segurança residuais: 404 correto em not-found, erros padronizados via `AppError`,
validação de UUID nos `:id`, proteção do `GET /api/metrics` e rate limit global.

## Escopo / Passos
1. **404 em not-found / UUID inválido:** validar formato UUID nos parâmetros `:id` (Zod ou middleware) antes
   de consultar o Prisma; `:id` inválido → 404/422 padronizado, nunca 500 do fallback.
2. **Padronizar erros:** substituir os `res.status(...)` crus em Auth/Product/Provider por `next(AppError.*)`,
   deixando o `errorHandler` central formatar a resposta (`{ error: { code, message, details }, message }`).
3. **Proteger `/api/metrics`:** exigir autenticação (e papel admin) na rota de métricas RED; público não acessa.
4. **Rate limit global:** aplicar um `rateLimit` global (janela/limite mais folgados que o de `/auth`) em
   `app.use(...)`, mantendo o `authLimiter` mais rígido nas rotas de autenticação.
5. **Buffer:** reservar folga para pendências P2/P3 remanescentes dos outros tracks.

## Arquivos envolvidos
- `backend/src/app.js` (rate limit global; auth no `GET /api/metrics`)
- `backend/src/middlewares/errorHandler.js` (referência do fallback; garantir 404 correto)
- `backend/src/middlewares/*` (novo middleware/validação de UUID para `:id`, se aplicável)
- `backend/src/controllers/AuthController.js`, `ProductController.js`, `ProviderController.js` (trocar `res.status` cru por `next(AppError)`)
- `backend/src/routes/*` (validação de `:id` nas rotas com parâmetro)

## Dependências (Depende de / Bloqueia)
- **Depende de:** nenhuma.
- **Bloqueia:** nada diretamente; é pré-requisito de qualidade para o marco M5 e buffer do sprint.

## Critério de aceite (Definition of Done)
- Rota inexistente e `:id` malformado retornam **404** (ou 422 de validação), nunca 500.
- Erros de Auth/Product/Provider passam pelo `errorHandler` central (formato padronizado via `AppError`).
- `GET /api/metrics` exige autenticação (admin) — retorna 401/403 sem token válido.
- Rate limit **global** ativo, além do limite específico de `/auth`.

## Testes
- `GET /api/v1/rota-inexistente` → 404 padronizado.
- `GET /api/v1/products/nao-e-uuid` → 404/422, não 500.
- Provocar erros conhecidos em Auth/Product/Provider → resposta no formato `{ error: { code, message }, message }`.
- `GET /api/metrics` sem token → 401/403; com token admin → 200.
- Estourar o limite global de requisições → 429 `RATE_LIMITED`.

## Notas técnicas / armadilhas
- O `notFoundHandler` **já** cobre rota não mapeada; o 500 vem de `:id` inválido chegando ao Prisma — a
  correção real é **validar UUID antes** da query.
- `errorHandler` já trata `P2025` como 404 — mas UUID malformado não gera `P2025`, e sim um erro de validação
  do Prisma que cai no fallback 500; por isso a validação prévia.
- `app.set('trust proxy', 1)` já está configurado — o rate limit global usa o IP correto atrás do proxy.
- Não afrouxar o `authLimiter` (20/15min) ao adicionar o limite global — mantê-lo mais rígido nas rotas de auth.
- Proteger `/api/metrics` sem quebrar coleta interna — o middleware de coleta (`metricsMiddleware`) continua global; só o **endpoint de leitura** é protegido.
