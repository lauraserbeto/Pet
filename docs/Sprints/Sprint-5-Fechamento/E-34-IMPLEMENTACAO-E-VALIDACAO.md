# E-34 — Acessibilidade: implementação e validação

22/11/2026 · branch `tasks-laura`, sobre `34c7fa8` · alterações locais, **sem commit, push ou deploy**. Somente frontend; sem backend nem migration.

Origem: auditoria pré-Sprint 4, E-34 / AUD-40. Critérios:
- nomes acessíveis nos botões de ícone;
- rótulos associados aos campos;
- modais migrados para o `Dialog` existente;
- `lang="pt-BR"`;
- axe em `/login`, `/register`, `/checkout` e `/dashboard`, reprovando também violações sérias.

## Reprodução (antes)

Varredura com axe (WCAG 2.0/2.1 A e AA, só **sérias e críticas**) em API e PostgreSQL reais (base exclusiva `petplus_e34_test`). Foram **76 combinações** de rota × perfil × largura (anônimo, tutor, lojista, hotel e admin; 1280 e 390 px), mais os modais abertos pelo teclado. Resultado em [`evidencias-e34/antes/axe.json`](evidencias-e34/antes/axe.json).

- `index.html` com **`lang="en"`**.
- **33** combinações com violações sérias ou críticas:
  - `button-name`: voltar, −/+ e remover do carrinho; voltar do checkout; filtros e ordenação sem nome; abas de Parceiros e redes do Contato que ficam só com ícone no celular; fechar do formulário de pet e da avaliação;
  - `color-contrast`: textos `slate-400` (cerca de 2,5:1), selos `bg-blue-500`, destaques `primary-500`, botões `primary-500`/`emerald-600`;
  - `label`: formulário de pet sem rótulos associados;
  - `svg-img-alt`: gráfico do painel admin;
  - `aria-valid-attr-value`: abas das avaliações de sitter sem painel;
  - `scrollable-region-focusable`: carrossel do Sobre e tabela de usuários no celular.
- **Modais:** nenhum dos 6 testados era diálogo de verdade. Faltavam `role="dialog"`, foco dentro e fechamento por Esc. Eram eles: formulário de pet, remover item do carrinho, sair (Navbar), recusar e desativar parceiro, avaliação de sitter. Os menus laterais do painel e dos filtros do Shopping no celular tinham o mesmo problema.
- O botão de fechar do `Dialog` compartilhado dizia "Close" (em inglês).
- O teste `a11y.spec.ts` auditava só a landing e só reprovava violações críticas.

Achados em passagem, corrigidos junto:
- **Avaliação de sitter (RF-010):** o painel **não mostrava as fotos** do ambiente. Exibia um ícone genérico, o final da URL ou do base64 e o aviso "Previews simulados". Agora mostra as imagens reais.
- **Carrinho (resíduo da E-20):** `removeItem` engolia o erro, e a tela mostrava "Item removido do carrinho" mesmo com falha da API.
- **Contato (resíduo da E-20):** os botões de redes sociais anunciavam "Abrindo Instagram da Pet+" sem abrir nada.

## Alterações

**Base**
- `index.html` com `lang="pt-BR"`.
- `components/ui/dialog.tsx`:
  - fechar em português ("Fechar");
  - opção `showCloseButton` para conteúdos com botão próprio;
  - **devolve o foco ao elemento que abriu o diálogo**: antes ia para o `<body>` nos diálogos abertos por estado, sem `DialogTrigger`.

**Modais migrados para `Dialog`** (foco preso, Esc fecha, título e descrição associados, foco devolvido):
- remover item (Carrinho) e sair (Navbar);
- recusar e desativar parceiro (Aprovações);
- avaliação de sitter;
- formulário de pet;
- menu lateral do painel e filtros do Shopping no celular (drawer sobre o mesmo componente).

Durante uma ação em andamento, Esc e o clique fora não fecham o diálogo.

**Nomes e rótulos**
- Botões só com ícone ganharam `aria-label` específico ("Remover Ração X do carrinho", "Diminuir quantidade de X", "Voltar ao carrinho", "Editar pet X", "Fechar filtros"…). Os ícones decorativos ficaram com `aria-hidden`.
- Selects de filtro e ordenação ganharam nome.
- Formulário de pet com `htmlFor`/`id` em todos os campos, `aria-invalid` e mensagens de erro ligadas por `aria-describedby`.
- Motivo da recusa com a dica ligada ao campo.
- Abas de Aprovações e Parceiros com `aria-pressed`; etapas do checkout com `aria-current="step"`.
- Overlay "Processando seu pedido" com `role="status"`.

