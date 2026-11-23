# E-18 — Confirmação real, recuperação do carrinho e cache de pedidos

Entrega local de 22/11/2026 sobre `d593b03`, na branch `tasks-laura`, preservando as alterações acumuladas. Sem commit, push, deploy, migration nova ou uso do banco publicado.

## Problemas reproduzidos

- `CheckoutSuccessPage` dependia de `location.state`, não consultava o pedido e anunciava confirmação, etapa Pago e prazo de três a cinco dias úteis sem comprovação.
- O merge somava as quantidades em cada POST. Se o banco concluísse a operação e a resposta se perdesse, uma repetição poderia somar os mesmos itens novamente. O frontend marcava a tentativa como feita antes da resposta, sem estado recuperável nem retry.
- O cache global `['cart']` não separava contas. Uma resposta atrasada podia atualizar o contexto após troca de sessão.
- O checkout não invalidava o histórico. Chamava DELETE do carrinho após a criação, embora o backend já consumisse os itens na transação; uma exclusão posterior não é necessária e pode apagar itens adicionados depois.

## Confirmação e histórico

O checkout navega para `/checkout/success?orders=<ids>`. A confirmação valida até 50 UUIDs e consulta o endpoint existente `GET /orders/:orderId/payment-status`, que exige Tutor e pesquisa por ID **e** proprietário autenticado. Não foi criada uma rota pública de pedidos.

Estado, loja e total vêm da API. A confirmação global de pagamento só aparece se todos os pedidos retornados estiverem nos estados reconhecidos como pagos. Pendentes e cancelados mostram seus estados; pendente oferece acompanhamento do pagamento. Pedido ausente/alheio retorna mensagem segura, sem mostrar dados ou declarar sucesso. Há carregamento, erro/retry, consulta manual e acesso ao histórico. URL sem IDs válidos mostra pedido não identificado.

Links antigos com IDs no state continuam aceitos e ganham query persistente; status/valores do state não são usados. O parâmetro de retorno do gateway também não comprova pagamento. Foram removidos prazo e rastreador fictícios, sem inventar envio de e-mail ou preparação do pedido.

`refreshOrderHistory` invalida os históricos após criação e pagamentos simulados; a página de acompanhamento também invalida o histórico da conta quando consulta novos dados. A E-19 continua responsável pela paginação. Após consumir o carrinho, o frontend faz consulta/invalidação, **não DELETE extra**. Assim, um item novo no servidor não é apagado por uma limpeza tardia do checkout.

Se a criação receber timeout, falha de transporte/5xx ou resposta não confiável sem IDs, a tela interrompe novos envios e orienta consultar o histórico/revisar o carrinho. Não transforma a incerteza em falha definitiva nem repete POST automaticamente. Se os IDs já chegaram e o pagamento falhou, conserva o fluxo de recuperação pela página de pagamento.

## Merge recuperável sem migration

### Protocolo opcional `baseline`

O frontend consulta o carrinho da conta antes da primeira tentativa e envia:

```json
{
  "items": [{ "product_id": "UUID", "quantity": 2 }],
  "baseline": [{ "product_id": "UUID", "quantity": 3 }]
}
```

O alvo desse produto é **3 + 2 = 5**, limitado a 99/estoque disponível. Produto sem linha na baseline parte de zero. Repetir o mesmo payload não transforma cinco em sete:

- Quantidade atual igual à anterior: aplicar o alvo.
- Quantidade atual igual ao alvo: já está reconciliado; não somar novamente.
- Outra quantidade: 409, sem sobrescrever uma alteração conflitante.

As alterações acontecem numa transação Serializable, com lock no carrinho, ordem determinística de produtos, limites de estoque/SKUs e validação de fornecedor ativo. Conflito em qualquer item reverte as gravações dos outros itens. Conflitos de serialização/deadlock retornam 409, inclusive quando o erro vem do SQL de lock. Produtos indisponíveis/limites mantêm avisos, conforme o comportamento anterior. Não há reserva de estoque pelo merge; o checkout continua revalidando o estoque.

