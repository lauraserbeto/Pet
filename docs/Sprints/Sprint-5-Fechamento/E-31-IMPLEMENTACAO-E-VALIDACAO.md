# E-31 — Estados de erro honestos: implementação e validação

22/11/2026 · branch `tasks-laura`, sobre `34c7fa8` · alterações locais, **sem commit, push ou deploy**. Somente frontend; sem backend nem migration.

Origem: auditoria pré-Sprint 4, E-31 / AUD-22, que fecha a CAR-0. Critério: nenhuma tela trata falha de rede como "não encontrado" nem mostra estado enganoso; "não encontrado" não oferece nova tentativa inútil; buscas por ID descartam respostas tardias.

## Reprodução item a item (AUD-22)

| Item da auditoria | Situação em 22/11 | Ação |
|---|---|---|
| `WalkersPage` sem estado de erro | **Já resolvido**: Hotéis e Pet Sitters usam `PartnerDirectory`, com erro, "Tentar novamente" e teste | Nenhuma |
| Produto falso a R$ 0 com carrinho ativo | **Já resolvido**: o detalhe usa React Query e mostra erro | Ver próxima linha |
| Detalhes tratam falha de rede como "não encontrado" | **Reproduzido**: Hotel e Pet Sitter mostravam "Não foi possível carregar" também para 404, só com "Voltar". A Loja mostrava "Loja não encontrada" em **qualquer** falha, inclusive de rede, sem nova tentativa. O Produto oferecia "Tentar novamente" para produto inexistente e repetia a chamada automaticamente (3 tentativas para um 404). `fetchProductDetails` usava `fetch` direto e perdia o status HTTP | Corrigido |
| `Account` mostra "Pendente" na falha | **Reproduzido**: com `/providers/me` falhando, a tela usava a sessão salva no navegador e exibia o status antigo (ou "Pendente") como se fosse o atual | Corrigido |
| Onboarding faz logout em qualquer erro e não valida o tamanho das fotos | **Já resolvido**: estado de erro com "Consultar novamente" (E-33), sem logout; tipo, tamanho de 2 MB e quantidade conferidos na escolha (E-03) | Nenhuma |
| Buscas por `id` sem cancelamento | **Reproduzido só na Loja**: Hotel e Pet Sitter já descartavam resposta tardia, e o Produto usa React Query | Corrigido na Loja |

Outros uploads: Produtos, Perfil Público, Perfil do Tutor e onboarding validam o tamanho. O único sem limite é `pages/dashboard/Profile.tsx`, que **não tem rota** (código morto, inventário da E-36).

## Alterações

- **`isMissingResourceError`** (`lib/httpClient.ts`): considera inexistente só o 404 e o 422 `VALIDATION_ERROR` (ID malformado, que a API valida com Zod). Rede/tempo esgotado (status 0), 5xx, 429 e outros 422 de negócio continuam sendo falha.
- **`ResourceLoadError`** (componente novo): estado único das páginas de detalhe públicas.
  - Para "não encontrado": título "X não encontrado(a)", explicação de link incorreto ou cadastro indisponível e só "Voltar".
  - Para falha: "Não foi possível carregar X", a mensagem real da API ou da rede, "Tentar novamente" e "Voltar".
  - `role="alert"` e textos em `slate-600`.
- **Hotel e Pet Sitter:** estado `notFound` e nova tentativa por `attempt`, sem recarregar a página. Saiu o `console.error` com o objeto de erro.
- **Loja:** cancela resposta tardia ao trocar de loja ou sair; distingue 404/ID inválido de falha; tem nova tentativa.
- **Produto:**
  - `fetchProductDetails` passou para `httpClient` (`auth: false`), preservando status e código. É um passo pontual da E-32; os demais serviços com `fetch` direto continuam lá.
  - O React Query não repete automaticamente o 404; repete até 2 vezes as falhas temporárias.
- **Conta:** a falha de `/providers/me` mostra "Não foi possível carregar os dados da sua conta… O status do cadastro não foi confirmado agora" e oferece nova tentativa. Não usa dados da sessão local nem exibe status. O cartão "Encerrar sessão" continua disponível.

## Validação

- **Frontend:** **306 testes em 49 arquivos**. Os 10 novos ficam em `ResourceErrors.test.tsx`:
  - classificação do helper;
  - hotel, sitter e loja com 404 sem nova tentativa;
  - hotel, sitter e loja com falha de rede, nova tentativa e carregamento;
  - produto 404 com uma única chamada;
  - produto com 503 oferecendo nova tentativa;
  - conta sem status antigo, com o status real após a nova tentativa.
- Typecheck e build aprovados. Lint com 0 erros e 115 avisos, os mesmos da E-23 (um import que ficou sem uso pela mudança foi removido).
- **Navegador com API e PostgreSQL reais:** **19/19** cenários em 1280 e 390 px, na base exclusiva `petplus_e31_test`:
  - 404 reais de hotel, sitter, loja e produto, sem "Tentar novamente", e o produto com **1** chamada só;
  - ID malformado `/hotels/abc` (422 da API) apresentado como "não encontrado";
  - falha de rede **simulada no navegador** (requisição abortada) em hotel, loja e produto: tela de falha sem "não encontrado" e, na nova tentativa, os dados reais carregados;
  - conta com falha de `/providers/me` e sessão marcada como APROVADO: nenhum "Ativo" ou "Pendente" exibido, e o status real ("Ativo") só depois da nova tentativa.

  Resultado e prints mascarados em [`evidencias-e31/`](evidencias-e31/).
- Regressão Chromium com API controlada: **28 aprovados**, 46 opt-in ignorados.
- Backend não alterado nem reexecutado; a última regressão registrada continua sendo **561**.

Encerramento: API (3000), Vite (5173) e preview do Playwright parados; base `petplus_e31_test` e fixture com tokens removidas; container `petplus-dev-local`, `petplus_dev_test` e `petplus_ci_test` preservados. `git diff --check` limpo. HEAD, stash e índice vazio mantidos.

## Limites

- A falha de rede foi simulada no navegador, abortando a requisição; não foi derrubada a API nem a rede real.
- Outras telas autenticadas com carregamento próprio (por exemplo, listas do painel) não foram reauditadas item a item nesta frente. As que já tinham estado de erro conferido em entregas anteriores (pedidos, agenda, reservas, métricas, diretório) foram mantidas.
- `pages/dashboard/Profile.tsx`, sem rota e com upload sem limite, fica para a remoção da E-36.
- A camada de dados ainda mistura `fetch` direto e `httpClient` (E-32).
