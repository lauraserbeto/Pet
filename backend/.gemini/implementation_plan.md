# Planejamento: Dashboards de Gestão "Pet+"

Abaixo apresento a análise detalhada das telas do frontend, mapeamento de banco de dados e endpoints, além da proposta de arquitetura limpa (Clean Architecture) para o nosso backend Node.js (CommonJS).

## 1. Scan do Frontend e Análise por Tipo de Parceiro

### Lojista (Store Partner)
- **Telas Inspecionadas:** `Overview.tsx`, `Orders.tsx`, `Products.tsx`
- **Dados Exibidos:** KPIs (Receita, Pedidos Pendentes, Valor em Estoque, Produtos com Baixo Estoque), lista de Produtos e lista de Pedidos.
- **Formulários/Ações:** Importar produtos, cadastrar novo produto, buscar e filtrar pedidos/produtos, trocar status do pedido.
- **Conclusão:** O Lojista gerencia predominantemente **Produtos** (Estoque) e **Pedidos** (Vendas para Clientes).

### Hotel e Pet Sitter
- **Telas Inspecionadas:** `Overview.tsx`, `Schedule.tsx`, `SitterEvaluations.tsx`
- **Dados Exibidos:** Agenda do dia (Timeline), próximos livres, lista de agendamentos com dados do pet, dono (tutor), horário, duração, e tipo de serviço prestado (Hospedagem, Day Care, Pet Sitter, Passeio).
- **Formulários/Ações:** Novo Agendamento, filtro por data, alteração de status (Confirmado, Pendente, Concluído, Cancelado). Administradores também visualizam as "Avaliações" dos Pet Sitters (currículo de experiência, áreas, quiz).
- **Conclusão:** Hotel e Pet Sitter são orientados à prestação de **Serviços** de duração e agendamento de horário. Eles necessitam gerenciar **Serviços Ofertados** e atuar diretamente na **Agenda (Agendamentos)**.

---

## 2. Mapeamento de Entidades (`schema.prisma` Adições)

Para comportar a gestão destes perfis, os seguintes modelos deverão ser adicionados ao Prisma Schema. Todos terão chaves estrangeiras amarradas direta ou indiretamente com as tabelas `User` e `Provider` existentes.

```prisma
// Entidades para Lojistas
model Product {
  id             String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provider_id    String      @db.Uuid // Relaciona ao Lojista
  name           String      @db.VarChar(150)
  category       String      @db.VarChar(50)
  description    String?     @db.Text
  sku            String?     @db.VarChar(50)
  stock_quantity Int         @default(0)
  price          Decimal     @db.Decimal(10, 2)
  image_url      String?     @db.Text
  status         String      @default("ACTIVE") // ACTIVE, INACTIVE, OUT_OF_STOCK
  created_at     DateTime    @default(now()) @db.Timestamptz
  updated_at     DateTime    @default(now()) @db.Timestamptz

  provider       Provider    @relation(fields: [provider_id], references: [id], onDelete: Cascade)
  order_items    OrderItem[]

  @@map("products")
}

model Order {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provider_id String      @db.Uuid // O lojista que recebe o pedido
  customer_id String      @db.Uuid // O Tutor/Cliente
  total_price Decimal     @db.Decimal(10, 2)
  status      String      @default("PENDING") // PENDING, PREPARING, SHIPPED, DELIVERED, CANCELLED
  created_at  DateTime    @default(now()) @db.Timestamptz
  updated_at  DateTime    @default(now()) @db.Timestamptz

  provider    Provider    @relation(fields: [provider_id], references: [id])
  customer    User        @relation(fields: [customer_id], references: [id])
  items       OrderItem[]

  @@map("orders")
}

model OrderItem {
  id         String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  order_id   String  @db.Uuid
  product_id String  @db.Uuid
  quantity   Int
  unit_price Decimal @db.Decimal(10, 2)

  order      Order   @relation(fields: [order_id], references: [id], onDelete: Cascade)
  product    Product @relation(fields: [product_id], references: [id], onDelete: Restrict)

  @@map("order_items")
}

// Entidades para Hotel e Pet Sitter
model Service {
  id               String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provider_id      String        @db.Uuid // Relaciona ao Hotel ou Pet Sitter
  name             String        @db.VarChar(150)
  category         String        @db.VarChar(50) // BOARDING, DAYCARE, SITTING, WALKING
  description      String?       @db.Text
  price            Decimal       @db.Decimal(10, 2)
  duration_minutes Int?
  is_active        Boolean       @default(true)
  created_at       DateTime      @default(now()) @db.Timestamptz

  provider         Provider      @relation(fields: [provider_id], references: [id], onDelete: Cascade)
  appointments     Appointment[]

  @@map("services")
}

model Appointment {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provider_id String   @db.Uuid
  service_id  String   @db.Uuid
  pet_id      String   @db.Uuid
  start_time  DateTime @db.Timestamptz
  end_time    DateTime @db.Timestamptz
  status      String   @default("PENDING") // PENDING, CONFIRMED, COMPLETED, CANCELLED
  total_price Decimal  @db.Decimal(10, 2)
  notes       String?  @db.Text
  created_at  DateTime @default(now()) @db.Timestamptz
  updated_at  DateTime @default(now()) @db.Timestamptz

  provider    Provider  @relation(fields: [provider_id], references: [id])
  service     Service   @relation(fields: [service_id], references: [id])
  pet         Pet       @relation(fields: [pet_id], references: [id])

  @@map("appointments")
}
```

---

