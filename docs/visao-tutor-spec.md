# Especificação Técnica — Integração da Visão do Tutor

> Documento de hand-off para desenvolvedores que vão dar continuidade à
> integração frontend × backend dos fluxos do Tutor (Perfil, Endereços,
> Pets, Favoritos e Carrinho).
>
> **Escopo:** o que foi entregue, como funciona, onde encostar e o que
> ainda é dívida. Não é um tutorial — assume familiaridade com React,
> Express, Prisma e Zod.

---

## 1. Visão geral

A entrega cobre 6 fases planejadas em
[integration-plan/tutor-integration-plan.md](../integration-plan/tutor-integration-plan.md):

| Fase | Domínio | Status |
|---|---|---|
| 0 | Fundação (httpClient, AuthContext, errorHandler, validate) | ✅ |
| 1 | Perfil — dados pessoais, senha, **avatar base64** | ✅ |
| 2 | Endereços — CRUD + `is_default` + ViaCEP server-side | ✅ |
| 3 | Pets — CRUD novo + bloqueio de delete com appointment ativo | ✅ |
| 4 | Favoritos — modelo polimórfico (PRODUCT/HOTEL/SITTER) | ✅ |
| 5 | Carrinho — persistente, com merge anônimo→logado | ✅ |

Stack adicionada nesta entrega:

- **Backend:** `zod` (validação), `bcryptjs` (já existia, mais usado)
- **Frontend:** `@tanstack/react-query`, `zod`, `@hookform/resolvers`

---

## 2. Camada de fundação (Fase 0)

### 2.1 Backend

| Arquivo | Responsabilidade |
|---|---|
| [`src/utils/AppError.js`](../backend/src/utils/AppError.js) | Classe de erro operacional com factories (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `validation`, `internal`). Sempre carrega `statusCode`, `code`, `details`. |
| [`src/middlewares/errorHandler.js`](../backend/src/middlewares/errorHandler.js) | Trata `ZodError`, `AppError` e erros conhecidos do Prisma (P2002, P2025, P2003). Mapeia para o shape padronizado. |
| [`src/middlewares/validate.js`](../backend/src/middlewares/validate.js) | Middleware genérico `validate({ body?, query?, params? })`. Substitui `req.body`/`req.query`/`req.params` pelo valor parseado e delega ao errorHandler em caso de falha. |

**Shape de erro padronizado** (em todas as rotas novas):

```jsonc
// 4xx / 5xx
{
  "error": {
    "code": "VALIDATION_ERROR",        // string enum
    "message": "Dados inválidos",      // mensagem amigável
    "details": [ /* opcional */ ]
  },
  "message": "Dados inválidos"          // duplicado no topo para compat
                                        // com services legados que liam
                                        // `data.error` como string
}
```

Padrão de uso em controllers novos:

```js
async myAction(req, res, next) {
  try {
    if (!something) throw AppError.notFound('Recurso não encontrado');
    // ...
    return res.status(200).json(result);
  } catch (err) {
    return next(err); // o errorHandler captura
  }
}
```

### 2.2 Frontend

| Arquivo | Responsabilidade |
|---|---|
| [`src/lib/httpClient.ts`](../frontend/src/lib/httpClient.ts) | Wrapper único sobre `fetch`. Injeta `Authorization: Bearer`, parseia shape de erro novo e legado, exporta `ApiError`, registra `onUnauthorized` que dispara logout em 401. |
| [`src/lib/queryClient.ts`](../frontend/src/lib/queryClient.ts) | `QueryClient` global. `staleTime: 30s`, sem retry em 4xx, sem refetch on focus. |
| [`src/contexts/AuthContext.tsx`](../frontend/src/contexts/AuthContext.tsx) | `AuthProvider` com `user`, `token`, `isAuthenticated`, `isLoading`, `login`, `logout`, `refetchMe`, `setUser`. Conecta o `setUnauthorizedHandler` do httpClient ao `logout`. Faz `refetchMe()` ao montar se há token salvo. |
| [`src/components/auth/ProtectedRoute.tsx`](../frontend/src/components/auth/ProtectedRoute.tsx) | Reescrito consumindo `useAuth`. Mantém a state-machine de onboarding do sitter (`role_id === 4`) e a flag `adminOnly`. |

