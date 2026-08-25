# Sprint 1 — Pedidos e Segurança

> Marco **M1 = 14/set** · Semana 2 (01–07/set) + Semana 3 (08–14/set)

## Objetivo do Sprint
Fechar o fluxo de compra do Pet+ ponta a ponta (checkout → pedido transacional → gestão de pedidos) e endurecer a segurança da plataforma (vazamento de dados sensíveis, login de conta inativa, status de parceiro consistente). Ao fim do Sprint 1 o tutor consegue finalizar um pedido real, o lojista gerencia seus pedidos e produtos, e nenhuma resposta pública vaza `password_hash` ou `document` (CPF/CNPJ).

## Marco M1 (14/set) — Definition of Done do Sprint
- Checkout cria `Order`/`OrderItem` de forma atômica, com baixa de estoque e carrinho esvaziado.
- Tutor e parceiro listam seus pedidos; status transita com validação e ownership.
- Nenhuma resposta expõe `password_hash`; público sem CPF/CNPJ; usuário inativo não loga.
- `Provider.status` é enum consistente com dados legados migrados.
- Suíte de integração com banco de teste rodando no CI, cobrindo carrinho + criação de pedido.

## Tasks (8)
| ID | Título | Trilha | Semana | Prioridade | Esforço | Resp. |
|----|--------|--------|--------|------------|---------|-------|
| PED-1 | POST /orders transacional (parte 1) | Backend | 2 | Crítico | G | R1 |
| SEC-1 | Fechar vazamentos + `is_active` no login | Segurança | 2 | Crítico | M | R2 |
| CHK-1 | Reescrever Checkout com validação real | Frontend | 2 | Alta | M | R3 |
| CFG-1 | Persistir Configurações do parceiro | Frontend | 2 | Alta | M | R4 |
| PED-2 | GET /orders + PATCH status (parte 2) | Backend | 3 | Crítico | M | R1 |
| STA-1 | `Provider.status` → enum + migração + DELETE /products | Backend | 3 | Crítico | M | R2 |
| PRD-1 | Front: consumir DELETE produto + tratar erros | Frontend | 3 | Alta | P/M | R3 |
| QA-1 | Infra de testes de integração (carrinho/pedido) | QA | 3 | Alta | M | R4 |

## Ordem e dependências
```
Semana 2:  PED-1 (dep PED-0)      SEC-1 (—)      CHK-1 (—)      CFG-1 (—)
                │                                                   
Semana 3:  PED-2 (dep PED-1)   STA-1 (dep INF-0)   PRD-1 (dep STA-1)   QA-1 (dep PED-1)
```
- **PED-1 → PED-2** e **PED-1 → QA-1**: os pedidos precisam existir antes de listar/testar.
- **STA-1 → PRD-1**: o `DELETE /products/:id` do backend precisa existir antes do front consumi-lo.
- **SEC-1**, **CHK-1**, **CFG-1** são independentes e podem ser paralelizados na Semana 2.
- `PED-0` (modelagem/decisão do fluxo de pedido) e `INF-0` (baseline de migrações) são pré-requisitos herdados do Sprint 0.

## Convenções do time
- Ninguém commita direto na `main` — todo merge via **Pull Request com revisão**.
- Backend em camadas: routes → controllers → useCases → repositories/prisma; erros via `next(AppError)` + errorHandler central; validação Zod (`.strict()`/`.strip()`); logger pino.
- Frontend: `lib/services/*` sobre `httpClient` tipado; hooks React Query em `lib/hooks`; sempre tratar loading/erro/vazio/sucesso; `HamsterLoader`.
