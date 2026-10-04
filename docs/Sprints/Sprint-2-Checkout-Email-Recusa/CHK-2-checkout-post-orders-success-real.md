# CHK-2 — Ligar Checkout ao POST /orders + Success real

> Sprint 2 · Semana 4 (15–21/set) · Frontend · Prioridade Crítico · Esforço G · Responsável R3

## Contexto

O checkout é uma vitrine falsa: em `frontend/src/pages/CheckoutPage.tsx:68` o
`handleFinalize` só faz `await new Promise(r => setTimeout(r, 2000))`, limpa o carrinho e
navega — **nenhum pedido é criado**. Na sequência,
`frontend/src/pages/CheckoutSuccessPage.tsx:14` inventa o número do pedido com
`Math.floor(100000 + Math.random() * 900000)` e a tela ainda afirma "Confirmação enviada
para seu e-mail" (linha 62), o que é falso. Precisamos ligar a finalização ao
`POST /orders` real (PED-2) com pagamento simulado (PAG-1) e refletir o pedido de verdade
na tela de sucesso.

## Objetivo

Criar um `orderService` no front e fazer o checkout finalizar criando um pedido real
(carrinho → `POST /orders` → pagamento simulado), com a tela de sucesso exibindo o número
real do pedido e mensagens honestas; o carrinho é esvaziado só após sucesso confirmado.

## Limite de escopo e pré-requisito já entregue

O bloqueio básico de compra sem autenticação é uma responsabilidade transversal do front,
e não depende do `POST /orders`. Por isso, ele foi tratado antes da CHK-2:

- `/checkout` e `/checkout/success` exigem tutor autenticado;
- ao tentar finalizar deslogado, o carrinho explica que é necessário entrar ou criar conta;
- os itens anônimos são preservados e o tutor retorna ao carrinho após o login/cadastro;
- redirecionamentos pós-login aceitam apenas caminhos internos da aplicação.

A **CHK-2 não deve recriar esse bloqueio**. Ela deve completar a retomada da compra depois
da autenticação, coordenando a sincronização do carrinho com o carregamento do checkout e
eliminando qualquer estado intermediário enganoso.

## Escopo / Passos

1. Criar `frontend/src/lib/services/orderService.ts` sobre o `httpClient` tipado: `createOrder(payload)` (`POST /orders`) e `payOrder(orderId)` (`POST /orders/:id/pay`, de PAG-1).
2. Em `CheckoutPage.tsx:68`, reescrever `handleFinalize`: montar o pedido a partir do carrinho, chamar `createOrder`, depois `payOrder` (pagamento simulado), tratar loading/erro reais e só então `clearCart()` + navegar para a success com o pedido criado.
3. Passar o pedido real para a success (via state de navegação do react-router ou refetch por id) em vez de `Math.random()`.
4. Em `CheckoutSuccessPage.tsx:14`, remover o `Math.random()` e usar o número/ID real; ajustar o card para o status real do pedido.
5. Corrigir a mensagem "Confirmação enviada para seu e-mail" (linha 62): só afirmar se o e-mail de confirmação existir; caso contrário, trocar por texto honesto (ex.: acompanhar em "Meus Pedidos").
6. Tratar erro de criação/pagamento com toast e manter o usuário no checkout (não esvaziar carrinho em falha).
7. Ao retomar uma compra após login/cadastro, aguardar o merge do carrinho anônimo com o
   carrinho da conta antes de testar carrinho vazio ou chamar `POST /orders`. Enquanto isso,
   exibir loading; após sucesso, permitir avançar automaticamente do carrinho para o checkout.
8. Para tutor sem endereço, preferir cadastro em modal/drawer dentro do checkout. Se a seção
   de perfil for reutilizada, preservar a intenção e retornar automaticamente ao checkout
   após salvar ou selecionar o endereço, sem enviar o usuário para a página inicial.

## Arquivos envolvidos

