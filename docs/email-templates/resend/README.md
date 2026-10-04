# Templates Resend - Pet+

Arquivos HTML prontos para upload no editor de Templates do Resend.

## Como usar no Resend

1. Acesse **Templates** no Resend.
2. Crie um template novo.
3. Clique em **Upload HTML**.
4. Envie um dos arquivos `.html` desta pasta.
5. Ajuste os campos `From`, `Subject` e `Preview text`.
6. Publique o template.

## Variáveis

O Resend usa variáveis com três chaves:

```txt
{{{RESET_URL}}}
```

Mantenha os nomes exatamente iguais aos listados abaixo.

## Templates

### `password-reset.html`

Uso: recuperação de senha.

Alias recomendado no Resend:

```txt
password-reset
```

Campos recomendados:

```txt
From: Pet+ <no-reply@seudominio.com.br>
Subject: Redefinição de senha - Pet+
Preview text: Use este link para redefinir sua senha com segurança.
```

Variáveis:

```txt
RESET_URL
```

### `order-payment-approved.html`

Uso: confirmação de pagamento/pedido.

Alias recomendado:

```txt
order-payment-approved
```

Campos recomendados:

```txt
From: Pet+ <no-reply@seudominio.com.br>
Subject: Pedido confirmado - Pet+
Preview text: Seu pagamento foi aprovado e seu pedido já está em andamento.
```

Variáveis:

```txt
CUSTOMER_NAME
ORDER_ID
ORDER_TOTAL
ORDER_URL
```

### `provider-correction-needed.html`

Uso: cadastro de parceiro recusado com pedido de correção.

Alias recomendado:

```txt
provider-correction-needed
```

Campos recomendados:

```txt
From: Pet+ <no-reply@seudominio.com.br>
Subject: Ajustes necessários no cadastro - Pet+
Preview text: Revise os pontos indicados para reenviar seu cadastro.
```

Variáveis:

```txt
PARTNER_NAME
REVIEW_NOTES
CORRECTION_URL
```

## Observação importante

O backend está preparado para enviar a recuperação de senha usando o alias `password-reset` e a variável `RESET_URL`. Se o alias publicado no Resend for diferente, ajuste o alias no Resend ou o valor usado pelo `EmailService`.
