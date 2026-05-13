# 01. Arquitetura do Frontend

O frontend da plataforma Pet+ foi projetado para ser uma aplicação web moderna, performática e escalável. Utilizamos uma abordagem modular e baseada em componentes, garantindo a reutilização de código e a facilidade de manutenção.

---

## 🛠️ Stack Tecnológica

### Core
- **React 18:** Biblioteca principal para construção da interface baseada em componentes.
- **Vite:** Ferramenta de build e dev server ultrarrápido.
- **TypeScript:** Superset de JavaScript que adiciona tipagem estática.

### Dados e Estado de Servidor
- **TanStack Query (React Query):** gerenciamento de dados remotos — cache, refetch, invalidation, optimistic updates. Configurado em [`src/lib/queryClient.ts`](../../frontend/src/lib/queryClient.ts) com `staleTime: 30s` e sem retry em 4xx.
- **Cliente HTTP único:** [`src/lib/httpClient.ts`](../../frontend/src/lib/httpClient.ts) — wrapper sobre `fetch` com injeção automática de Bearer, parser de erros padronizado (`ApiError`), e hook `onUnauthorized` que dispara logout global em 401.

### Estado Global de Aplicação (Context API)
- **`AuthContext`** ([`src/contexts/AuthContext.tsx`](../../frontend/src/contexts/AuthContext.tsx)): `user`, `token`, `isAuthenticated`, `isLoading`, `login`, `logout`, `refetchMe`, `setUser`.
- **`FavoritesContext`** ([`src/contexts/FavoritesContext.tsx`](../../frontend/src/contexts/FavoritesContext.tsx)): `Set<\`${type}:${id}\`>` hidratado no boot. Expõe `isFavorite(type, id)` e `toggle(type, id)` com otimismo + rollback.
- **`CartContext`** ([`src/components/cart/CartContext.tsx`](../../frontend/src/components/cart/CartContext.tsx)): **dual-mode** — `localStorage` quando anônimo, servidor quando autenticado. Merge automático ao logar.

### Navegação e Roteamento
- **React Router v7:** Gerenciamento de rotas SPA, suportando carregamento dinâmico e proteção de rotas via [`ProtectedRoute`](../../frontend/src/components/auth/ProtectedRoute.tsx) (consome `useAuth`).

### Formulários e Validação
- **React Hook Form:** Manipulação eficiente de formulários.
- **Zod + `@hookform/resolvers`:** Schemas de validação espelhando o backend (telefone com máscara, CEP com máscara, UF whitelist, etc.).
- **Máscaras:** [`src/lib/utils/masks.ts`](../../frontend/src/lib/utils/masks.ts) exporta `formatPhone`, `formatCep`, `PHONE_MASKED_REGEX`, `CEP_MASKED_REGEX`.

### Estilização e UI
- **Tailwind CSS 4:** Framework utilitário para estilização rápida, responsiva e moderna.
- **Shadcn/UI & Radix UI:** Conjunto de componentes acessíveis e customizáveis.
- **Lucide React:** Biblioteca de ícones.
- **`HamsterLoader`** ([`src/components/ui/HamsterLoader.tsx`](../../frontend/src/components/ui/HamsterLoader.tsx)): loader temático Pet+ usado em loaders de **página/seção**. `Loader2` da Lucide continua sendo usado em loaders **inline de botões** (escala apropriada).

---

## 📂 Estrutura de Pastas (`/frontend/src/`)

```
src/
├── app/
│   ├── App.tsx          # Composição dos providers (QueryClient > Auth > Favorites > Cart)
│   └── routes.tsx       # Definição de rotas + ProtectedRoute
├── components/
│   ├── ui/              # Componentes base (Shadcn, HamsterLoader)
│   ├── layout/          # Navbar, DashboardLayout, Sidebar
│   ├── cart/            # CartContext
│   ├── auth/            # ProtectedRoute
│   └── tutor/           # AddressesSection (extraído do TutorProfile)
├── contexts/
│   ├── AuthContext.tsx
│   └── FavoritesContext.tsx
├── lib/
│   ├── api.ts           # API_URL e getHeaders legados
│   ├── httpClient.ts    # cliente HTTP único (use este, não fetch cru)
│   ├── queryClient.ts   # configuração do TanStack Query
│   ├── hooks/           # hooks customizados (useProfile, useAddresses, usePets, useCepLookup)
│   ├── services/        # camada de serviço por domínio
│   └── utils/           # masks, helpers
├── pages/
│   ├── tutor/           # Visão do tutor (TutorProfile, TutorPets, TutorOrders, TutorAppointments)
│   ├── auth/            # LoginPage, RegisterPage, etc.
│   ├── dashboard/       # Visões admin/lojista/hotel/sitter
│   └── onboarding/      # PetSitterOnboarding
└── styles/              # CSS global
```

