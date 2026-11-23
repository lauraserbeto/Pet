# E-08 — Integridade de pedidos, estoque e pagamento

Entrega local de 19/11/2026, na branch `tasks-laura`, sobre a main `d593b03` e as entregas locais anteriores. Sem commit, push, publicação ou acesso ao banco de produção.

## Problemas confirmados na base

- O decremento de estoque era um update sem condição. Ler a quantidade antes não impedia duas compras concorrentes de consumirem a mesma unidade.
- O carrinho que decidia os itens do pedido era lido antes da transação; requisições simultâneas podiam trabalhar sobre a mesma versão.
- Cancelar mudava somente o estado do pedido, sem devolver a reserva de estoque.
- A confirmação simulada e as transições do lojista usavam atualização incondicional do estado.
- O lojista podia marcar PAGO quando o Mercado Pago estava desabilitado.
- Webhook, preferência e cancelamento não compartilhavam uma ordem de bloqueio do pedido.
- A edição de quantidade do carrinho consultava produto sem carregar o parceiro exigido pela validação de disponibilidade, recusando produto válido. A consulta foi corrigida.

## Comportamento implementado

### Finalização e estoque

As verificações prévias de endereço próprio, carrinho e disponibilidade foram preservadas. A transação de finalização agora faz sua própria leitura do carrinho, agrupa os itens dessa versão e usa isolamento **Serializable**. O preço continua sendo o snapshot aceito no carrinho, e o endereço continua sendo copiado para cada pedido, conforme E-05.

Os produtos são processados em ordem de UUID. A gravação de estoque usa `updateMany` com ID, status ACTIVE e `stock_quantity >= quantity`. Se uma linha não for alterada, a operação retorna conflito e toda a transação é desfeita. Quantidade inválida ou preço inválido no carrinho também impedem a finalização.

Criação dos pedidos por lojista, itens, decrementos e limpeza do carrinho permanecem na mesma transação. Conflitos de serialização/deadlock reconhecidos pelo Prisma como P2034 retornam 409, orientando atualização dos dados. Não há repetição automática da criação, que poderia consumir uma nova intenção de compra.

A ordenação reduz a possibilidade de locks cruzados; o isolamento e as guardas de gravação são as proteções de integridade. Não foi alegado um benchmark ou a eliminação de toda possibilidade de contenção.

### Pagamento e mudanças de estado

Pagamento, cancelamento, criação de tentativa e webhook adotam a ordem **Order → PaymentAttempt**. O lock de Order é obtido na transação, antes da releitura do estado. Chamadas ao gateway continuam fora de transações de banco.

O pagamento simulado passa a ter transação, lock e atualização condicional de AGUARDANDO_PAGAMENTO para PAGO. Repetir um pagamento já PAGO permanece idempotente. Um pedido cancelado não volta a PAGO. O perfil precisa ser Tutor e a origem precisa pertencer à sessão.

O lojista proprietário pode executar as transições operacionais existentes, mas **não pode confirmar PAGO em nenhum modo**. O papel atual da sessão é passado pelo controller; tutor, hotel, sitter e administrador não ganham permissão de operação de pedidos por possuir um cadastro de parceiro antigo.

O PATCH valida UUID, e o erro de body utiliza `ZodError.issues`, evitando transformar uma entrada inválida em erro interno. As gravações de estado usam o estado corrente como condição; não substituem uma atualização concorrente por um valor calculado antes dela.

### Cancelamento e devolução de estoque

Para pedidos sem tentativa de gateway, os cancelamentos já permitidos em AGUARDANDO_PAGAMENTO, PAGO e PREPARANDO passam a devolver a quantidade dos itens na mesma transação da mudança para CANCELADO. Quantidades são consolidadas por produto e processadas em ordem estável. Não há reativação automática de produto INACTIVE ou OUT_OF_STOCK.

Repetir CANCELADO retorna o estado atual sem nova reposição. Uma falha ao repor qualquer item reverte também a mudança de estado. ENVIADO e CONCLUIDO continuam sem cancelamento nessa rota; não foram criados novos direitos de cancelamento do tutor ou uma interface de cancelamento nesta etapa.

Um pedido antigo já CANCELADO não é reposto retroativamente: o histórico não prova se seu estoque foi conciliado por outro meio. Esta entrega não executa saneamento de pedidos antigos.

### Mercado Pago e conciliação

