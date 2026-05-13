# 02. Banco de Dados

O Pet+ utiliza o **PostgreSQL** hospedado no **Railway** com o **Prisma ORM**. O esquema é projetado para suportar múltiplos tipos de prestadores de serviço com extensibilidade.

## Infraestrutura
- **Provedor:** Railway (PostgreSQL 16+)
- **ORM:** Prisma v5+
- **Sincronização do schema:** `prisma db push` (sem histórico de migrations versionado)
- **SQL complementar:** scripts opcionais em `backend/prisma/migrations/manual/` para índices parciais, CHECKs e backfills

## Principais Entidades

### 👤 `users`
Tabela central para todos os usuários.
- **Relacionamentos:**
  - `role_id`: Define o tipo de acesso.
  - `provider`: Link 1:1 com a tabela de provedores (caso seja parceiro).
  - `pets`: Link 1:N (um tutor tem vários pets).
  - `addresses`: Link 1:N.
  - `favorites`: Link 1:N.
  - `cart`: Link 1:1 (um carrinho por usuário).
- **Campo `avatar_url`** (`Text`): hoje aceita data URL base64 inline. Migração futura para storage externo registrada como dívida.

### 🏢 `providers`
Dados específicos para Lojistas, Hotéis e Pet Sitters.
- **Campos Importantes:**
  - `status`: Define se o parceiro está ativo ou pendente.
  - `business_name`, `document` (CNPJ/CPF).
  - `operating_hours`, `gallery_images` (Campos JSON para flexibilidade).
  - `daily_rate`, `hourly_rate`: Definidos conforme a `role` do parceiro.

### 📦 `products`
Exclusivo para `role_id: 2` (Lojistas).
- Contém preço, estoque, categoria e fotos.
- Relaciona-se com `providers` (Dono do produto), `order_items` e **`cart_items`**.

### 🏨 `services`
Exclusivo para `role_id: 3` (Hotel) e `4` (Pet Sitter).
- Define serviços como Daycare, Walking ou Hospedagem.
- Relaciona-se com `appointments` (Agendamentos).

### 🐶 `pets`
Dados dos animais cadastrados pelos tutores.
- Contém peso, raça, nome e anotações médicas.
- **`species`** padronizado como enum lógico `DOG | CAT | OTHER` (validado em Zod; coluna ainda é `VarChar` por compatibilidade — backfill manual disponível).

### 🏠 `addresses`
Endereços do usuário.
- **`is_default Boolean`** (default `false`): marca o endereço principal.
- Invariante: no máximo 1 default por usuário. Garantida pelo controller via transação; reforço opcional via índice parcial único (SQL em `prisma/migrations/manual/2026_05_11_add_address_default.sql`).
- Índice: `@@index([user_id, is_default])`.

### ❤️ `favorites` *(novo)*
Favoritos polimórficos do tutor — produtos, hotéis e sitters em uma única tabela.
- **Colunas:** `id`, `user_id`, `target_type` (enum `FavoriteTargetType`), `target_id`, `created_at`.
- **Constraints:**
  - `@@unique([user_id, target_type, target_id])` garante idempotência do `POST`.
  - `@@index([user_id, target_type])` para listagens por tipo.
- **Sem FK física** para `target_id`: validação de existência feita em aplicação no `POST` (consulta `products` ou `providers` conforme `target_type` + checagem de `user.role_id`).
- Registros "dangling" (target deletado depois de favoritado) são filtrados silenciosamente na listagem hidratada.

### 🛒 `carts` *(novo)*
Um carrinho por usuário (relação 1:1).
- **Colunas:** `id`, `user_id` (`@unique`), `created_at`, `updated_at`.
- `updated_at` é atualizado a cada mutação dos itens — usado para lazy cleanup de carrinhos abandonados (>30d zerados no próximo `GET /cart`).

### 🛒 `cart_items` *(novo)*
Itens do carrinho.
- **Colunas:** `id`, `cart_id`, `product_id`, `quantity`, **`unit_price_snapshot`** (Decimal), `added_at`, `updated_at`.
- **Constraints:**
  - `@@unique([cart_id, product_id])` — um produto, uma linha por carrinho.
  - `quantity > 0` (CHECK opcional via SQL manual; aplicação já valida).
- **`unit_price_snapshot`** congela o preço no momento da adição. Permite detectar `price_changed` ao ler o carrinho, comparando com o preço atual do produto.

### 🧾 `orders` / `order_items`
Pedidos e itens. **Relação com endereço:** o status `PENDING/PREPARING/SHIPPED` impede a exclusão do **último** endereço do tutor — regra implementada no `AddressController.deleteAddress`.

## Enums Lógicos

| Enum | Valores | Onde vive |
|---|---|---|
| `EvaluationStatus` | `PENDING`, `APPROVED`, `REJECTED` | Prisma enum |
| `FavoriteTargetType` *(novo)* | `PRODUCT`, `HOTEL`, `SITTER` | Prisma enum |
| `species` (lógico) | `DOG`, `CAT`, `OTHER` | Validação Zod; coluna `VarChar` |
| `status` (Provider) | `PENDENTE`, `ATIVO`, `BLOQUEADO` | String livre |
| `status` (Order) | `PENDING`, `PREPARING`, `SHIPPED`, `DELIVERED`, `CANCELLED` | String livre |
| `status` (Appointment) | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` | String livre |

## Diagrama Simplificado (ER)
- **User (1)** <-> **Role (1)**
- **User (1)** <-> **Provider (0..1)**
- **User (1)** <-> **Address (0..N)**
- **User (1)** <-> **Pet (0..N)**
- **User (1)** <-> **Favorite (0..N)**
- **User (1)** <-> **Cart (0..1)** <-> **CartItem (0..N)** <-> **Product (1)**
- **Provider (1)** <-> **Products (0..N)**
- **Provider (1)** <-> **Services (0..N)**
- **Order (1)** <-> **OrderItem (N)** <-> **Product (1)**
- **Appointment (1)** <-> **Service (1)** + **Pet (1)** + **Provider (1)**

## Limites por Usuário (aplicação)

| Recurso | Limite | Onde é aplicado |
|---|---|---|
| Endereços | 5 | `AddressController.createAddress` |
| Pets | 10 | `PetController.createPet` |
| SKUs distintos no carrinho | 50 | `CartController.addItem` / `merge` |
| Quantidade por item | 99 | `CartController` + Zod |
