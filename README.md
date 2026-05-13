<div align="center">
  <img width="100%" alt="Pet+ Banner" src="https://github.com/user-attachments/assets/42799674-3f05-47d7-ab21-9628e018d885" />

  # 🐾 Pet+ | Ecossistema & Marketplace Pet

  **Uma plataforma SaaS ponta a ponta projetada para conectar tutores de pets a uma rede qualificada de prestadores de serviços e lojistas.**

  [![Deploy Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://petplus.vercel.app/)
  [![Swagger Docs](https://img.shields.io/badge/Swagger-API_Docs-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://api-petplus.up.railway.app/api-docs/swagger)
  ![Railway Hosted](https://img.shields.io/badge/Railway-Hosted-0B0D0E?style=for-the-badge&logo=railway)
</div>

---

## 📖 Sobre o Projeto

O **Pet+** vai além de um simples e-commerce. É um ecossistema completo e centralizado para o mundo pet. A plataforma atende às diferentes necessidades dos animais e de seus tutores, permitindo desde a compra de produtos rotineiros até a contratação de serviços de alto nível de confiança, como hospedagem e cuidados domiciliares.

### ✨ Principais Implementações
- 🛍️ **Marketplace Integrado:** Compra e venda de produtos pet através de lojistas cadastrados.
- 🏨 **Booking de Serviços:** Agendamento simplificado de Hotéis, Daycare e Pet Sitters.
- 🔐 **Sistema Multi-Tenant:** Arquitetura robusta de Role-Based Access Control (RBAC) para diferentes perfis de usuários.
- 📍 **Automação de Endereços:** Integração com ViaCEP para preenchimento ágil durante os cadastros, com validação server-side e endereço principal por usuário.
- 🛒 **Carrinho Persistente:** Funciona offline (anônimo, via localStorage) e sincroniza com o servidor ao logar. Inclui snapshot de preço, validação de estoque e limites configuráveis.
- ❤️ **Favoritos Polimórficos:** Tutores podem favoritar produtos, hotéis ou pet sitters em uma única tabela, com idempotência e validação de tipo.
- 👤 **Visão do Tutor End-to-End:** Perfil (com foto em base64), endereços, pets, favoritos e carrinho integrados com formulários validados via Zod + React Hook Form.

---

## 🚀 Tecnologias e Ferramentas

A aplicação foi construída visando performance, escalabilidade e uma excelente experiência de usuário (UI/UX), utilizando uma stack moderna:

### Tech Stack Visual
<div align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=react,vite,ts,tailwind,nodejs,express,prisma,postgres,vercel,figma,github" alt="Tecnologias Utilizadas" />
  </a>
</div>

### 🖥️ Frontend
* **Core:** [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/) + TypeScript
* **Estado remoto:** [TanStack Query](https://tanstack.com/query) (cache, refetch, optimistic updates)
* **Estado global:** Context API (`AuthContext`, `FavoritesContext`, `CartContext`)
* **Formulários:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) + `@hookform/resolvers`
* **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
* **Animações:** [Framer Motion](https://www.framer.com/motion/) + [GSAP](https://gsap.com/)
* **Ecosystem:** Sonner (Toasts), Lucide React
* **Hospedagem:** [Vercel](https://vercel.com/)

### ⚙️ Backend
* **Core:** [Node.js](https://nodejs.org/) + Express
* **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (via [Railway](https://railway.com/))
* **ORM:** [Prisma](https://www.prisma.io/)
* **Validação:** [Zod](https://zod.dev/) via middleware `validate({ body?, query?, params? })`
* **Tratamento de erros:** `AppError` + `errorHandler` central com shape padronizado
* **Segurança:** JWT, BcryptJS, Middlewares de RBAC customizados
* **Documentação:** [Swagger](https://swagger.io/) (OpenAPI 3.0) — gerado automaticamente via JSDoc nas rotas

---

## 👥 Perfis de Acesso (RBAC)

O sistema adapta as permissões e a interface de acordo com o nível de acesso do usuário autenticado:

| Perfil | Descrição e Permissões |
|:---|:---|
| 👑 **Admin** | Gestão central da plataforma, aprovação de parceiros e moderação. |
| 🏪 **Lojista** | Gestão do catálogo de produtos, controle de estoque e acompanhamento de vendas. |
| 🏨 **Hotel** | Administração de vagas, infraestrutura (daycare/hospedagem) e reservas. |
| 🐕 **Pet Sitter** | Criação de perfil profissional, gestão de serviços de passeio e cuidados domiciliares. |
| 👤 **Tutor** | Cliente final. Acesso ao marketplace, agendamento de serviços e gestão de seus pets. |

---

## 🔌 Integrações de API

- 🟢 **Ativas:** Integração com **[ViaCEP](https://viacep.com.br/)** para busca automatizada de endereços no onboarding.
- 🟡 **Em Breve:** Integração com **[Brasil API](https://brasilapi.com.br/)** para validação rigorosa e em tempo real de CPFs e CNPJs de parceiros na entrada da plataforma.

---

## 🛠️ Como Executar o Projeto Localmente

### 1. Pré-requisitos
Certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/en/) (v18+)
- [Git](https://git-scm.com/)
- Um banco de dados [PostgreSQL](https://www.postgresql.org/) rodando (local ou na nuvem).

### 2. Clonando o Repositório
```bash
git clone [https://github.com/lauraserbeto/Pet.git](https://github.com/lauraserbeto/Pet.git)
cd Pet
```

### 2. Configuração do Backend
```bash
cd backend
npm install
```
- Crie um arquivo `.env` baseado no `.env.example`.
- Certifique-se de configurar a `DATABASE_URL` corretamente (local ou Railway).
- Sincronize o schema do banco de dados:
```bash
npx prisma db push
npx prisma generate
```
> Esse comando cria/atualiza as tabelas (`addresses.is_default`, `favorites`, `carts`, `cart_items`) a partir do `schema.prisma`. SQLs complementares opcionais (índices parciais, CHECKs, backfills) ficam em `backend/prisma/migrations/manual/`.

- Inicie o servidor:
```bash
npm start
```
- A API estará disponível em `http://localhost:3000` e a documentação interativa (Swagger) em `/api-docs`.

---

## 📚 Documentação da API (Swagger)

O projeto utiliza Swagger (OpenAPI 3.0) para documentação automática dos endpoints, permitindo testes interativos diretamente pelo navegador. A geração é feita por `swagger-jsdoc` a partir das anotações `@swagger` nas próprias rotas (`backend/src/routes/*.js`) — novos endpoints aparecem no Swagger sem configuração adicional.

- **Local:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Produção:** [https://api-petplus.up.railway.app/api-docs](https://api-petplus.up.railway.app/api-docs)

### 📋 Documentação adicional

Documentação técnica detalhada por área em `docs/`:

- **[Especificação da Visão do Tutor](docs/visao-tutor-spec.md)** — hand-off completo da integração frontend × backend dos fluxos do Tutor (Perfil, Endereços, Pets, Favoritos, Carrinho)
- [Arquitetura do Backend](docs/backend/01-arquitetura.md)
- [Banco de Dados](docs/backend/02-banco-de-dados.md)
- [Endpoints da API](docs/backend/03-api-endpoints.md)
- [Segurança e Testes](docs/backend/04-seguranca-e-testes.md)
- [Arquitetura do Frontend](docs/frontend/01-arquitetura.md)
- [Visão geral funcional](docs/funcional/01-visao-geral.md)
- [Perfis de usuário](docs/funcional/02-perfis-de-usuario.md)
- [Regras de negócio](docs/funcional/03-regras-de-negocio.md)
- [Plano de integração com checklist](integration-plan/tutor-integration-plan.md)

---

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
DATABASE_URL="postgresql://user:password@host:port/database" # URL do PostgreSQL (Local ou Railway)
JWT_SECRET="sua_chave_secreta_aqui"
PORT=3000
```

### Frontend (`/frontend/.env.local`)
```env
VITE_API_URL="http://localhost:3000/api/v1"
```

---

<div align="center">
  <img 
    src="https://i.pinimg.com/originals/ef/36/93/ef3693f233cfa46f61290e5e7386b4db.gif" 
    width="100%"
    alt="Cute dog gif"
  />
</div>
