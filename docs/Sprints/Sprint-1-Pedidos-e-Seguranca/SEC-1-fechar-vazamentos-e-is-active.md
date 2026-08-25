# SEC-1 — Fechar vazamentos (password_hash, document público) + is_active no login

> Sprint 1 · Semana 2 (01–07/set) · Segurança · Prioridade Crítico · Esforço M · Responsável R2

## Contexto
Várias respostas da API retornam o objeto `user` cru (via `include: { user: true }`), o que vaza `password_hash` (o hash bcrypt) para o cliente. Além disso, rotas públicas expõem o `document` (CPF/CNPJ) do parceiro, e o login nunca verifica o campo `is_active` — um usuário desativado ainda consegue autenticar.

Pontos confirmados no código:
- `ProviderController.getMe` (`backend/src/controllers/ProviderController.js:172-184`) — `include: { user: true }` retornado cru.
- `UpdateProviderProfileUseCase` (`backend/src/useCases/providers/UpdateProviderProfileUseCase.js:63-67`) — `update(... include: { user: true })` retornado ao controller.
- `UpdateProviderAccountUseCase` (`backend/src/useCases/providers/UpdateProviderAccountUseCase.js:23-27`) — idem.
- `ProviderController.getCompleteness` (`:217-220`) também usa `include: { user: true }` (embora só derive flags, evita expor por segurança).
- `document` público:
  - `ProviderController.listPartners` (`:132-159`) espalha `...p` (inclui `document`) — usado em `GET /providers`.
  - `ListActiveProductsUseCase` (`backend/src/useCases/products/ListActiveProductsUseCase.js:3-18`) — `PROVIDER_INCLUDE` com `document: true`.
  - `GetProductDetailsUseCase` (`backend/src/useCases/products/GetProductDetailsUseCase.js:8-26`) — `select` com `document: true`.
  - `listHotels`/`listSitters`/`listStores` já usam `select` no `user`, mas retornam todos os campos do `provider` (incluindo `document`).
- `LoginUseCase` (`backend/src/useCases/auth/LoginUseCase.js:13-41`) — nunca checa `user.is_active`.

## Objetivo
Garantir que nenhuma resposta exponha `password_hash`, que nenhuma rota pública exponha `document` (CPF/CNPJ), e que usuários inativos (`is_active === false`) não consigam logar.

## Escopo / Passos
1. **password_hash:** substituir todo `include: { user: true }` por `select` explícito dos campos necessários (`id`, `full_name`, `email`, `avatar_url`, `role_id`, `phone`, etc.), nunca `password_hash`. Corrigir em `getMe`, `getCompleteness`, `UpdateProviderProfileUseCase`, `UpdateProviderAccountUseCase`.
2. **document público:** remover `document` das respostas públicas:
   - `PROVIDER_INCLUDE` em `ListActiveProductsUseCase` — tirar `document: true`.
   - `select` do provider em `GetProductDetailsUseCase` — tirar `document: true`.
   - `listPartners` — não espalhar `document` (mapear apenas campos públicos; `document` pode permanecer em rotas admin autenticadas se necessário).
   - `listHotels`/`listSitters`/`listStores` — trocar o retorno cru do provider por um mapeamento/`select` sem `document`.
3. **is_active no login:** em `LoginUseCase`, após validar a senha, checar `user.is_active === false` → lançar erro 403 ("Conta desativada. Entre em contato com o suporte."). Confirmar que `UserRepository.findByEmail` traz `is_active`.

## Arquivos envolvidos
- `backend/src/controllers/ProviderController.js` (`getMe` :172, `getCompleteness` :217, `listPartners` :132, `listHotels`/`listSitters`/`listStores` :40-129)
- `backend/src/useCases/providers/UpdateProviderProfileUseCase.js` (:63-67)
- `backend/src/useCases/providers/UpdateProviderAccountUseCase.js` (:23-27)
- `backend/src/useCases/products/ListActiveProductsUseCase.js` (`PROVIDER_INCLUDE` :3-18)
- `backend/src/useCases/products/GetProductDetailsUseCase.js` (:8-26)
- `backend/src/useCases/auth/LoginUseCase.js` (checar `is_active`)
- `backend/src/repositories/UserRepository.js` (garantir `is_active` no `findByEmail`)

## Dependências
- **Depende de:** nenhuma.
- **Bloqueia:** nada diretamente, mas é pré-requisito de qualidade para o marco M1.

## Critério de aceite (Definition of Done)
- Nenhuma resposta da API (pública ou autenticada) contém `password_hash`.
- Rotas públicas (`GET /providers`, `GET /providers/hotels|sitters|stores`, listagem e detalhe de produtos) não contêm `document` (CPF/CNPJ).
- Usuário com `is_active = false` recebe 403 ao tentar logar e não recebe token.
- Fluxos de leitura/atualização de perfil do parceiro continuam funcionando (avatar, dados de conta), apenas sem os campos sensíveis.

## Testes
- `grep`/inspeção de payloads: nenhuma resposta com `password_hash`.
- `GET /api/v1/providers`, `.../hotels`, `.../sitters`, `.../stores`, `GET /api/v1/products`, `GET /api/v1/products/:id` → resposta sem `document`.
- Login de usuário ativo → 200 + token; login de usuário desativado → 403 sem token.
- Teste de regressão do `LoginUseCase` (já existe `tests/unit/loginUseCase.test.js`) para o novo ramo `is_active`.

## Notas técnicas / armadilhas
- **Nunca retornar `user` cru** — sempre `select` explícito (regra do projeto). O mesmo vale para qualquer novo endpoint.
- `document` pode continuar disponível em contexto **admin autenticado** se houver necessidade de negócio — o requisito é não expô-lo em rota pública.
- Cuidado com `listPartners`: ele hoje faz `...p` (espalha todos os campos do provider). Trocar por um objeto explícito com os campos públicos.
- `is_active` é `Boolean?` no schema (`nullable`, default `true`) — tratar `null`/`undefined` como ativo; só bloquear em `=== false`.
- Não expor `document` também em logs (pino) — evitar logar o objeto provider inteiro.
