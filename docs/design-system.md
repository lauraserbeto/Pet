# 🎨 Pet+ | Design System Documentation

> **Documento de referência completo dos componentes visuais, tokens de design e padrões de UI utilizados na plataforma Pet+.**
>
> Fonte da verdade: `frontend/src/styles/theme.css`, `frontend/src/styles/fonts.css`, `frontend/src/components/ui/*` e `frontend/src/pages/StyleGuide.tsx`.

---

## 📑 Índice

1. [Identidade da Marca](#1-identidade-da-marca)
2. [Paleta de Cores](#2-paleta-de-cores)
3. [Tipografia](#3-tipografia)
4. [Espaçamento, Bordas e Sombras](#4-espaçamento-bordas-e-sombras)
5. [Breakpoints e Responsividade](#5-breakpoints-e-responsividade)
6. [Iconografia](#6-iconografia)
7. [Componentes de UI](#7-componentes-de-ui)
8. [Padrões de Layout](#8-padrões-de-layout)
9. [Animações e Microinterações](#9-animações-e-microinterações)
10. [Efeitos Visuais Especiais](#10-efeitos-visuais-especiais)
11. [Acessibilidade](#11-acessibilidade)
12. [Tech Stack Visual](#12-tech-stack-visual)
13. [Assets e Imagens](#13-assets-e-imagens)

---

## 1. Identidade da Marca

### 1.1 Nome

**Pet+** (lê-se "Pet Plus") — Ecossistema & Marketplace Pet.

### 1.2 Logotipos

O logotipo está disponível em variantes localizadas em `frontend/src/assets/pet+/`:

| Arquivo | Uso recomendado |
|---|---|
| `logo-horizontal.png` | **Logo principal (usado na Navbar, Footer, Sidebar e Telas de Autenticação)** — formato horizontal de alta legibilidade |
| `logo-vertical.png` | **Variante vertical** — recomendada para layouts centralizados ou proporções quadradas/altas |
| `icon.png` (em `public/`) | **Favicon** — ícone oficial usado na aba do navegador |
| `icon-branco.png` | Variante de ícone com fundo branco circular |
| `icon-transparente.png` | Variante de ícone com fundo transparente |
| `identidade-visual.png` | Arquivo geral de referência da identidade visual do projeto |

**Dimensões em uso:**
- Navbar (header público): `h-16` (≈64px)
- Sidebar (dashboard): `h-24` expandida / `h-12` colapsada
- Footer: `h-20` (≈80px)

### 1.3 Tom e personalidade

- **Acolhedor** — voltado para tutores que confiam serviços de seus pets.
- **Profissional & Confiável** — marketplace + RBAC multi-perfil.
- **Moderno** — uso de gradientes sutis, glassmorphism, microanimações.
- **Lúdico** — uso pontual de pegadas, emojis pet (🐾) e mascote (Hamster Loader).

---

## 2. Paleta de Cores

A paleta segue o padrão Tailwind (escala 50 → 900) e está declarada via CSS Custom Properties no `@theme` do Tailwind v4.

### 2.1 Primary — Brand Orange 🟠

Cor de destaque da marca. Usada em CTAs, links ativos, badges, gradientes de avatar, foco de inputs e estados ativos da navegação.

| Token | Valor HEX | Preview |
|---|---|---|
| `--color-primary-50` | `#fff8eb` | ░░ Plano de fundo de hover/seleção sutil |
| `--color-primary-100` | `#fdecd1` | ░░ Badge default (background) |
| `--color-primary-200` | `#fcd9a3` | ▒▒ Hover de badge / borda hover |
| `--color-primary-300` | `#fbbd68` | ▒▒ Borda em foco de input/search |
| `--color-primary-400` | `#f99c2b` | ▓▓ Borda focus de input / topo do gradient avatar |
| `--color-primary-500` | `#f58b05` | ██ **Cor base da marca** — botões primários, ícones de destaque |
| `--color-primary-600` | `#d67000` | ██ Hover do botão primário, link button, base do gradient avatar |
| `--color-primary-700` | `#b35602` | ██ Texto sobre badges claros |
| `--color-primary-800` | `#8f4107` | ██ Reservado para profundidade |
| `--color-primary-900` | `#75330a` | ██ Reservado para alto contraste |

**Uso comum:**
```tsx
className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white"
```

### 2.2 Secondary — Trust Blue 🔵

Cor de apoio que transmite confiança e tranquilidade. Usada em variantes secundárias de botões/badges.

| Token | Valor HEX |
|---|---|
| `--color-secondary-50` | `#f0f7fb` |
| `--color-secondary-100` | `#e0f0f8` |
| `--color-secondary-200` | `#c4e9f2` |
| `--color-secondary-300` | `#93d4eb` |
| `--color-secondary-400` | `#57b7e3` |
| `--color-secondary-500` | `#3699d2` — **base** |
| `--color-secondary-600` | `#267ab0` — hover |
| `--color-secondary-700` | `#206390` — texto sobre badge |
| `--color-secondary-800` | `#1d5378` |
| `--color-secondary-900` | `#1b4562` |

### 2.3 Neutros — Slate ⚫

A escala neutra utilizada em todo o projeto é a `slate` do Tailwind. Não foram criados tokens customizados — usa-se diretamente `slate-50` … `slate-950`.

| Classe Tailwind | Uso predominante |
|---|---|
| `slate-50` | Background de dashboards e seções claras |
| `slate-100` | Hover de ghosts, separadores, backgrounds suaves |
| `slate-200` | **Bordas padrão** de cards, inputs e botões outline |
| `slate-300` | Borda do checkbox |
| `slate-400` | Placeholder e ícones inativos |
| `slate-500` | Texto secundário / descrições / labels muted |
| `slate-600` | Texto de navegação e botões secundários |
| `slate-700` | Labels de formulário |
| `slate-800` | Sidebar (background secundário) |
| `slate-900` | **Background da Sidebar e Footer**, texto principal |
| `slate-950` | Texto em cards |

### 2.4 Cores Semânticas

Cores que comunicam estado/feedback. Usam tokens nativos do Tailwind (não há override de tema).

| Estado | Cores |
|---|---|
| **Sucesso** ✅ | Badge: `bg-green-100 text-green-700` · Live indicator: `bg-green-500` |
| **Erro / Destrutivo** ❌ | Bordas/texto: `red-400`/`red-500`/`red-600` · Badge: `bg-red-100 text-red-700` |
| **Aviso** ⚠️ | Banner de completitude: `bg-amber-50 border-amber-200 text-amber-700/900` |
| **Informação / Avaliação** ⭐ | Estrelas: `fill-yellow-400 text-yellow-400` |
| **Notificação** 🔔 | Ponto pulsante: `bg-red-500 animate-pulse` |

### 2.5 Gradientes utilizados

```css
/* Avatar do tutor logado */
bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)]

/* Cards de categoria na Landing (popularCategories) */
from-amber-400 to-orange-500    /* Alimentação */
from-pink-400 to-rose-500       /* Brinquedos */
from-sky-400 to-blue-500        /* Higiene */
from-violet-400 to-purple-500   /* Acessórios */
from-teal-400 to-emerald-500    /* Conforto */
from-green-400 to-emerald-500   /* Farmácia */
```

---

## 3. Tipografia

### 3.1 Famílias

Importadas via Google Fonts em `frontend/src/styles/fonts.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Nunito:wght@600;700;800&display=swap');
```

Declaradas como tokens em `theme.css`:

```css
--font-display: "Nunito", sans-serif;
--font-body:    "Inter",  sans-serif;
```

| Família | Token | Pesos disponíveis | Função |
|---|---|---|---|
| **Nunito** | `--font-display` | 600, 700, 800 | Headings, botões, labels de formulário, badges, títulos de cards. Mais arredondada, transmite acolhimento. |
| **Inter** | `--font-body` | 400, 500, 600, 700 | Corpo de texto, descrições, conteúdo de card, parágrafos. Excelente legibilidade em telas. |

Aplicação via classe utilitária:
```tsx
className="font-[family-name:var(--font-display)]"
className="font-[family-name:var(--font-body)]"
```

### 3.2 Hierarquia tipográfica

Conforme `StyleGuide.tsx`:

| Nível | Classe Tailwind | Tamanho | Peso | Família | Uso |
|---|---|---|---|---|---|
| **H1** | `text-4xl font-extrabold` | 36px | 800 | Nunito | Hero / títulos de landing e Style Guide |
| **H2** | `text-3xl font-bold` | 30px | 700 | Nunito | Seções principais |
| **H3** | `text-2xl font-bold` | 24px | 700 | Nunito | Subtítulos / títulos de card (`CardTitle`) |
| **H4** | `text-xl font-semibold` | 20px | 600 | Nunito | Sub-seções |
| **Body Base** | `text-base` | 16px | 400 | Inter | Texto corrido |
| **Body Small** | `text-sm` | 14px | 400-500 | Inter | Descrições, labels, links de menu |
| **Caption / Muted** | `text-xs text-slate-500` | 12px | 400-600 | Inter | Captions, metadata, descrições de campo |
| **Eyebrow / Section label** | `text-sm uppercase tracking-wider text-slate-500` | 14px | 500 | Nunito | Etiquetas de seção, headers do Footer |
| **Microtag** | `text-[10px] uppercase tracking-wider` | 10px | 600 | Nunito | Badges de categoria em cards |

### 3.3 Regras semânticas

- **Headings sempre Nunito** (`font-display`) com peso ≥ 700.
- **Body sempre Inter** (`font-body`) com pesos 400-500 para leitura.
- **Botões e badges em Nunito** para reforço visual de ação.
- **Labels de input em Nunito 500** (`text-sm font-medium`).
- **Letter-spacing wider** em uppercase/eyebrows (`tracking-wider` ou `tracking-tight` para microtags).

---

## 4. Espaçamento, Bordas e Sombras

### 4.1 Escala de espaçamento

Usa a escala padrão do Tailwind. Padrões mais frequentes no projeto:

| Token | Pixels | Uso |
|---|---|---|
| `gap-2` | 8px | Itens próximos (ícone + texto) |
| `gap-3` | 12px | Lista de menu |
| `gap-4` | 16px | Botões em linha |
| `space-y-2` / `gap-6` | 24px | Espaçamento entre campos de formulário |
| `p-4` | 16px | Padding interno de card pequeno |
| `p-6` | 24px | **CardHeader / CardContent padrão** |
| `py-12` / `py-16` | 48-64px | Padding vertical de seção |
| `px-4 sm:px-6 lg:px-8` | — | Padding horizontal responsivo de container |
| `max-w-7xl mx-auto` | 1280px | Largura máxima de container principal |

### 4.2 Border Radius

| Token | Valor | Uso |
|---|---|---|
| `rounded-sm` | 2px | SelectItem indicator |
| `rounded-md` | 6px | Inputs, botões `sm`/`lg` |
| `rounded-lg` | 8px | **Botões padrão**, alertas |
| `rounded-xl` | 12px | **Cards**, dropdowns, mobile menu items |
| `rounded-2xl` | 16px | Hero search wrapper |
| `rounded-full` | 9999px | Avatars, badges, ícones circulares, search da navbar |

### 4.3 Sombras

| Token | Uso |
|---|---|
| `shadow-sm` | **Cards padrão**, inputs |
| `shadow-md` | Hover em CTAs principais |
| `shadow-lg` | Dropdowns de perfil, modais |
| `shadow-xl` | Modal de logout, mobile menu |
| `shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]` | Hero search (sombra suave de glassmorphism) |
| `shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary-500)_20%,transparent)]` | **Focus ring laranja** em inputs |

### 4.4 Bordas

- Padrão: `border border-slate-200`
- Focus: `border-[var(--color-primary-400)]` + box-shadow ring (acima)
- Erro: `border-red-400` + box-shadow `0_0_0_3px_rgba(239,68,68,0.15)`
- Separadores internos: `border-slate-100`

---

## 5. Breakpoints e Responsividade

Tokens customizados em `theme.css`:

```css
--breakpoint-fhd: 1920px;
--breakpoint-3xl: 1920px;
```

| Breakpoint | Largura mínima | Uso |
|---|---|---|
| `sm` | 640px | Pequenos tablets / smartphones em landscape |
| `md` | 768px | **Quebra desktop ↔ mobile** (menu hamburguer) |
| `lg` | 1024px | Sidebar expandida no dashboard |
| `xl` | 1280px | `max-w-7xl` (limite de containers) |
| `2xl` | 1536px | Layouts amplos |
| `3xl` / `fhd` | 1920px | **Customizado** — telas Full HD |

**Padrão de container:**
```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
```

---

## 6. Iconografia

### 6.1 Biblioteca principal

**[Lucide React](https://lucide.dev/)** (`lucide-react@0.487.0`) — biblioteca primária e exclusiva de ícones em todo o produto.

### 6.2 Biblioteca complementar

**[Material UI Icons](https://mui.com/material-ui/material-icons/)** (`@mui/icons-material@7.3.5`) — uso pontual.

### 6.3 Convenções

- **Tamanho padrão dentro de botões/inputs:** `h-4 w-4` (16px) ou `h-5 w-5` (20px).
- **Tamanho de menu na Sidebar:** `size={20}`.
- **Cores de ícone seguem o contexto:**
  - Inativo: `text-slate-400` / `text-slate-500`
  - Hover: `text-slate-900` ou `text-[var(--color-primary-600)]`
  - Ativo: `text-[var(--color-primary-500)]`

### 6.4 Ícones recorrentes por funcionalidade

| Funcionalidade | Ícone Lucide |
|---|---|
| Marca / Pet genérico | `PawPrint` |
| Hotelaria | `Hotel` |
| Pet Sitter / Passeio | `Footprints` |
| Shopping / Marketplace | `ShoppingBag` |
| Carrinho | `ShoppingCart` |
| Login / Logout | `LogIn` / `LogOut` |
| Usuário | `UserCircle` / `User` |
| Dashboard | `LayoutDashboard` |
| Agenda | `Calendar` |
| Produtos | `Package` |
| Aprovações | `ClipboardCheck` |
| Favoritos | `Heart` |
| Loja | `Store` |
| Financeiro | `DollarSign` |
| Configurações | `Settings` |
| Notificação | `Bell` |
| Busca | `Search` |
| Localização | `MapPin` |
| Avaliação | `Star` |
| Loader | `Loader2` (`animate-spin`) |
| Categorias (Landing) | `Bone`, `Sparkles`, `Bath`, `Tag`, `Sofa`, `Pill`, `Shirt` |

---

## 7. Componentes de UI

Implementados em `frontend/src/components/ui/`. Stack: **shadcn/ui** sobre **Radix UI**, com `class-variance-authority` (CVA) para variantes.

### 7.1 Button (`button.tsx`)

**Variantes:**

| Variante | Visual | Caso de uso |
|---|---|---|
| `default` | Laranja sólido (primary-500 → hover 600) | **CTA principal** |
| `secondary` | Azul sólido (secondary-500) | Ações alternativas |
| `destructive` | Vermelho (red-500) | Excluir / sair |
| `outline` | Borda slate-200, fundo branco | Ações neutras |
| `ghost` | Sem fundo, hover slate-100 | Toolbar, ícones |
| `link` | Texto laranja-600 com underline no hover | Links inline |

**Tamanhos:** `sm` (h-9 px-3), `default` (h-10 px-4), `lg` (h-11 px-8), `icon` (h-10 w-10).

**Características comuns:**
- `font-[family-name:var(--font-display)]` — Nunito
- `rounded-lg` (padrão) ou `rounded-md` (sm/lg)
- `transition-colors` + `focus-visible:ring-2`
- `disabled:opacity-50 disabled:pointer-events-none`

### 7.2 Badge (`badge.tsx`)

| Variante | Fundo / Texto |
|---|---|
| `default` | `primary-100` / `primary-700` |
| `secondary` | `secondary-100` / `secondary-700` |
| `success` | `green-100` / `green-700` |
| `destructive` | `red-100` / `red-700` |
| `outline` | Apenas borda `slate-200` |

- Formato: `rounded-full px-2.5 py-0.5 text-xs font-semibold`
- Fonte: Nunito

### 7.3 Card (`card.tsx`)

Composição modular:

```
Card
├── CardHeader
│   ├── CardTitle  (Nunito 2xl bold slate-800)
│   └── CardDescription (Inter sm slate-500)
├── CardContent  (Inter)
└── CardFooter
```

Base: `rounded-xl border border-slate-200 bg-white shadow-sm`.

### 7.4 Input (`input.tsx`)

- Altura: `h-10`
- Border: `border-slate-200` → focus `primary-400` + ring laranja translúcido
- Erro: borda + texto vermelhos + ring vermelho
- Suporte a `label` (Nunito 500) e `error` (xs vermelho)
- Placeholder: `slate-400`

### 7.5 Select (`select.tsx`)

Wrapper do Radix Select com mesma estética do Input: borda, focus laranja, popover branco com `shadow-md` e bordas arredondadas.

### 7.6 Checkbox (`checkbox.tsx`)

- 16×16px, `rounded-sm`, borda `slate-300`
- Estado checado: `bg-primary-500 + border-primary-500 + text-white` com ícone `Check`

### 7.7 Switch (`switch.tsx`)

- 44×24px, `rounded-full`
- Off: `bg-slate-200` · On: `bg-primary-500`
- Thumb branco com sombra, translação suave

### 7.8 Avatar (`avatar.tsx`)

- Padrão: 40×40px, `rounded-full`, fundo `slate-100`
- Fallback: iniciais em Nunito bold sobre `slate-200`
- No dashboard: borda dupla laranja `border-2 border-primary-500`
- No header de tutor logado: gradiente laranja + sombra

### 7.9 Outros componentes disponíveis

`calendar.tsx`, `dialog.tsx`, `label.tsx`, `loader.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `HamsterLoader.tsx`.

### 7.10 Componentes de domínio

- **`ServiceCard.tsx`** — card para hotéis/pet sitters/lojas com imagem, badge "Aberto Agora", rating, distância e CTA "Agendar".
- **`HeroSearch.tsx`** — barra de busca dupla (serviço + localização) com glassmorphism.
- **`AnimatedHeroIllustration.tsx`** — ilustração animada do herói.
- **`Navbar.tsx`** / **`Sidebar.tsx`** / **`Footer.tsx`** / **`DashboardLayout.tsx`** / **`Layout.tsx`** — estruturais.

---

## 8. Padrões de Layout

### 8.1 Layout público (Site)

```
┌──────────────────────────────────────────────┐
│  Navbar (sticky, h-16, white/blur ao rolar)  │
├──────────────────────────────────────────────┤
│                                              │
│  <Outlet> — Conteúdo da página               │
│  Container: max-w-7xl px-4 sm:px-6 lg:px-8   │
│                                              │
├──────────────────────────────────────────────┤
│  Footer (bg-slate-900, 4 colunas md+)        │
└──────────────────────────────────────────────┘
```

- **Navbar comportamento:** `sticky top-0 z-50`. Após scroll > 20px: vira `bg-white/70 backdrop-blur-md`.
- **Logo:** 64px de altura, alinhada à esquerda.
- **Busca central:** input `rounded-full bg-slate-50` que clareia (`focus:bg-white`) com ring `primary-50`.
- **CTAs Login/Cadastrar:** chip duplo no canto direito (`bg-slate-50 + rounded-full` com botão "Cadastrar" laranja).

### 8.2 Layout do Dashboard

```
┌──────────┬─────────────────────────────────┐
│          │  Header (h-16, busca + perfil)  │
│          ├─────────────────────────────────┤
│ Sidebar  │  ⚠ Banner completitude (cond.)  │
│ slate-900│ ├─────────────────────────────────┤
│ w-64/w-20│  Outlet — Conteúdo do painel    │
│          │  bg-slate-50/50 p-4 sm:p-6 lg:p-8│
│          │                                 │
└──────────┴─────────────────────────────────┘
```

- **Sidebar colapsável:** 256px expandida ↔ 80px colapsada, com botão `ChevronLeft/Right` ancorado em `slate-800`.
- **Item ativo:** `bg-primary-600 text-white shadow-md`.
- **Item hover:** `bg-slate-800 text-white` + `scale-110` no ícone.
- **Drawer mobile:** `translate-x` animado + overlay `bg-slate-900/50 backdrop-blur-sm`.

### 8.3 Banner de completitude

Padrão de comunicação para parceiros (Hotel/Pet Sitter) que ainda não estão publicados:

```
bg-amber-50 border-amber-200
├── Ícone AlertTriangle em chip amber-100
├── Texto amber-900 (título) + amber-700 (campos faltantes)
└── Botão outline branco com texto amber-700
```

---

## 9. Animações e Microinterações

### 9.1 Bibliotecas

- **[Motion (Framer Motion)](https://motion.dev/)** `12.23.24` — animações declarativas em React.
- **[GSAP](https://gsap.com/)** `3.14.2` — animações complexas/timeline (ex.: hero).
- **[tw-animate-css](https://www.npmjs.com/package/tw-animate-css)** `1.3.8` — classes utilitárias estilo `animate-*`.

### 9.2 Padrões de transição

| Padrão | Classe Tailwind |
|---|---|
| Cor padrão | `transition-colors` |
| Layout / spacing | `transition-all duration-200` |
| Shadow | `transition-shadow` |
| Hover lift | `hover:scale-105` (botões), `hover:scale-110` (ícones de sidebar) |
| Card hover | `hover:shadow-md` + imagem `group-hover:scale-105` |
| Dropdown | `motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}` 150ms |

### 9.3 Microinterações específicas

- **Notificação pulsante:** `animate-pulse` no ponto vermelho do `Bell`.
- **Sino hover:** `hover:text-primary-600` com transição.
- **Search focus:** Ícone muda de `slate-400 → primary-500` + fundo do container `slate-50 → orange-50`.
- **Seta de CTA:** `motion.div animate={{x:[0,4,0]}} transition={{repeat:Infinity, duration:1.5}}` (Hero CTA).
- **Sidebar global icon:** `group-hover:rotate-12` no ícone de "Ir para o Site".

### 9.4 Loaders customizados

**Pet Spinner** (`index.css`) — patinha rotativa com 3 elementos usando `--color-primary-500` e `--color-primary-400`.

**Hamster Loader** (`HamsterLoader.tsx`) — mascote em uma roda de hamster (CSS puro, sem styled-components). Modos: `full` (60vh) ou `sm` (compacto). Mensagem custom + linha fixa `"Só um segundinho 🐾"`.

**Spinner padrão:** `<Loader2 className="animate-spin text-[var(--color-primary-500)]" />`.

---

## 10. Efeitos Visuais Especiais

### 10.1 Glassmorphism

Usado em:
- Navbar pós-scroll: `bg-white/70 backdrop-blur-md border-b border-white/20`
- Hero Search: `bg-white/40 backdrop-blur-xl border border-white/40`
- Overlay de modais: `bg-black/50 backdrop-blur-sm`
- Drawer mobile do Dashboard: `bg-slate-900/50 backdrop-blur-sm`

### 10.2 Ring laranja translúcido (foco)

Padrão único de foco em inputs/selects:

```css
focus:border-[var(--color-primary-400)]
focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary-500)_20%,transparent)]
```

### 10.3 Hover scale + sombra

Padrão em botões de ação principal:

```tsx
className="hover:bg-primary-600 shadow-md shadow-primary-500/20 transform hover:scale-105"
```

### 10.4 Gradientes em avatares

```tsx
className="bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm"
```

### 10.5 Truncate + line-clamp

- Nomes de cards: `line-clamp-1 truncate`
- Email do usuário no dropdown: `max-w-[120px] truncate`

---

## 11. Acessibilidade

### 11.1 Boas práticas implementadas

- **`focus-visible:ring-2 ring-offset-2`** em botões e elementos interativos.
- **`aria-label`** / `aria-expanded` / `aria-haspopup` no dropdown de perfil.
- **`role="status"`** + `aria-label` no HamsterLoader.
- **Teclas Enter/Space** ativando o dropdown do tutor (`onKeyDown`).
- **Atributos `title`** em ícones colapsados na Sidebar.
- **Contraste:** texto principal em `slate-900`/`slate-950` sobre branco; texto em sidebar `slate-300` sobre `slate-900`.

### 11.2 Estados disabled

Padrão consistente: `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`.

### 11.3 Suporte a `next-themes` 0.4.6

A dependência está instalada no `package.json`, sinalizando suporte futuro a **dark mode**. Atualmente, o produto é apenas light.

---

## 12. Tech Stack Visual

### 12.1 Stack do design system

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework CSS | **Tailwind CSS** | `4.1.12` |
| Plugin Vite | `@tailwindcss/vite` | `4.1.12` |
| Animações utilitárias | `tw-animate-css` | `1.3.8` |
| Primitives | **Radix UI** (24+ pacotes: dialog, dropdown, select, checkbox, popover, tabs, …) | — |
| Variantes | `class-variance-authority` (CVA) | `0.7.1` |
| Merge de classes | `clsx` + `tailwind-merge` | — |
| Ícones | `lucide-react` | `0.487.0` |
| Ícones MUI (apoio) | `@mui/icons-material` | `7.3.5` |
| Animação React | `motion` (Framer Motion) | `12.23.24` |
| Animação avançada | `gsap` | `3.14.2` |
| Toasts | `sonner` | `2.0.3` |
| Datepicker | `react-day-picker` | `8.10.1` |
| OTP Input | `input-otp` | `1.4.2` |
| Carousel | `embla-carousel-react` | `8.6.0` |
| Drawer mobile | `vaul` | `1.1.2` |
| Charts | `recharts` | `2.15.2` |
| Drag & drop | `react-dnd` + `react-dnd-html5-backend` | `16.0.1` |
| Masonry layout | `react-responsive-masonry` | `2.7.1` |
| Command palette | `cmdk` | `1.1.1` |
| Slider (carrossel) | `react-slick` | `0.31.0` |
| MUI Material | `@mui/material` + `@emotion/*` | `7.3.5` |
| Dark mode (futuro) | `next-themes` | `0.4.6` |

### 12.2 Utilitário `cn`

Helper em `frontend/src/lib/utils.ts` combinando `clsx` + `tailwind-merge` — usado em **todos os componentes** para concatenar classes condicionais sem conflito.

---

## 13. Assets e Imagens

### 13.1 Estrutura

```
frontend/
├── public/
│   ├── hero_dog_breakout.png         (377 KB)
│   ├── hero_illustration.png         (155 KB)
│   ├── hero_illustration_v2.png      (156 KB)
│   ├── hero_isolated.png             (156 KB)
│   ├── hero_nobg.png                 (283 KB)
│   ├── icon.png                      (favicon, 312 KB)
│   ├── preview.jpg                   (preview Open Graph)
│   └── images/
└── src/assets/
    ├── pet+/                         (logos institucionais)
    │   ├── logo-horizontal.png       ← logo principal (horizontal)
    │   ├── logo-vertical.png         ← variante vertical
    │   ├── icon-branco.png           ← variante com fundo branco
    │   ├── icon-transparente.png     ← variante com fundo transparente
    │   ├── identidade-visual.png     ← referência geral da marca
    │   └── pets.jpg
    ├── paw_pattern.png               (padrão de pegadas)
    ├── paw_pattern_bg.png            (padrão de pegadas - background)
    ├── icon_dashboard.png
    ├── icon_agenda.png
    ├── icon_reach.png
    ├── business_calendar_icon.png
    ├── business_growth_icon.png
    ├── business_reach_icon.png
    ├── pet_shop_partner_cta.png
    └── …+50 imagens hash do Figma (importadas do design original)
```

### 13.2 Componente de fallback

**`ImageWithFallback`** em `app/components/figma/ImageWithFallback.tsx` — wrapper para imagens com fallback gracioso em caso de erro. Usado em todos os locais que renderizam imagens externas (Navbar/Footer/Sidebar/Avatar/Cards).

### 13.3 Imagens externas

A landing page utiliza imagens de **Unsplash** (URLs assinadas) para produtos e categorias da seção `popularCategories` e `weeklyHighlights`.

---

## 📋 Resumo Executivo (TL;DR)

| Eixo | Decisão |
|---|---|
| **Cor primária** | 🟠 Laranja `#f58b05` (primary-500) — gera calor e ação |
| **Cor secundária** | 🔵 Azul `#3699d2` (secondary-500) — gera confiança |
| **Neutro principal** | Slate (50-900) |
| **Fonte de display** | Nunito (600-800) — para títulos, botões, badges |
| **Fonte de corpo** | Inter (400-700) — para conteúdo |
| **Border-radius padrão** | `lg` (8px) para botões / `xl` (12px) para cards |
| **Foco** | Ring laranja translúcido com `color-mix` |
| **Iconografia** | Lucide React (exclusivo) |
| **Animação** | Framer Motion + GSAP + transições Tailwind |
| **Containers** | `max-w-7xl` com padding responsivo |
| **Breakpoint principal** | `md` (768px) decide desktop ↔ mobile |
| **Tema** | Light (dark preparado via next-themes) |

---

> 📌 **Página de referência viva:** acesse `/style-guide` na aplicação para ver todos os componentes renderizados (`frontend/src/pages/StyleGuide.tsx`).
