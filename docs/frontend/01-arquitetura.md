# 01. Arquitetura do Frontend

O frontend da plataforma Pet+ foi projetado para ser uma aplicação web moderna, performática e escalável. Utilizamos uma abordagem modular e baseada em componentes, garantindo a reutilização de código e a facilidade de manutenção.

---

## 🛠️ Stack Tecnológica

### Core
- **React 18:** Biblioteca principal para construção da interface baseada em componentes.
- **Vite:** Ferramenta de build e dev server ultrarrápido.
- **TypeScript:** Superset de JavaScript que adiciona tipagem estática, reduzindo erros em tempo de desenvolvimento.

### Navegação e Roteamento
- **React Router v7 (Beta/RC):** Gerenciamento de rotas SPA, suportando carregamento dinâmico e proteção de rotas por níveis de acesso (Admin, Parceiro, Tutor).

### Gerenciamento de Estado e Formulários
- **React Hook Form:** Utilizado para manipulação eficiente de formulários, validações e integração com esquemas Zod.
- **Context API:** Gerenciamento de estados globais como Carrinho de Compras, Autenticação de Usuário e Preferências de Tema.

### Estilização e UI
- **Tailwind CSS 4:** Framework utilitário para estilização rápida, responsiva e moderna.
- **Shadcn/UI & Radix UI:** Conjunto de componentes acessíveis e customizáveis que seguem os padrões WAI-ARIA.
- **Lucide React:** Biblioteca de ícones leves e consistentes.

---

## 📂 Estrutura de Pastas (`/frontend/src/`)

A organização do código segue um padrão semântico para separar responsabilidades lógicas de visuais:

```bash
src/
├── app/          # Configurações globais, roteamento e provedores (Providers)
├── assets/       # Imagens, fontes e arquivos estáticos
├── components/   # Componentes reutilizáveis (UI, Layout, Formulários)
│   ├── ui/       # Componentes base do Shadcn (Botões, Inputs, Cards)
│   ├── layout/   # Estruturas fixas (Navbar, Sidebar, Footer)
│   └── shared/   # Componentes de negócio compartilhados
├── lib/          # Utilitários, configurações de API e Hooks personalizados
│   ├── services/ # Funções de comunicação com o backend (Fetch/Axios)
│   └── utils/    # Funções auxiliares e helpers (formatadores, validadores)
├── pages/        # Telas completas da aplicação (Views)
│   ├── auth/     # Login, Registro, Recuperação de Senha
│   ├── dashboard/# Painéis administrativos por perfil
│   └── public/   # Landing Page, Marketplace e Detalhes
└── styles/       # Configurações globais de CSS e temas
```

---

## 🚀 Padrões de Desenvolvimento

1.  **Componentização:** Dividir a interface em pequenos componentes funcionais e puros sempre que possível.
2.  **Hooks Customizados:** Isolar a lógica de negócio e chamadas de API em Hooks para manter os componentes focados apenas na renderização.
3.  **Responsividade:** Aplicação estrita da abordagem Mobile-First através das classes utilitárias do Tailwind.
4.  **Tipagem Estática:** Todas as interfaces de dados recebidas da API devem possuir tipos correspondentes definidos em TypeScript.
