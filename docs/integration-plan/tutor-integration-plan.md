# Guia Técnico — Integração Front × Back (Visão do Tutor)

> Stack: React/TypeScript (Vite) × Node.js/Express + Prisma + PostgreSQL
> Escopo: Perfil, Endereços, Pets, Favoritos, Carrinho

---

## 0. Diagnóstico do que existe vs. o que falta

| Módulo | Front (mock/real) | Back (status) | Gap principal |
|---|---|---|---|
| Perfil | `TutorProfile.tsx` — real, usa `fetch` cru e `userService` | `UserController.js` `getMe/updateProfile/updatePassword` prontos | `updatePassword` aceita só `newPassword` sem confirmar a atual; mínimo do back (6) ≠ front (8); avatar upload em TODO |
| Endereços | Formulário inline em `TutorProfile.tsx` | `AddressController.js` CRUD pronto | **Não existe `is_default`** no schema; sem regras para 1 default por usuário; sem validação ViaCEP server-side |
| Pets | `TutorPets.tsx` + `petService` chamando `/users/me/pets` | **Não existe** PetController/petRoutes; só o modelo `Pet` em `schema.prisma` | Backend inteiro do módulo + rota PUT que o front ainda nem chama |
| Favoritos | Apenas `useState` local em `ShoppingPage.tsx`, `HotelsPage.tsx`, `WalkersPage.tsx`, `ProductDetailPage.tsx` | **Inexistente** (sem modelo, sem rota) | Modelo, polimorfismo (produto/hotel/sitter), service e contexto front |
| Carrinho | `CartContext.tsx` em memória, mock pré-populado, `id: number` (incompatível com UUID dos produtos) | **Inexistente** | Modelo `Cart/CartItem`, sync, recálculo server-side, correção de tipo do front |

Pontos transversais a corrigir já:
- **Sem cliente HTTP centralizado:** `api.ts` expõe só `API_URL`/`getHeaders()`; cada página usa `fetch` cru → impossível tratar 401 globalmente, fazer retry, parsear erro padronizado.
- **Sem `AuthContext`** — `localStorage` é lido em N lugares; isso quebra com SSR futuro e impede invalidar cache quando o usuário muda.
- **Token sem refresh** — `petplus_token` em localStorage; aceitável para o MVP, mas anote como dívida.

---

## 1. Plano de Implementação Faseado

Premissa: cada fase é **mergeable** isoladamente (PRs pequenos). Sempre back → contrato → front.

### Fase 0 — Fundação (1 PR, antes de tudo)
1. Criar `frontend/src/lib/httpClient.ts` (wrapper sobre `fetch`) com: injeção de Bearer, parse uniforme `{ error|message }`, `throw new ApiError(status, code, message)`, hook `onUnauthorized` que dispara logout.
2. Criar `frontend/src/contexts/AuthContext.tsx` (estado: `user`, `token`, `isAuthenticated`, `login`, `logout`, `refetchMe`) — substitui leituras diretas de `localStorage`.
3. Backend: padronizar shape de erro `{ error: { code, message, details? } }` e criar `errorHandler` middleware (após todas as rotas em `server.js`).
4. Backend: criar `validate(schema)` middleware com **Zod** ou **Joi** — pré-requisito para todos os endpoints novos.

### Fase 1 — Perfil
1. **Back:** adicionar `currentPassword` em `updatePassword`; subir mínimo para 8; comparar bcrypt antes de alterar.
2. **Back:** validar formato de `phone` (regex BR) e tamanho de `full_name` em `updateProfile`.
3. **Back:** rota `POST /users/me/avatar` (multipart) com Multer + storage S3/Cloudinary. Retorna `{ avatar_url }`.
4. **Front:** migrar `handleSavePersonal` e `handleSavePassword` para `userService.updateMe` e `userService.changePassword`; adicionar campo "senha atual"; usar React Hook Form + Zod resolver.
5. **Front:** integrar upload real, com preview otimista + revert em erro.

### Fase 2 — Endereços + endereço principal
1. **Back:** migration Prisma — adicionar `is_default Boolean @default(false)` em `Address` e índice parcial único `@@unique([user_id, is_default]) where is_default = true` (via SQL custom).
2. **Back:** novo endpoint `PATCH /addresses/:id/default` em transação (zera os outros, marca o alvo).
3. **Back:** em `createAddress`, se for o primeiro endereço, marcar `is_default = true` automaticamente.
4. **Back:** em `deleteAddress`, bloquear exclusão se `is_default === true` E existirem pedidos pendentes; se for default e existem outros, promover o mais recente.
5. **Back:** integrar `DocumentVerificationService`/ViaCEP para validar CEP no `create/update`.
6. **Front:** extrair seção de endereços para `AddressesSection.tsx` + criar hook `useAddresses()`.
7. **Front:** adicionar botão "Tornar principal" + badge "Principal" no card; bloquear delete se default e mostrar tooltip.