Ordem dos providers em [`src/app/App.tsx`](../frontend/src/app/App.tsx):

```
QueryClientProvider
└── AuthProvider
    └── FavoritesProvider
        └── CartProvider
            └── RouterProvider
```

---

## 3. Perfil (Fase 1)

### 3.1 Endpoints

| Verbo | Rota | Autenticado | Body |
|---|---|---|---|
| GET | `/api/v1/users/me` | sim | — |
| PUT | `/api/v1/users/me` | sim | `UpdateProfileDTO` |
| PATCH | `/api/v1/users/me/password` | sim | `ChangePasswordDTO` |
| POST | `/api/v1/users/me/avatar` | sim | `{ image: <base64 data URL> }` |

### 3.2 DTOs (Zod schemas em [`src/schemas/userSchemas.js`](../backend/src/schemas/userSchemas.js))

```ts
type UpdateProfileDTO = {
  full_name?: string;         // 2-150 chars
  phone?: string;             // regex BR
  avatar_url?: string;        // URL (opcional; mas use POST /avatar)
};

type ChangePasswordDTO = {
  currentPassword: string;    // obrigatória
  newPassword: string;        // ≥8 chars, ≥1 letra, ≥1 dígito,
                              //   diferente da atual
};

type UploadAvatarDTO = {
  image: string;              // data:image/{jpeg|png|webp};base64,...
                              // máx ~2.7MB de string ≈ 2MB raw
};
```

### 3.3 Regras críticas implementadas
- Email **imutável** por `PUT /users/me` (campo ignorado se enviado).
- `PATCH /password` valida `currentPassword` com `bcrypt.compare` antes de aceitar a nova.
- Após troca de senha, todos os `PasswordResetToken` pendentes do usuário são marcados como `used=true` (defesa em profundidade contra reuso).
- Avatar: validação dupla (MIME no client + regex de data URL no server). String salva inline em `user.avatar_url` (campo `Text`).

### 3.4 Frontend
- Hook [`useProfile`](../frontend/src/lib/hooks/useProfile.ts) (`useQuery(['me'])` + 3 mutations) sincroniza o cache e o `AuthContext.setUser` no sucesso.
- Página [`TutorProfile.tsx`](../frontend/src/pages/tutor/TutorProfile.tsx) usa React Hook Form + Zod resolver. Campos com máscara aplicada via [`lib/utils/masks.ts`](../frontend/src/lib/utils/masks.ts).

### 3.5 Dívida conhecida
**Avatar em base64 infla `GET /users/me`** em até ~2.7MB por usuário. Aceitável para MVP; em escala, migrar para storage externo (Cloudinary/S3) e guardar só a URL. Já registrado em
[integration-plan §6](../integration-plan/tutor-integration-plan.md).

---

## 4. Endereços (Fase 2)

### 4.1 Endpoints

| Verbo | Rota | Status notáveis |
|---|---|---|
| GET | `/api/v1/addresses` | 200 — ordenado `is_default desc, created_at desc` |
| POST | `/api/v1/addresses` | 201 ou 409 (limite 5) ou 422 (CEP inválido) |
| PUT | `/api/v1/addresses/:id` | 200, 404 se não for do usuário |
| **PATCH** | **`/api/v1/addresses/:id/default`** | 200 — transação atômica |
| DELETE | `/api/v1/addresses/:id` | 204, 409 se único + tem pedido pendente |

### 4.2 Modelo Prisma

Coluna nova em `Address`:

```prisma
is_default Boolean @default(false)

@@index([user_id, is_default])
```

> A **unicidade do default por usuário** (`UNIQUE WHERE is_default = true`) não pode ser expressa em DSL Prisma. O backend garante a invariante via transação no `setDefault`. Há um SQL opcional em
[`prisma/migrations/manual/2026_05_11_add_address_default.sql`](../backend/prisma/migrations/manual/2026_05_11_add_address_default.sql) que cria o índice parcial — recomendado em produção como safety-net.

### 4.3 Regras críticas implementadas
- **Primeiro endereço** criado vira default automaticamente.
- **Set default** em transação: zera `is_default = false` dos outros do mesmo user e marca o alvo como `true`.
- **Excluir o default**:
  - Se não é o único → promove o mais recente (`created_at desc`) a default na mesma transação.
  - Se é o único E há pedido `PENDING/PREPARING/SHIPPED` → bloqueia com 409.
