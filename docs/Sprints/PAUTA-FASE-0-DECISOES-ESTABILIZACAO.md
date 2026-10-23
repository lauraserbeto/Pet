# Pauta — Fase 0: Decisões de Estabilização (antes da Sprint 4)

> **Origem:** [Auditoria de Qualidade e Plano de Estabilização](AUDITORIA-QUALIDADE-ESTABILIZACAO-PRE-SPRINT-4.md), seção 10 (Fase 0) · **Base técnica:** `origin/main` em `c1d53f0` · **Preparada em:** 23/10/2026
>
> **Objetivo da reunião:** tomar as 7 decisões (DEC-A a DEC-G) que bloqueiam a correção dos problemas encontrados e o início das tasks de agendamento da Sprint 4. Nenhuma delas exige código para ser decidida; todas exigem consenso, porque mudam regras de negócio já registradas ou contratos usados por mais de uma pessoa.
>
> **Participantes:** equipe completa (trilhas R1 a R4). **Duração sugerida:** 75 minutos. **Facilitação e registro:** a definir no início da reunião.

> **Status: DECIDIDO em 23/10/2026.** As decisões foram tomadas por Laura, sem reunião, e seguem as recomendações desta pauta. O registro de cada item está nos blocos "Registro da decisão" abaixo.
>
> | Decisão | Opção escolhida |
> | --- | --- |
> | DEC-A | A3 — pagamento antes do aceite |
> | DEC-B | B1 — preço do serviço reservado |
> | DEC-C | C1 — remover frete, desconto PIX e cupom da interface |
> | DEC-D | D1 — aprovação de sitter só pela avaliação |
> | DEC-E | E1 (8 caracteres + maiúscula + número) com bcrypt custo 12 |
> | DEC-F | F1 — data e versão do aceite no usuário |
> | DEC-G | G1 — desativação via `User.is_active=false` |
>
> **Registro concluído em 23/10/2026** no `PLANO-DESENVOLVIMENTO.md` (§3 e §9) e nas specs afetadas:
> - specs já entregues, com aviso e seção "Atualização pós-auditoria" que preservam o texto original: AGD-1, AGD-2 e CHK-2;
> - specs futuras, com o corpo corrigido: PAG-2, BKG-1, BKG-2, SCH-1, SCH-2 e SRV-Fpub.

---

## Como usar esta pauta

- **Leitura prévia (15 min):** seções 1, 6.5 e 8 da auditoria, sobretudo AUD-01, AUD-05, AUD-06, AUD-07, AUD-13, AUD-14 e AUD-15.
- Cada decisão traz: **contexto** (o problema e onde está no código), **perguntas a decidir**, **opções** (prós, contras e impacto) e a **recomendação** com a justificativa. A recomendação é um ponto de partida; a equipe pode escolher outra opção ou ajustá-la.
- Ao fim de cada item, preencher o bloco **Registro da decisão**. Depois da reunião, as decisões entram no `PLANO-DESENVOLVIMENTO.md` (§3, "Decisões de negócio") e nas specs indicadas.
- Esforço em P/M/G, como nas specs: **P** ≈ até meio dia, **M** ≈ 1 a 2 dias, **G** ≈ 3 dias ou mais, para uma pessoa. São estimativas grosseiras.

## Ordem sugerida e tempo

| Ordem | Decisão | Tempo | Por que nessa ordem |
| --- | --- | --- | --- |
| 1 | DEC-A — Máquina de agendamento | 20 min | Bloqueia PAG-2, BKG-1/2 e SCH-1/2 |
| 2 | DEC-B — Fonte do preço do agendamento | 10 min | Depende do fluxo definido em DEC-A; bloqueia PAG-2 e BKG-1 |
| 3 | DEC-G — Desativação de conta | 8 min | Define o desenho do gate de parceiro (correção do crítico AUD-01) |
| 4 | DEC-D — "Sitter operacional" | 8 min | Também entra no gate de parceiro e na vitrine |
| 5 | DEC-C — Frete, desconto PIX e cupom | 8 min | Corrige o total exibido diferente do cobrado |
| 6 | DEC-E — Política de senha e custo do bcrypt | 5 min | Correção independente |
| 7 | DEC-F — Aceite de termos | 6 min | Correção independente |
| — | Encaminhamentos | 10 min | Responsáveis, ordem de execução e Sprint 4 |

## Resumo das recomendações