### Fase 3 — Pets (backend inteiro novo)
1. **Back:** criar `repositories/PetRepository.js`.
2. **Back:** criar `controllers/PetController.js` (`listMyPets / createPet / getPet / updatePet / deletePet`).
3. **Back:** criar `routes/petRoutes.js`, montar como sub-rota `/users/me/pets` **ou** rota dedicada `/api/v1/pets`. Recomendação: dedicada.
4. **Back:** validações: `species ∈ {DOG, CAT, OTHER}`, `weight_kg ∈ (0, 200)`, `birth_date <= hoje`, soft-block se houver `Appointment` futuro.
5. **Back:** registrar rota em `server.js`.
6. **Front:** ajustar `petService` (URL conforme decisão) + adicionar `updatePet` e habilitar edição.
7. **Front:** trocar `setPets`/`useEffect` por hook `usePets()` com cache local.

### Fase 4 — Favoritos (modelo + persistência)
1. **Back:** novo modelo Prisma `Favorite { id, user_id, target_type, target_id, created_at, @@unique([user_id, target_type, target_id]) }`.
2. **Back:** `FavoritesController`: `list`, `add`, `remove` (ou `toggle`).
3. **Back:** validar `target_id` existe na tabela apropriada.
4. **Front:** substituir os 4 `useState` por **um único** `FavoritesContext` que carrega o Set de IDs por tipo no login.
5. **Front:** atualização otimista com revert em erro.

### Fase 5 — Carrinho persistente
1. **Front (correção imediata):** `CartItem.id` precisa virar `string` (UUID). Remover itens mock.
2. **Back:** modelos `Cart { id, user_id @unique, updated_at }` e `CartItem { id, cart_id, product_id, quantity, unit_price_snapshot }`.
3. **Back:** endpoints CRUD + merge. Recálculo do total **sempre no servidor**.
4. **Back:** validações de estoque (`stock_quantity`) e limites.
5. **Front:** estratégia híbrida — anônimo em `localStorage`, ao logar dispara `POST /cart/merge`.
6. **Front:** `CartProvider` sincroniza com servidor após cada mutação (debounce 300ms para `updateQuantity`).

---

## 2. Mapa de Endpoints + DTOs

Base: `/api/v1`. Auth: `Authorization: Bearer <jwt>` salvo onde indicado. Erros: `{ error: { code, message, details? } }`.

### 2.1 Perfil
| Verbo | Rota | Body (DTO) | Resposta | Notas |
|---|---|---|---|---|
| GET | `/users/me` | — | `UserProfileDTO` | já existe |
| PUT | `/users/me` | `UpdateProfileDTO` | `UserProfileDTO` | retornar o user atualizado |
| PATCH | `/users/me/password` | `ChangePasswordDTO` | `204` | validar atual com bcrypt |
| POST | `/users/me/avatar` | `multipart/form-data { file }` | `{ avatar_url }` | novo |

```ts
type UpdateProfileDTO = { full_name: string; phone?: string; avatar_url?: string };
type ChangePasswordDTO = { currentPassword: string; newPassword: string };
type UserProfileDTO = {
  id: string; full_name: string; email: string; phone: string | null;
  avatar_url: string | null; role_id: number; onboarding_step: string;
  created_at: string;
};
```

### 2.2 Endereços
| Verbo | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/addresses` | — | `AddressDTO[]` |
| POST | `/addresses` | `CreateAddressDTO` | `AddressDTO` (201) |
| PUT | `/addresses/:id` | `CreateAddressDTO` (parcial) | `AddressDTO` |
| **PATCH** | **`/addresses/:id/default`** | — | `AddressDTO` (novo) |
| DELETE | `/addresses/:id` | — | `204` (ou `409` se default + tem pedidos) |

```ts
type CreateAddressDTO = {
  cep: string; rua: string; numero: string; complemento?: string;
  bairro: string; cidade: string; estado: string;
};
type AddressDTO = CreateAddressDTO & { id: string; is_default: boolean; created_at: string };
```

### 2.3 Pets
| Verbo | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/users/me/pets` | — | `PetDTO[]` |
| POST | `/users/me/pets` | `CreatePetDTO` | `PetDTO` (201) |
| GET | `/users/me/pets/:id` | — | `PetDTO` |
| PUT | `/users/me/pets/:id` | `CreatePetDTO` (parcial) | `PetDTO` |
| DELETE | `/users/me/pets/:id` | — | `204` (ou `409` com appointments futuros) |

