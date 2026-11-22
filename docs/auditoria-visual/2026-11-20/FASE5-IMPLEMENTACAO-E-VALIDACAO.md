# Auditoria visual — Fase 5 (P3 e limpeza): implementação e validação

22/11/2026 · branch `codex/retomada-servicos` · alterações locais, **sem commit, push ou deploy**.

Origem: [relatório](index.html), grupos G22–G26. Sem mudanças de backend nesta fase.

## O que mudou

| Grupo | Mudança | Onde |
|---|---|---|
| G22 | Remoção de pet e de endereço usa o diálogo do app (`ConfirmDialog`, mesmo padrão de `AppointmentActions`: título, consequência, “Voltar” e ação destrutiva) em vez de `window.confirm()`. Proteções do E-12 mantidas: cancelar não chama a API, botão bloqueado durante a operação, conflito mantém o card. A variante `destructive` do `Button` passou de `red-500` (3,76:1) para `red-600` (4,83:1). | `components/ConfirmDialog.tsx` (novo), `TutorPets.tsx`, `AddressesSection.tsx`, `ui/button.tsx` |
| G23 | Carregamentos do painel (layout e troca de rota) com o `HamsterLoader` da marca, como o `ProtectedRoute` desde a Fase 2. | `DashboardLayout.tsx` |
| G24 | Cadastro: senha e confirmação em coluna única no celular (antes, placeholders cortados lado a lado). Redefinição de senha com link inválido: aviso com atalho “Pedir um novo link”. A linha “Versão dos termos: …” foi **mantida**: é exigência do E-10 (aceite com versão) e coberta por testes unitários e E2E. | `RegisterPage.tsx`, `ResetPasswordPage.tsx` |
| G25 | Rótulos do Sidebar do Admin sem corte (“Aprovações”, “Avaliar sitters”); copyright único e com ano corrente em rodapé e telas de autenticação (“© {ano} Pet+.”, antes “© 2024 Pet+ Inc.” × “© 2026 Pet+.”); recuo extra removido de “Avaliações de Pet Sitters”. | `Sidebar.tsx`, `Footer.tsx`, telas de auth, `SitterEvaluations.tsx` |
| G26 | Removidos do working tree o kit de UI duplicado `src/app/components/ui` (48 arquivos) e `src/app/dashboard` (`LoadingState`, `Navbar`, `Sidebar` órfãos) — nenhuma importação no projeto (verificado inclusive para caminhos relativos dentro de `src/app`). Arquivos versionados; nada foi colocado em stage; restauráveis com `git checkout -- <pasta>`. `ImageWithFallback` (em uso) permanece em `src/app/components/figma`. Os `console.log` de sessão do `Navbar` já haviam saído na Fase 1. | `src/app/` |

## Validação

Runtime: Node 24.18.0 global (o validado no handoff é 24.22.3).

- **Frontend:** 38 arquivos / **188 testes** aprovados. `ResourceRemoval.test.tsx` passou a responder o diálogo (Voltar / Remover) em vez de simular `window.confirm`, preservando as mesmas garantias. Typecheck sem erros; lint 0 erros (avisos 126 → 124); build aprovado.
- **E2E:** `e2e/resource-deletion-real.spec.ts` foi adaptado para clicar nos botões do diálogo; **não executado** nesta sessão (depende de fixtures próprias).

### Comparativo final: auditoria original × após as Fases 1–5

Mesmas 151 capturas da auditoria (rotas × perfis × desktop 1440/celular 390), com axe WCAG 2.1 AA e navegação por Tab, sobre API e PostgreSQL locais descartáveis.

| Medição | Auditoria (20/11) | Após Fase 5 |
|---|---|---|
| `button-name` — telas / ocorrências | 116 / 399 | **13 / 17** |
| `link-name` — telas | 35 | **0** |
| `label` — telas | 2 | **0** |
| `color-contrast` — telas / ocorrências | 134 / 679 | **60 / 193** |
| Foco de teclado sem indicador (ocorrências) | 38 | **7** |
| Títulos H1–H3 em Inter / em preto puro | 115 / 22 | **0 / 0** |
| Telas com rolagem horizontal | 0 | 0 |
| Capturas com erro | 0 | 0 |

Também nesta rodada, a partir da varredura: `aria-label` nos botões de mostrar/ocultar senha (login, cadastro, redefinição) e no ícone de carrinho dos cards do Shopping.

Leitura dos restantes:
- **Foco (7):** 4 são do campo de busca do diretório, cujo anel agora fica no contêiner (`focus-within`) — indicador visível, mas a medição olha só o `input`; 3 são campos de data nativos da reserva e da agenda.
- **Nome acessível (17):** seletor “Relevância” do Shopping, botões da página de Contato, botões dos cards de Aprovações/Usuários e da página de Parceiros.
- **Contraste (193):** rótulos pequenos em `text-[10px]`/`text-[11px]` com `slate-400`, selo azul dos cards do Shopping e textos secundários em `slate-400`.
- **Bibliotecas:** gráfico Recharts (`svg-img-alt`), IDs das abas Radix (`aria-valid-attr-value`), regiões roláveis e `aria-label` em `div` de gráfico — sem alteração.
- Os redirecionamentos da Fase 4 mudaram o que `/search` e `/appointments` medem (Shopping e login, em vez da landing).

Detalhe em [`fase5/comparativo-axe.txt`](fase5/comparativo-axe.txt).

## Pendências

- Gradiente violeta das categorias da landing (linha 118, anterior a esta auditoria) apontado pelo plugin de design; não alterado.
- Página Sobre: título narrativo “milhares de pets felizes”.
- E2E do Playwright e login real com senha não executados.