- `frontend/src/lib/services/orderService.ts` — novo serviço (`createOrder`, `payOrder`).
- `frontend/src/pages/CheckoutPage.tsx:68` — `handleFinalize` real (criar + pagar pedido).
- `frontend/src/pages/CheckoutSuccessPage.tsx:14,62` — número real do pedido e mensagem honesta.
- `frontend/src/components/cart/CartContext` — origem dos itens; `clearCart()` só após sucesso.
- `frontend/src/components/cart/CartContext.tsx` — expor estado de sincronização/merge para
  impedir leitura prematura de carrinho vazio após o login.
- `frontend/src/components/tutor/AddressesSection.tsx` ou componente compartilhado de endereço
  — reutilizar o formulário sem duplicar regras de validação.

## Dependências (Depende de / Bloqueia)

- Depende de: **PED-2** (`POST /orders`) e **PAG-1** (pagamento simulado `POST /orders/:id/pay`).
- Bloqueia: **PED-F** (TutorOrders passa a listar os pedidos criados aqui) — dependência lógica, não técnica.

## Critério de aceite (Definition of Done)

- [ ] Finalizar a compra cria um pedido real via `POST /orders` e o marca como pago (pagamento simulado).
- [ ] A tela de sucesso mostra o número/ID **real** do pedido (sem `Math.random()`).
- [ ] O carrinho só é esvaziado após o pedido ser criado e pago com sucesso.
- [ ] Em falha de criação/pagamento, o usuário permanece no checkout com feedback de erro e o carrinho intacto.
- [ ] A mensagem de "e-mail enviado" só aparece se corresponder à realidade; senão, texto honesto.
- [ ] Um visitante não entra no checkout como se fosse um tutor sem endereço; recebe orientação
      para entrar ou criar conta e mantém os itens do carrinho.
- [ ] Após autenticar, o merge do carrinho termina antes da validação de carrinho vazio e da
      criação do pedido; não há redirecionamento indevido para início/carrinho vazio.
- [ ] Tutor sem endereço consegue cadastrar um endereço e retomar o checkout sem perder etapa,
      itens ou forma de pagamento já preenchida.

## Testes

- Compra feliz: finalizar → pedido criado + pago → success com ID real → carrinho vazio.
- Falha de rede no `createOrder` → toast de erro, permanece no checkout, carrinho preservado.
- Falha no `payOrder` após criar → estado tratado (pedido existe em `AGUARDANDO_PAGAMENTO`; mensagem clara).
- Recarregar a success sem state de navegação → tratar ausência de pedido (buscar por id ou redirecionar).
- Visitante clica em finalizar → recebe contexto de autenticação → entra → carrinho é sincronizado
  → checkout é retomado com os mesmos itens.
- Visitante cria uma conta a partir do carrinho → entra → compra pode ser retomada.
- Falha no merge do carrinho → mensagem clara, carrinho local preservado e opção de tentar novamente.
- Tutor sem endereço → cadastra endereço → volta ao checkout com o endereço selecionado.
- Sessão expirada durante o checkout → login → retomada segura, sem duplicar pedido.

## Notas técnicas / armadilhas

- Não confiar em preços do carrinho local como verdade de cobrança; o back recalcula o total (o front apenas exibe).
- `Decimal` do back chega como número/string — formatar em BRL no front, sem refazer o cálculo.
- Evitar duplo pedido: desabilitar o botão durante o processamento (`isProcessing` já existe) e/ou idempotência no `payOrder`.
- Sempre tratar os quatro estados (loading/erro/vazio/sucesso); usar `HamsterLoader` no processamento.
- Não redirecionar por `items.length === 0` enquanto o carrinho autenticado ainda estiver carregando
  ou mesclando itens anônimos.
- Não guardar URL externa como destino pós-login; aceitar somente caminhos internos conhecidos.
- `VITE_API_URL=http://localhost:3000/api/v1` em dev local; não hardcodar URL no serviço.