```ts
type CreatePetDTO = {
  name: string; species: 'DOG' | 'CAT' | 'OTHER';
  breed?: string; weight_kg?: number; birth_date?: string;
  medical_notes?: string;
};
```

### 2.4 Favoritos
| Verbo | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/favorites?type=PRODUCT\|HOTEL\|SITTER` | — | `FavoriteDTO[]` |
| POST | `/favorites` | `{ target_type, target_id }` | `FavoriteDTO` (201, idempotente) |
| DELETE | `/favorites?type=X&target_id=Y` (ou `/favorites/:id`) | — | `204` |

```ts
type FavoriteDTO = {
  id: string; target_type: 'PRODUCT' | 'HOTEL' | 'SITTER';
  target_id: string; created_at: string;
  target?: ProductDTO | ProviderDTO;
};
```

### 2.5 Carrinho
| Verbo | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/cart` | — | `CartDTO` |
| POST | `/cart/items` | `{ product_id, quantity }` | `CartDTO` |
| PATCH | `/cart/items/:itemId` | `{ quantity }` | `CartDTO` |
| DELETE | `/cart/items/:itemId` | — | `CartDTO` |
| DELETE | `/cart` | — | `CartDTO` (vazio) |
| POST | `/cart/merge` | `{ items: [{product_id, quantity}] }` | `CartDTO` |

```ts
type CartDTO = {
  id: string; updated_at: string;
  items: CartItemDTO[];
  totals: { subtotal: number; discount: number; total: number; total_items: number };
};
type CartItemDTO = {
  id: string; product_id: string; quantity: number;
  unit_price: number; line_total: number;
  product: { id: string; name: string; image_url: string | null; stock_quantity: number };
};
```

---

## 3. Regras de Negócio Críticas + Validações

### 3.1 Perfil
- **Senha:** mínimo **8 caracteres**, exigir 1 letra + 1 dígito; **sempre** confirmar `currentPassword`. Invalidar `PasswordResetToken` após mudança.
- **Email:** imutável pela rota de perfil; back deve **ignorar** se vier no body.
- **Avatar:** validar MIME (`image/jpeg|png|webp`), tamanho ≤ 2MB, redimensionar server-side.
- **Phone:** regex BR `^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$` ou `libphonenumber`.

### 3.2 Endereços
- **`is_default` único por usuário:** invariante de banco (unique index parcial).
- **Primeiro endereço criado** → default automaticamente.
- **Exclusão do default:**
  - Único endereço: permitir; mas se houver pedido `PENDING|PREPARING|SHIPPED`, bloquear com `409`.
  - Com outros: promover o mais recente a default na mesma transação.
- **CEP:** regex `^\d{5}-?\d{3}$` + cross-check ViaCEP server-side.
- **Estado:** whitelist 27 UFs.
- **Limite:** máximo **5 endereços** por usuário.

### 3.3 Pets
- **Ownership:** filtrar por `tutor_id = req.userId` em todo método.
- **Exclusão:** bloquear (409) se `Appointment` com `status IN (PENDING, CONFIRMED)` e `start_time > now()`.
- **`weight_kg`:** range `(0, 200)`; validar tipo numérico.
- **`birth_date`:** não pode ser futura.
- **`species`:** padronizar enum antes de ter dados sujos.
- **Limite:** **10 pets** por tutor.

### 3.4 Favoritos
- **Idempotência:** `POST` duplicado retorna o existente (constraint unique).
- **Cascata:** quando Product/Provider deletado, remove favoritos via `ON DELETE CASCADE`.
- **Acesso:** apenas o dono (`user_id = req.userId`).
- **Performance:** rota leve `/favorites/ids` no boot para hidratar ícones.

### 3.5 Carrinho
- **Estoque:** verificar `stock_quantity` ≥ qty final; se exceder, ajustar e responder com `warnings`.
- **Status do produto:** rejeitar `INACTIVE`/`OUT_OF_STOCK`.
- **Multi-lojista:** definir política (1 cart × N pedidos vs. 1 cart = 1 lojista).
- **Preço:** **sempre recalcular no servidor**; `unit_price_snapshot` é referência; flag `price_changed` se mudou.
- **Limites:** 50 SKUs distintos, 99 unidades por item.
- **Merge ao logar:** somar quantidades, respeitar estoque.
- **Expiração:** carrinho `updated_at < now() - 30d` é zerado.