- **DEC-A:** **pagamento antes do aceite** no PRE_PAGO e aceite do parceiro no PRESENCIAL; todo agendamento nasce `PENDENTE`; a política fica congelada no agendamento. É a regra que o plano e as specs da Sprint 4 já descrevem.
- **DEC-B:** **preço do serviço reservado** × unidades (diária para hotel, hora para sitter).
- **DEC-C:** **remover frete, desconto PIX e cupom da interface** neste semestre; total exibido = soma dos itens = valor cobrado.
- **DEC-D:** a aprovação de Pet Sitter **só acontece pela avaliação aprovada**, e um único verificador de "parceiro operacional" é usado em todos os pontos.
- **DEC-E:** **8 caracteres, 1 letra maiúscula e 1 número** em todos os fluxos; **bcrypt com custo 12** em uma constante.
- **DEC-F:** registrar **data e versão do aceite no próprio usuário**; versão identificada pela data de publicação dos textos.
- **DEC-G:** **desativação = `User.is_active=false`**, separada de "cadastro recusado", com bloqueio imediato dos tokens.

---

## DEC-A — Máquina de estados do agendamento

**Achados relacionados:** AUD-07, AUD-16 · **Bloqueia:** PAG-2, BKG-1, BKG-2, SCH-1, SCH-2

### Contexto

Hoje há **três versões diferentes** do mesmo fluxo:

1. **O que o plano decidiu** (`PLANO-DESENVOLVIMENTO.md` §3, decisão 3; README da Sprint 4; specs PAG-2, BKG-2 e SCH-1). PRESENCIAL é "confirmado pelo parceiro sem pagamento online". PRE_PAGO "exige pagamento antes da confirmação", passa a `AGUARDANDO_CONFIRMACAO` depois de pago, e recusa ou cancelamento geram estorno.
2. **O que a AGD-1 documentou** (comentários em `backend/src/constants/appointmentStatus.js:9-16` e na própria spec). `AGUARDANDO_CONFIRMACAO` seria "a janela entre o aceite do parceiro e a confirmação do pagamento", ou seja, aceite primeiro e pagamento depois. O helper `nextStatusAfterPartnerAccepts` foi criado para isso, mas não é usado.
3. **O que a AGD-2 implementou** (`backend/src/useCases/appointments/CreateAppointmentUseCase.js:74-77`):
   - PRESENCIAL já **nasce `CONFIRMADO`**: o parceiro não aceita nem pode recusar;
   - PRE_PAGO já **nasce `AGUARDANDO_CONFIRMACAO`** sem nenhum pagamento;
   - `PENDENTE` nunca ocorre;
   - o estorno só aparece na resposta e é decidido pela política **atual** do parceiro, não pela que valia quando o tutor reservou (`UpdateAppointmentStatusUseCase.js:86-125`).

Além disso, o texto mostrado ao parceiro (`frontend/src/lib/constants/paymentPolicy.ts:18-21`) descreve um quarto comportamento.

### Perguntas a decidir

1. Em que estado todo agendamento nasce?
2. No PRESENCIAL, o parceiro aceita ou recusa a solicitação?
3. No PRE_PAGO, o tutor paga **antes** ou **depois** do aceite do parceiro?
4. A política de cobrança fica gravada no agendamento no momento da reserva?
5. Quem pode cancelar, a partir de quais estados, e com que estorno?
6. Quem marca `CONCLUIDO`, e a partir de quando?

### Opções

**A1 — Manter o que a AGD-2 implementou**

- Fluxo: PRESENCIAL nasce `CONFIRMADO`; PRE_PAGO nasce `AGUARDANDO_CONFIRMACAO`; o parceiro confirma ou recusa a partir daí.
- Prós: nenhuma alteração imediata no backend.
- Contras:
  - contradiz o plano e as specs PAG-2, BKG-2 e SCH-1;
  - o parceiro não controla a própria agenda no PRESENCIAL;
  - o PRE_PAGO "aguarda confirmação" sem ter sido pago;
  - `PENDENTE` fica inútil;
  - as specs da Sprint 4 teriam de ser reescritas.
- Impacto: retrabalho nas specs e regra de negócio diferente da combinada.

**A2 — Aceite primeiro, pagamento depois (versão da AGD-1)**

- Fluxo:
  - PRESENCIAL: `PENDENTE` → parceiro aceita → `CONFIRMADO`.
  - PRE_PAGO: `PENDENTE` → parceiro aceita → `AGUARDANDO_CONFIRMACAO` (aguardando o pagamento) → tutor paga → `CONFIRMADO`.
- Prós: o tutor só paga depois do aceite, então há menos estornos; aproveita o helper já criado.
- Contras:
  - contradiz a decisão 3 do plano e as specs da Sprint 4;
  - o nome `AGUARDANDO_CONFIRMACAO` passaria a significar "aguardando pagamento";
  - o tutor precisa voltar depois para pagar, e o projeto não tem sistema de notificação;
  - a BKG-2 precisaria de uma tela de "pagar depois".
