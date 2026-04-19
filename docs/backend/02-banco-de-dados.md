# 02. Banco de Dados

O Pet+ utiliza o **PostgreSQL** com o **Prisma ORM**. O esquema é projetado para suportar múltiplos tipos de prestadores de serviço com extensibilidade.

## Principais Entidades

### 👤 `users`
Tabela central para todos os usuários.
- **Relacionamentos:**
  - `role_id`: Define o tipo de acesso.
  - `provider`: Link 1:1 com a tabela de provedores (caso seja parceiro).
  - `pets`: Link 1:N (um tutor tem vários pets).

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
- Relaciona-se com `providers` (Dono do produto).

### 🏨 `services`
Exclusivo para `role_id: 3` (Hotel) e `4` (Pet Sitter).
- Define serviços como Daycare, Walking ou Hospedagem.
- Relaciona-se com `appointments` (Agendamentos).

### 🐶 `pets`
Dados dos animais cadastrados pelos tutores.
- Contém peso, raça, nome e anotações médicas.

## Diagrama Simplificado (ER)
- **User (1)** <-> **Role (1)**
- **User (1)** <-> **Provider (0..1)**
- **Provider (1)** <-> **Products (0..N)**
- **Provider (1)** <-> **Services (0..N)**
- **Order (1)** <-> **OrderItem (N)** <-> **Product (1)**
- **Appointment (1)** <-> **Service (1)**