---

## 4. Estratégia de Gerenciamento de Estado

Modelo **híbrido**: nem Redux/Zustand (overkill), nem `useState` espalhado (anti-pattern atual).

### 4.1 Stack escolhida
- **TanStack Query (React Query)** para dados de servidor (perfil, endereços, pets, favoritos, carrinho).
- **Context API** apenas para cross-cutting global: `AuthContext`, `CartContext`, `FavoritesContext`.
- **Hooks customizados** como fachada sobre o React Query.

### 4.2 Layout final do estado

```
contexts/
  AuthContext.tsx        # user, token, login, logout
  FavoritesContext.tsx   # Set<`${type}:${id}`>, isFavorite, toggle
  CartContext.tsx        # cart canônico, addItem, updateQty, totalItems

lib/hooks/
  useProfile.ts          # useQuery + useMutation
  useAddresses.ts        # CRUD + setDefault, optimistic
  usePets.ts
  useFavorites.ts
  useCart.ts

lib/httpClient.ts        # wrapper único
lib/services/            # consomem httpClient, não fetch cru
```

### 4.3 Padrão de invalidação

| Mutação | Queries a invalidar |
|---|---|
| `updateProfile` | `['me']` |
| `createAddress/updateAddress/deleteAddress/setDefault` | `['addresses']` |
| `createPet/updatePet/deletePet` | `['pets']` |
| `toggleFavorite` | `['favorites', type]` (optimistic + invalida em background) |
| `addToCart/updateQty/removeItem` | `['cart']` (optimistic; rollback se 4xx) |
| `login` | `queryClient.clear()` + refetch `me`, `cart`, `favorites` |
| `logout` | `queryClient.clear()` |

### 4.4 Persistência cliente
- **Token:** `localStorage` (dívida: migrar para cookie httpOnly).
- **Carrinho anônimo:** `localStorage` chave `petplus_anon_cart`; merge ao logar.
- **Favoritos anônimos:** mesma estratégia ou exigir login.
- **NÃO persistir** perfil/endereços/pets em `localStorage`. Remover `petplus_user`.

---

## 5. Ordem sugerida de execução (PRs)

1. **PR-0** Fundação: `httpClient`, `AuthContext`, `errorHandler`, validador. [bloqueante]
2. **PR-1** Perfil: corrigir `updatePassword` + `currentPassword` + retornar user.
3. **PR-2** Endereços: migration `is_default` + endpoint `setDefault` + regras de exclusão.
4. **PR-3** Pets backend: repo + controller + routes + validações.
5. **PR-4** Pets front: hook `usePets` + edição.
6. **PR-5** Favoritos: modelo, controller, `FavoritesContext`, substituir `useState` espalhado.
7. **PR-6** Carrinho fase 1: corrigir tipo, criar modelo e endpoints CRUD.
8. **PR-7** Carrinho fase 2: merge anônimo→logado + estoque + recálculo server.
9. **PR-8** Upload de avatar.

---

## 6. Riscos e dívidas

- **`CartItem.id` é `number` no front** mas `Product.id` é `Uuid` — bug latente.
- **Token JWT em `localStorage`** — vulnerável a XSS. Planejar cookie httpOnly + refresh.
- **Espécies de pet em texto livre** — padronizar enum agora.
- **Rota de pets duplicada** conceitualmente — escolher e documentar.
- **Avatar upload em TODO** — definir storage (Cloudinary recomendado).

---

## 7. Checklist de Progresso

> Atualizar conforme cada item for concluído. Marcar `[x]` quando entregue, `[~]` em andamento, `[ ]` pendente. Adicionar PR/commit ao lado quando aplicável.

### Fase 0 — Fundação ✅
- [x] `frontend/src/lib/httpClient.ts` com Bearer injection + `ApiError` + handler de 401
- [x] `frontend/src/contexts/AuthContext.tsx` (user, token, login, logout, refetchMe)
- [x] Backend `errorHandler` middleware + shape padronizado `{ error: { code, message, details? } }` (com `message` no topo para compat com clients legados)
- [x] Backend `validate(schema)` middleware com Zod (dependência instalada)
- [x] Instalar e configurar TanStack Query no `App.tsx` (via `lib/queryClient.ts`)
- [x] Refatorar `ProtectedRoute` para usar `useAuth()` em vez de ler `localStorage` direto
- [x] Backend `AppError` class + `notFoundHandler` para 404 padronizado
- [x] Tratamento de erros conhecidos do Prisma (P2002, P2025, P2003) no errorHandler

