# PAG-2 - Pagamento simulado e estorno de agendamentos

Implementação local em 16/11/2026, branch tasks-laura, sobre main 5d11b7e. Alterações ainda sem commit e sem publicação.

## Contrato

- POST /api/v1/appointments/:id/pay: tutor proprietário paga uma reserva PRE_PAGO em PENDENTE, antes do início.
- Corpo vazio; valor vem de total_price persistido. Não recebe cartão nem chama Mercado Pago.
- Resposta 200: agendamento com status AGUARDANDO_CONFIRMACAO e objeto payment.
- Repetir um pagamento já aprovado não cria nova cobrança, inclusive após confirmação/conclusão.
- Presencial não possui pagamento online. Cancelado/recusado/estornado não pode ser pago novamente.
- GET de detalhe e listagens incluem payment (null quando não houver registro), com id, status, amount, paid_at, refunded_at e simulated=true.
- payment.status: APPROVED ou REFUNDED. Estorno é integral e mantém o valor original no registro.
- Recusa ou cancelamento elegível de reserva pré-paga paga altera status e pagamento na mesma transação. Repetição da mesma saída terminal por proprietário autorizado não repete estorno.
- Confirmação/conclusão não estorna. A política utilizada é a gravada na reserva.
- Alterações financeiras e de status usam lock de linha do Appointment. A unicidade do pagamento por agendamento também é garantida pelo banco.

Exemplo de resposta financeira:

```json
{
  "status": "AGUARDANDO_CONFIRMACAO",
  "payment": {
    "id": "<uuid>",
    "status": "APPROVED",
    "amount": 120,
    "paid_at": "<data ISO>",
    "refunded_at": null,
    "simulated": true
  }
}
```

## Banco e publicação

Nova migration: 20261116000000_appointment_payments. Cria appointment_payments com valor positivo, unicidade por Appointment, FK restritiva e consistência entre status e data de estorno.

Aplicar pelo processo de migrations do backend antes de expor a versão nova. Regenerar Prisma Client no build. Nenhuma migration existente foi editada.

Não foram aplicadas migrations em produção nesta entrega. Não há flag/credencial de gateway nova; a PAG-2 é simulação e independente da configuração de pagamento de pedidos.

### Dados legados

Não foram inventados pagamentos para reservas antigas. Pré-pagos em AGUARDANDO_CONFIRMACAO ou CONFIRMADO sem registro APPROVED recebem conflito ao tentar transicionar; precisam de conciliação explícita. Consultar e decidir o tratamento com o responsável antes de atualizar registros. Não executar backfill presumindo que todos foram pagos.

Rollback de código não deve reativar uma versão que ignora estornos de reservas já pagas. Se houver problema após publicação, suspender as operações afetadas e avaliar o estado dos dados antes de voltar a versão. Não apagar a tabela de pagamentos como forma de rollback.

## Validação local

- Prisma Client gerado e schema validado.
- As oito migrations foram aplicadas com sucesso em um PostgreSQL 16 descartável, banco petplus_test, acessível apenas por loopback na porta 55439.
- Prisma migrate diff após aplicação: nenhuma diferença.
- Suíte completa com banco habilitado: 410 testes aprovados, zero falhas e zero ignorados.
- Suíte anterior sem banco: 396 aprovados e 14 ignorados por exigirem banco.
- Lint backend: zero erros, quatro avisos em arquivos preexistentes. Lint direcionado aos use cases e testes alterados: sem problemas.
- O container descartável foi criado apenas para essa validação; não foi usado banco publicado.

Cobertura acrescentada: pagamento HTTP/autorização/UUID; idempotência; retorno do pagamento no detalhe; concorrência de pagamento e cancelamento; estorno único; rollback de status e pagamento; política da reserva; presencial sem cobrança; proteção de registros legados sem comprovante.

Testes novos:

- backend/tests/unit/appointmentPayment.test.js (simulações controladas).
- backend/tests/integration/appointmentPaymentDb.test.js (PostgreSQL real no CI e nesta validação).

A estrutura existente de testes DB foi ajustada para incluir a nova tabela na limpeza segura. O teste anterior de corrida de status foi adaptado para a serialização por lock, sem barreira de leitura que bloquearia o próprio lock.

## Escopo restante

A API de pagamento está implementada e validada localmente. As telas de pagar, retomar, acompanhar e cancelar pertencem a BKG-1/BKG-2; a agenda do parceiro a SCH-1/SCH-2. Não considerar essas tasks concluídas por esta entrega de backend.
