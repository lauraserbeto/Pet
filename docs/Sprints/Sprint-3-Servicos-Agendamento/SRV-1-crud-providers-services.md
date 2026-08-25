# SRV-1 — CRUD /providers/services (só hotel/sitter aprovado)

> Sprint 3 · Semana 6 (29/set–05/out) · Backend · Prioridade Crítico · Esforço G · Responsável R2

## Contexto
O modelo `Service` e o `ServiceRepository` (`backend/src/repositories/ServiceRepository.js`) já existem com `create`/`findByProviderId`/`findById`/`update`/`delete`. Há até um `CreateServiceUseCase` (`backend/src/useCases/services/CreateServiceUseCase.js`) — mas **nada disso é usado por nenhuma rota** (código morto) e o useCase atual só verifica se existe um `Provider`, **sem checar tipo nem aprovação**. Esta task expõe o CRUD e aplica a restrição de negócio.

## Objetivo
Expor um CRUD de serviços em `/api/v1/providers/services`, restrito a parceiro **HOTEL (role 3) ou PET_SITTER (role 4) aprovado**, e exibir os serviços no detalhe público do parceiro para consumo do frontend (SRV-Fpub).

## Escopo / Passos
1. Criar `serviceRoutes` + `ServiceController` ligando o `ServiceRepository`/`CreateServiceUseCase` (hoje mortos).
2. Endpoints (todos sob `authMiddleware`, exceto a listagem pública):
   - `POST /providers/services` — cria serviço (nome, `category`/tipo, `description`, `price`, `duration_minutes`).
   - `GET /providers/services` — lista serviços do parceiro logado.
   - `PUT /providers/services/:id` — edita (ownership).
   - `DELETE /providers/services/:id` — remove (ownership).
3. **Gate de aprovação:** só HOTEL/PET_SITTER com `Provider.status = APROVADO` pode criar/editar/excluir. Ajustar `CreateServiceUseCase` para validar tipo (role) e status do provider — hoje ele só exige a existência do provider.
4. **Unidade de cobrança:** hotel cobra por **diária**; sitter cobra por **visita/hora** (decisão 4). Registrar a unidade junto ao serviço (campo/convenção acordada em AGD-1/modelagem) para o frontend exibir corretamente.
5. **Exposição pública:** incluir os serviços ativos no detalhe público do parceiro (`ProviderController.getDetails` / `GET /providers/:id`), para SRV-Fpub consumir.

## Arquivos envolvidos
- `backend/src/routes/serviceRoutes.js` (novo)
- `backend/src/controllers/ServiceController.js` (novo)
- `backend/src/useCases/services/CreateServiceUseCase.js` (existente — endurecer gate; hoje só exige Provider)
- `backend/src/useCases/services/UpdateServiceUseCase.js` / `DeleteServiceUseCase.js` / `ListProviderServicesUseCase.js` (novos)
- `backend/src/repositories/ServiceRepository.js` (existente — usar; hoje morto)
- `backend/src/controllers/ProviderController.js` (incluir serviços no detalhe público)
- `backend/src/app.js` (registrar rota)

## Dependências
- **Depende de:** STA-1 (`Provider.status` como enum consistente, valor `APROVADO`).
- **Bloqueia:** SRV-F1, SRV-Fpub, SRV-F2 (todo o front de serviços) e AGD-2 (agendamento referencia serviços).

## Critério de aceite (Definition of Done)
- HOTEL/PET_SITTER **aprovado** cria, lista, edita e exclui os próprios serviços.
- Parceiro não-aprovado, ou de tipo diferente (LOJISTA/TUTOR), recebe erro ao tentar gerir serviços.
- Ownership respeitado: parceiro só altera/exclui os próprios serviços.
- Detalhe público (`GET /providers/:id`) retorna os serviços reais com preço.
- Nenhuma resposta vaza `password_hash`/`document`.

## Testes
- Integração: hotel aprovado cria serviço → 201; hotel PENDENTE → erro; lojista/tutor → erro.
- Ownership: parceiro A não edita/exclui serviço de B.
- Público: `GET /providers/:id` lista serviços ativos com `price` numérico.
- Validação: nome vazio e preço negativo rejeitados.

## Notas técnicas / armadilhas
- `CreateServiceUseCase` atual **não** valida tipo nem aprovação — apenas `provider` existe. Não deixar essa brecha valer para o CRUD exposto.
- Prisma `Decimal` (`price`) → `Number()` na saída.
- `req.userRole` (role_id) e `req.userId` vêm do `authMiddleware`; resolver `Provider` por `user_id`.
- Erros via `next(AppError)`; validar body/params com Zod. Não misturar valores de `category` (BOARDING/DAYCARE/SITTING/WALKING) com a unidade de cobrança.