### Fase 1 — Perfil ✅ (avatar adiado)
- [x] Back: `currentPassword` obrigatório em `updatePassword` + bcrypt compare
- [x] Back: subir mínimo de senha para 8 + complexidade (letra + número)
- [x] Back: validar `phone` (regex BR) e `full_name` em `updateProfile`
- [x] Back: retornar user atualizado em `PUT /users/me` (não só `message`)
- [x] Back: ignorar `email` se enviado no body (imutável por esta rota)
- [x] Back: invalidar `PasswordResetToken` pendentes após troca de senha
- [x] Back: schemas Zod (`updateProfileSchema`, `changePasswordSchema`) + middleware `validate` aplicado
- [~] Back: rota `POST /users/me/avatar` (multipart) + storage — **adiado pendente decisão Cloudinary/S3**
- [x] Front: `userService` migrado para `httpClient` + `updateMe` / `changePassword` + tipos
- [x] Front: hook `useProfile` (query + mutations) com sync no `AuthContext`
- [x] Front: refatorar `TutorProfile.tsx` (Dados Pessoais + Senha) com React Hook Form + Zod
- [x] Front: campo "senha atual" no formulário + validação de senhas iguais/diferentes
- [~] Front: integrar upload de avatar com preview otimista — **adiado junto com a rota backend**

### Fase 2 — Endereços ✅
- [x] Back: schema Prisma atualizado com `is_default Boolean` + index `@@index([user_id, is_default])`
- [x] Back: migration SQL manual em `prisma/migrations/manual/2026_05_11_add_address_default.sql` (coluna + backfill + índice parcial único). **Requer execução manual no banco**
- [x] Back: endpoint `PATCH /addresses/:id/default` em transação (zera os outros, marca o alvo)
- [x] Back: primeiro endereço criado vira default automaticamente
- [x] Back: regra de exclusão do default — promove o mais recente quando há outros; bloqueia (409) se for o único e houver pedido `PENDING/PREPARING/SHIPPED`
- [x] Back: CEP validado via ViaCEP server-side com fail-open em network error (CepService)
- [x] Back: whitelist 27 UFs no Zod schema
- [x] Back: limite de 5 endereços por usuário (409 quando atingido)
- [x] Back: Zod schemas (`createAddressSchema`, `updateAddressSchema`, `addressIdParamsSchema`) com `validate` middleware
- [x] Back: lista retorna ordenada (default primeiro, depois `created_at desc`)
- [x] Front: `addressService` (httpClient)
- [x] Front: hook `useAddresses` com optimistic update em `setDefault` e `remove`
- [x] Front: componente `AddressesSection.tsx` extraído com RHF + Zod
- [x] Front: botão "Tornar principal" (estrela) + badge "Principal" no card
- [x] Front: auto-preenchimento via ViaCEP no front (useCepLookup)
- [x] Front: erros do servidor (limite, CEP inválido, bloqueio de delete) caem em toast com mensagem do `ApiError`

### Fase 3 — Pets ✅
- [x] Back: `PetRepository.js` (findManyByTutor, findByIdAndTutor, countByTutor, create/update/delete, countActiveAppointments)
- [x] Back: `PetController.js` (list / create / get / update / delete)
- [x] Back: `petRoutes.js` montado em `/api/v1/users/me/pets` no `server.js`
- [x] Back: schemas Zod (`createPetSchema`, `updatePetSchema`, `petIdParamsSchema`) com `validate` aplicado
- [x] Back: validações (species enum DOG/CAT/OTHER, weight_kg 0-200, birth_date ≤ hoje, ISO 8601)
- [x] Back: bloqueio de delete (409) se houver `Appointment` PENDING/CONFIRMED com `start_time > now()`
- [x] Back: limite de 10 pets por tutor
- [x] Back: migration manual `2026_05_12_normalize_pet_species.sql` para backfill PT-BR → enum
- [x] Front: `petService` migrado para `httpClient` + `update` adicionado + tipos
- [x] Front: hook `usePets` com TanStack Query e optimistic remove
- [x] Front: habilitar edição na UI de `TutorPets.tsx` (modal abre em modo create OU edit)
- [x] Front: normalizar `species` para enum (DOG/CAT/OTHER) + label PT-BR via `SPECIES_LABEL`
- [x] Front: validação client (RHF + Zod) espelha backend; `max` no date picker = hoje