Qualquer PaymentAttempt vinculada bloqueia o cancelamento local com 409 `PAYMENT_RECONCILIATION_REQUIRED`, inclusive tentativa CREATED, pendente ou recusada. Uma preferência pode estar sendo criada ou continuar utilizável; devolver estoque sem encerrar a possibilidade de cobrança seria inseguro.

A reserva da tentativa passa a ser feita com o lock de Order e nova validação do estado/valor, **antes** de chamar o gateway. Assim, ou o cancelamento vence e a preferência não é iniciada, ou a tentativa vence e o cancelamento precisa de conciliação. Se a chamada externa falhar depois de reservar a tentativa, ela continua vinculada e não se promete cancelamento local automático.

O endpoint simulado também rejeita pedido com tentativa no Mercado Pago, mesmo se o modo global for desabilitado depois: retorna 409 `GATEWAY_PAYMENT_REQUIRED`. Não existe atalho para confirmar localmente uma tentativa externa.

O webhook mantém validação de assinatura, conta sandbox, valor, moeda, referência, duplicidade e conciliação. Uma aprovação tardia de pedido cancelado legado não o reabre nem reserva estoque novamente; a tentativa permanece para revisão conforme o contrato existente. Estornos e contestações do gateway continuam exigindo conciliação manual. **Não foi implementado estorno automático ou cancelamento da preferência externa.**

## Migration e dados legados

Nova migration: `20261119000000_products_stock_nonnegative`.

O CHECK `products_stock_nonnegative` impede novas gravações negativas diretamente no PostgreSQL, inclusive fora da API. É adicionado com NOT VALID e validado imediatamente se não houver negativos existentes. Se houver negativos legados, eles são preservados e a restrição continua protegendo novas gravações, mas fica pendente de validação histórica.

O procedimento de release deve conferir, por leitura autorizada:

```sql
SELECT count(*) AS produtos_com_estoque_negativo
FROM products WHERE stock_quantity < 0;

SELECT convalidated
FROM pg_constraint WHERE conname = 'products_stock_nonnegative';
```

Qualquer ajuste de estoque legado exige conciliação das quantidades. A migration não zera valores, não remove produtos e não infere devoluções antigas. Após a conciliação, a validação da constraint deve ser concluída no procedimento autorizado de banco. Não foram alteradas migrations já aplicadas.

## Relação entre critérios e testes

| Critério | Evidência em orderIntegrityDb.test.js |
| --- | --- |
| Impedir oversell | Dois tutores disputam uma unidade: um pedido, estoque zero e carrinho do perdedor preservado |
| Evitar finalização duplicada | Três POSTs simultâneos: um pedido e um decremento |
| Ler a versão transacional do carrinho | Barreira real no estoque permite alterar a quantidade; checkout perde a versão, responde 409 e preserva a edição |
| Devolver estoque uma vez | Cinco cancelamentos concorrentes e repetição posterior; produto inativo não é reativado |
| Cancelar pedido simulado pago ou em preparação | Cancelamento devolve reserva e pagamento posterior é recusado |
| Pagamento contra cancelamento | Não ressuscita pedido nem duplica reposição |
| Envio contra cancelamento | Uma única transição válida, estoque correspondente ao estado final |
| Rollback da reposição | Trigger de falha reverte CANCELADO; nova tentativa bem-sucedida repõe uma vez |
| Atomicidade de checkout de múltiplas lojas | Falha na segunda loja reverte pedidos, itens e todos os decrementos; carrinho preservado |
| Defesa no banco | Update negativo direto é recusado pelo CHECK |
| Autorização e entrada | Parceiro alheio/tutor/PAGO manual recusados; UUID/body inválidos retornam 422 |
| Link externo não permite liberação de estoque | Gateway controlado fica pausado durante criação; cancelamento e pagamento simulado são recusados |
| Cancelamento antes da tentativa | Preferência não chama o gateway nem cria tentativa |
| Webhook contra cancelamento | Confirmação única e estoque reservado, sem devolução indevida |
| Aprovação tardia de cancelado legado | Mantém CANCELADO, estoque e REVIEW_REQUIRED |

## Verificações concluídas