---

## 🔌 Camada de Serviços (`lib/services/`)

Cada arquivo encapsula a comunicação com um domínio do backend usando o `httpClient`. Não há `fetch` cru em service novo.

| Service | Domínio | Métodos principais |
|---|---|---|
| `userService` | `/users/me`, avaliação de sitter | `getMe`, `updateMe`, `changePassword`, `uploadAvatar`, `submitSitterEvaluation`, métodos admin |
| `addressService` | `/addresses` | `list`, `create`, `update`, `setDefault`, `remove` |
| `petService` | `/users/me/pets` | `list`, `get`, `create`, `update`, `remove` |
| `favoriteService` | `/favorites` | `list`, `listIds`, `add`, `remove` |
| `cartService` | `/cart` | `get`, `addItem`, `updateItem`, `removeItem`, `clear`, `merge` |
| `productService` | `/products` | listagem pública + gestão de lojista |
| `providerService` | `/providers` | hotéis, sitters, stores, detalhes |
| `authService` | `/auth` | `register`, `logout`, `forgotPassword`, `resetPassword` (login agora pelo `useAuth().login`) |

---

## 🪝 Hooks Customizados (`lib/hooks/`)

Hooks são a fachada entre os componentes e a camada de serviços. Encapsulam o uso do TanStack Query, cache invalidation e otimismo.

| Hook | Estado expostos | Mutations |
|---|---|---|
| `useProfile` | `profile`, `isLoading`, `isError` | `updateProfile`, `changePassword`, `uploadAvatar` (sincronizam `AuthContext.setUser`) |
| `useAddresses` | `addresses`, `isLoading`, `isError` | `createAddress`, `updateAddress`, `setDefault`, `removeAddress` (com optimistic update) |
| `usePets` | `pets`, `isLoading`, `isError` | `createPet`, `updatePet`, `removePet` (optimistic remove) |
| `useCepLookup` | `isFetchingCep` | `lookupCep(rawCep)` — chama ViaCEP, retorna `{address_line, neighborhood, complement, city, state}` |

---

## 🚦 Padrão de Invalidação e Sincronização

| Mutação | Cache invalidado |
|---|---|
| `updateProfile`, `uploadAvatar` | `['me']` + `AuthContext.setUser` |
| Endereços (`create/update/setDefault/remove`) | `['addresses']` |
| Pets (`create/update/remove`) | `['pets']` |
| Favoritos | `FavoritesContext.refresh()` (set local atualiza otimisticamente) |
| Carrinho | `['cart']` (mutations já usam `setQueryData` direto) |
| Login | Limpa cache e refetch `['me']`, `['cart']`, `['favorites']` |
| Logout | `queryClient.clear()` + redirect |

---

## 🚀 Padrões de Desenvolvimento

1. **Componentização:** Dividir a interface em pequenos componentes funcionais e puros sempre que possível.
2. **Hooks Customizados:** Isolar a lógica de negócio e chamadas de API em hooks para manter os componentes focados em renderização.
3. **Formulários:** sempre RHF + Zod resolver. Schema do front espelha o do backend.
4. **Erros do servidor:** capturados via `ApiError`; `instanceof ApiError` para extrair `.message` e mostrar em `toast.error`.
5. **Tipagem estrita:** todas as interfaces de dados recebidas da API têm tipos correspondentes em TypeScript.
6. **Responsividade:** Mobile-first com Tailwind.
7. **Loaders:** `HamsterLoader` para tela/seção; `Loader2` da Lucide para botões e ícones inline.