- Impacto: specs da Sprint 4 reescritas e mais trabalho de frontend.

**A3 — Pagamento primeiro, aceite depois (decisão 3 do plano e specs da Sprint 4)**

- Fluxo:
  - PRESENCIAL: `PENDENTE` → parceiro confirma (`CONFIRMADO`) ou recusa (`RECUSADO`).
  - PRE_PAGO: `PENDENTE` → tutor paga na própria reserva → `AGUARDANDO_CONFIRMACAO` → parceiro confirma (`CONFIRMADO`) ou recusa (`RECUSADO`, com estorno).
  - `PENDENTE → AGUARDANDO_CONFIRMACAO` acontece **só pelo pagamento**, nunca por alteração manual de status.
- Prós:
  - cumpre a decisão já alinhada no plano;
  - segue as specs PAG-2, BKG-1/2 e SCH-1/2 sem reescrevê-las;
  - o nome do estado volta a fazer sentido ("aguardando confirmação do parceiro");
  - a reserva tem um único checkout.
- Contras:
  - toda recusa de PRE_PAGO gera estorno, o que é barato porque o pagamento é simulado;
  - se o pagamento falhar, o agendamento fica `PENDENTE` até o tutor pagar ou cancelar.
- Impacto: ajustar o código da AGD-2 e corrigir a documentação e os comentários da AGD-1.

### Recomendação: **A3**

É a regra que o plano já marcou como "alinhada, não reabrir sem combinar", e as 5 specs de agendamento da Sprint 4 foram escritas a partir dela. Escolher outra opção obriga a reescrever essas specs justamente quando vão começar.

**Respostas sugeridas para as perguntas 4 a 6:**

- **Política congelada (4):** gravar `payment_policy` no próprio agendamento na criação. Mudanças posteriores do parceiro não afetam reservas existentes nem o estorno.
- **Cancelamento (5):**
  - o tutor pode cancelar em `PENDENTE`, `AGUARDANDO_CONFIRMACAO` e `CONFIRMADO`, sempre antes do início;
  - o parceiro pode recusar em `PENDENTE` (PRESENCIAL) e `AGUARDANDO_CONFIRMACAO` (PRE_PAGO), e cancelar um `CONFIRMADO` antes do início;
  - estorno **integral** quando houve pagamento;
  - multas e prazos de cancelamento ficam fora deste semestre.
- **Conclusão (6):** só o parceiro, a partir de `CONFIRMADO`, e **só depois do horário de início**. Isso protege a futura avaliação (AVL), que só é liberada após `CONCLUIDO`.
- **Fora desta decisão:** expiração automática de `PENDENTE` não pago. Fica registrada como pendência.

**Efeitos da recomendação:**

- E-04 (R1, esforço G): estado inicial, permissões por política, política congelada e validações de data, duração, sobreposição e parceiro aprovado.
- PAG-2 passa a cuidar só do pagamento e do estorno persistido.
- Atualizar o comentário e a spec da AGD-1, o texto de `paymentPolicy.ts` e remover ou adaptar o helper sem uso.

### Registro da decisão

- [ ] A1 · [ ] A2 · [x] A3 · [ ] Outra: —
- Respostas às perguntas 1 a 6:
  1. Todo agendamento nasce `PENDENTE`.
  2. No PRESENCIAL, o parceiro confirma ou recusa.
  3. No PRE_PAGO, o tutor paga na reserva e o agendamento vai para `AGUARDANDO_CONFIRMACAO` **só pelo pagamento**.
  4. A política de cobrança fica congelada no agendamento na criação.
  5. Cancelamento antes do início: o tutor cancela em `PENDENTE`, `AGUARDANDO_CONFIRMACAO` ou `CONFIRMADO`; o parceiro recusa em `PENDENTE` (PRESENCIAL) ou `AGUARDANDO_CONFIRMACAO` (PRE_PAGO) e cancela em `CONFIRMADO`. Estorno integral quando houve pagamento.
  6. `CONCLUIDO` só pelo parceiro, a partir de `CONFIRMADO` e depois do horário de início.
  
  Expiração de `PENDENTE` não pago fica como pendência.
- Atualização do PLANO, da AGD-1 e das specs da Sprint 4: pendente.

---

## DEC-B — Fonte do preço do agendamento

**Achado relacionado:** AUD-06 · **Bloqueia:** PAG-2, BKG-1

### Contexto

Existem duas fontes de preço que não conversam:

