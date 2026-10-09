# AGD-1 — Modelar Agendamento (parte 1)

> Sprint 2 · Semana 5 (22–28/set) · Backend · Prioridade Crítico · Esforço G · Responsável R1

## Contexto
Os modelos `Service` e `Appointment` já existem no schema
(`prisma/schema.prisma:262-297`), mas são **código morto**: nenhum endpoint os usa e o
`Appointment.status` traz um comentário genérico em inglês (`PENDING, CONFIRMED, COMPLETED,
CANCELLED`) que não reflete a máquina de estados alinhada. Além disso, não há `payment_policy`
no `Provider`, embora o negócio já tenha definido cobrança presencial (padrão) vs. pré-paga,
e a regra de cálculo do total difere por papel: hotel cobra por diária, sitter por
visita/hora. Esta task foca **modelagem + cálculo**; os endpoints ficam para AGD-2.

## Objetivo
Definir e migrar o modelo de agendamento: `payment_policy` no `Provider`
(`PRESENCIAL`/`PRE_PAGO`), a máquina de estados do `Appointment` alinhada ao negócio, e o
cálculo do total (hotel = diária × nº de dias; sitter = valor por visita/hora × quantidade),
deixando as regras documentadas para AGD-2 implementar os endpoints.

## Escopo / Passos
1. Adicionar `payment_policy` ao `Provider` com default `PRESENCIAL` e valor alternativo `PRE_PAGO`.
2. Redefinir os estados do `Appointment` conforme o alinhamento: `PENDENTE → AGUARDANDO_CONFIRMACAO (apenas quando PRE_PAGO) → CONFIRMADO → CONCLUIDO`, além de `RECUSADO`/`CANCELADO`. Ajustar o `default` para `PENDENTE`.
3. Documentar a transição condicional: `AGUARDANDO_CONFIRMACAO` só ocorre em parceiros `PRE_PAGO`; em `PRESENCIAL` o fluxo vai de `PENDENTE` direto para `CONFIRMADO`.
4. Implementar o **cálculo do total** em uma função/useCase reutilizável:
   - Hotel (role 3): `daily_rate × nº de diárias` (diárias derivadas de `start_time`/`end_time`).
   - Sitter (role 4): `hourly_rate` (ou valor por visita) × quantidade de visitas/horas.
5. Criar migration Prisma para `payment_policy` e para o novo default/semântica de `status`.
6. Registrar as regras de estado e de cálculo em comentário no schema + neste doc, como contrato para AGD-2 (endpoints) e para o front de agendamento.

## Arquivos envolvidos
- `backend/prisma/schema.prisma:49-83` — `Provider.payment_policy` (`PRESENCIAL`/`PRE_PAGO`, default `PRESENCIAL`).
- `backend/prisma/schema.prisma:279-297` — `Appointment.status`: novos estados + default `PENDENTE`.
- `backend/src/useCases/appointments/CalculateAppointmentTotalUseCase.js` — novo: cálculo por papel (hotel/sitter).
- `backend/src/constants/` — nova constante com os estados do `Appointment` e valores de `payment_policy`.
- `backend/prisma/migrations/` — nova migration.

## Dependências (Depende de / Bloqueia)
- Depende de: **STA-1** (enum/convenção de status do Provider — base para padronizar estados como constantes).
- Bloqueia: **AGD-2** (endpoints de agendamento consomem este modelo e o cálculo).

## Critério de aceite (Definition of Done)
- [ ] `Provider.payment_policy` existe, com default `PRESENCIAL`, aceitando `PRE_PAGO`.
- [ ] Estados do `Appointment` migrados: `PENDENTE`, `AGUARDANDO_CONFIRMACAO`, `CONFIRMADO`, `CONCLUIDO`, `RECUSADO`, `CANCELADO`, com `default = PENDENTE`.
- [ ] Regras de transição documentadas, incluindo a condicionalidade de `AGUARDANDO_CONFIRMACAO` a `PRE_PAGO`.
- [ ] Função de cálculo do total cobre hotel (diária × dias) e sitter (visita/hora × qtd), com testes.
- [ ] Migration aplica do zero com `prisma migrate deploy`.

## Testes
- Cálculo hotel: `daily_rate` × nº de diárias para intervalos de 1, 2 e N dias → total correto.
- Cálculo sitter: `hourly_rate`/valor por visita × quantidade → total correto.
- Bordas: mesmo dia, virada de mês, intervalo mínimo — arredondamento/diárias coerentes.
- Rodar `npm test` no `backend/` (`node --test`).

