# Auditoria visual — Fase 2 (fundações): implementação e validação

20/11/2026 · branch `codex/retomada-servicos` · alterações locais, **sem commit, push ou deploy**.

Origem: [relatório](index.html), grupos G01, G02, G03, G04 e G05, com a decisão de contraste da [Fase 0](FASE0-DECISOES.md).

## O que mudou

| Grupo | Mudança | Onde |
|---|---|---|
| G01 | Camada base com a regra de compatibilidade do Tailwind v4: bordas sem cor usam `slate-200` em vez de `currentColor`. Corrige de uma vez as bordas pretas de diretório, agenda, reserva, históricos e cards novos. | `styles/theme.css` (`@layer base`) |
| G01/G23 | Spinners que dependiam de `border-primary` (classe inexistente no tema) apareciam pretos: o carregamento do `ProtectedRoute` passou a usar o `HamsterLoader` com “Verificando sua sessão…”; o do onboarding do Pet Sitter ganhou cores explícitas. | `ProtectedRoute.tsx`, `PetSitterOnboarding.tsx` |
| G02 | `h1–h3` na fonte de display (Nunito) e `body` em `slate-900` (antes não havia cor base e os títulos novos saíam em preto puro e Inter). A cor dos títulos é herdada, para não afetar heróis com texto branco. | `styles/theme.css` |
| G03 | Decisão “laranja escuro”: superfícies com texto branco passaram de `primary-500`→`primary-700` (hover `600`→`800`; gradientes `500/600`→`700/800`) e texto `primary-600`→`primary-700`. Ícones e decoração em `primary-500` não mudaram. 110 trocas em 38 arquivos, feitas por script restrito a literais de classe; mais calendário (foco), checkbox marcado e, na landing, o card “Pet Sitter” (`#f57a26`), o selo “Novo” (`emerald-500`→`700`) e o rótulo da loja (`slate-400`→`500`); selo de etapa concluída do checkout (`emerald-700`). | `ui/button.tsx` (variantes `default` e `link`) e telas |
| G04 | `aria-label` em botões só com ícone: menu hambúrguer público e do painel (com `aria-expanded`), fechar menu, recolher menu lateral, notificações, menu da conta do painel, favoritar (Shopping, landing, detalhe do produto, com `aria-pressed`), copiar link, editar/excluir produto, ações da tela demonstrativa de clientes. Atalho “Início” do painel deixou de ser `<Button>` dentro de `<Link>` (usa `asChild`). | `Navbar`, `DashboardLayout`, `Sidebar`, `ShoppingPage`, `LandingPage`, `ProductDetailPage`, `Products`, `Customers` |
| G05 | Anel de foco visível em “Mais” e no menu da conta do `Navbar`; anel do `Button` com cor definida (`primary-700`) — no v4 o anel sem cor herdava `currentColor` e sumia no botão de texto branco. | `Navbar.tsx`, `ui/button.tsx` |
| — | “Compartilhar” no detalhe do produto exibia “Link copiado!” sem copiar; agora copia a URL e informa falha. | `ProductDetailPage.tsx` |
| Docs | Tabela da cor primária e seção de acessibilidade atualizadas com a decisão e a justificativa. | `docs/design-system.md` |

## Validação

Runtime: Node 24.18.0 global (o validado no handoff é 24.22.3).

- **Suíte do frontend:** 35 arquivos / **181 testes aprovados**. Typecheck sem erros. Build aprovado (avisos de chunk já conhecidos). Lint: 0 erros.
- **Varredura repetida** (mesmas 151 capturas da auditoria: rotas × perfis × desktop/celular, axe WCAG 2.1 AA e Tab), com API e PostgreSQL locais descartáveis: ver comparativo abaixo.

| Medição (151 capturas) | Antes | Depois |
|---|---|---|
| `button-name` — telas / ocorrências | 116 / 399 | 19 / 46 |
| `link-name` — telas | 35 | 0 |
| `color-contrast` — telas / ocorrências | 134 / 679 | 59 / 198 |
| `label` — telas | 2 | 0 |
| Foco de teclado sem indicador (ocorrências) | 38 | 3 |
| Títulos H1–H3 em Inter | 115 | 0 |
| Títulos em preto puro | 22 | 0 |
| Telas com rolagem horizontal | 0 | 0 |
| Capturas com erro | 0 | 0 |

Também nesta rodada, a partir do resultado intermediário: iniciais do `Avatar` (`slate-500`→`slate-700` sobre `slate-200`), copyright do rodapé (`slate-500`→`slate-400` sobre `slate-900`) e rótulo associado ao e-mail somente leitura do perfil do Tutor.

Restam sem alteração (Fases 3–5): rótulos pequenos em `text-[10px]`/`text-[11px]` com `slate-400` em cards de produto e listas, selo azul dos cards da loja, botões de adicionar ao carrinho só com ícone nos cards (16 ocorrências) e os itens ligados a bibliotecas (gráfico Recharts, abas Radix, regiões roláveis). Detalhe em [`fase2/comparativo-axe.txt`](fase2/comparativo-axe.txt); prints antes/depois em [`fase2/`](fase2/).

Observação de método: uma rodada da suíte feita em paralelo à varredura (4 navegadores) teve 2 falhas por tempo esgotado em testes assíncronos (`Navbar.test.tsx`, `Products.test.tsx`); os dois arquivos passam sozinhos e a suíte completa passou na rodada seguinte, sem carga (181/181).

## Pendências identificadas nesta fase

- Card de favorito da landing muda só estado local e mostra “Adicionado aos favoritos” sem salvar (somar à G19, Fase 4). O botão fica dentro do link do card (controle aninhado).
- Ícones de editar/excluir pet em `slate-300` têm contraste baixo para controle (Fase 4/5).
- `theme.css` e `tailwind.css` importam `tailwindcss` duas vezes; não alterado nesta fase para não mexer na ordem das camadas.
- Gráfico de pizza do Admin (Recharts) e IDs das abas Radix seguem apontados pelo axe; dependem das bibliotecas.
