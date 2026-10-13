# PGT-1: configurar e validar o Mercado Pago de teste

O gateway é opcional. `MERCADO_PAGO_ENABLED=false` mantém o pagamento simulado.
Habilitado, o backend aceita apenas vendedor de teste e pagamentos com `live_mode=false`.
Não é uma integração de cobrança real ou de split/repasse aos lojistas.

## 1. Preparar o Mercado Pago

1. Em Mercado Pago Developers > Suas integrações, configure uma aplicação Checkout Pro via Preferences API.
2. Crie/use as contas brasileiras de teste de vendedor e comprador. São contas diferentes.
3. Use o Access Token da aplicação vinculada ao vendedor de teste e anote o User ID deste vendedor. O token pode começar com `APP_USR`; o backend verifica a conta na API, não o prefixo.
4. Configure notificações Webhooks para eventos **Pagamentos** na aplicação correspondente ao token.
5. Cadastre a URL `https://api-petplus.up.railway.app/api/v1/orders/webhook` e obtenha a chave secreta de assinatura.
6. Faça o checkout em janela privada, usando o comprador de teste e os cartões da documentação oficial. Não utilize cartão real nem a conta real do comprador.

## 2. Variáveis no serviço backend da Railway

```dotenv
MERCADO_PAGO_ENABLED=true
MERCADO_PAGO_ACCESS_TOKEN=<access-token-do-vendedor-de-teste>
MERCADO_PAGO_TEST_USER_ID=<user-id-numerico-do-vendedor-de-teste>
MERCADO_PAGO_WEBHOOK_SECRET=<chave-secreta-do-webhook>
BACKEND_PUBLIC_URL=https://api-petplus.up.railway.app
FRONTEND_URL=https://petplus.vercel.app
```

Não colocar o Access Token no frontend nem no Git. Não é necessária Public Key no Pet+ para este redirecionamento hospedado.
Antes de habilitar a flag, aplicar a migration `20261012000000_payment_attempts` pelo Pre Deploy Command `npm run migrate:deploy` e publicar o frontend atualizado.
O frontend descobre o modo pela API, sem uma segunda flag Vite.
Flag ativa com variáveis faltantes impede o boot; flag desativada dispensa as variáveis Mercado Pago.

## 3. Fluxo implementado

- `GET /api/v1/orders/payment-config`: modo disponível, autenticado, sem segredos.
- `POST /api/v1/orders/:orderId/payment-preference`: cria/reutiliza a preferência do pedido do tutor; os preços são lidos dos itens salvos.
- `GET /api/v1/orders/:orderId/payment-status`: pedido e estado do pagamento, restritos ao tutor dono.
- `POST /api/v1/orders/webhook`: público, valida assinatura pelo SDK, consulta o pagamento na API e confere conta de teste, referência, tentativa, valor e moeda.
- Pagamento `approved` confirma `PAGO` em transação com a tentativa. Lock por tentativa e atualização condicional do pedido impedem efeito duplicado ou sobrescrita de cancelamento.
- Pagamentos recusados/pendentes não confirmam pedido. Notificações antigas não sobrescrevem um estado mais recente. Cancelamento local antes de uma aprovação exige conciliação manual (`REVIEW_REQUIRED`).
- No retorno do Mercado Pago, `/checkout/payment` consulta o backend. A query de sucesso nunca confirma um pedido por si só.
- Cada lojista mantém seu pedido e pagamento separado. O retorno recupera os outros pedidos da mesma compra na sessão do tutor. Também é possível retomar por **Meus Pedidos > Pagar pedido**.
- Com gateway ativo, `/pay` simulado e confirmação manual `PAGO` pelo parceiro ficam bloqueados.

## 4. Validar antes de marcar como concluída

1. Aplicar migrations em banco de teste e executar a suíte com `RUN_DB_INTEGRATION_TESTS=true`. O CI já faz isso com Postgres separado; há um teste de três webhooks concorrentes.
2. Com flag desligada, criar e pagar compra simulada, incluindo carrinho com mais de um lojista.
3. Com flag ligada, iniciar compra de teste: o pedido nasce aguardando pagamento, o link abre no Mercado Pago e os dados de cartão ficam somente lá.
4. Usar cartão de teste aprovado: verificar notificação aceita no painel, `payment_attempts.status=APPROVED` e `orders.status=PAGO`; o frontend confirma após consultar a API.
5. Usar cartão recusado: pedido continua aguardando, aparece opção de tentar novamente, sem criar novo pedido nem baixar estoque novamente.
6. Reenviar a mesma notificação: pedido e pagamento mantêm o resultado, sem efeito adicional.
7. Verificar dois lojistas: pagar um não confirma o outro; ambos devem ficar pagos ao terminar.
8. Voltar pelo link de retorno sem pagar não pode marcar `PAGO`.

## Limites desta entrega

- O backend atual calcula `Order.total_price` apenas a partir dos itens. No checkout Mercado Pago, frete adicional é zero para manter revisão e cobrança coerentes; frete calculado/persistido requer evolução do contrato de pedidos.
- Agendamentos PRE_PAGO dependem das rotas e do contrato final de AGD-2. Nesta entrega o gateway confirma pedidos `Order`; não foi criado um fluxo de agendamento paralelo.
- Estorno automático, chargebacks e liberação de estoque por abandono não são implementados aqui. Uma aprovação após cancelamento ou um evento não suportado exige conciliação manual. Preferências pagas não devem ser reutilizadas para uma segunda cobrança.
- As validações locais com mocks não substituem o teste com as credenciais e Webhooks da aplicação Mercado Pago configurada na Railway.

## Referências oficiais

- [Preferências Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/create-payment-preference)
- [Assinatura e configuração do webhook](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications)
- [Compras de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/integration-test/test-purchases)

Para voltar ao simulado, desative a flag após encerrar as tentativas pendentes. Não troque o modo no meio de uma cobrança aguardando confirmação.