Arrays repetindo o mesmo produto são recusados nesse protocolo. `baseline` é opcional para compatibilidade: **clientes legados sem baseline continuam aditivos e não recebem a mesma proteção contra repetição**. O frontend atual envia a baseline e reutiliza a mesma intenção. Não se afirma idempotência universal de todos os endpoints nem foi criado um recibo de idempotência no banco.

### Intenção local e conta

`useCartSync` guarda itens e baseline em `petplus-cart-sync:<userId>` antes do POST. O lote deixa de ser um carrinho anônimo compartilhado e passa a ser uma intenção dessa conta; os dados não são descartados por erro de rede. Após sucesso, a intenção é removida. Não há JWT ou senha nesse registro.

Carrinho/cache são separados por conta. Respostas só atualizam o contexto se ainda corresponderem à sessão ativa. Resposta da conta anterior não altera a conta nova e não apaga a intenção antiga. Consulta do carrinho em andamento é cancelada antes de reconciliar, evitando substituir o resultado por uma leitura anterior.

O fluxo automático inicia na sessão/montagem apropriada, mas não entra em loop de retry após erro. O usuário pode tentar novamente; uma recarga também retoma o lote persistido. Cliques repetidos durante a mesma operação não geram dois envios. Se outra aba já concluiu e removeu a intenção, um retry reconhece isso e consulta o carrinho, sem novo POST.

Cart e Checkout apresentam sincronização pendente/erro e bloqueiam compra e alterações enquanto a etapa não for resolvida. O usuário pode revisar o carrinho e, **mediante confirmação explícita**, usar apenas os itens que estão na conta, abandonando a intenção local pendente. Essa escolha não apaga produtos do servidor. Erro de consulta do carrinho não aparece como carrinho vazio. Os logs de usuário/papel antes impressos pelo CartContext foram retirados; isso não encerra toda a higiene E-22.

## Arquivos principais

- Backend: `CartController.js`, `cartSchemas.js`, Swagger `cartRoutes.js`; `cartRecoveryDb.test.js` e helper protegido `qa-checkout-recovery-fixture.js`.
- Frontend: `useCartSync.ts`, `CartContext.tsx`, `CartSyncNotice.tsx`, `cartService.ts`; `checkoutOrders.ts`, `orderCache.ts`, CartPage, CheckoutPage, CheckoutPaymentPage e CheckoutSuccessPage.
- Testes: CartSync, confirmação, CartPage e CheckoutPage; E2E real `checkout-recovery-real.spec.ts`.
- Compatibilidade de QA: `schedule.spec.ts` foi alinhado aos guards já existentes. Lojista vê Acesso Negado inline; Tutor vai a `/tutor/perfil`. Mantida a verificação de ausência de tela e chamada da agenda; nenhuma regra de autorização foi afrouxada ou alterada por isso.

## Critérios e validações

| Critério | Evidência |
| --- | --- |
| Confirmação por URL e dados reais | Consulta por ID; status/total da API; recarga; pendente/cancelado; 404 alheio; múltiplas lojas sem confirmação global indevida. |
| Sem duplicação na resposta perdida | Banco: mesmo payload repetido três vezes mantém quantidade cinco. Navegador: primeiro POST é concluído no banco, a resposta é descartada no transporte e o retry continua em cinco. |
| Concorrência e rollback | Dois merges simultâneos aceitam 200/409 sem duplicação; nova tentativa converge. Conflito no segundo item reverte a gravação do primeiro. |
| Regras e propriedade | Estoque/99, duplicidade de produto, sessão e escopo por conta; consulta de confirmação recusa outra conta/parceiro. |
| Recuperação da interface | Baseline reaproveitada após reload, retry explícito, bloqueio de checkout, resposta tardia de outra sessão ignorada e intenção preservada. |
| Escolha consciente | Cancelar confirmação mantém lote; aceitar usa carrinho da conta sem DELETE do servidor. |
| Cache e criação incerta | Histórico pré-carregado é invalidado; refresh sem limpeza extra; timeout impede outro envio na mesma tela. |

