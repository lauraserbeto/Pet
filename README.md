# 🐾 Pet+ Partner Platform

Uma plataforma SaaS completa que conecta Tutores apaixonados aos melhores serviços pet da região, incluindo Lojistas, Hotéis e Pet Sitters.

## 🏗️ Arquitetura do Projeto

Este repositório está dividido em duas partes principais:

* **`/frontend`**: Aplicação SPA construída com React, Vite, Tailwind CSS e React Router. Responsável por toda a interface do usuário, painel administrativo (Dashboard) e fluxos de autenticação.
* **`/backend`**: (Em construção) Serviços auxiliares em Node.js para processamento de webhooks, envio de e-mails transacionais e integrações de pagamento.

## 🚀 Tecnologias Utilizadas

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React (Ícones), Sonner (Toasts).
* **Backend/BaaS:** Supabase (PostgreSQL, Authentication, Row Level Security).
* **Roteamento:** React Router DOM.

## ⚙️ Como executar o projeto localmente

1. Clone o repositório:
   ```bash
   git clone [https://github.com/seu-usuario/petplus.git](https://github.com/seu-usuario/petplus.git)
   ```

2. Navegue até a pasta frontend:
   ```bash
   cd frontend
   ```

3. Instale as dependências:
   ```bash
   yarn install
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   yarn dev
   ```

## 🎨 Design System & Componentes

O projeto segue um design system moderno baseado em Figma, com componentes reutilizáveis e tipografia consistente.

* **Cores:** Definidas em `src/styles/index.css` (Variáveis `--color-primary-500`, `--color-secondary-500`, etc.).
* **Fontes:** Inter (Google Fonts).
* **Componentes de UI:** Localizados em `src/components/ui/` e `src/app/components/figma/`.

## 🔐 Autenticação & Segurança

O sistema utiliza o Supabase para autenticação de usuários. As regras de segurança (Row Level Security - RLS) estão implementadas no banco de dados para garantir que os dados sejam acessados apenas pelo usuário correto.

* **Login:** [http://localhost:5173/login](http://localhost:5173/login)
* **Cadastro:** [http://localhost:5173/register](http://localhost:5173/register)


# 🔐 Níveis de Acesso (Role IDs)
O sistema possui controle de acesso rigoroso baseado nos seguintes papéis:

1: Admin Master (Aprovações e Gestão)

2: Lojista (Produtos e Pedidos)

3: Hotel (Vagas e Reservas)

4: Pet Sitter (Agenda e Raio de Atendimento)

5: Tutor (Visão pública e compras)


## 📱 Responsividade

O layout é totalmente responsivo, adaptando-se perfeitamente a dispositivos móveis, tablets e desktops.
