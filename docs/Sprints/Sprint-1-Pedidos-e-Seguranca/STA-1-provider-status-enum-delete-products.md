# STA-1 — Provider.status → enum + migração + DELETE /products

> Sprint 1 · Semana 3 (08–14/set) · Backend · Prioridade Crítico · Esforço M · Responsável R2

## Contexto
`Provider.status` é hoje um `VarChar(50)` livre (`backend/prisma/schema.prisma:55`, default `"PENDENTE"`) e o fluxo grava **sinônimos** conforme o caminho de aprovação:
- `PENDENTE` no cadastro (`RegisterUseCase.js` ~:74, `status: 'PENDENTE'`).
- `APROVADO` na aprovação de lojista/hotel (`ProviderController.updateStatus` :277).
- `ATIVO` na aprovação de pet sitter (`UserController.reviewEvaluation` — `data: { status: 'ATIVO' }`).
- `ACTIVE` também é aceito como aprovado.

Por isso "aprovado" é testado por **conjunto** hoje (`constants/providerStatus.js` — `APPROVED_PROVIDER_STATUSES = ['APROVADO','ATIVO','ACTIVE']`). Isso é frágil e inconsistente.

Além disso, `ProductRepository.delete(id)` já existe (`backend/src/repositories/ProductRepository.js:36-40`), mas **não há rota** `DELETE /products/:id` (`productsRoutes.js` só tem GET/POST/PUT). O frontend já chama esse endpoint (`productService.deleteProduct` → 404 hoje).

## Objetivo
Transformar `Provider.status` em enum consistente (`PENDENTE/APROVADO/REJEITADO/EM_REVISAO`), migrar os dados legados (`ATIVO`/`ACTIVE` → `APROVADO`), implementar o helper "sitter operacional" e adicionar a rota `DELETE /products/:id` com checagem de ownership.

## Escopo / Passos
1. **Enum no schema:** criar `enum ProviderStatus { PENDENTE APROVADO REJEITADO EM_REVISAO }` e trocar `Provider.status` de `String?` para `ProviderStatus` (default `PENDENTE`).
2. **Migração de dados:** gerar migração Prisma que:
   - mapeia valores legados `ATIVO` e `ACTIVE` → `APROVADO` antes/junto da conversão de tipo;
   - garante que valores fora do enum não quebrem a migração (normalizar antes do `ALTER TYPE`).
3. **Ajustar gravações:** `UserController.reviewEvaluation` deve gravar `APROVADO` (não `ATIVO`); `RegisterUseCase` e `ProviderController.updateStatus` já usam `PENDENTE`/`APROVADO`. Usar as constantes de `PROVIDER_STATUS`.
4. **Helper "sitter operacional":** em `constants/providerStatus.js`, adicionar função que retorna operacional = `status === APROVADO` **E** existe `SitterEvaluation` com `status APPROVED`. Definir `EM_REVISAO` como o estado de reenvio após recusa (decisão de negócio 1). Simplificar `APPROVED_PROVIDER_STATUSES` para apenas `['APROVADO']` após a migração.
5. **DELETE /products/:id:** adicionar rota autenticada em `productsRoutes.js`, controller `ProductController.delete`, e use case/`ProductRepository.delete` com **checagem de ownership** (o `provider_id` do produto deve pertencer ao `req.userId`). Retornar 403 se não for dono, 404 se não existir.

## Arquivos envolvidos
- `backend/prisma/schema.prisma` (`Provider.status` :55; novo `enum ProviderStatus`; `Product.status` permanece string)
- `backend/prisma/migrations/` (nova migração de tipo + dados)
- `backend/src/constants/providerStatus.js` (enum, helper "sitter operacional", simplificar conjunto aprovado)
- `backend/src/controllers/UserController.js` (`reviewEvaluation` — gravar `APROVADO`)
- `backend/src/useCases/auth/RegisterUseCase.js` (~:74 — usar constante)
- `backend/src/controllers/ProviderController.js` (`updateStatus` :277 — validar contra o enum)
- `backend/src/routes/productsRoutes.js` (nova rota `DELETE /:id`)
- `backend/src/controllers/ProductController.js` (novo `delete`)
- `backend/src/repositories/ProductRepository.js` (`delete` :36 já existe; adicionar checagem de ownership no use case)

## Dependências
- **Depende de:** INF-0 (baseline de migrações do banco).
- **Bloqueia:** PRD-1 (front consumir `DELETE /products/:id`).

## Critério de aceite (Definition of Done)
- `Provider.status` é enum `PENDENTE/APROVADO/REJEITADO/EM_REVISAO` aplicado no banco.
- Dados legados migrados: nenhum provider com `ATIVO`/`ACTIVE`; todos os aprovados como `APROVADO`.
- Helper "sitter operacional" disponível e usado onde faz sentido (APROVADO + SitterEvaluation APPROVED).
- `DELETE /products/:id` remove o produto **apenas** se pertencer ao lojista autenticado (403 caso contrário, 404 se inexistente).
- Login e listagens de parceiros continuam funcionando com o novo enum (ajustar `isApprovedProviderStatus`).

## Testes
- Migração aplicada em base com dados `ATIVO`/`ACTIVE` → todos viram `APROVADO`.
- Login de lojista/hotel aprovado continua entrando; pet sitter aprovado idem.
- `DELETE` de produto próprio → 200 e some da listagem; `DELETE` de produto de outro lojista → 403; `DELETE` de id inexistente → 404.
- Helper "sitter operacional" retorna false para APROVADO sem SitterEvaluation APPROVED.

## Notas técnicas / armadilhas
- **Ordem da migração é crítica:** normalizar/atualizar os valores de texto (`ATIVO`/`ACTIVE`→`APROVADO`) **antes** de converter a coluna para o tipo enum, senão o `ALTER TYPE` falha. Preferir SQL manual na migração (UPDATE + CREATE TYPE + ALTER COLUMN ... USING).
- `Product.status` (ACTIVE/INACTIVE/OUT_OF_STOCK) é outra coluna e **não** faz parte desta migração — não confundir com `Provider.status`.
- `OrderItem.product` tem `onDelete: Restrict` — deletar um produto que já está em pedidos falhará no banco. Decidir: bloquear delete (retornar erro amigável) ou fazer soft-delete (`status = INACTIVE`). Registrar a escolha; para o MVP, um erro claro "produto vinculado a pedidos" é aceitável.
- Regra do time: migração vai via **Pull Request revisado** — nunca aplicar direto em produção sem revisão.
- Após simplificar `APPROVED_PROVIDER_STATUSES`, revisar todos os usos (`LoginUseCase`, `ProviderController.#getApprovedStatus`) para não quebrar.
