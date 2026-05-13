# 01. Arquitetura do Servidor

O backend do Pet+ segue princípios de separação de responsabilidades (Separation of Concerns), utilizando o Express como framework de roteamento e o Prisma como motor de persistência.

## Estrutura de Pastas (`backend/src/`)

- **`config/`**: Centraliza as configurações de infraestrutura (Banco de Dados, Swagger, Variáveis Globais).
- **`routes/`**: Define os endpoints da API e vincula-os aos controladores. Aplica middlewares de autenticação e validação (`validate`).
- **`controllers/`**: Responsável pela interface HTTP. Recebe a requisição, lê `req.body`/`req.params`/`req.query` (já parseados pelo `validate`), delega à lógica de domínio e devolve a resposta. Em erros, usa `next(err)` para o `errorHandler` central.
- **`useCases/`**: "Coração do negócio". Cada arquivo representa uma ação específica (ex: `RegisterUserUseCase`). Domínios novos podem usar diretamente o controller + repository quando a lógica é trivial.
- **`services/`**: Serviços transversais que não pertencem a uma entidade específica. Ex: `CepService` (integração ViaCEP server-side, fail-open em timeout), `DocumentVerificationService` (validação matemática de CPF/CNPJ).
- **`middlewares/`**: Funções de interceptação:
  - `authMiddleware`: valida JWT, popula `req.userId` e `req.userRole`.
  - `adminMiddleware`: restringe rota a `role_id === 1`.
  - `validate({ body?, query?, params? })`: middleware genérico que aplica um schema Zod e substitui o valor de entrada pelo parseado. Falhas vão para o `errorHandler`.
  - `errorHandler`: handler central de erros. Trata `ZodError`, `AppError` e códigos conhecidos do Prisma (`P2002`, `P2025`, `P2003`). Sempre devolve o shape padronizado.
  - `notFoundHandler`: 404 padronizado para rotas inexistentes.
- **`repositories/`**: Abstração opcional para o Prisma. Encapsula consultas e includes padrão (ex: `CartRepository` define o `ITEM_INCLUDE` reutilizado em todas as queries de carrinho).
- **`schemas/`**: Schemas de validação **Zod** organizados por domínio (`userSchemas`, `addressSchemas`, `petSchemas`, `favoriteSchemas`, `cartSchemas`). Cada arquivo exporta os schemas e constantes relacionadas (ex: `MAX_QTY_PER_ITEM`, `UF_LIST`).
- **`utils/`**: Utilitários. `AppError` é a classe de erro operacional com factories (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `validation`, `internal`).

## Fluxo de uma Requisição (Request Flow)

1. **Request:** O cliente envia `POST /api/v1/addresses` com `Authorization: Bearer <jwt>`.
2. **Router:** `addressRoutes.js` aplica `authMiddleware` (valida JWT, popula `req.userId`).
3. **Validate:** `validate({ body: createAddressSchema })` parseia o corpo via Zod. Se falhar, `next(ZodError)` → errorHandler → 422.
4. **Controller:** `AddressController.createAddress` lê `req.body` já validado, conta endereços (limite 5), chama `CepService.validate`, faz `prisma.address.create`.
5. **Response:** Controller responde `201 {AddressDTO}`. Se algo der errado, chama `next(AppError.conflict('...'))` ou erro do Prisma é capturado pelo handler.
6. **Error path (uniforme):** errorHandler converte qualquer erro para o shape padrão e responde com o status apropriado.

## Padronização

- **Endpoints:** Todos os endpoints são versionados com o prefixo `/api/v1`.
- **JSON:** A comunicação é feita estritamente via JSON. `express.json({ limit: '50mb' })` permite upload de avatar em base64.
- **Documentação:** **Swagger (OpenAPI 3.0)** em `/api-docs`, gerado automaticamente via anotações JSDoc nas rotas (`swagger-jsdoc` varre `routes/*.js` e `controllers/*.js`).
- **Shape de erro padronizado:**
  ```jsonc
  {
    "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos", "details": [...] },
    "message": "Dados inválidos"  // duplicado no topo p/ compat com services legados
  }
  ```
- **Códigos HTTP utilizados:** 200, 201, 204 (sucesso); 400 (BAD_REQUEST), 401 (UNAUTHORIZED), 403 (FORBIDDEN), 404 (NOT_FOUND), 409 (CONFLICT), 422 (VALIDATION_ERROR), 500 (INTERNAL_ERROR).
- **Migrations:** schema gerenciado via `prisma db push` (sem histórico de migrations versionadas). SQLs complementares (índices parciais, CHECKs, backfills) ficam em `backend/prisma/migrations/manual/` e são aplicados sob demanda.
