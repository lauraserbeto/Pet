# SRV-F1 — UI de gestão de Serviços (parte 1) + campo payment_policy

> Sprint 3 · Semana 6 (29/set–05/out) · Frontend · Prioridade Alta · Esforço M · Responsável R4

## Contexto
Com o CRUD de serviços exposto no backend (SRV-1), hotel e pet sitter aprovados precisam de uma UI para cadastrar seus serviços. Hoje não existe tela para isso. Além disso, a decisão de negócio 3 define a `payment_policy` por parceiro (**PRESENCIAL** padrão / **PRE_PAGO**), que precisa de um seletor nas Configurações — servindo de base para o CFG-1 e para o comportamento do agendamento (AGD-2).

## Objetivo
Entregar a primeira parte da UI de serviços — o **formulário de criação** (nome, tipo, preço, unidade de cobrança) — e adicionar o **seletor de `payment_policy`** nas Configurações do parceiro, persistido no backend.

## Escopo / Passos
1. **Serviço (service layer):** criar `serviceService.ts` sobre `httpClient` consumindo `POST /providers/services` e `GET /providers/services`.
2. **Hook React Query:** `useServices` (query da lista + mutation de criação) em `lib/hooks`.
3. **Formulário de criação** (react-hook-form): campos **nome**, **tipo** (`category`), **preço** e **unidade de cobrança** — diária (hotel) ou visita/hora (sitter), derivada do tipo do parceiro. Validar nome obrigatório e preço não-negativo.
4. **Listagem** dos serviços já cadastrados do parceiro (base para editar/excluir em SRV-F2), com estados loading/vazio/erro.
5. **Seletor `payment_policy`** nas Configurações: opções PRESENCIAL (padrão) / PRE_PAGO, persistido via `providerService`/`PUT /providers/me` (ou endpoint de configurações acordado). Base do CFG-1.
6. Feedback de sucesso/erro (toast) e `HamsterLoader` nos carregamentos.

## Arquivos envolvidos
- `frontend/src/lib/services/serviceService.ts` (novo)
- `frontend/src/lib/hooks/useServices.ts` (novo)
- `frontend/src/pages/` — página/aba de gestão de serviços do parceiro (nova)
- `frontend/src/pages/` — Configurações do parceiro (adicionar seletor `payment_policy`)
- `frontend/src/lib/services/providerService.ts` (persistir `payment_policy`)

## Dependências
- **Depende de:** SRV-1 (endpoints de serviços no backend).
- **Bloqueia:** SRV-F2 (editar/excluir parte da mesma UI). Fornece base para CFG-1 (Configurações) e alinha com AGD-2 (que lê `payment_policy`).

## Critério de aceite (Definition of Done)
- Parceiro aprovado cria um serviço pela UI (nome/tipo/preço/unidade) e ele aparece na listagem.
- Unidade de cobrança correta por tipo: hotel = diária; sitter = visita/hora.
- Seletor de `payment_policy` (PRESENCIAL padrão / PRE_PAGO) selecionável e **persistido** (recarregar mantém o valor).
- Estados loading/erro/vazio/sucesso tratados; validações de nome e preço ativas.

## Testes
- Manual: criar serviço → aparece na lista; recarregar mantém.
- Manual: tentar salvar com nome vazio / preço negativo → validação bloqueia.
- Manual: alterar `payment_policy` para PRE_PAGO e recarregar → persistido.
- Verificar loading/vazio/erro na listagem.

## Notas técnicas / armadilhas
- `payment_policy` é campo do `Provider` introduzido em AGD-1; confirmar o endpoint que o persiste antes de ligar o seletor.
- Preço: enviar em formato que o backend sanitiza (o padrão do projeto aceita `R$`/vírgula e converte); alinhar com o contrato de SRV-1.
- Não fabricar a unidade de cobrança no front — derivá-la do tipo do parceiro/serviço vindo do backend.
- Padrão do time: `lib/services/*` sobre `httpClient`, hooks React Query, sempre tratar os quatro estados.