Resultados finais locais:

- **559 testes backend aprovados**, zero falhas/ignorados, com PostgreSQL 16; cinco cenários reais novos de recuperação/propriedade.
- **213 testes frontend em 43 arquivos aprovados**; inclui confirmação, merge, troca de conta, ação de revisão e cache.
- Typecheck e build aprovados; lint sem erros, um aviso backend e 122 frontend. Avisos existentes de chunk/Zod permanecem.
- **28 cenários de navegador aprovados**: 26 existentes com API controlada/smoke e dois novos reais, incluindo perda deliberada de resposta após commit. Desktop 1280 e celular 390; seis capturas de erro de merge, confirmação e pedido alheio inspecionadas.

A auditoria automatizada não encontrou violações críticas nas páginas verificadas, mas a landing mantém uma violação séria de contraste em dois elementos. A correção completa de acessibilidade permanece na fila, sem ser considerada resolvida pelos cenários aprovados.

As primeiras rodadas identificaram o erro de serialização do lock, corrigido para conflito operacional, e um teste de cache com `gcTime=0` que removia o histórico antes da asserção. O teste passou a representar um histórico retido (`gcTime/staleTime` infinitos), sem mudar essa política na aplicação. Dois E2E antigos esperavam home em vez do estado atual dos guards; foram corrigidos após conferir o código, preservando a asserção de segurança. Não contar rodadas incompletas como aprovação.

## Reprodução, evidências e limites

Usado apenas o banco novo `petplus_e18_test` em 127.0.0.1:55432, no container local já existente. Os bancos `petplus_dev_test`, `petplus_ci_test` e a produção não foram usados/limpos. As 15 migrations anteriores foram aplicadas na base nova, sem mudança de schema. Runtime da rodada: Node global 24.18.0; referência INF-2 permanece Node 24.22.3/npm 11.19.1.

Para reproduzir, configurar explicitamente banco local descartável, NODE_ENV=test, RUN_DB_INTEGRATION_TESTS=true, chave JWT de teste e credenciais falsas/DSN vazio. Executar a suíte de banco ou criar uma massa com o helper de QA. O helper exige ambiente protegido e arquivo absoluto exclusivo. O E2E exige `E18_FIXTURE`, API local em 3318, build/preview em 4173; sem fixture é opt-in ignorado.

Logs e capturas em `evidencias-e18/`, sem fixture com tokens, senhas ou `.env`. A perda da resposta é uma falha de transporte injetada; os dados e as gravações do cenário são reais no PostgreSQL local. Outros cenários da regressão usam API controlada e não validam serviços externos.

Não há garantia de processamento exatamente uma vez para criação de Order, recibo de idempotência persistido no servidor, coordenação completa de todos os clientes/abas ou suporte a perder/apagar o armazenamento local durante uma tentativa incerta. Nessas situações, conservar o fluxo explícito de revisão e os conflitos, sem repetir automaticamente operações financeiras. Não foram validados Resend, gateway real, produção, acessibilidade completa ou release global.

Próxima frente sugerida: reproduzir E-13 (retorno/correção de cadastro recusado) e depois E-33 e demais pendências restantes. Parte dos guards e validações já foi implementada; não recriar nem declarar ausente sem conferir.

Encerramento conferido: API/preview de QA parados, banco exclusivo `petplus_e18_test` e três fixtures temporárias com tokens removidos. Container de desenvolvimento original preservado, sem limpar seus outros bancos. HEAD `d593b03`, stash e alterações anteriores preservados; índice vazio, sem conflitos. O diff dos arquivos desta entrega passou na verificação de whitespace com a normalização do repositório.
