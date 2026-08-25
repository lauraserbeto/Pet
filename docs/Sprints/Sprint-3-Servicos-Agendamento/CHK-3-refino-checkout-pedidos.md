# CHK-3 — Refino de checkout/pedidos (erros/estoque)

> Sprint 3 · Semana 6 (29/set–05/out) · Frontend · Prioridade Alta · Esforço M · Responsável R3

## Contexto
O checkout já foi reescrito com validação real (CHK-1) e refinado em CHK-2. A `CheckoutPage` (`frontend/src/pages/CheckoutPage.tsx`) tem fluxo em etapas (endereço → pagamento → revisão) com métodos crédito/pix/boleto. Faltam os **casos de borda** que hoje podem travar o usuário: estoque insuficiente no momento da finalização, carrinho vazio e falhas de pagamento. O backend de pedido (`POST /orders`) já baixa estoque de forma transacional (PED-1), então a UI precisa reagir bem aos erros que ele devolve.

## Objetivo
Tratar os casos de borda do checkout com mensagens claras e caminhos de recuperação, para que nenhum erro deixe o usuário preso sem ação possível.

## Escopo / Passos
1. **Estoque insuficiente na finalização:** ao receber o erro do `POST /orders` (produto sem estoque suficiente), exibir mensagem apontando o item afetado e oferecer ação (ajustar quantidade / remover item / voltar ao carrinho). Não perder os demais dados do checkout.
2. **Carrinho vazio:** se o carrinho esvaziar (ou o usuário chegar sem itens), bloquear a finalização e mostrar estado vazio com CTA para a loja, em vez de permitir submeter um pedido vazio.
3. **Erros de pagamento:** falha no pagamento (simulado ou sandbox) mostra feedback específico e permite tentar novamente sem refazer endereço/itens.
4. **Estados de UI:** loading no botão de finalizar (evitar duplo clique/pedido duplicado), erro e sucesso consistentes; usar `HamsterLoader` onde couber.
5. Mensagens em português, amigáveis, mapeadas a partir dos códigos/erros retornados pela API.

## Arquivos envolvidos
- `frontend/src/pages/CheckoutPage.tsx` (principal)
- `frontend/src/pages/CheckoutSuccessPage.tsx` (fluxo de sucesso)
- `frontend/src/lib/services/cartService.ts` / `productService.ts` (leitura de erros da API)
- Hook de finalização de pedido (React Query) — mutation de criação de pedido

## Dependências
- **Depende de:** CHK-2 (checkout refinado) e do `POST /orders` transacional (PED-1) que devolve os erros de estoque.
- **Bloqueia:** nada direto; melhora a robustez do fluxo de compra.

## Critério de aceite (Definition of Done)
- Estoque insuficiente na finalização mostra feedback claro com caminho de recuperação; o usuário consegue corrigir e concluir.
- Carrinho vazio impede finalização e mostra estado vazio com CTA.
- Erro de pagamento mostra mensagem específica e permite nova tentativa sem perder dados.
- Botão de finalizar tem loading e não gera pedido duplicado.
- Nenhum caso de borda deixa o usuário travado.

## Testes
- Manual/e2e: forçar estoque insuficiente e verificar mensagem + recuperação.
- Manual: acessar checkout com carrinho vazio → bloqueio + estado vazio.
- Manual: simular falha de pagamento → mensagem + retry.
- Verificar ausência de pedido duplicado no duplo clique (loading/disable).

## Notas técnicas / armadilhas
- Ler o corpo de erro da API de forma consistente (formato `{ error: { code, message } }` usado no backend) e mapear para mensagens amigáveis; não exibir stack/`error.message` cru ao usuário.
- Sempre tratar os quatro estados (loading/erro/vazio/sucesso), padrão do time.
- Não confiar só na validação de estoque no carregamento — o estoque pode mudar até a finalização; a verdade é o retorno do `POST /orders`.