## 3. Mapeamento de Endpoints (RESTful APIs)

Todas as rotas sob o escopo dos parceiros devem estar amparadas pelo Middleware de Autenticação (`verifyToken` / `verifyRole`), garantindo também que um lojista não fará alteração em serviços de um pet sitter.

### Produtos (Lojista) - Rota base: `/api/v1/products`
| Método | Rota | Autenticação Exigida | Descrição |
|--------|------|----------------------|-----------|
| `GET`    | `/` | Nenhuma (Catálogo Cliente) | Lista produtos disponíveis (com paginação e filtros) |
| `GET`    | `/provider` | Role: Lojista | Lista produtos do lojista logado (Dashboard) |
| `GET`    | `/:id` | Nenhuma | Detalhes de um produto específico |
| `POST`   | `/` | Role: Lojista | Cria um novo produto (apenas para o lojista autenticado) |
| `PUT`    | `/:id` | Role: Lojista | Atualiza detalhes de um produto |
| `DELETE` | `/:id` | Role: Lojista | Remove (ou inativa) um produto |

### Pedidos (Lojista) - Rota base: `/api/v1/orders`
| Método | Rota | Autenticação Exigida | Descrição |
|--------|------|----------------------|-----------|
| `GET`    | `/provider` | Role: Lojista | Lista os pedidos recebidos pela loja, com itens |
| `GET`    | `/customer` | Role: Cliente | Lista os pedidos feitos pelo usuário atual |
| `POST`   | `/` | Role: Cliente | Cria um novo pedido (Checkout) |
| `PUT`    | `/:id/status` | Role: Lojista | Atualiza status (ex: PENDING -> SHIPPED) |

### Agendamentos (Hotel / Pet Sitter) - Rota base: `/api/v1/appointments`
| Método | Rota | Autenticação Exigida | Descrição |
|--------|------|----------------------|-----------|
| `GET`    | `/provider` | Role: Hotel/Sit. | Lista agendamentos para controle de calendário |
| `GET`    | `/customer` | Role: Cliente | Lista agendamentos feitos pelo tutor |
| `POST`   | `/` | Role: Todos | Cria um agendamento |
| `PUT`    | `/:id/status` | Role: Hotel/Sit. | Altera status do agendamento (Confirmado, etc.) |

---

## 4. Estrutura Clean Architecture: Gestão de Produtos (Lojista)

Considerando o Node.js com Express em CommonJS, abaixo está a criação inicial dos arquivos do módulo de Produtos respeitando Separação de Responsabilidades.

### Arquitetura de Pastas e Arquivos a Serem Criados:
```
src/
 └─ modules/
     └─ products/
         ├─ controllers/
         │   └─ productController.js
         ├─ useCases/
         │   ├─ createProductUseCase.js
         │   └─ listProviderProductsUseCase.js
         ├─ repositories/
         │   └─ productRepository.js
         └─ routes.js
```

### 1. Repository (`src/modules/products/repositories/productRepository.js`)
Lida diretamente com o Prisma e as transações de banco de dados.
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ProductRepository {
  async create(data) {
    return await prisma.product.create({
      data
    });
  }

  async findByProviderId(providerId) {
    return await prisma.product.findMany({
      where: { provider_id: providerId },
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(productId) {
    return await prisma.product.findUnique({
      where: { id: productId }
    });
  }
}

module.exports = new ProductRepository();
```

### 2. Use Cases (`src/modules/products/useCases/createProductUseCase.js`)
Lida com a lógica de negócio, neste caso pode possuir validações complexas.
```javascript
const productRepository = require('../repositories/productRepository');

class CreateProductUseCase {
  async execute({ provider_id, name, category, stock_quantity, price }) {
    // Regra de Ouro: Checagem base se preço não é negativo, se há itens na string, etc.
    if (!name || price < 0) {
      throw new Error("Dados de produto inválidos.");
    }
    
    // Insere no banco utilizando o repositório
    const product = await productRepository.create({
      provider_id,
      name,
      category,
      stock_quantity: stock_quantity || 0,
      price
    });

    return product;
  }
}

module.exports = new CreateProductUseCase();
```

### 3. Controller (`src/modules/products/controllers/productController.js`)
Lida puramente com req/res, injeta dados no UseCase e devolve mensagem adequada em Português.
```javascript
const createProductUseCase = require('../useCases/createProductUseCase');
const listProviderProductsUseCase = require('../useCases/listProviderProductsUseCase');

class ProductController {
  async create(req, res) {
    try {
      // O provider_id idealmente será extraído do token JWT pelo middleware
      const { name, category, stock_quantity, price } = req.body;
      const provider_id = req.user.providerId; // Veio do token preenchido pelo middleware
      
      const product = await createProductUseCase.execute({
        provider_id,
        name,
        category,
        stock_quantity,
        price
      });

      return res.status(201).json({
        message: "Produto criado com sucesso.",
        product
      });
    } catch (error) {
      return res.status(400).json({ error: error.message || "Erro ao criar produto." });
    }
  }

  // listProviderProducts omitted for brevity...
}

module.exports = new ProductController();
```

> [!IMPORTANT]
> **Autenticação Base**: Os routes.js incorporarão o middleware `verifyToken` e `verifyRole(roles.LOJISTA)` já existentes na sua aplicação, blindando o acesso.

## Revisão Necessária
Você aprova o modelo das entidades e essa divisão Clean Architecture usando classes simples em JS? Caso concorde, os próximos passos do lado do backend seriam a execução da alteração do schema do prisma, e a codificação de fato desses moldes.
