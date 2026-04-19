# 🐾 Pet+ | Marketplace & Gestão Pet

O **Pet+** é uma plataforma SaaS e Marketplace ponta a ponta projetada para conectar tutores de pets a uma rede qualificada de prestadores de serviços. O ecossistema abrange desde a compra de produtos (Lojistas) até a contratação de serviços especializados como Hotéis e Pet Sitters.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Linguagem:** TypeScript
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Animações:** [Framer Motion](https://www.framer.com/motion/) + [GSAP](https://gsap.com/)
- **Estado & UI:** React Hook Form, Sonner (Toasts), Lucide React (Icons)
- **BaaS/Auth:** JWT + Node.js Backend

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (Express)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
- **Documentação:** [Swagger](https://swagger.io/)
- **Segurança:** JWT, BcryptJS, Middlewares de Role-Based Access Control (RBAC)

---

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
- [Node.js](https://nodejs.org/en/) (v18 ou superior)
- [PostgreSQL](https://www.postgresql.org/) 


---

## 🛠️ Instalação e Execução

### 1. Clone o Repositório
```bash
git clone https://github.com/lauraserbeto/Pet
cd Pet
```

### 2. Configuração do Backend
```bash
cd backend
npm install
```
- Crie um arquivo `.env` baseado no `.env.example` (veja seção abaixo).
- Execute as migrações do banco de dados:
```bash
npx prisma migrate dev
npx prisma generate
```
- Inicie o servidor:
```bash
npm start
```
- A API estará disponível em `http://localhost:3000` e a documentação em `/api-docs`.

### 3. Configuração do Frontend
```bash
cd ../frontend
npm install
npm run dev
```
- O frontend estará disponível em `http://localhost:5173`.

---

## 🔐 Variáveis de Ambiente

### Backend (`/backend/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/petplus"
JWT_SECRET="sua_chave_secreta_aqui"
PORT=3000
```

### Frontend (`/frontend/.env.local`)
```env
VITE_SUPABASE_URL="sua_url_do_supabase"
VITE_SUPABASE_ANON_KEY="sua_chave_anon_do_supabase"
VITE_API_URL="http://localhost:3000/api/v1"
```

---

## 👥 Níveis de Acesso (Roles)

1. **Admin Master:** Gestão de plataforma e aprovação de parceiros.
2. **Lojista:** Gestão de catálogo de produtos e vendas.
3. **Hotel:** Gestão de vagas, daycare e hospedagem.
4. **Pet Sitter:** Prestação de serviços de passeio e cuidados domiciliares.
5. **Tutor:** Cliente final que consome produtos e serviços.
