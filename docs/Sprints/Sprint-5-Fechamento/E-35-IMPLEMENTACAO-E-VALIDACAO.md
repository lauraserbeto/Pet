# E-35 — CSP efetiva e avaliação da guarda do token: implementação e validação

22/11/2026 · branch `tasks-laura`, sobre `34c7fa8` · alterações locais, **sem commit, push ou deploy**. Somente frontend; sem backend nem migration. **A CSP só passa a valer em produção depois de um deploy autorizado.**

Origem: auditoria pré-Sprint 4, E-35 / AUD-41 (relaciona-se à SEC-2). Critério: tirar a CSP de Report-Only depois de ajustar as fontes necessárias e avaliar a guarda do token (JWT no `localStorage`).

## Reprodução (antes)

A CSP estava como `Content-Security-Policy-Report-Only` em `frontend/vercel.json` e copiada à mão em `vite.config.ts`: não bloqueava nada.

Varredura no **build de produção** (`vite preview`) com API real em base exclusiva (`petplus_e35_test`):
- 35 rotas de 5 perfis;
- fluxos de foto em base64, consulta de CEP e prévia de fotos do onboarding;
- registro de cada evento `securitypolicyviolation`.

Resultado em [`evidencias-e35/antes/csp.json`](evidencias-e35/antes/csp.json). Com a política antiga **efetiva**, o app quebraria em três pontos:

| Problema | Efeito se a política fosse efetiva |
|---|---|
| `connect-src` com a API de produção fixa no `vite.config.ts` | No preview local (e em qualquer ambiente com outra API), **todas** as chamadas à API seriam bloqueadas |
| `img-src` sem `blob:` | A prévia das fotos do onboarding do Pet Sitter (`URL.createObjectURL`) não carregaria. Confirmado pela contraprova: 0 prévias e violação `img-src ← blob` |
| Zod 4 testando `new Function` (`script-src ← eval` em `/tutor/pets`) | O Zod cai no modo sem compilação e continua funcionando, mas cada validação gera violação, poluindo os relatórios |

Também faltava a região DE do Sentry (`*.ingest.de.sentry.io`) no `connect-src`; o DSN real fica na Vercel e não foi visto.

Inventário das fontes externas no código:
- Google Fonts via `@import` em `styles/fonts.css`;
- imagens `https:` (Unsplash e fotos hospedadas), `data:` (envios em base64) e `blob:` (prévia);
- ViaCEP;
- Sentry só com DSN (sem Replay nem worker);
- Mercado Pago **por navegação** (`location.assign`), sem SDK, iframe ou formulário externo;
- WhatsApp por link;
- nenhum `<iframe>`, `<object>`, `dangerouslySetInnerHTML` ou `innerHTML`.

## Alterações

- **`vercel.json`:** `Content-Security-Policy` **efetivo** (saiu o Report-Only), mantendo `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy`. A política:

  ```
  default-src 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  connect-src 'self' https://api-petplus.up.railway.app https://viacep.com.br https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io;
  object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  ```

  Sem `'unsafe-eval'`, sem script externo nem inline. O `'unsafe-inline'` fica só em `style-src`, porque animações e gráficos aplicam `style` inline.
- **Fonte única:** o `vite.config.ts` não repete mais a política. O `vite preview` lê os cabeçalhos do próprio `vercel.json` e troca só a origem da API de produção pela de `VITE_API_URL`.
- **Sincronia:** `src/config/csp.ts` define a política esperada (`buildCsp`), e `src/config/csp.test.ts` exige que `vercel.json` seja exatamente ela, sem Report-Only, sem `unsafe-eval` e com `blob:` nas imagens.
- `src/main.tsx`: `z.config({ jitless: true })` — o Zod não testa `eval`.
- O `vite dev` continua sem CSP: o HMR do Vite depende de scripts inline e eval. A validação vale para o build de produção.

**Acessibilidade encontrada nos fluxos que a E-34 não abriu** (corrigida junto):
- formulário de endereço e perguntas do onboarding com rótulos associados (`htmlFor`/`id`), inclusive os Selects do quiz;
- onboarding com botões e etapas em `primary-700` (eram `orange-500`, cerca de 2,8:1) e barra de progresso com `role="progressbar"`;
- botão "remover foto" com nome e visível também com foco do teclado (antes, `opacity-0` até o hover);
- prévias com texto alternativo;
- botão do cadastro com degradê em tons 700/800. O axe não mede degradê, e o anterior (500→600) ficava em cerca de 2,4:1.

Axe nas 3 etapas do onboarding, em 1280 e 390 px: 0 violações sérias ou críticas.

**Portão automatizado (`e2e/csp.spec.ts`, novo; roda no CI com API controlada):**
- o cabeçalho é efetivo, sem Report-Only, com as diretivas principais e os demais cabeçalhos de segurança;
- 11 rotas públicas sem nenhuma violação e sem cair no `ErrorBoundary`;
- formulário com `zodResolver` validando sem violação;
- script inline e script externo injetados **não executam** e geram violação.

## Validação