- **Tarifa do parceiro** (`Provider.daily_rate` e `Provider.hourly_rate`): editada no Perfil Público. É a base do cálculo atual do agendamento (`CalculateAppointmentTotalUseCase.js:105-110`), da regra de visibilidade na vitrine e da completude do perfil (`ProviderController.js:30-36,284-299`). A spec da BKG-1 também calcula o total por ela.
- **Preço de cada serviço** (`Service.price`, obrigatório): cadastrado pelo parceiro em "Meus Serviços" (SRV-1/F1/F2) e exibido como "R$ X / diária" ou "R$ X / hora". O tutor **reserva um serviço específico** (`service_id` é obrigatório), mas esse preço é ignorado na cobrança.

**Exemplo do problema:** um hotel cadastra "Creche diurna — R$ 60/diária" e "Hospedagem — R$ 120/diária", com tarifa geral de R$ 100. O tutor reserva a creche e é cobrado R$ 100 por dia.

### Perguntas a decidir

1. O valor cobrado vem do serviço reservado ou da tarifa geral do parceiro?
2. O que acontece com a outra fonte (listagem, completude do perfil, vitrine)?
3. A unidade do sitter continua "hora" ou passa a ter "visita"? A decisão 4 do plano fala em "visita/hora".

### Opções

**B1 — Preço do serviço reservado × unidades**

- Prós:
  - o tutor paga o que viu no serviço;
  - permite preços diferentes por tipo, e as categorias `BOARDING`, `DAYCARE`, `SITTING` e `WALKING` já pressupõem isso;
  - aproveita o que a Sprint 3 entregou (SRV-1/F1/F2) e o que a SRV-Fpub vai exibir.
- Contras: a tarifa geral perde a função de cálculo; a listagem e a regra de completude precisam de ajuste; o texto da BKG-1 muda.
- Impacto: troca da fonte no cálculo (P) e testes com preços diferentes. A listagem passa a mostrar "a partir de R$ X" (menor preço entre os serviços ativos) junto com a SRV-Fpub (E-17).

**B2 — Tarifa geral do parceiro × unidades**

- Prós: zero mudança no cálculo atual; a BKG-1 fica como está.
- Contras:
  - o preço por serviço vira enfeite: seria preciso esconder ou remover o preço em "Meus Serviços", refazendo parte da SRV-F1/F2 e de seus testes;
  - impossível cobrar diferente por tipo de serviço;
  - o tutor escolhe um serviço que não muda nada no valor.
- Impacto: retrabalho na interface de serviços e regra de negócio mais pobre.

**B3 — Híbrido: preço do serviço, com a tarifa como reserva**

- Prós: flexível.
- Contras: o preço do serviço já é obrigatório, então a reserva nunca seria usada; vira só complexidade e duas fontes de verdade.

### Recomendação: **B1**

O tutor reserva um serviço, e o preço desse serviço deve ser o cobrado. É também o modelo que a Sprint 3 construiu e que a vitrine real (SRV-Fpub) vai mostrar.

- **Pergunta 2:** a tarifa geral passa a ser só "preço de referência" até a SRV-Fpub; depois, a listagem mostra "a partir de" calculado pelos serviços e a regra de completude passa a exigir "ao menos um serviço ativo".
- **Pergunta 3:** manter "hora" para sitter neste semestre e registrar "visita" no backlog.

**Efeitos:**

- Ajuste no `CalculateAppointmentTotalUseCase` dentro de E-04, com teste em que o preço do serviço é diferente da tarifa.
- Atualizar a spec da BKG-1 (o total passa a usar o preço do serviço).
- Ajustar a listagem e a completude junto com E-17.

### Registro da decisão

- [x] B1 · [ ] B2 · [ ] B3 · [ ] Outra: —
- Destino da tarifa geral: preço de referência até a SRV-Fpub; depois, a listagem mostra "a partir de" (menor preço entre os serviços ativos) e a completude do perfil passa a exigir ao menos um serviço ativo.
- Unidade do sitter: hora ("visita" vai para o backlog).

---

## DEC-G — Desativação de conta como estado próprio

**Achados relacionados:** AUD-01, AUD-13 · **Base do gate de parceiro (E-01)**

### Contexto

- No painel de aprovações, **"Desativar" grava o status `REJEITADO`** (`frontend/src/pages/dashboard/admin/Approvals.tsx:143,148`). Isso tem três efeitos:
  1. dispara o e-mail **"cadastro recusado — corrija seu cadastro"** (`ProviderController.js:347`);
  2. **deixa o parceiro logar**, porque o recusado entra para corrigir o cadastro (`LoginUseCase.js:44-56`);
  3. permite que ele "reenvie" o cadastro e volte para a fila como `EM_REVISAO`.
