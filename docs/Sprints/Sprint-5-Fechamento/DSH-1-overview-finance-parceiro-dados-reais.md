# DSH-1 — Overview/Finance do parceiro com dados reais

> Sprint 5 · Semana 10 (27/out–01/nov) · Backend · Prioridade Alta · Esforço M · Responsável R2

## Contexto
Os dashboards do parceiro são inteiramente mock. Em `frontend/src/pages/dashboard/Overview.tsx`
os dados de agendamentos, receita e mix de serviços são arrays fixos no componente
(`appointments`, `revenueData`, `servicesData` — ver `Overview.tsx:36-60`, comentário literal
`// Mock Data`). Em `frontend/src/pages/dashboard/Finance.tsx` os KPIs, o gráfico e as transações
são constantes hardcoded (`mockKPIs`, `mockChartData`, `mockTransactions` — `Finance.tsx:17-50`).
Agora que `Order` e `Appointment` existem (dos sprints anteriores) e o checkout marca pedidos como
pagos, dá para alimentar esses painéis com dados reais do parceiro logado.

## Objetivo
Fornecer endpoints/métricas reais para o parceiro — pedidos e agendamentos do próprio parceiro, e
receita calculada a partir de pedidos pagos — e ligar `Overview.tsx` e `Finance.tsx` a eles,
removendo os mocks.

## Escopo / Passos
1. **Endpoint de métricas do parceiro (backend):** criar rota autenticada (ex.: `GET /api/v1/providers/me/metrics?days=N`)
   que, para o `provider` do usuário logado, retorne: total/breakdown de pedidos e agendamentos, receita de
   pedidos **pagos**, série temporal de receita por dia e mix de serviços. Seguir camadas routes → controller →
   useCase → repositories/prisma; validar `days` com Zod inline (Express 5: `req.query` read-only).
2. **Receita de pedidos pagos:** somar apenas pedidos com status pago; converter `Prisma.Decimal` → `Number()`.
3. **Séries por dia:** bucketizar `groupBy` por timestamp em JS (dia a dia), reaproveitando o utilitário de
   `adminMetrics` (`groupByDay`) para consistência com o painel admin.
4. **Serviço/hook no frontend:** adicionar método em `lib/services/providerService` (sobre `httpClient`) e um
   hook React Query; tratar loading/erro/vazio/sucesso com `HamsterLoader`.
5. **Ligar as telas:** substituir `mockKPIs`/`mockChartData`/`mockTransactions` (Finance) e
   `appointments`/`revenueData`/`servicesData` (Overview) pelos dados do endpoint.

## Arquivos envolvidos
- `backend/src/routes/providerRoutes.js` (nova rota de métricas do parceiro)
- `backend/src/controllers/ProviderController.js` (handler de métricas)
- `backend/src/useCases/providers/*` (novo useCase de métricas do parceiro)
- `backend/src/utils/adminMetrics.js` (reuso de `groupByDay`/helpers)
- `frontend/src/lib/services/providerService.ts` (novo método)
- `frontend/src/pages/dashboard/Overview.tsx` (remover `Mock Data`)
- `frontend/src/pages/dashboard/Finance.tsx` (remover `mockKPIs`/`mockChartData`/`mockTransactions`)

## Dependências (Depende de / Bloqueia)
- **Depende de:** PED-2 (`POST /orders` — existe `Order` pago), AGD-2 (agendamento — existe `Appointment`).
- **Bloqueia:** DSH-2 (métricas admin reaproveitam o cálculo de receita de pedidos pagos).

## Critério de aceite (Definition of Done)
- `Overview.tsx` e `Finance.tsx` do parceiro leem dados reais do backend (nenhum array mock remanescente).
- Receita exibida é calculada a partir de pedidos **pagos** do parceiro logado.
- Pedidos/agendamentos e a série temporal refletem os registros do parceiro no banco.
- Estados de loading/erro/vazio tratados (parceiro sem pedidos vê zeros/estado vazio, não mock).

## Testes
- Teste de integração do endpoint: parceiro com pedidos pagos → receita e contagens corretas; parceiro sem
  pedidos → zeros.
- Isolamento: parceiro A não enxerga métricas de parceiro B (escopo por `provider` do token).
- Conferência manual: números do dashboard batem com uma consulta direta ao banco.
- Frontend: com o backend mockado no teste, Overview/Finance renderizam os valores do endpoint.

## Notas técnicas / armadilhas
- **Prisma `Decimal` → `Number()`** antes de somar/enviar (valores monetários).
- **Express 5:** `req.query` é read-only — validar `days` com Zod inline, sem reatribuir `req.query`.
- **`groupBy` por timestamp** não agrupa por dia sozinho — bucketizar em JS (reusar `groupByDay`).
- Receita = **somente pedidos pagos**; não contar `PENDENTE`/`REJEITADO`/cancelado.
- Nunca incluir `password_hash`/`document` ao trazer dados do parceiro/usuário — `select` explícito.
