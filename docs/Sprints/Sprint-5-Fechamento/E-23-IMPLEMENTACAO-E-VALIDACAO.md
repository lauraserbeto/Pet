# E-23 — Pedidos, Financeiro e Perfil Público no design system: implementação e validação

22/11/2026 · branch `tasks-laura`, sobre `34c7fa8` · alterações locais, **sem commit, push ou deploy**. Somente frontend; sem backend, migration ou mudança de contrato da API.

Origem: auditoria pré-Sprint 4, E-23 / AUD-31, que fecha a UX-2. Critérios da UX-2:
- `Finance.tsx` e `Orders.tsx` com o vocabulário do design system (componentes shadcn e tokens `--color-primary-*`), sem cores cruas inline;
- "Descartar" em `PublicProfile` reseta o formulário sem `window.location.reload()` e volta ao snapshot da API.

Os critérios de favoritos da UX-2 já estavam atendidos pelo `FavoritesContext` e não foram mexidos.

## O que foi reproduzido antes de alterar

Ambiente de reprodução: API local e base exclusiva `petplus_e23_test`, com as 15 migrations e contas sintéticas por papel. Capturas e axe (WCAG 2 A/AA) em 1440 e 390 px, em [`evidencias-e23/antes/`](evidencias-e23/antes/).

| Tela | Situação encontrada |
|---|---|
| **Financeiro** | Já usava o padrão do painel (DSH-1: título com ações, `StatCard`, `Card`). Restavam: gráfico com hex cru azul-céu (`#0369a1`/`#e0f2fe`) fora da marca; `aria-label` em `div` sem papel (axe `aria-prohibited-attr`, sério); tabela de valores diários sem estilo. |
| **Pedidos** | Layout próprio, diferente do Financeiro: cabeçalho dentro de um card, botão "Buscar pedidos" embaixo do campo, input nativo, indicadores com ícones decorativos gigantes e cor azul, cores cruas inline com fallback azul (`#3b82f6`, `#eff6ff`), tabela manual, botão de retry solto e ação "olho" só com `title`. No celular, apenas os indicadores apareciam sem rolar, e a tabela tinha `min-w-[800px]`. Axe: **10** falhas de contraste sérias (data e e-mail em `slate-400`). A mensagem de busca vazia usava o texto ainda sendo digitado, e não o termo aplicado. O indicador "Receita do Mês" somava o mesmo conceito que o Financeiro chama de "Vendas reconhecidas" (pedidos pagos ou posteriores criados no mês, fuso de São Paulo). |
| **Perfil Público** | O "Descartar" já voltava ao snapshot atualizado após salvar (o achado antigo da AUD-31 não se reproduz mais). Restavam: botão oculto no celular (`hidden sm:flex`); texto `slate-400` (contraste); "Salvar Perfil" em `primary-600`, contra a decisão G03; abas com texto `slate-500` sobre `slate-100` (contraste); checkboxes e botão de regra em `indigo` cru; botão "+" de regra sem nome acessível. Axe: **4** falhas sérias no desktop e **3** no celular. |

## Alterações

**Pedidos (`pages/dashboard/Orders.tsx`)**
- Mesmo padrão do Financeiro: título "Pedidos" (igual ao menu), subtítulo e busca à direita em um `form role="search"` com `Input` e `Button` "Buscar" na mesma linha.
- Indicadores com `StatCard`:
  - "Total de pedidos" (neutro);
  - "Em andamento" (aviso), com a dica dos estados contados;
  - "Vendas reconhecidas no mês" (ação), com a dica da regra. O nome agora é o mesmo do Financeiro; os valores e o cálculo do backend não mudaram.
- Carregamento, erro e lista em `Card`; retry com `Button`.
- Tabela com os componentes `Table`; total alinhado à direita; ação com `Button` ícone e `aria-label` "Ver detalhes do pedido #XXXX".
- **Celular:** lista em cartões (código, data, status, cliente, itens, total e botão "Detalhes"), sem rolagem horizontal. A tabela aparece a partir de `md`.
- Textos secundários em `slate-600` (contraste AA). Removidos os estilos inline e os fallbacks azuis.
- A mensagem de busca vazia usa o termo aplicado (`query`).
- Preservados: consulta, paginação (E-19), resumo global, tratamento de 403 e o modal de detalhes com o endereço gravado (E-05).

