# PRD-2 — Gate de criação de produto (só lojista aprovado)

> Sprint 3 · Semana 7 (06–12/out) · Backend · Prioridade Alta · Esforço M · Responsável R2

## Contexto
Hoje há duas brechas na criação/publicação de produtos (decisão de negócio 5: só LOJISTA aprovado cria/publica; produto de lojista não-aprovado não aparece na loja):
1. `CreateProductUseCase.js` (linhas 20–43) só exige que **exista um `Provider`** vinculado ao usuário — **não checa o tipo (LOJISTA) nem o status (APROVADO)**. Assim, hotel/sitter também conseguem criar produto, e um lojista **PENDENTE** cria produto já com `status: "ACTIVE"`.
2. `ListActiveProductsUseCase.js` filtra apenas `where: { status: 'ACTIVE' }` do **produto** — **não** filtra pelo status do provider. Logo, produto de lojista não-aprovado **aparece na loja pública**.

## Objetivo
Restringir criação/edição de produto a **LOJISTA (role 2) APROVADO** e esconder da loja pública os produtos de lojistas não-aprovados.

## Escopo / Passos
1. **Gate na criação:** em `CreateProductUseCase`, além de localizar o provider, validar que o usuário é **LOJISTA** e que `Provider.status = APROVADO`; caso contrário, lançar `AppError` (403). Mesma checagem na edição (`UpdateProductUseCase`).
2. **Filtro na vitrine:** em `ListActiveProductsUseCase`, restringir também pelo status do provider (só produtos cujo lojista está APROVADO). Ajustar o `where` para cruzar `product.status = 'ACTIVE'` **e** `provider.status = 'APROVADO'`.
3. **Detalhe público:** garantir que `GetProductDetailsUseCase` não exponha produto de lojista não-aprovado (ou trate como não encontrado).
4. Padronizar erros via `next(AppError)` (o controller atual captura no `try/catch` e devolve 500 — melhorar o mapeamento).

## Arquivos envolvidos
- `backend/src/useCases/products/CreateProductUseCase.js` (endurecer gate — linhas 20–43)
- `backend/src/useCases/products/UpdateProductUseCase.js` (mesmo gate)
- `backend/src/useCases/products/ListActiveProductsUseCase.js` (filtrar por `provider.status`)
- `backend/src/useCases/products/GetProductDetailsUseCase.js` (esconder de lojista não-aprovado)
- `backend/src/controllers/ProductController.js` (mapeamento de erro)

## Dependências
- **Depende de:** STA-1 (`Provider.status` como enum consistente, valor `APROVADO`).
- **Bloqueia:** nada direto; corrige regra de negócio e visibilidade da loja.

## Critério de aceite (Definition of Done)
- Só **LOJISTA aprovado** cria/edita produto; hotel/sitter/tutor e lojista PENDENTE recebem 403.
- Loja pública (`GET /products`) **não** mostra produto de lojista não-aprovado.
- Detalhe público não expõe produto de lojista não-aprovado.
- `password_hash`/`document` seguem não vazando nas respostas de produto.

## Testes
- Integração: lojista APROVADO cria produto → 201; lojista PENDENTE → 403; hotel/sitter → 403.
- Vitrine: produto de lojista PENDENTE não aparece em `GET /products`; ao aprovar o lojista, passa a aparecer.
- Detalhe: `GET /products/:id` de produto de lojista não-aprovado → não encontrado/oculto.
- Edição: lojista PENDENTE não edita produto.

## Notas técnicas / armadilhas
- A brecha é dupla: **criação** (useCase só exige Provider) **e** **listagem** (filtra só `status:'ACTIVE'` do produto, confirmado). Corrigir os dois lados — senão o produto some da criação mas continua na loja, ou vice-versa.
- Valor de status: usar exatamente o enum de STA-1 (`APROVADO`), não string livre.
- `req.userRole` (role_id) vem do `authMiddleware`; role 2 = LOJISTA.
- Prisma `Decimal` (`price`) → `Number()` na saída.
