# Sprint 2 — Checkout, E-mail e Recusa

> Semanas 4–5 (15–28/set) · Marco **M2 = 28/set** · Pet+ (marketplace de pets: loja + hotéis + pet sitters)

## Objetivo do Sprint
Tornar a jornada de compra **real e honesta** de ponta a ponta e destravar os fluxos
de operação do parceiro. Ao final do Sprint 2, o tutor finaliza uma compra que cria um
pedido de verdade com pagamento simulado (marca `PAGO`), recebe e-mail real via Resend, e
acompanha o pedido em tela; o parceiro vê os pedidos recebidos; o admin recusa cadastros
com motivo (e-mail com link para correção) e distingue reenvios (`EM_REVISAO`) de novos
(`PENDENTE`); e a base do agendamento (hotel/sitter) fica modelada e calculada. Fechamos
também a dívida de consistência visual e de favoritos persistentes no front.

## Marco M2 (28/set) — Definition of Done do Sprint
"**Compra ponta a ponta com pagamento simulado + e-mail real + recusa/reenvio**"
- [ ] Checkout cria pedido real (`POST /orders`), pagamento simulado marca `PAGO`, tela de sucesso reflete o pedido e carrinho esvazia.
- [ ] `EmailService` (Resend) reutilizável funcionando: recuperação de senha e e-mail de recusa chegam ao destinatário com link válido.
- [ ] Recusa grava `rejection_reason` + `REJEITADO` e envia e-mail; reenvio move para `EM_REVISAO`; admin diferencia `EM_REVISAO` de `PENDENTE`; tela de correção exige login e exibe o motivo.
- [ ] Tutor e parceiro acompanham pedidos reais (mocks removidos); agendamento modelado e com cálculo de total migrado.

## Tasks
| ID | Título | Trilha | Prioridade | Esforço | Sem. | Resp. |
|----|--------|--------|-----------|---------|------|-------|
| PAG-1 | Pagamento simulado no `POST /orders` (contrato pronto p/ gateway). | Backend | Crítico | M | 4 | R1 |
| EML-1 | Integrar Resend + recuperação de senha real (`EmailService`). | Backend | Crítico | M | 4 | R2 |
| CHK-2 | Ligar Checkout ao `POST /orders` + tela de Sucesso real. | Frontend | Crítico | G | 4 | R3 |
| UX-2 | Consistência visual + favoritar persistente + fix reload. | Frontend | Média | M | 4 | R4 |
| AGD-1 | Modelar Agendamento parte 1 (estados + cálculo de total). | Backend | Crítico | G | 5 | R1 |
| REC-1 | Fluxo recusa/reenvio no backend (motivo + e-mail + `EM_REVISAO`). | Backend | Alta | M | 5 | R2 |
| PED-F | TutorOrders + Orders do parceiro consumindo endpoints reais. | Frontend | Crítico | M | 5 | R3 |
| REC-2 | Tela de correção de cadastro recusado (exige login). | Frontend | Alta | M | 5 | R4 |

## Dependências e ordem sugerida
- **Herdadas do Sprint 1:** `PED-2` (`POST /orders`) — bloqueia **PAG-1**, **CHK-2** e **PED-F**. `STA-1` (enum de status do Provider) — bloqueia **AGD-1** e **REC-1**.
- **Semana 4:** começar por **EML-1** (sem dependências, habilita REC-1) e **PAG-1** (habilita CHK-2). **CHK-2** logo após PAG-1. **UX-2** em paralelo (sem dependências).
- **Semana 5:** **REC-1** depende de EML-1 + STA-1; **REC-2** depende de REC-1. **PED-F** depende de PED-2 (pode iniciar após CHK-2). **AGD-1** depende de STA-1 e corre em paralelo à trilha de recusa.
- Cadeia crítica do marco: `EML-1 → REC-1 → REC-2` e `PAG-1 → CHK-2 → PED-F`.

## Convenções do time
- Ninguém commita direto na `main` — fluxo de Pull Request com revisão obrigatória.
- Backend em camadas: routes → controllers → useCases → repositories/prisma; erros via `next(AppError)` + errorHandler central; validação Zod; logger pino. Express 5: `req.query` é read-only (validar com Zod inline). Prisma `Decimal` → `Number()`. Nunca vazar `password_hash`/`document`.
- Frontend: `lib/services/*` sobre `httpClient` tipado; hooks React Query; sempre tratar loading/erro/vazio/sucesso; `HamsterLoader`. Dev local usa `VITE_API_URL=http://localhost:3000/api/v1`; `.env.local` aponta para o Railway.
- `EmailService` é único e reutilizável (reset de senha, recusa e, no futuro, confirmações).