- O campo `User.is_active` existe, e o login já barra `is_active=false` (`LoginUseCase.js:29`). A tela de usuários exibe "Inativo". Porém **nenhum endpoint altera esse campo**, e o token emitido antes continua valendo por até 24 h (`authMiddleware.js`).

### Perguntas a decidir

1. "Desativar" e "recusar cadastro" são a mesma coisa?
2. Onde fica registrada a desativação?
3. O que acontece com tokens já emitidos, produtos, serviços, pedidos e agendamentos em aberto do parceiro desativado?

### Opções

**G1 — Desativar = `User.is_active=false`**

- Prós:
  - usa um campo e uma regra de login que já existem, sem mudança de enum;
  - vale para qualquer tipo de conta, inclusive tutor;
  - separa "conta suspensa" de "cadastro recusado";
  - preserva o histórico da moderação em `Provider.status`.
- Contras: exige criar o endpoint de admin para ativar e desativar, e verificar o estado da conta a cada requisição.
- Impacto: endpoint + botão no painel + checagem no `authMiddleware` + filtro de vitrine, carrinho e agendamento (dentro de E-01).

**G2 — Novo status de parceiro `SUSPENSO`**

- Prós: deixa explícito no domínio do parceiro.
- Contras: exige migration do enum; mexe em constantes, badges e em todas as verificações de status; não serve para desativar tutor.
- Impacto: maior, e espalha mudanças.

**G3 — Manter `REJEITADO` (como está)**

- Contras: o parceiro desativado recebe convite para corrigir o cadastro, consegue logar e volta para a fila. **Não resolve o problema.**

### Recomendação: **G1**

É a menor mudança que separa os dois conceitos e fecha o caminho de acesso. "Recusar" continua sendo da moderação de cadastro, com motivo e e-mail; "desativar" é suspensão da conta, sem e-mail de correção.

- **Tokens:** o middleware passa a consultar a conta em cada requisição. A escala do projeto comporta; uma alternativa é um contador de versão de token. Desativar bloqueia já na requisição seguinte.
- **Produtos e serviços:** somem da vitrine e não podem ser comprados ou agendados.
- **Pedidos e agendamentos em aberto:** não são cancelados automaticamente; o admin trata caso a caso. Fica registrado como pendência operacional.

**Efeitos:** E-01 (R2, esforço G, junto com o gate de parceiro); botão "Desativar/Reativar" no painel (R4).

### Registro da decisão

- [x] G1 · [ ] G2 · [ ] G3 · [ ] Outra: —
- Desativar bloqueia o login e os tokens já emitidos na requisição seguinte, tira produtos e serviços da vitrine e não envia o e-mail de correção. "Recusar cadastro" continua reservado à moderação.
- Pedidos e agendamentos em aberto: não são cancelados automaticamente; o admin trata caso a caso (pendência operacional).

---

## DEC-D — Definição de "Pet Sitter operacional"

**Achado relacionado:** AUD-15 (e parte de AUD-01 e AUD-16) · **Afeta:** E-01, E-04, E-17, vitrine e BKG

### Contexto

- A decisão 1 do plano define: sitter operacional = parceiro `APROVADO` **e** avaliação (questionário) `APPROVED`.
- Na prática a regra só vale na listagem pública de sitters (`isOperationalSitter`, usado apenas em `ProviderController.js:115`).
- Gestão de serviços (`serviceAccess.js:39`), agendamento e detalhe público checam só o status do parceiro, ou nada.
- O admin pode aprovar um sitter pelo `PATCH /providers/:id/status` **sem avaliação nenhuma**. A aprovação pela avaliação (`UserController.js:265-321`) também grava `APROVADO`.
- **Resultado:** há dois caminhos de aprovação e verificações diferentes em cada ponto. Um sitter pode, por exemplo, ter serviços ativos e não aparecer na vitrine.

### Perguntas a decidir

1. A avaliação aprovada continua obrigatória para o sitter operar?
2. Por qual caminho o sitter é aprovado?
3. Depois de uma avaliação recusada, o sitter pode enviar outra?

### Opções

**D1 — A aprovação do sitter só acontece pela avaliação, com um único verificador de "parceiro operacional"**

- `PATCH /providers/:id/status` recusa `APROVADO` para sitter sem avaliação aprovada.
- Todos os pontos (serviços, agendamento, vitrine, detalhe, produtos) usam o mesmo verificador.
- Prós: cumpre a decisão 1; uma regra só; elimina o atalho do admin.
- Contras: pequena mudança na moderação e na tela de aprovações.