### Fase 4 — Favoritos ✅
- [x] Back: modelo Prisma `Favorite` + enum `FavoriteTargetType` + relation no `User`
- [x] Back: migration manual `2026_05_12_add_favorites.sql` (enum + tabela + unique index + index secundário)
- [x] Back: `FavoritesController` (`list` hidratado, `listIds` enxuto, `add` idempotente, `remove`)
- [x] Back: validação de `target_id` existir na tabela do `target_type` (PRODUCT em `products`; HOTEL/SITTER em `providers` com `role_id` correspondente)
- [x] Back: idempotência no POST (retorna 200 com o existente)
- [x] Back: Zod schemas + `validate` aplicado nas rotas
- [x] Back: rota `/api/v1/favorites` montada em `server.js`
- [x] Back: hidratação enxuta no `list` (apenas campos relevantes do target) com filtro silencioso de "dangling"
- [x] Front: `favoriteService`
- [x] Front: `FavoritesContext` global carregando IDs no boot e expondo `isFavorite`/`toggle`/`refresh`
- [x] Front: atualização otimista + rollback em erro + guard de double-click via `inFlightRef`
- [x] Front: remover `useState` local em `ShoppingPage / HotelsPage / WalkersPage / ProductDetailPage`
- [x] Front: provider montado em `App.tsx` (depois de Auth, antes de Cart)

### Fase 5 — Carrinho ✅ (debounce adiado)
- [x] Front: corrigir `CartItem.id` de `number` para `string` (UUID) + adicionado campo `product_id` para navegação
- [x] Front: remover itens mock pré-populados de `CartContext`
- [x] Back: modelos `Cart` e `CartItem` com `unit_price_snapshot Decimal` + relation `User.cart` e `Product.cart_items`
- [x] Back: migration manual `2026_05_12_add_cart.sql` (tabelas + unique `(cart_id, product_id)` + CHECK quantity > 0). **Requer execução manual**
- [x] Back: endpoints CRUD (`GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId`, `DELETE /cart`)
- [x] Back: recálculo de totais server-side em `toDTO` — front nunca envia totals
- [x] Back: validação de estoque (`stock_quantity`) + rejeita `status !== ACTIVE` ou estoque zero (409)
- [x] Back: limites (50 SKUs distintos / 99 unidades por item) com ajuste automático e warning `STOCK_CAPPED`
- [x] Back: endpoint `POST /cart/merge` para fundir carrinho anônimo após login (skip-with-warning para produtos inválidos)
- [x] Back: snapshot `unit_price_snapshot` no `CartItem` + flag `price_changed` no DTO (compara com preço atual do `Product`)
- [x] Back: lazy cleanup de carrinho expirado (>30d) no `GET /cart` + warning `CART_EXPIRED`
- [x] Back: rota `/api/v1/cart` montada em `server.js`
- [x] Front: `cartService` (httpClient) com tipos completos
- [x] Front: `CartContext` reescrito — modo dual (anônimo via `localStorage` chave `petplus_anon_cart` × autenticado via servidor)
- [x] Front: merge automático ao logar (effect observa `token`, dispara `/cart/merge`, limpa `localStorage`, mostra toast)
- [x] Front: optimistic update em `updateQuantity` e `removeItem` com rollback em erro
- [x] Front: warnings do servidor exibidos via `toast.warning` (uma vez por payload)
- [x] Front: cap defensivo no client (0-99) antes de chamar API
- [x] Front: API pública compatível com `CartPage`/`CheckoutPage`/`Navbar`/`LandingPage` (campo `product_id` exposto para Link)
- [~] Front: debounce 300ms em `updateQuantity` — **adiado** (optimistic update já dá feedback instantâneo; pode ser otimização futura para reduzir chamadas em cliques rápidos)
- [~] Back: job/cron de cleanup global de carrinhos expirados — **adiado** (lazy cleanup no GET cobre o caso comum; cron fica como tarefa de operação)

### Transversal / Dívidas
- [ ] Remover leituras diretas de `localStorage.petplus_user` (fonte única = servidor)
- [ ] Documentar todos os endpoints novos no Swagger
- [ ] Definir política multi-lojista do carrinho
- [ ] Migrar token JWT para cookie httpOnly (pós-MVP)
- [ ] Definir storage de imagens (Cloudinary / S3)