- **Limite de 5 endereços por usuário** → 409 quando atingido.
- **CEP validado via ViaCEP server-side** ([`src/services/CepService.js`](../backend/src/services/CepService.js)): rejeita 422 se ViaCEP retornar `erro: true`; **fail-open em timeout/network** (4s) — não bloqueia o usuário por indisponibilidade de terceiros.
- **Whitelist de 27 UFs** no Zod ([`src/schemas/addressSchemas.js`](../backend/src/schemas/addressSchemas.js)).

### 4.4 Frontend
- [`useAddresses`](../frontend/src/lib/hooks/useAddresses.ts) com optimistic update em `setDefault` e `remove` (rollback em erro).
- [`AddressesSection.tsx`](../frontend/src/components/tutor/AddressesSection.tsx) — componente extraído, RHF + Zod, máscara CEP, asterisco vermelho em obrigatórios, badge "Principal" e botão estrela "Tornar principal".
- Auto-preenchimento via [`useCepLookup`](../frontend/src/lib/hooks/useCepLookup.ts) (ViaCEP no front também, para UX); preenche rua, bairro, complemento, cidade e UF.

---

## 5. Pets (Fase 3)

### 5.1 Endpoints

Todos sob `/api/v1/users/me/pets`, autenticados.

| Verbo | Rota |
|---|---|
| GET | `/` |
| POST | `/` |
| GET | `/:id` |
| PUT | `/:id` |
| DELETE | `/:id` |

### 5.2 DTOs

```ts
type CreatePetDTO = {
  name: string;                          // 1-100 chars
  species: 'DOG' | 'CAT' | 'OTHER';      // enum padronizado
  breed?: string;
  weight_kg?: number;                    // (0, 200]
  birth_date?: string;                   // ISO 8601, ≤ hoje
  medical_notes?: string;
};
```

### 5.3 Regras críticas implementadas
- **Ownership** em todos os métodos: `where: { id, tutor_id: req.userId }`.
- **Bloqueio de delete (409)** se houver `Appointment` com `status IN (PENDING, CONFIRMED)` e `start_time > now()`. Concluídos/cancelados não bloqueiam.
- **Limite de 10 pets** por tutor.
- **Enum `species`** padronizado. Há um SQL opcional em
[`prisma/migrations/manual/2026_05_12_normalize_pet_species.sql`](../backend/prisma/migrations/manual/2026_05_12_normalize_pet_species.sql) que normaliza valores legados PT-BR → enum, **só rode se houver dados antigos**.

### 5.4 Frontend
- [`usePets`](../frontend/src/lib/hooks/usePets.ts) com optimistic remove.
- [`TutorPets.tsx`](../frontend/src/pages/tutor/TutorPets.tsx) com RHF + Zod, modal único create/edit, label PT-BR via `SPECIES_LABEL`.

---

## 6. Favoritos (Fase 4)

### 6.1 Endpoints

| Verbo | Rota | Notas |
|---|---|---|
| GET | `/api/v1/favorites?type=PRODUCT\|HOTEL\|SITTER` | Hidratado com produto/provider |
| **GET** | **`/api/v1/favorites/ids`** | Rota enxuta para hidratar ícones na SPA |
| POST | `/api/v1/favorites` | Idempotente: 200 se já existe, 201 se criado |
| DELETE | `/api/v1/favorites/:type/:targetId` | 204 |

### 6.2 Modelo polimórfico

```prisma
enum FavoriteTargetType {
  PRODUCT
  HOTEL
  SITTER
}

model Favorite {
  id          String             @id @default(...)
  user_id     String             @db.Uuid
  target_type FavoriteTargetType
  target_id   String             @db.Uuid
  created_at  DateTime

  @@unique([user_id, target_type, target_id])
  @@index([user_id, target_type])
}
```

**Não há FK física** para o `target_id` (limitação de polimorfismo em SQL). O backend valida a existência do alvo na tabela apropriada em cada `POST`:

