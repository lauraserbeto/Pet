# SRV-F2 — UI de gestão de Serviços (parte 2)

> Sprint 3 · Semana 7 (06–12/out) · Frontend · Prioridade Alta · Esforço M · Responsável R4

## Contexto
SRV-F1 entregou a primeira parte da UI de serviços: o `serviceService`, o hook `useServices`, o formulário de **criação** e a listagem dos serviços do parceiro. Falta completar o ciclo de gestão — **editar** e **excluir** serviço — com validações de formulário robustas e os estados de loading/vazio/erro bem tratados, consumindo `PUT /providers/services/:id` e `DELETE /providers/services/:id` (SRV-1).

## Objetivo
Completar a UI de gestão de serviços com edição e exclusão, validação de formulário e feedback consistente em todos os estados.

## Escopo / Passos
1. **Editar serviço:** reaproveitar o formulário de criação em modo edição (pré-preencher nome/tipo/preço/unidade), consumindo `PUT /providers/services/:id` via mutation React Query; invalidar a query da lista ao sucesso.
2. **Excluir serviço:** ação de exclusão com **confirmação** (dialog), consumindo `DELETE /providers/services/:id`; atualizar a lista otimisticamente ou por invalidação.
3. **Validações de formulário:** nome obrigatório, preço não-negativo, tipo/unidade coerentes; mensagens de erro por campo (react-hook-form).
4. **Estados:** loading (mutations e lista), vazio (nenhum serviço cadastrado), erro (falha de API) e sucesso (toast). Usar `HamsterLoader`.
5. Evitar duplo submit (disable/loading no botão) e refletir mudanças na listagem imediatamente.

## Arquivos envolvidos
- `frontend/src/lib/services/serviceService.ts` (adicionar `update`/`delete`)
- `frontend/src/lib/hooks/useServices.ts` (mutations de editar/excluir + invalidação)
- `frontend/src/pages/` — página/aba de gestão de serviços (formulário em modo edição + exclusão)
- Componente de diálogo de confirmação (Radix/shadcn) para a exclusão

## Dependências
- **Depende de:** SRV-1 (endpoints `PUT`/`DELETE` de serviços) e SRV-F1 (service/hook/formulário e listagem base).
- **Bloqueia:** nada direto; fecha o ciclo de gestão de serviços.

## Critério de aceite (Definition of Done)
- Parceiro edita um serviço existente e a mudança reflete na listagem.
- Parceiro exclui um serviço com confirmação; o item some da lista.
- Validações de formulário ativas (nome obrigatório, preço não-negativo) com mensagens por campo.
- Estados loading/vazio/erro/sucesso tratados; sem duplo submit.

## Testes
- Manual: editar serviço → valor atualizado na lista após salvar.
- Manual: excluir serviço → confirmação → item removido; cancelar → nada muda.
- Manual: submeter edição inválida (nome vazio/preço negativo) → validação bloqueia.
- Verificar loading nas mutations e ausência de duplo submit; estado vazio quando não há serviços.

## Notas técnicas / armadilhas
- Ownership é garantido no backend (SRV-1) — mas a UI só deve oferecer editar/excluir para os serviços do próprio parceiro logado.
- Invalidar/atualizar a query da lista após cada mutation para não exibir dados obsoletos.
- Formatar preço em BRL na exibição e enviar no formato aceito pelo backend (mesmo contrato de SRV-F1).
- Padrão do time: `lib/services/*` sobre `httpClient`, hooks React Query, sempre tratar os quatro estados.