**Contraste**
- Textos secundários `slate-400` para `slate-600` nas telas apontadas: hotel, produto, Shopping, Contato, Parceiros, Conta, endereços, checkout, carrinho e landing.
- Selos do Shopping em tons 700; destaques e botão de recuperação de senha em `primary-700` (G03); vermelhos de estoque em `red-700`; chip de tipo de pet com os tokens `secondary`.
- `ErrorFallback` em `#b35602` (era `#e6842b`, 2,72:1).
- Textos com `animate-pulse` deixaram de pulsar (`HamsterLoader`, checkout, hotel, landing): no meio do pulso, o contraste caía para cerca de 2,8:1.

**Outros**
- Gráfico de pizza do admin escondido de tecnologia assistiva (`aria-hidden`, camada sem foco). A lista ao lado já traz os mesmos valores em texto.
- Regiões roláveis (carrossel do Sobre, tabela de usuários) com `tabIndex=0` e nome.
- Abas das avaliações de sitter com `TabsContent`, que dá alvo válido ao `aria-controls`.
- Fotos da candidatura: `<img>` com texto alternativo ("Foto 1 de 3 do ambiente de …") e link para o tamanho original. Só renderiza `data:image/(jpeg|png|webp);base64` ou `https`, o mesmo que a API aceita; outro formato mostra "Formato de imagem não suportado".
- `removeItem` retorna `boolean`, e "Item removido" só aparece com a remoção confirmada.
- Redes do Contato: "perfil de demonstração, sem página publicada". Os canais seguem fictícios, por decisão da Laura.

**Portão automatizado (`e2e/a11y.spec.ts`, reescrito)** — reprova violações **sérias e críticas**, em 1280 e 390 px, com API controlada (roda no CI sem backend):
- 12 rotas públicas, incluindo `/login`, `/register`, `/recuperar-senha` e `/shopping`, mais a conferência de `lang="pt-BR"`;
- `/checkout` nas etapas de endereço e de pagamento;
- `/dashboard` do lojista, do hotel e do admin, além do menu do celular (diálogo com nome, Esc fecha, foco volta ao "Abrir menu");
- formulário de pet e confirmação de remoção (foco dentro, Esc fecha, foco volta ao botão de origem).

Métricas e completude respondem 503 controlado, mostrando o estado de erro real do painel.

## Validação

- **Frontend:** **308 testes em 50 arquivos**. Novos:
  - `SitterEvaluations.test.tsx`: fotos reais com texto alternativo, formato não aceito não vira imagem nem link, sem "previews simulados", diálogo nomeado e Esc fecha;
  - `CartPage.test.tsx`: remoção que falha não anuncia sucesso; diálogo nomeado.
- Typecheck e build aprovados. Lint com 0 erros e **114 avisos** (um a menos que antes).
- **Axe depois** (mesma varredura real, base exclusiva): **0 de 76** combinações com violações sérias ou críticas. Os **6/6** modais testados são `role="dialog"`, recebem o foco e fecham com Esc, sem violações dentro deles. Detalhes em [`evidencias-e34/depois/axe.json`](evidencias-e34/depois/axe.json); capturas dos modais em [`evidencias-e34/depois/`](evidencias-e34/depois/), com e-mails mascarados.
- **Chromium com API controlada:** **38 aprovados** (o novo portão tem 11 testes), 46 opt-in ignorados.
- Backend não alterado nem reexecutado; a última regressão registrada continua sendo **561**.

As capturas da varredura "antes" foram descartadas porque não mascaravam e-mails. O "antes" ficou só no `axe.json`, que contém seletores e nenhum dado pessoal. As capturas "depois" foram refeitas com máscara.

Encerramento: API (3000), Vite (5173) e preview parados; base `petplus_e34_test` e fixture com tokens removidas; container, `petplus_dev_test` e `petplus_ci_test` preservados. `git diff --check` limpo (espaços finais introduzidos ao mover o bloco do menu foram removidos). HEAD, stash e índice vazio mantidos.

## Limites

- O axe automatizado cobre só parte da WCAG. Não houve teste com leitor de tela real (NVDA ou VoiceOver), zoom de 200%/400% nem navegação completa só por teclado em todos os fluxos.
- A varredura não abriu todos os estados (por exemplo, os formulários de produto e de serviço do painel, erros de cada campo, toasts).
- A foto da candidatura foi validada em teste de componente; a base de QA não tinha candidatura com fotos.
- Os E2E opt-in com API real das entregas anteriores não foram reexecutados. As mudanças neles são de semântica e estilo, sem alterar textos dos botões de ação usados por esses testes.
- Componentes e páginas sem rota (E-36) não foram tratados.