- Onze migrations aplicadas em PostgreSQL 16 local descartável (`petplus_test`, porta 55446). `prisma migrate diff` contra o schema integrado: sem diferenças.
- Upgrade em segundo banco `petplus_upgrade_test`: primeiras dez migrations, produto fictício com estoque -3, aplicação da nova migration, preservação de -3 e bloqueio de nova escrita negativa. Após correção **somente do dado fictício**, VALIDATE CONSTRAINT passou. Nenhum registro publicado foi acessado.
- Dezesseis novos testes HTTP/PostgreSQL aprovados. A primeira rodada detectou um erro na fixture dos dois tutores, que reutilizava a identidade do primeiro ao compartilhar a loja. A fixture foi corrigida para manter identidades independentes; a rodada posterior passou.
- Sessenta e sete testes existentes de pedidos/gateway aprovados após atualizar mocks para `updateMany`, UUIDs válidos e o novo bloqueio de PAGO pelo lojista. O caso antigo que aceitava o atalho passou a verificar sua recusa, preservando testes de propriedade, alias e transições válidas.
- **Suíte completa do backend: 478 aprovados, zero falhas/ignorados.**
- Lint completo do backend: zero erros e quatro avisos existentes. Lint dos arquivos novos/alterados verificado separadamente.
- **Cinco cenários de navegador aprovados:** dois checkouts com API/PostgreSQL reais em 1280/390 px e três cenários existentes de pagamento com respostas controladas. Os cenários reais criam um pedido de R$ 20,20, pagam no modo simulado, conferem estoque 8, cancelam pelo parceiro, conferem estoque 10, repetem sem nova reposição e exibem Cancelado no histórico do tutor. Endereço e preço snapshot conferidos.
- As duas capturas foram inspecionadas; sem overflow horizontal. Não houve alteração de componentes da aplicação frontend: foi usado o build validado na entrega DSH anterior. A suíte inteira de navegador e o provedor Mercado Pago externo não foram revalidados nesta etapa.

## Evidências

- [Suíte completa — 478 testes](../../evidencias-testes/2026-11-19-e08-backend-tests.log).
- [Dezesseis cenários de integridade](../../evidencias-testes/2026-11-19-e08-integridade.log) e [regressão dos 67 contratos de pedidos/gateway](../../evidencias-testes/2026-11-19-e08-contratos.log).
- [Upgrade com estoque negativo fictício](../../evidencias-testes/2026-11-19-e08-upgrade.log).
- [Cinco cenários do navegador](../../evidencias-testes/2026-11-19-e08-e2e.log).
- [Histórico após cancelamento no desktop](../../evidencias-testes/2026-11-19-e08/pedido-desktop.png) e [no celular](../../evidencias-testes/2026-11-19-e08/pedido-celular.png).

## Reprodução dos cenários de navegador

1. Usar banco local de teste com as onze migrations e JWT_SECRET exclusivo de QA.
2. Definir RUN_DB_INTEGRATION_TESTS=true e DATABASE_URL local. Executar `node scripts/qa-order-integrity-fixture.js <json-temporario>` no backend.
3. Iniciar API local com o mesmo banco/chave e MERCADO_PAGO_ENABLED=false. A fixture contém apenas contas fictícias e duas compras independentes.
4. Definir ORD_E2E_FIXTURE para o JSON e ORD_E2E_API para a URL local terminada em /api/v1.
5. Executar `npx playwright test e2e/order-integrity-real.spec.ts e2e/payment.spec.ts --workers=1 --timeout=60000` no frontend, com o build disponível para preview.
6. Gerar uma fixture nova antes de repetir os cenários, pois eles consomem os carrinhos e cancelam pedidos. Remover os JSONs de sessão e encerrar os recursos ao terminar.

Os testes reais são opt-in; o provisionamento no CI permanece no fechamento de QA. Capturas usam fonte de fallback para não depender do Google Fonts. Os testes de gateway utilizam respostas controladas, sem chamar serviços financeiros externos.

## Continuidade e limites

Esta entrega cobre a E-08 localmente, sem declarar a conclusão de todos os itens de estabilização ou o aceite de release. Permanecem pendentes publicação/revisão da versão integrada, conciliação de legados quando necessária, cancelamento/estorno externo, testes de ambiente publicado e os demais blocos do plano.

Não foi introduzida chave de idempotência entre intenções de checkout de longa duração. A proteção implementada evita o consumo concorrente do mesmo carrinho; recuperação de resposta incerta e retomada da compra continuam exigindo as verificações previstas no item E-19.