- `PRODUCT` → existe em `products`?
- `HOTEL` → existe em `providers` E `provider.user.role_id === 3`?
- `SITTER` → existe em `providers` E `provider.user.role_id === 4`?

E na **listagem hidratada**, registros "dangling" (target deletado) são filtrados silenciosamente. Limpeza definitiva pode virar um job futuro.

### 6.3 Frontend
- [`FavoritesContext`](../frontend/src/contexts/FavoritesContext.tsx) carrega o `Set<\`${type}:${id}\`>` no boot via `/favorites/ids`. Expõe `isFavorite(type, id)` e `toggle(type, id)`.
- Toggle com **otimismo + rollback em erro** + lock `inFlightRef` para prevenir double-click.
- Toast "Faça login para favoritar." quando usuário anônimo clica.
- Páginas migradas: [ShoppingPage](../frontend/src/pages/ShoppingPage.tsx), [HotelsPage](../frontend/src/pages/HotelsPage.tsx), [WalkersPage](../frontend/src/pages/WalkersPage.tsx), [ProductDetailPage](../frontend/src/pages/ProductDetailPage.tsx).

---

## 7. Carrinho (Fase 5)

### 7.1 Endpoints

Todos sob `/api/v1/cart`, autenticados.

| Verbo | Rota | Comportamento |
|---|---|---|
| GET | `/` | Cria carrinho vazio se não existe. Lazy cleanup se `updated_at > 30d`. |
| POST | `/items` | Adiciona ou soma quantidade. 200 se já existia, 201 se criado. |
| PATCH | `/items/:itemId` | `quantity=0` remove. |
| DELETE | `/items/:itemId` | 200 |
| DELETE | `/` | Esvazia o carrinho |
| POST | `/merge` | Funde lista anônima ao carrinho do usuário após login. |

### 7.2 Modelos novos

```prisma
model Cart {
  id         String     @id @default(...)
  user_id    String     @unique     // 1:1 com User
  items      CartItem[]
}

model CartItem {
  id                  String  @id @default(...)
  cart_id             String
  product_id          String
  quantity            Int
  unit_price_snapshot Decimal @db.Decimal(10, 2)    // ⭐ congelado na adição
  @@unique([cart_id, product_id])
}
```

### 7.3 DTO de resposta (`CartDTO`)

```ts
type CartDTO = {
  id: string;
  updated_at: string;
  items: CartItemDTO[];
  totals: {
    subtotal: number;          // ⚠ sempre computado no servidor
    discount: number;
    total: number;
    total_items: number;
  };
  warnings: Array<{
    code: 'STOCK_CAPPED' | 'CART_EXPIRED'
        | 'PRODUCT_NOT_FOUND' | 'PRODUCT_UNAVAILABLE'
        | 'SKU_LIMIT_REACHED';
    product_id?: string;
    available?: number;
    message: string;
  }>;
};

type CartItemDTO = {
  id: string;                  // ← cart_item.id (use para PATCH/DELETE)
  product_id: string;          // ← product.id (use para navegação)
  quantity: number;
  unit_price: number;          // do snapshot
  current_unit_price: number;  // do Product agora
  price_changed: boolean;      // true se mudaram preço desde a adição
  line_total: number;
  product: { id, name, image_url, stock_quantity, status, provider? };
};
```

### 7.4 Regras críticas implementadas
- **Estoque + status:** rejeita 409 se `Product.status !== ACTIVE` ou `stock_quantity <= 0`.
- **Cap automático:** se a quantidade pedida ultrapassa `min(99, stock_quantity)`, ajusta para o teto e devolve um `warning STOCK_CAPPED`.
- **Limites:** 50 SKUs distintos por carrinho, 99 unidades por item.
- **Snapshot de preço:** `unit_price_snapshot` congela o preço no momento da adição/atualização. Ao ler o cart, comparamos com o preço atual do produto — se diferente, item recebe `price_changed: true`.
- **Recálculo de totais SEMPRE no servidor.** O front nunca envia `total`.
- **Cleanup lazy:** ao `GET /cart`, se `updated_at` > 30 dias, esvazia e devolve `warning CART_EXPIRED`. Não exige job/cron.
- **Merge anônimo→logado:** ao logar, se há `petplus_anon_cart` no `localStorage`, dispara `POST /cart/merge`; itens inválidos viram warnings, válidos somam quantidades respeitando cap.

