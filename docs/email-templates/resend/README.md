# Templates Resend - Pet+

Arquivos HTML prontos para upload no editor de Templates do Resend.

## Como usar no Resend

1. Acesse **Templates** no Resend.
2. Crie um template novo.
3. Clique em **Upload HTML**.
4. Envie um dos arquivos `.html` desta pasta.
5. Ajuste os campos `From`, `Subject` e `Preview text`.
6. Publique o template.

Antes do upload, confirme que a logo pública abre em:

```txt
https://petplus.vercel.app/email-assets/petplus-logo.png
```

O arquivo correspondente está em `frontend/public/email-assets/petplus-logo.png` e é publicado junto com o frontend.

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
cadastro-rejeitado
```

Campos recomendados:

```txt
From: Pet+ <no-reply@seudominio.com.br>
Subject: Ajustes necessários no cadastro - Pet+
Preview text: Revise os pontos indicados para reenviar seu cadastro.
```

Variáveis:

```txt
REASON
CORRECTION_URL
```

O alias `cadastro-rejeitado` e os nomes acima precisam ser idênticos aos enviados pelo backend em
`EmailService.sendRejection`. Após importar ou alterar o HTML, publique a versão do
template; rascunhos não são usados pelos envios da API.

O botão aponta para `/parceiro/corrigir-cadastro`, rota protegida prevista na REC-2.
Enquanto a REC-2 não estiver publicada no frontend, o e-mail será enviado normalmente,
mas o destino de correção ainda não estará disponível para o parceiro.

## Observação importante

O backend está preparado para enviar a recuperação de senha usando o alias `password-reset` e a variável `RESET_URL`. Se o alias publicado no Resend for diferente, ajuste o alias no Resend ou o valor usado pelo `EmailService`.

## Checklist de produção

1. Publique primeiro o frontend para disponibilizar a logo pública.
2. Faça upload do HTML atualizado e publique uma nova versão do template no Resend.
3. Configure `EMAIL_FROM` com um remetente do domínio verificado.
4. Configure `EMAIL_REPLY_TO` apenas se houver uma caixa de entrada monitorada.
5. Mantenha SPF e DKIM verificados e adicione DMARC no DNS do domínio.
6. Para o template de recuperação, mantenha o rastreamento de cliques desativado para não reescrever a URL que contém o token.
7. Envie testes para Outlook e Gmail e marque a primeira mensagem como confiável caso um provedor ainda a classifique como lixo eletrônico.
