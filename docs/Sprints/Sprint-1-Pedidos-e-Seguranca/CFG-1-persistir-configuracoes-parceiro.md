# CFG-1 — Persistir Configurações do parceiro

> Sprint 1 · Semana 2 (01–07/set) · Frontend · Prioridade Alta · Esforço M · Responsável R4

## Contexto
`frontend/src/pages/dashboard/Settings.tsx` só **simula** salvamento: todos os handlers (`handleSaveGeral` :29, `handleSaveTaxas` :33, `handleForceLogout` :37, `handleSaveSecurity` :42) apenas disparam `toast.success(...)` — nada é persistido, e ao recarregar a página os valores voltam ao estado inicial em memória (`useState`).

Esta é a base necessária para depois adicionar o campo `payment_policy` do parceiro (fora do escopo desta task, mas o endpoint de atualização precisa existir e persistir agora).

Já existe `providerService` (`frontend/src/lib/services/providerService.ts`) com `updateMe` (:80) e `updatePublicProfile` (:96), que batem em `PUT /providers/me` e `PUT /providers/profile` (ver `backend/src/routes/providerRoutes.js:103,123`). Esses endpoints já persistem no banco via `UpdateProviderAccountUseCase` / `UpdateProviderProfileUseCase`.

Além disso, há `console.*` de debug a remover no `Navbar` de layout — `frontend/src/components/layout/Navbar.tsx:114,119,126,130,135` (logs de sessão com emojis).

## Objetivo
Ligar a tela de Configurações a um endpoint real de atualização do provider, de forma que as configurações persistam após reload, e remover os `console.*` de debug remanescentes.

## Escopo / Passos
1. Ligar os formulários de `Settings.tsx` ao `providerService.updateMe` (ou endpoint de configurações adequado), substituindo os `toast`-only. Enviar os campos editados e tratar loading/erro/sucesso.
2. Carregar os valores atuais do provider (via `providerService.fetchMe`) ao montar a tela, em vez de valores mock em `useState`. Tratar loading (`HamsterLoader`), erro e sucesso.
3. Após salvar com sucesso, invalidar/atualizar o cache (React Query) para que os valores persistam visualmente e após reload.
4. Remover os `console.log`/`console.error` de debug em `Navbar.tsx:114-135`.

> **Nota de escopo:** as abas "Taxas da Plataforma" e "Segurança" (2FA/logout global) são configurações **globais do admin**, não do parceiro — se ainda não houver endpoint para elas, mantê-las claramente marcadas como mock/`TODO` e focar o "salvar de verdade" nos campos que já têm endpoint de provider. Confirmar com o time o recorte antes de codar. O objetivo mínimo é **provar o fluxo de persistência real** ligado ao provider.

## Arquivos envolvidos
- `frontend/src/pages/dashboard/Settings.tsx` (handlers :29-44, estados :15-26)
- `frontend/src/lib/services/providerService.ts` (`fetchMe` :65, `updateMe` :80)
- `frontend/src/components/layout/Navbar.tsx` (remover `console.*` :114-135)
- (Backend já pronto: `PUT /providers/me` → `UpdateProviderAccountUseCase`)

## Dependências
- **Depende de:** nenhuma.
- **Bloqueia:** task futura do campo `payment_policy` do parceiro (fora do Sprint 1).

## Critério de aceite (Definition of Done)
- Ao salvar as configurações, os dados são enviados a um endpoint real e persistem no banco.
- Após recarregar a página, os valores salvos continuam refletidos (não voltam ao mock).
- Estados de loading/erro/sucesso tratados no salvamento.
- Nenhum `console.*` de debug remanescente em `Navbar.tsx` (nem nos handlers alterados).

## Testes
- Alterar um campo, salvar, dar reload → valor persiste.
- Simular erro da API → toast de erro, sem "sucesso" falso.
- Verificar no DevTools/Network que a requisição `PUT` é disparada com o payload correto.
- Buscar por `console.` no `Navbar.tsx` → nenhum resultado.

## Notas técnicas / armadilhas
- Reaproveitar o padrão `providerService` + hook React Query (não usar `fetch` cru).
- Não enviar campos vazios como `undefined` sobrescrevendo dados existentes — enviar só o que mudou (os use cases já ignoram `undefined`).
- Cuidado para não expor dados sensíveis; o backend já foi endurecido em SEC-1 (não retorna `password_hash`).
- `SEC-1` remove `include: { user: true }` cru — se CFG-1 depender de algum campo do `user` na resposta do provider, alinhar o `select` com R2.