**D2 — Manter dois caminhos, exigindo o verificador completo em todos os pontos**

- Prós: não muda a moderação.
- Contras: um sitter pode ficar "aprovado" e não operacional ao mesmo tempo, o que confunde admin e parceiro; o status perde significado.

**D3 — Abandonar a exigência de avaliação; status `APROVADO` basta**

- Prós: mais simples.
- Contras: contradiz a decisão 1 e o propósito do onboarding (RF-008, RF-010); o questionário vira formalidade.

### Recomendação: **D1**

O status do parceiro passa a significar a mesma coisa para todos os papéis, e um único verificador evita que cada tela invente a própria regra.

- **Pergunta 3:** permitir nova submissão só quando a última avaliação estiver `REJECTED`, uma de cada vez.
- O envio de avaliação fica restrito ao papel Pet Sitter, e a decisão do admin só aceita `APPROVED`/`REJECTED` em avaliação `PENDING`.

**Efeitos:** E-11 (R2 + R4, esforço M) e o verificador reaproveitado em E-01, E-04 e E-17.

### Registro da decisão

- [x] D1 · [ ] D2 · [ ] D3 · [ ] Outra: —
- O admin não consegue aprovar sitter sem avaliação aprovada. Um único verificador de "parceiro operacional" vale em serviços, agendamento, vitrine e produtos.
- Nova submissão de avaliação só quando a última estiver `REJECTED`, uma de cada vez, e só pelo papel Pet Sitter.

---

## DEC-C — Frete, desconto PIX e cupom

**Achado relacionado:** AUD-05 (e AUD-18) · **Afeta:** compra ponta a ponta e evidências do M2

### Contexto

Hoje existem **três totais diferentes** para a mesma compra no modo de pagamento simulado:

1. **Carrinho** (`frontend/src/pages/CartPage.tsx:58-68`): soma, aplica 15% com o cupom `PETMAIS15` e acrescenta frete de R$ 14,90 abaixo de R$ 199. A mensagem de cupom inválido ainda **revela o cupom** ("Tente PETMAIS15").
2. **Checkout** (`CheckoutPage.tsx:143-144,527,642`): soma + frete, **sem** o cupom, e anuncia "5% de desconto no PIX!".
3. **Cobrado** (`CreateOrderUseCase.js`): só a soma dos itens, sem frete, desconto ou cupom.

No modo Mercado Pago, o frete já é zero na tela e no pedido, como a PGT-1 decidiu (`PGT-1-CONFIGURACAO.md`). Também no modo simulado, a tela pede os dados do cartão com "criptografia SSL" sem avisar que é simulação.

### Perguntas a decidir

1. Haverá frete neste semestre? Se sim, por pedido (lojista) ou por carrinho?
2. Haverá desconto por forma de pagamento ou cupom?
3. Como a tela informa que o pagamento é simulado?

### Opções

**C1 — Remover frete, desconto PIX e cupom da interface neste semestre**

- Total exibido = soma dos itens = valor cobrado, em todas as telas.
- Prós: coerente com o backend e com a decisão da PGT-1; esforço pequeno; elimina as promessas falsas.
- Contras: a interface perde elementos de "loja real"; frete e cupom vão para o backlog.
- Impacto: E-06 (R3, esforço P/M).

**C2 — Implementar frete fixo no servidor; remover desconto e cupom**

- Prós: mantém a experiência de frete.
- Contras:
  - exige persistir o frete por pedido (um pedido por lojista multiplica o frete);
  - exige incluir o frete na preferência do Mercado Pago, revendo a decisão da PGT-1;
  - exige decidir a regra de gratuidade por lojista.
- Impacto: E-06 vira esforço M/G, com R1 + R3.

**C3 — Implementar frete, cupom e desconto no servidor**

- Prós: experiência completa.
- Contras: escopo de uma task nova (G ou mais), fora da estabilização.

### Recomendação: **C1**

Corrige a divergência agora, com o menor esforço, e mantém a coerência com o Mercado Pago. Frete calculado depende do endereço no pedido (E-05) e pode voltar como task própria, quando houver.

- **Pergunta 3:** no modo simulado, aviso explícito "Pagamento simulado — nenhum valor real é cobrado"; sem pedir CVV real nem mencionar "criptografia SSL"; sem texto de QR Code ou desconto PIX.
- Exibir "Frete: grátis" só se a equipe quiser assumir isso como regra do semestre. Caso contrário, omitir a linha de frete.

### Registro da decisão

