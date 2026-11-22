# Auditoria visual — Fase 1 (P0): implementação e validação

20/11/2026 · branch `codex/retomada-servicos` · alterações locais, **sem commit, push ou deploy**.

Origem: [relatório da auditoria](index.html), grupos G06, G07, G08 e G10. Os demais grupos continuam pendentes conforme o plano do relatório.

## O que mudou

| Grupo | Problema | Mudança |
|---|---|---|
| G08 | Rotas do painel abriam para perfis errados ou caíam em texto cru / home | `app/routes.tsx`: matriz de perfis por rota espelhando o `Sidebar` (`DASHBOARD_ROLES` + `dashboardOnly`). Painel exige papéis 1–4; Tutor em `/dashboard` vai para `/tutor/perfil`. Perfil fora da lista vê `AccessDenied` dentro do painel, com "Voltar para Visão Geral". |
| G08 | Bloco "Acesso Negado" existia só em Usuários | Novo `components/dashboard/AccessDenied.tsx` (extraído de `admin/Users.tsx`). `ProtectedRoute` ganhou `deniedView` (`redirect`/`inline`), `deniedRedirectTo` e `deniedMessage`; padrão anterior (redirect para `/`) mantido fora do painel. |
| G06 | Parceiro pendente/recusado sem conta, sem "Sair" e sem caminho de correção | `Navbar.tsx`: parceiro não aprovado usa o menu de conta do Tutor (desktop e celular) com status ("Cadastro em análise" / "Cadastro recusado"), explicação e, se recusado, "Corrigir cadastro". `ProtectedRoute`: recusado vai direto para `/parceiro/corrigir-cadastro`; pendente volta à home com aviso (toast com id único). Botão do menu móvel ganhou `aria-label` e `aria-expanded`. |
| G26 (parcial) | `Navbar` imprimia o e-mail da sessão no console | Removidos os `console.log` da verificação de sessão. |
| G07 | "Configurações da Plataforma" simulava salvamentos e logout global; abria para qualquer perfil | Rota restrita ao Admin. `Settings.tsx` virou um resumo honesto das regras em vigor (análise manual de parceiros, sem taxas/repasses, sem 2FA nem logout global), sem campos ou botões que não gravam, com atalho para Aprovações. Não existe endpoint de configurações no backend (verificado). |
| G10 | Falha da API aparecia como catálogo vazio no painel do Lojista | `Products.tsx`: produtos e opções carregados com `Promise.allSettled`; falha de produtos mostra estado de erro com "Tentar novamente", indicadores em "—" e exportação desabilitada; falha só das opções gera toast específico. Vazio real × busca sem resultado agora têm mensagens distintas; CTA de cadastro só no vazio real. |

Observação: `/dashboard/customers` é uma tela demonstrativa com dados fictícios, fora do menu. Foi restrita a parceiros, mas o conteúdo fictício continua lá (fora do escopo P0).

## Validação

Runtime usado: Node 24.18.0 global (o validado no handoff é 24.22.3; não houve troca de runtime nesta rodada).

- **Testes unitários novos (12):** `ProtectedRoute.test.tsx` (5), `Navbar.test.tsx` (4), `Settings.test.tsx` (1), `Products.test.tsx` (2).
- **Suíte do frontend:** 35 arquivos / **181 testes aprovados** (antes: 31 / 169), `--pool=forks --maxWorkers=2`.
- **Typecheck:** sem erros. **Lint:** 0 erros; avisos do projeto 129 → 128 (os 9 avisos nos arquivos tocados já existiam).
- **Build:** aprovado; mantém os avisos já conhecidos (chunk > 500 kB, import dinâmico de `authService`).
- **Navegador com API e PostgreSQL 16 locais e descartáveis** (dados fictícios, sessão por token de teste): **23/23 cenários aprovados**, desktop 1440 e celular 390 — pendente, recusado, Admin/Lojista/Tutor/Hotel/Pet Sitter em rotas permitidas e negadas, Produtos com API em erro (500 simulado no navegador), com dados e vazio. Prints e `resultado.json` em [`fase1/`](fase1/); e-mails mascarados antes das capturas.

## Não validado

- Login real (senha) de parceiro pendente/recusado: a sessão foi injetada por token; o redirecionamento foi verificado com o usuário salvo no navegador.
- E2E existentes do Playwright (`npm run test:e2e`) não foram executados nesta rodada.
- Leitor de tela real; validado apenas por nome acessível nos testes.

## Riscos e pontos de atenção

- As guardas de rota são de interface; a autorização dos dados continua na API.
- `ProtectedRoute` aninhado reaplica as mesmas checagens de aprovação/onboarding nas rotas filhas (comportamento idêntico ao do pai).
- Ainda pendentes na Fase 0: decisão sobre contraste da cor primária (G03), regra única de visibilidade (G12), textos promocionais (G20).