**Financeiro (`components/dashboard/CommerceMetricsPanel.tsx`)**
- Gráfico com os tokens da marca (`--color-primary-700` no traço e `--color-primary-100` no preenchimento).
- Contêiner do gráfico com `role="img"` e nome que aponta para a tabela.
- Valores diários com os componentes `Table`, cabeçalho fixo e valores alinhados à direita.

**Perfil Público (`pages/dashboard/PublicProfile.tsx`, `components/ui/tabs.tsx`)**
- "Descartar":
  - aparece também no celular, com texto `slate-600`;
  - fica desabilitado sem alteração ou durante o salvamento;
  - volta ao último estado carregado ou salvo, sem recarregar.
- O estado "alterado" é calculado campo a campo. Avatar e galeria em base64 não são serializados a cada tecla.
- "Salvar Perfil" usa a variante padrão do `Button` (`primary-700`/800, G03).
- Checkboxes e botão de regra com os tokens primários no lugar de `indigo`; o "+" ganhou `aria-label` "Adicionar regra".
- `TabsList` passou de `slate-500` para `slate-600`. **Afeta todas as abas do app**, sempre com contraste maior.

**Testes atualizados por mudança de interface (mesmo comportamento verificado):**
- `Orders.test.tsx`: abre o detalhe pelo nome acessível, e não mais pelo `title`.
- `OrdersPages.test.tsx` (E-19): campo `searchbox` e botão "Buscar".
- `e2e/orders-pagination-real.spec.ts` (E-19): os mesmos seletores.
- `e2e/route-access-real.spec.ts` (E-33): título "Pedidos" e "Lista de pedidos".

## Validação

- **Frontend:** **296 testes em 48 arquivos**. Novos:
  - 2 em `Orders.test.tsx`: indicadores do design system sem cor crua, tabela, nomes acessíveis da ação, busca vazia com o termo aplicado;
  - 1 em `PublicProfile.test.tsx`: Descartar desabilitado sem alteração e voltando ao valor **salvo**, não ao carregado no início.
- Typecheck e build aprovados. Lint com 0 erros e 115 avisos, os mesmos de antes da E-23.
- **Axe depois** (mesmas telas e larguras, API e PostgreSQL reais): **zero violações sérias ou críticas** em Pedidos, Financeiro e Perfil, em 1440 e 390 px ([`evidencias-e23/depois/axe.json`](evidencias-e23/depois/axe.json)).
- **Navegador com API e PostgreSQL reais:**
  - "Descartar" no celular: visível, desabilitado sem alteração, habilitado após editar e restaurando o valor ([`perfil-barra-390.png`](evidencias-e23/depois/perfil-barra-390.png));
  - E2E real da E-19 (paginação, busca e totais de Pedidos), **2/2**, em base exclusiva `petplus_e19_test` (teste de banco, fixture e API na 3319);
  - E2E real da E-33 (rotas e retomada por papel), **13/13**, em base exclusiva `petplus_e33_test` (API na 3333).
- Regressão Chromium com API controlada: 28 aprovados e 46 opt-in ignorados (rodada da revisão da E-17, antes da E-23). A E-23 não alterou as telas públicas cobertas por ela.
- Capturas antes/depois em [`evidencias-e23/`](evidencias-e23/), com e-mails mascarados.
- Backend não alterado nem reexecutado; a última regressão completa registrada continua sendo **561**.

Encerramento: APIs temporárias (3000, 3319, 3333) e o Vite antigo (5173) parados. Bases `petplus_e23_test`, `petplus_e19_test` e `petplus_e33_test` e fixtures com tokens removidas. Container `petplus-dev-local`, `petplus_dev_test` e `petplus_ci_test` preservados. `git diff --check` limpo. HEAD, stash e índice vazio mantidos.

## Limites

- Os selos de status continuam em dois mapas com a mesma paleta: `getOrderStatusBadge` (pedidos) e `statusTone` (painel, que também cobre agendamentos). Há uma diferença de tom (`amber-700` contra `amber-800`). Unificar em um componente fica para a E-36 ou E-34.
- O bloco informativo azul-céu da aba Localização (cor semântica de informação), o ícone vermelho de endereço e os ícones decorativos em `slate-400` foram mantidos. Não reprovam no axe e não são texto.
- Outras telas do painel (Produtos, Serviços, Agenda e administração) não foram reauditadas. Acessibilidade geral continua na E-34.
