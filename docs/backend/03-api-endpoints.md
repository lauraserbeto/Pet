# 03. Endpoints da API

A API segue o padrão RESTful e está disponível sob o prefixo `/api/v1`.

---

## 📚 Documentação Interativa (Swagger)

A documentação detalhada de cada endpoint, incluindo esquemas de entrada/saída e testes em tempo real, está disponível via Swagger:

- **Local:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Produção:** [https://api-petplus.up.railway.app/api-docs](https://api-petplus.up.railway.app/api-docs)

A documentação é gerada automaticamente a partir das anotações JSDoc `@swagger` nas próprias rotas (`routes/*.js`) e controllers — sempre que um endpoint novo é adicionado com a anotação, ele aparece no Swagger sem configuração extra.

---

## 🔐 Autenticação (`/auth`)

- **POST `/register`**: Cadastro de novos usuários (Tutor ou Parceiro).
- **POST `/login`**: Retorna o JWT e dados básicos do usuário.
- **POST `/forgot-password`**: Inicia fluxo de recuperação de senha.
- **POST `/reset-password`**: Redefine a senha com token.

---

## 👤 Usuários (`/users`)

### Próprio perfil
- **GET `/me`**: Retorna dados do perfil logado (id, nome, email, telefone, avatar, role, onboarding_step).
- **PUT `/me`**: Atualiza nome, telefone e avatar_url. **Email é imutável** por esta rota. Retorna o usuário atualizado.
- **PATCH `/me/password`**: Troca a senha. Requer `currentPassword` (validada via bcrypt). `newPassword` deve ter ≥8 chars com ≥1 letra e ≥1 dígito. Invalida tokens de reset pendentes.
- **POST `/me/avatar`**: Upload de foto de perfil em **base64 data URL** (`data:image/{jpeg|png|webp};base64,...`). Limite ~2 MB.

### Avaliação de Pet Sitter
- **POST `/me/evaluations`**: Tutor solicita avaliação para virar Pet Sitter (envia quiz + fotos do ambiente).

### Admin
- **GET `/admin/evaluations?status=`**: Lista avaliações de sitter filtradas (`PENDING|APPROVED|REJECTED`). Requer `role_id = 1`.
- **PATCH `/admin/evaluations/:id`**: Aprova ou rejeita uma avaliação. Atualiza `onboarding_step` do usuário; se aprovado e tem provider, marca `provider.status = ATIVO`.

---

## 🏠 Endereços (`/addresses`)

Todos autenticados; sempre operam sobre o usuário logado.

- **GET `/`**: Lista os endereços do usuário (ordenados `is_default desc, created_at desc`).
- **POST `/`**: Cria novo endereço. CEP validado via ViaCEP server-side (fail-open em timeout). Primeiro endereço criado vira default automaticamente. **Limite 5/usuário** (409 quando atingido).
- **PUT `/:id`**: Atualiza endereço (não altera `is_default` — use o endpoint dedicado).
- **PATCH `/:id/default`**: Define como endereço principal. Operação transacional: zera os outros, marca o alvo.
- **DELETE `/:id`**:
  - Se for o único endereço E houver pedido `PENDING|PREPARING|SHIPPED` → **409**.
  - Se for o default e há outros → promove o mais recente a default na mesma transação.
  - Caso contrário, remove direto.

---

## 🐶 Pets (`/users/me/pets`)

Todos autenticados; ownership por `tutor_id = req.userId`.

- **GET `/`**: Lista os pets do tutor.
- **POST `/`**: Cria novo pet. **Limite 10/tutor**. `species ∈ {DOG, CAT, OTHER}`, `weight_kg ∈ (0, 200]`, `birth_date ≤ hoje`.
- **GET `/:id`**: Detalhe do pet.
- **PUT `/:id`**: Atualiza pet (validações iguais ao POST).
- **DELETE `/:id`**: Remove pet. **Bloqueia (409)** se houver `Appointment` com `status IN (PENDING, CONFIRMED)` e `start_time > now()`.

---

## ❤️ Favoritos (`/favorites`)

Todos autenticados. Suportam alvos polimórficos (`PRODUCT`, `HOTEL`, `SITTER`).

- **GET `/?type=PRODUCT|HOTEL|SITTER`**: Lista favoritos hidratados com o objeto-alvo (produto ou provider). Sem `?type` retorna todos.
- **GET `/ids`**: Versão enxuta — retorna `[{ target_type, target_id }]`. Usado pela SPA para hidratar ícones de favorito ao boot.
- **POST `/`**: Adiciona favorito. **Idempotente:** 201 se criou, 200 se já existia. Valida que o `target_id` existe na tabela correta (com checagem de `role_id` para HOTEL/SITTER).
- **DELETE `/:type/:targetId`**: Remove favorito.

---

## 🛒 Carrinho (`/cart`)

Todos autenticados. **Tudo é recalculado no servidor** — front nunca envia totais.

- **GET `/`**: Retorna o carrinho do usuário (cria vazio se não existe). Aplica **lazy cleanup** se `updated_at > 30 dias` (esvazia e devolve warning `CART_EXPIRED`).
- **POST `/items`** `{ product_id, quantity? }`: Adiciona produto. Soma quantidade se já existir. Rejeita `INACTIVE`/`OUT_OF_STOCK` (409). Aplica cap automático em `min(99, stock_quantity)` e devolve warning `STOCK_CAPPED` quando ajusta.
- **PATCH `/items/:itemId`** `{ quantity }`: Atualiza quantidade. `quantity=0` remove.
- **DELETE `/items/:itemId`**: Remove item.
- **DELETE `/`**: Esvazia o carrinho.
- **POST `/merge`** `{ items: [{product_id, quantity}] }`: Funde o carrinho anônimo (do `localStorage`) ao carrinho do usuário após login. Itens inválidos viram warnings; válidos somam quantidades respeitando estoque e limite de SKUs.

### DTO de resposta (`CartDTO`)
```ts
{
  id, updated_at,
  items: [
    {
      id,                    // cart_item.id (use para PATCH/DELETE)
      product_id,            // product.id (use para navegação)
      quantity,
      unit_price,            // do snapshot
      current_unit_price,    // do Product agora
      price_changed,         // true se mudaram preço desde a adição
      line_total,
      product: { id, name, image_url, stock_quantity, status, provider? }
    }
  ],
  totals: { subtotal, discount, total, total_items },
  warnings: [{ code, product_id?, available?, message }]
}
```

---

## 🏢 Parceiros (`/providers`)

### Endpoints Públicos (Vitrine)
- **GET `/hotels`**: Lista hotéis que passaram no filtro de completitude e estão ativos.
- **GET `/sitters`**: Lista pet sitters e passeadores ativos.
- **GET `/stores`**: Lista lojistas com inventário ativo.
- **GET `/:id`**: Retorna os detalhes completos de um parceiro.

### Gestão (Privado)
- **GET `/me`**: Retorna dados do parceiro logado.
- **PUT `/me`**: Atualiza dados de conta.
- **PUT `/profile`**: Atualiza dados da vitrine (fotos, taxas, serviços).
- **GET `/completeness`**: Retorna checklist de campos faltantes no perfil.

---

## 📦 Produtos (`/products`)

- **GET `/`**: Lista produtos ativos em toda a plataforma.
- **GET `/options`**: Categorias e tipos de pet (opções para filtros).
- **GET `/:id`**: Detalhes de um produto.
- **POST `/`**: Criação de produto (Somente Lojistas).
- **PUT `/:id`**: Atualização de produto.
- **DELETE `/:id`**: Exclusão de produto.
- **GET `/provider`**: Lista produtos do lojista autenticado.

---

## 🩺 Health Check
- **GET `/api/health`**: Verifica conectividade com banco de dados.

---

## Convenções gerais

- **Auth**: `Authorization: Bearer <jwt>` em rotas autenticadas. Middleware `authMiddleware` popula `req.userId` e `req.userRole`.
- **Shape de erro** (4xx/5xx):
  ```jsonc
  {
    "error": { "code": "CONFLICT", "message": "...", "details": ... },
    "message": "..."
  }
  ```
- **Códigos de status**: 200, 201, 204 (sucesso); 400, 401, 403, 404, 409, 422, 500 (erros).
- **Validação**: todos os endpoints novos têm Zod schemas em `src/schemas/` aplicados via middleware `validate({ body?, query?, params? })`.