### 7.5 Frontend
- [`cartService`](../frontend/src/lib/services/cartService.ts) com `get/addItem/updateItem/removeItem/clear/merge`.
- [`CartContext`](../frontend/src/components/cart/CartContext.tsx) reescrito como **dual-mode**:
  - **Anônimo:** itens em `localStorage` chave `petplus_anon_cart`.
  - **Autenticado:** itens via `useQuery(['cart'])`, mutations otimistas.
  - **Transição:** effect observa o `token`. Quando passa de `null → string`, dispara `cart/merge` e limpa o `localStorage`. Toast "Carrinho sincronizado com sua conta".
- **API pública mantida:** `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `totalPrice`. Novo: `warnings`, `isLoading`. `addItem` aceita segundo arg opcional `quantity` (default 1, cap 1–99).
- **Bug corrigido:** `CartItem.id` agora é `string` (UUID), não `number`. Campo `product_id` exposto separado para navegação.
- Ícone de carrinho na Navbar ([`Navbar.tsx`](../frontend/src/components/layout/Navbar.tsx)) com badge de contagem.

---

## 8. Outros ajustes nesta entrega

- **Login sincroniza React state**: [`LoginPage`](../frontend/src/pages/auth/LoginPage.tsx) trocou `authService.login` por `useAuth().login`. Resolveu bug onde, logo após login, navegar para rota protegida redirecionava para `/login` (só funcionava com F5).
- **HamsterLoader** em 11 telas que ainda usavam `Loader2` em loaders de página/seção. Botões inline continuam com `Loader2` (escala correta).
- **Máscaras automáticas** de telefone e CEP via [`lib/utils/masks.ts`](../frontend/src/lib/utils/masks.ts) (`formatPhone`, `formatCep`, `PHONE_MASKED_REGEX`, `CEP_MASKED_REGEX`).
- **Avatar via base64** funcional (foto de perfil); regras detalhadas em §3.5.

---

## 9. Como rodar / aplicar em ambiente novo

1. **Dependências:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. **Variáveis de ambiente** (backend/.env):
   - `DATABASE_URL` — PostgreSQL
   - `JWT_SECRET`
   - `PORT` (default 3000)
3. **Aplicar schema:**
   ```bash
   cd backend
   npx prisma db push     # cria favorites, carts, cart_items, coluna is_default
   npx prisma generate
   ```
4. **(Opcional)** Rodar os SQLs em `backend/prisma/migrations/manual/` para:
   - Backfill do `is_default` para usuários com endereços existentes
   - Índice parcial único `is_default` (safety-net contra race conditions)
   - `CHECK (quantity > 0)` em `cart_items`
   - Normalização de `pets.species` PT-BR → enum
5. **Subir:**
   ```bash
   # terminal 1
   cd backend && npm start
   # terminal 2
   cd frontend && npm run dev
   ```
6. **Swagger:** `http://localhost:3000/api-docs` — todas as rotas novas já estão documentadas via JSDoc inline nas rotas. O `swagger.config.js` varre `routes/*.js` e `controllers/*.js` automaticamente.

---

## 10. Dívidas e roadmap

Itens com `[~]` no [checklist do plano de integração](../integration-plan/tutor-integration-plan.md#7-checklist-de-progresso):

- **Storage de imagens externo** (Cloudinary/S3) para avatar — substituir base64 inline.
- **Token JWT em cookie httpOnly + refresh token** — migrar do `localStorage` atual (vulnerável a XSS).
- **Cron job de limpeza** de carrinhos expirados — hoje só temos lazy cleanup no GET.
- **Debounce 300ms em `updateQuantity`** — optimistic update já dá feedback; é otimização de tráfego.
- **Política multi-lojista do checkout** — definir se um carrinho com produtos de N lojistas gera N pedidos ou 1.
- **Documentar endpoints novos no Swagger Hub público** — atualmente só `/api-docs` local/Railway.
- **Resolver erro pré-existente** em [`Overview.tsx:85`](../frontend/src/pages/dashboard/Overview.tsx) (`providerService.getMe()` inexistente — não é desta entrega, mas atrapalha o type-check).
