# PGT-1 — Mercado Pago sandbox no checkout (OPCIONAL)

> Sprint 3 · Semana 7 (06–12/out) · Backend · Prioridade Opcional · Esforço G · Responsável R1

## Contexto
A decisão de negócio 7 define pagamento **SIMULADO primeiro** e **Mercado Pago sandbox como OPCIONAL**. Esta task integra o gateway em ambiente de testes, mantendo o pagamento simulado como fallback. **É explicitamente opcional e pode migrar para o próximo semestre** — não bloqueia o marco M3 nem o fluxo essencial de compra/agendamento.

## Objetivo
Integrar o Mercado Pago **sandbox** ao checkout: criar preferência de pagamento, pagar com cartão de teste e receber a confirmação por **webhook**, marcando o pedido como pago. Preservar o pagamento simulado como caminho padrão/fallback.

## Escopo / Passos
1. **Criação de preferência:** endpoint que gera uma preferência de pagamento no MP sandbox a partir do pedido/checkout (itens, valor total, referência externa = `order_id`).
2. **Checkout com cartão de teste:** o front redireciona/abre o checkout do MP sandbox usando cartões de teste do próprio MP.
3. **Webhook de confirmação:** endpoint público que recebe a notificação do MP, valida a origem, consulta o status do pagamento e, se aprovado, marca o `Order` como pago (e, no fluxo de agendamento PRE_PAGO, avança para `AGUARDANDO_CONFIRMACAO`).
4. **Fallback simulado:** manter o pagamento simulado funcionando integralmente; a integração MP é acionada apenas quando configurada (feature flag / variável de ambiente).
5. **Config:** credenciais sandbox por variável de ambiente; nunca commitar tokens.

## Arquivos envolvidos
- `backend/src/services/` — cliente/serviço de integração Mercado Pago (novo)
- `backend/src/routes/` — rota de criação de preferência + rota de webhook (novas)
- `backend/src/controllers/` — controller de pagamento (novo)
- `backend/src/config/env.js` — variáveis do MP sandbox
- Fluxo de pedido/pagamento existente (PAG-1) — ponto de integração

## Dependências
- **Depende de:** PAG-1 (pagamento simulado / base do fluxo de pagamento).
- **Bloqueia:** nada essencial — task opcional.

## Critério de aceite (Definition of Done)
- Com credenciais sandbox configuradas: pagamento com cartão de teste gera preferência e o **webhook confirma o pedido** como pago.
- Sem configuração: o pagamento **simulado continua funcionando** normalmente (fallback).
- O webhook valida a origem e é idempotente (notificação repetida não duplica efeito).
- Documentado no README/task que a integração é **opcional** e não bloqueia o essencial.

## Testes
- Sandbox: fluxo feliz com cartão de teste aprovado → pedido pago via webhook.
- Cartão de teste recusado → pedido não é marcado pago; usuário pode tentar de novo.
- Webhook duplicado → sem efeito duplo (idempotência).
- Sem credenciais MP → checkout simulado íntegro.

## Notas técnicas / armadilhas
- **Opcional**: priorizar apenas se o essencial da sprint estiver fechado; pode migrar de semestre.
- Webhook é endpoint **público** — validar assinatura/origem e tratar como entrada não-confiável.
- Nunca colocar dados sensíveis/tokens em URL ou log; credenciais só via env.
- Não capturar/entrar credenciais de cartão real no ambiente — apenas cartões de teste do MP.
- Prisma `Decimal` (valores) → `Number()` ao montar a preferência.