- **Frontend:** **310 testes em 51 arquivos** (2 novos em `csp.test.ts`). Typecheck do app e do `tsconfig.node.json` aprovados (este segundo não é rodado pelo CI). Build aprovado. Lint com 0 erros e 114 avisos.
- **Chromium com a CSP efetiva** (todo o conjunto roda contra o `vite preview`): **42 aprovados**, com 4 novos de CSP e os 11 do portão de acessibilidade; 46 opt-in ignorados.
- **Varredura real com a CSP efetiva** ([`evidencias-e35/depois/csp.json`](evidencias-e35/depois/csp.json)): 35 rotas de 5 perfis, **0 quebradas e 0 violações**. Fluxos funcionando:
  - foto de perfil em `data:` exibida;
  - CEP preenchendo o logradouro (ViaCEP interceptado depois da checagem de CSP, sem tráfego externo);
  - prévia `blob:` do onboarding carregada.
- **Contraprovas** ([`contraprovas.json`](evidencias-e35/depois/contraprovas.json)):
  - script inline e script externo injetados não executam;
  - `fetch` para origem não autorizada é bloqueado;
  - a política antiga (sem `blob:`), aplicada como efetiva, bloqueia a prévia do onboarding.

  O bloqueio de `eval` não é mensurável por `page.evaluate`, porque o DevTools ignora a CSP da página. A evidência é a violação `script-src ← eval` da varredura "antes".
- Durante a varredura com axe aparecem violações `connect-src` para `fonts.googleapis.com`: é o próprio axe baixando CSS externo para analisar. Elas não ocorrem sem o axe.

Encerramento: API (3000) e preview (4173) parados; base `petplus_e35_test` e fixture com tokens removidas; arquivo `tsconfig.node.tsbuildinfo` gerado pela checagem removido; container, `petplus_dev_test` e `petplus_ci_test` preservados. `git diff --check` limpo. HEAD, stash e índice vazio mantidos.

## Avaliação da guarda do token (sem mudança nesta entrega)

**Situação:**
- o JWT de login fica em `localStorage` (`petplus_token`), vale **1 dia** e não tem revogação nem refresh token;
- é lido em 4 pontos do frontend (`AuthContext`, `httpClient`, `lib/api`, `Navbar`);
- um XSS poderia ler o token e usá-lo de qualquer origem até expirar.

**O que mudou com esta entrega:** a CSP efetiva tira os caminhos mais comuns de execução de script injetado (inline, externo, `eval`) e de exfiltração por `fetch` para outra origem. Somado a isso, o código não usa `dangerouslySetInnerHTML` nem `innerHTML`, e o React escapa o conteúdo. O risco residual vem de uma falha em dependência ou de um bypass da política, e não foi eliminado.

**Alternativas avaliadas:**

| Opção | O que exige | Avaliação |
|---|---|---|
| Manter `localStorage` + CSP efetiva (atual) | Nada além desta entrega | Mitigação razoável para o escopo acadêmico; risco residual documentado |
| Token só em memória + refresh token em cookie `httpOnly` | Endpoint de refresh, rotação e revogação no backend; cookie `SameSite=None; Secure` entre Vercel e Railway (sites diferentes) com proteção CSRF; ajuste de CORS com credenciais; sessão perdida a cada recarga até o refresh | Maior proteção, mas é uma mudança de autenticação no backend e no frontend, com risco de quebrar navegadores que bloqueiam cookies de terceiros |
| JWT direto em cookie `httpOnly` | O mesmo problema de cookie entre sites, CSRF e CORS | Mesmo custo da anterior, sem o benefício da rotação |
| Reduzir a validade do JWT (ex.: 2–4 h) | Mudança pequena no backend; usuário faz login mais vezes | Diminui a janela de abuso de um token vazado; decisão de produto |

**Recomendação:** manter o modelo atual com a CSP efetiva nesta sprint. Registrar como dívida a migração para refresh token `httpOnly`, junto com a revogação de JWT após troca de senha, também não implementada (ver SEC-2 e E-09). A redução da validade é a única melhoria barata e **depende de decisão da Laura** (equilíbrio entre segurança e conveniência). Centralizar a leitura do token num único módulo é tarefa da E-32.

## Limites e o que conferir no deploy autorizado

- A política só foi validada localmente (`vite preview`). Depois do deploy, conferir no navegador, em produção:
  - o cabeçalho efetivo;
  - o login;
  - o checkout com Mercado Pago Sandbox, incluindo o retorno;
  - o envio de evento ao Sentry, com a **região do DSN real**;
  - a consulta de CEP;
  - as fontes.
- **Deploys de preview da Vercel** injetam a barra de ferramentas (`vercel.live`), que esta política bloqueia. Não afeta produção. Se a equipe usar a barra nos previews, ajustar só para esses ambientes.
- Imagens seguem liberadas para qualquer `https:`, porque fotos de produtos e parceiros podem vir de qualquer hospedagem. Restringir exigiria um armazenamento próprio (STO-1, opcional).
- Os E2E opt-in com API real das entregas anteriores não foram reexecutados com a política efetiva.
