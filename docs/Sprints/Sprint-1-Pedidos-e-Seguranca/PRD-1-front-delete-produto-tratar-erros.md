# PRD-1 — Front: consumir DELETE produto + tratar erros

> Sprint 1 · Semana 3 (08–14/set) · Frontend · Prioridade Alta · Esforço P/M · Responsável R3

## Contexto
O serviço de produtos do frontend já implementa a chamada de exclusão: `productService.deleteProduct(id)` faz `DELETE /products/:id` (`frontend/src/lib/services/productService.ts:120-130`). Porém, até STA-1, essa rota **não existe no backend** e retorna 404. A tela de produtos do dashboard já tem o handler `handleDelete` (`frontend/src/pages/dashboard/Products.tsx:198-208`) ligado ao botão de excluir (`:608`), com `window.confirm`, remoção otimista da lista e `toast`.

Depois que STA-1 entregar o `DELETE /products/:id` com ownership, esta task garante que o fluxo de exclusão funcione de verdade e que os erros de API sejam tratados com feedback claro.

## Objetivo
Ligar o botão de excluir produto ao endpoint real (já existente após STA-1), garantindo que o produto excluído suma da lista e que erros de API (403 ownership, 404 inexistente, 409 vinculado a pedidos) exibam feedback claro ao usuário.

## Escopo / Passos
1. Validar o fluxo `handleDelete` (`Products.tsx:198-208`) contra o endpoint real: em sucesso, remover da lista e `toast.success`.
2. **Tratamento de erros** por caso:
   - 403 (não é dono) → mensagem "Você não tem permissão para excluir este produto".
   - 404 (não existe / já removido) → mensagem adequada e sincronizar a lista.
   - 409/erro de vínculo (produto em pedidos, `onDelete: Restrict`) → mensagem "Este produto está vinculado a pedidos e não pode ser excluído" (alinhar com a decisão tomada em STA-1: erro vs. soft-delete).
   - Erro genérico/rede → toast de erro sem quebrar a UI.
3. Substituir o `window.confirm` por um diálogo de confirmação consistente com o design system (Radix/shadcn) — opcional se o time preferir manter `confirm` no MVP; priorizar o tratamento de erros.
4. Garantir consistência do cache: se React Query gerencia a lista, invalidar a query após exclusão em vez da remoção manual do estado (`setProducts`), para evitar divergência.

## Arquivos envolvidos
- `frontend/src/pages/dashboard/Products.tsx` (`handleDelete` :198-208, botão :608)
- `frontend/src/lib/services/productService.ts` (`deleteProduct` :120-130 — já pronto)
- Componentes de diálogo em `frontend/src/components/ui/` (se substituir `window.confirm`)

## Dependências
- **Depende de:** STA-1 (rota `DELETE /products/:id` com ownership precisa existir no backend).
- **Bloqueia:** nada.

## Critério de aceite (Definition of Done)
- Excluir um produto próprio remove-o da lista imediatamente e exibe sucesso.
- Erros da API (403/404/409/rede) exibem feedback claro e específico ao usuário, sem quebrar a tela.
- A lista permanece consistente após a operação (sem itens "fantasma" nem divergência de cache).

## Testes
- Excluir produto próprio → some da lista + toast de sucesso.
- Forçar 403 (produto de outro lojista) → mensagem de permissão.
- Excluir produto já removido (404) → mensagem e lista sincronizada.
- Produto vinculado a pedido (409) → mensagem de vínculo.
- Erro de rede → toast de erro, UI intacta.

## Notas técnicas / armadilhas
- `productService.deleteProduct` já extrai `errorData.error` da resposta — garantir que o backend (STA-1) retorne mensagens no shape esperado (`{ error: ... }` ou `AppError` padronizado) para o feedback ficar legível.
- Preferir invalidação de query (React Query) à remoção manual do estado para evitar dessincronização.
- Não assumir sucesso otimista sem rollback: se a exclusão falhar após remover da UI, restaurar o item ou re-buscar a lista.
- Alinhar a mensagem do caso "vinculado a pedidos" com a decisão de STA-1 (erro amigável vs. soft-delete `status = INACTIVE`).
