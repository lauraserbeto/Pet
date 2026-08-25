# CHK-1 — Reescrever Checkout com validação real

> Sprint 1 · Semana 2 (01–07/set) · Frontend · Prioridade Alta · Esforço M · Responsável R3

## Contexto
`frontend/src/pages/CheckoutPage.tsx` é hoje um protótipo visual sem validação:
- O endereço vem **hardcoded** no estado inicial (`CheckoutPage.tsx:39-47` — "Av. Paulista", CEP fixo etc.).
- O formulário de cartão (`:285-321`) não tem máscara nem validação — qualquer valor (ou vazio) passa.
- O botão "Confirmar Pedido" (`handleFinalize`, `:68-74`) é um `setTimeout` de 2s que apenas limpa o carrinho e navega para `/checkout/success` — **não chama a API**.
- Os botões "Continuar" (`:229` e `:355`) trocam de passo sem validar nada.

Já existe infraestrutura reutilizável: `addressService` (`frontend/src/lib/services/addressService.ts` — `list()`, tipos `Address`) e o hook `useAddresses` (`frontend/src/lib/hooks/useAddresses.ts`), além de `AddressesSection.tsx` (tutor). O `httpClient` tipado é o padrão de acesso.

## Objetivo
Substituir o endereço hardcoded pelos endereços reais do usuário (via serviço de endereços), aplicar máscaras e obrigatoriedade nos campos de cartão, e impedir o avanço entre passos quando houver campos vazios/ inválidos. **Não** ligar o submit real do pedido ainda — isso fica para CHK-2 (depende de PED-1/PED-2).

## Escopo / Passos
1. **Endereço:** carregar os endereços do usuário com `useAddresses`/`addressService.list()`. Se houver endereço padrão (`is_default`), pré-selecioná-lo; permitir escolher entre os cadastrados. Tratar os quatro estados: loading (`HamsterLoader`), erro, vazio (CTA para cadastrar endereço) e sucesso. Remover o objeto `address` hardcoded (`:39-47`).
2. **Cartão:** aplicar máscaras — número `0000 0000 0000 0000`, validade `MM/AA`, CVV `000/0000`. Marcar campos como obrigatórios quando `paymentMethod === "credit"`.
3. **Validação de avanço:**
   - Passo "address": só avança com um endereço selecionado/válido.
   - Passo "payment": para cartão, só avança com número (16 dígitos), nome, validade (MM/AA plausível, não vencida) e CVV preenchidos; PIX/Boleto avançam sem cartão.
   - Exibir mensagens de erro por campo (react-hook-form já é padrão no projeto).
4. **Não** implementar o submit real: manter `handleFinalize` como placeholder claramente marcado `// TODO CHK-2: ligar POST /orders`, ou desabilitar o botão final com aviso de que o pagamento ainda é simulado.

## Arquivos envolvidos
- `frontend/src/pages/CheckoutPage.tsx` (endereço :39-47, cartão :285-321, avanços :229/:355, finalize :68-74)
- `frontend/src/lib/services/addressService.ts` (consumir `list()`)
- `frontend/src/lib/hooks/useAddresses.ts` (hook de endereços)
- `frontend/src/components/ui/input.tsx` / `label.tsx` (componentes já usados)

## Dependências
- **Depende de:** nenhuma.
- **Bloqueia:** CHK-2 (submit real do pedido, que consumirá `POST /orders` de PED-1).

## Critério de aceite (Definition of Done)
- O endereço exibido vem do serviço de endereços do usuário (não hardcoded); estados loading/erro/vazio/sucesso tratados.
- Campos de cartão têm máscara e são obrigatórios quando o método é cartão.
- Não é possível avançar de passo com campos vazios ou inválidos — o usuário vê feedback claro.
- O submit real permanece desligado (placeholder/aviso), sem chamar API de pedido.

## Testes
- Sem endereço cadastrado → estado vazio com CTA, sem crash.
- Tentar avançar com cartão vazio → bloqueado + mensagens.
- Validade vencida ou número com menos de 16 dígitos → bloqueado.
- PIX/Boleto → avança sem exigir cartão.
- Selecionar endereço padrão automaticamente quando existir.

## Notas técnicas / armadilhas
- Não colocar dados de cartão em URL/query string nem logar valores do cartão (privacidade).
- Máscara não substitui validação — validar o valor "limpo" (sem espaços/barras).
- Reaproveitar `react-hook-form` + tipos de `addressService` para consistência.
- Manter o layout/estilo atuais (Tailwind v4, tokens `--color-primary-*`); a task é de comportamento, não de redesign.
- Deixar explícito no código que o pagamento é **SIMULADO** nesta fase (decisão de negócio 7: simulado antes do Mercado Pago sandbox).