- [x] C1 · [ ] C2 · [ ] C3 · [ ] Outra: —
- Frete: linha omitida (sem frete neste semestre); sem desconto PIX e sem cupom.
- Total exibido no carrinho e no checkout = soma dos itens = valor cobrado.
- Aviso no modo simulado: "Pagamento simulado — nenhum valor real é cobrado", sem pedir CVV real nem mencionar "criptografia SSL".
- Frete e cupom vão para o backlog.

---

## DEC-E — Política de senha única e custo do bcrypt

**Achado relacionado:** AUD-13

### Contexto

| Fluxo | Frontend | Backend |
| --- | --- | --- |
| Cadastro | 8 caracteres + maiúscula + número (`RegisterPage.tsx:49-53`) | **mínimo de 6, sem composição** (`authSchemas.js:22-25`) |
| Troca de senha | 8 + letra + número (`TutorProfile.tsx:26-35`) | 8 + letra + número (`userSchemas.js:24-29`) |
| Recuperação | 8 + maiúscula + número | 8 + maiúscula + número (`authSchemas.js:52-57`) |
| Custo bcrypt | — | 10 no cadastro e na troca; 12 na recuperação |

Quem chama a API direto cadastra senha de 6 caracteres. O texto acadêmico já propôs "8 caracteres, maiúscula e número", sujeito à aprovação da equipe.

**Medição de referência** (bcryptjs, nesta máquina de desenvolvimento): custo 10 ≈ 0,1 s por hash ou comparação; custo 12 ≈ 0,33 s. A Railway pode ser mais lenta.

### Perguntas a decidir

1. Qual regra de senha vale para todos os fluxos?
2. Usuários atuais com senha fora da regra precisam trocá-la?
3. Qual custo de bcrypt usar?

### Opções de regra

- **E1 — 8 caracteres, 1 maiúscula e 1 número:** já é o que o usuário vê no cadastro e na recuperação. A mudança se limita ao backend do cadastro e à regra da troca de senha (front e back).
- **E2 — 8 caracteres, 1 letra e 1 número:** menos restritiva; exige mudar o cadastro no front e a recuperação no front e no back.
- **E3 — mínimo de 10 caracteres, sem regras de composição, com bloqueio de senhas comuns:** alinhada às recomendações atuais de segurança, mas exige lista de bloqueio e mudança em todas as telas. É mais trabalho para este semestre.

### Opções de custo

- **10:** mínimo usual recomendado; mais leve para a infraestrutura.
- **12:** padrão de vários frameworks; cerca de 3 vezes mais caro por login, cadastro e troca.

### Recomendação: **E1 + custo 12**

- **Regra:** E1 é a menor mudança que deixa todos os fluxos iguais ao que o usuário já vê. Um único schema compartilhado no backend e a mesma regra no frontend.
- **Usuários atuais:** sem troca forçada; a regra vale para senhas novas.
- **Custo:** 12 em uma constante única. Logins, cadastros e trocas de senha são pouco frequentes, e o projeto já usa 12 na recuperação. Acompanhar a latência de `/auth/login` nas métricas depois do deploy; se passar de cerca de 1 s, reavaliar para 11.
- Os hashes existentes continuam válidos. Opcionalmente, a senha é refeita com o novo custo no próximo login.

**Efeitos:** E-09 (R2 + R3, esforço M), junto com a normalização do e-mail (sem decisão necessária).

### Registro da decisão

- Regra: [x] E1 · [ ] E2 · [ ] E3 · [ ] Outra: — (8 caracteres, 1 maiúscula e 1 número em cadastro, troca e recuperação; mesmo schema no backend e mesma regra no frontend)
- Custo: [ ] 10 · [x] 12 · [ ] Outro: — (constante única; acompanhar a latência de `/auth/login` após o deploy)
- Troca forçada para usuários atuais: [ ] Sim · [x] Não

---

## DEC-F — Aceite de termos: versão vigente e registro

**Achado relacionado:** AUD-14 · **Decisão 6 do plano, que não tem task**

### Contexto

- A decisão 6 do plano diz que o aceite dos termos "passa a ser capturado de verdade (bloqueia cadastro sem aceite; grava o valor real + data/versão dos termos)".
- Hoje:
  - o campo `terms_accepted` é opcional na API (`authSchemas.js:43`);
  - o cadastro grava `true` sempre (`RegisterUseCase.js:68`), e o banco tem `default(true)` (`schema.prisma:28`);
  - não há data nem versão;
  - as páginas `/terms` e `/privacy` **não exibem versão nem data de publicação**.
- O frontend já exige marcar a caixa (`RegisterPage.tsx:153`), mas isso não vale para quem chama a API diretamente.

### Perguntas a decidir