## Notas técnicas / armadilhas
- `daily_rate` e `hourly_rate` são `Decimal` no Prisma → converter com `Number()` para calcular e ao serializar.
- Cuidado com fuso: `start_time`/`end_time` são `Timestamptz`; contar diárias por data local do parceiro, não por diferença bruta de horas.
- Definir explicitamente a política de arredondamento de diárias (ex.: dia iniciado conta como diária) e registrá-la no doc.
- Esta task NÃO expõe endpoints — só modelo, migration e cálculo reutilizável (endpoints são AGD-2).
- Não misturar estados de `Appointment` com estados de `Order`/pagamento; são máquinas distintas.

---

## Contrato definido (saída desta task — entrada da AGD-2)

> Preenchido na implementação. As decisões de arredondamento e fuso que o card
> pedia para explicitar estão registradas aqui.

### Política de cobrança — `Provider.payment_policy`
Enum `PaymentPolicy` no Postgres (mesma convenção que a STA-1 adotou para
`ProviderStatus`), default `PRESENCIAL`. Helpers em `src/constants/paymentPolicy.js`.

| Valor | Significado |
|---|---|
| `PRESENCIAL` (padrão) | Tutor paga no local, no momento do serviço |
| `PRE_PAGO` | Parceiro exige pagamento antecipado |

Valor nulo ou desconhecido é normalizado para `PRESENCIAL` — nunca para pré-pago.

### Máquina de estados — `Appointment.status`
VarChar(30), default `PENDENTE`. Constantes e validadores em
`src/constants/appointmentStatus.js`.

```
PRESENCIAL:  PENDENTE ──────────────────────────────▶ CONFIRMADO ─▶ CONCLUIDO
PRE_PAGO:    PENDENTE ─▶ AGUARDANDO_CONFIRMACAO ────▶ CONFIRMADO ─▶ CONCLUIDO
```

`AGUARDANDO_CONFIRMACAO` **só ocorre em parceiro `PRE_PAGO`** — é a janela entre
o aceite do parceiro e a confirmação do pagamento. Em `PRESENCIAL` a transição é
bloqueada por `isValidAppointmentTransition`.

| De | Para |
|---|---|
| `PENDENTE` | `AGUARDANDO_CONFIRMACAO`¹, `CONFIRMADO`, `RECUSADO`, `CANCELADO` |
| `AGUARDANDO_CONFIRMACAO` | `CONFIRMADO`, `CANCELADO` |
| `CONFIRMADO` | `CONCLUIDO`, `CANCELADO` |
| `CONCLUIDO` / `RECUSADO` / `CANCELADO` | — (terminais) |

¹ apenas quando `payment_policy = PRE_PAGO`.

A AGD-2 deve usar `nextStatusAfterPartnerAccepts(payment_policy)` no aceite, em
vez de decidir o próximo estado na mão.

> Esta máquina é **independente** da de `Order`/pagamento. Um agendamento
> `CONFIRMADO` não diz nada sobre o pedido.

### Cálculo do total — `CalculateAppointmentTotalUseCase`
Não expõe endpoint. Recebe `{ provider, startTime, endTime }` e devolve
`{ total, unit, quantity, unitPrice }`.

| Papel | Fórmula |
|---|---|
| Hotel (role 3) | `daily_rate` × diárias |
| Sitter (role 4) | `hourly_rate` × horas |

**Arredondamento — decisões tomadas aqui:**

- **Diária = noite.** Conta-se a diferença entre as *datas de calendário* de
  entrada e saída. Entrar dia 10 e sair dia 12 são 2 diárias, qualquer que seja
  o horário. Entrada e saída no mesmo dia contam **1 diária** (regra de daycare).
- **Hora iniciada conta inteira.** 90 minutos custam 2 horas; o mínimo é 1 hora.

**Fuso:** as diárias são contadas por data de calendário em `America/Sao_Paulo`,
não por diferença bruta de horas — senão uma estadia das 23h às 01h viraria
"0 diária". O `Provider` ainda não tem campo de fuso; quando tiver, trocar a
constante `BUSINESS_TIMEZONE` pelo fuso do parceiro.

**Erros** (todos `AppError` 400): fim anterior ou igual ao início; datas
inválidas; parceiro sem `daily_rate`/`hourly_rate`; papel que não é hotel nem
sitter.