1. Como identificar a versão dos Termos e da Política de Privacidade?
2. Onde registrar o aceite: no usuário ou em histórico próprio?
3. O que fazer com os usuários já cadastrados?
4. Quando uma nova versão for publicada, será exigido novo aceite?

### Opções

**F1 — Data e versão do aceite no próprio usuário**

- Campos `terms_accepted_at` e `terms_version`. Cadastro sem aceite → 422.
- Prós: uma migration simples; atende à decisão 6.
- Contras: guarda só o último aceite, sem histórico de versões.
- Impacto: E-10 (R2, esforço M), com exibição da versão nas páginas legais (R3).

**F2 — Tabela própria de aceites**

- Usuário, documento (Termos ou Privacidade), versão e data.
- Prós: histórico completo; permite exigir novo aceite quando a versão mudar.
- Contras: mais modelo, mais telas e mais esforço.

**F3 — Manter o booleano, apenas tornando-o obrigatório**

- Contras: não grava data nem versão; **não atende à decisão 6**.

### Recomendação: **F1**

Atende à decisão 6 com o menor esforço e deixa o caminho aberto para F2 no futuro.

- **Versão:** a data de publicação do texto vigente (ex.: `2026-10`), definida em um único ponto de configuração e exibida em `/terms` e `/privacy` como "Versão de …".
- **Usuários atuais:** ficam com versão vazia, entendida como "aceite anterior ao registro de versão"; sem novo aceite neste semestre.
- **Banco:** remover o `default(true)` do campo para cadastros novos.
- **Dados pessoais:** não guardar IP nem dados além de data e versão.
- **Pergunta 4:** novo aceite a cada nova versão fica no backlog, junto com F2.

### Registro da decisão

- [x] F1 · [ ] F2 · [ ] F3 · [ ] Outra: —
- Campos `terms_accepted_at` e `terms_version` no usuário; cadastro sem aceite → 422; sem `default(true)` para cadastros novos; sem guardar IP.
- Identificador da versão vigente: data de publicação do texto vigente, definida em um único ponto de configuração e exibida em `/terms` e `/privacy`. O valor exato é fixado na implementação.
- Usuários atuais: versão vazia ("aceite anterior ao registro de versão"), sem novo aceite neste semestre.

---

## Encaminhamentos (10 min)

1. **Registrar as decisões** no `PLANO-DESENVOLVIMENTO.md` (§3) e nas specs afetadas: AGD-1, AGD-2, PAG-2, BKG-1/2, SCH-1/2, SRV-Fpub e CHK-2. ✅ Concluído em 23/10/2026.
2. **Definir responsáveis pela Fase 1** (bloqueadores) da auditoria, respeitando as trilhas. Plano detalhado em [PLANO-IMPLEMENTACAO-FASE-1-ESTABILIZACAO.md](PLANO-IMPLEMENTACAO-FASE-1-ESTABILIZACAO.md).
   - E-01 — gate de parceiro e desativação (R2): ______
   - E-02 — proteger a listagem de parceiros e o painel do admin (R2 + R4): ______
   - E-03 — limite de requisição e imagens (R2): ______
   - E-04 — agendamento conforme DEC-A/DEC-B (R1): ______
   - E-05 — endereço no pedido (R1 + R3): ______
   - E-06 — total exibido = cobrado conforme DEC-C (R3): ______
3. **Confirmar o início da Sprint 4:** PAG-2, BKG-1/2 e SCH-1/2 só depois de E-01, E-02 e E-04; AVL-1 e STO-1 podem seguir em paralelo.
4. **Antecipar da Sprint 5** o que a auditoria já mapeou: itens da SEC-2 (erros padronizados, `/api/metrics`, validação de UUID), da INF-2 (dependências e auditoria bloqueante) e da QA-3 (acessibilidade). Decidir se entram agora: ______
5. **Prevenção imediata:** ativar a proteção da `main` (PR obrigatório com checks) e adotar o checklist de Definition of Done no PR. Responsável: ______

## Fora da pauta (não exigem decisão, só execução)

Estes itens da auditoria podem começar sem a reunião, porque não mudam regra de negócio combinada:

- E-02: proteger `GET /providers` e criar a listagem do admin.
- E-03: limite de corpo e imagens.
- E-05: endereço no pedido.
- E-07: padrão de erros.
- E-08: estoque e concorrência.
- E-12: travas de exclusão de pet e endereço.
- E-15: minimização de dados.
- E-16: dependências.
- E-24 e E-25: proteção da `main` e checklist de DoD.
- Normalização do e-mail (parte de E-09).

Detalhes e critérios de aceite na seção 10 e na seção 11 da auditoria.
