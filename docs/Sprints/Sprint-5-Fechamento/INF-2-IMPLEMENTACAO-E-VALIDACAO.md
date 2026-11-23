# E-16 / INF-2 — Dependências, runtime, CI e imagem de deploy

Entrega local de 20/11/2026, sobre `d593b03` e as alterações anteriores da branch `tasks-laura`. Sem commit, push, alteração de painéis publicados ou acesso ao banco de produção. Não há migration nova neste bloco. Procedimento operacional em [deploy-reprodutivel.md](../../runbooks/deploy-reprodutivel.md).

## Diagnóstico e decisão

O boot já executava `prisma migrate deploy && node src/server.js`; esse ponto da especificação antiga estava desatualizado e foi preservado. Faltavam manifesto, runtime explícito e auditoria com efeito no resultado do job. O CI usava Node 20 e mantinha `continue-on-error` nas auditorias. Havia um `yarn.lock` antigo no backend e um override do pnpm no frontend que ainda apontava para Vite 6.3.5, apesar de o CI e os lockfiles mantidos usarem npm.

Foi escolhido Node 24 LTS, na versão validada **24.22.3**, com npm **11.19.1**. Node 20 já aparece fora de suporte no [registro oficial](https://nodejs.org/en/about/previous-releases); por isso não foi copiada a versão indicada na especificação original. A linha 24 mantém a família já utilizada localmente e evita uma mudança de major desnecessária para executar as dependências atuais.

`.nvmrc` centraliza a versão exata usada pelos três jobs. `engines` declara Node 24/npm 11 nos dois projetos e `.npmrc` exige engines compatíveis. `packageManager` documenta npm 11.19.1. A família aceita por `engines` não equivale a exigir todo patch de segurança: desenvolvimento e publicação devem manter o runtime atualizado, com a versão validada e o digest revisados juntos.

O binário oficial de Windows usado na regressão foi extraído em diretório temporário, com SHA-256 conferido contra `SHASUMS256.txt` do Node. Não foi alterada a instalação global do computador. A imagem usa o mesmo patch do Node, em Linux.

## Dependências e resultado da auditoria

Atualizados os dois lockfiles dentro das faixas compatíveis dos manifestos, sem `--force`, sem override de major transitivo e sem migrar Prisma ou o plugin do Sentry para outro major. O lockfile legado do Yarn e a configuração do pnpm foram removidos; instalação e CI usam exclusivamente `npm ci`.

| Projeto / momento | Moderate | High | Critical | Total |
| --- | ---: | ---: | ---: | ---: |
| Backend antes | 4 | 5 | 1 | 10 |
| Backend depois | 0 | 0 | 0 | 0 |
| Frontend antes | 16 | 8 | 0 | 24 |
| Frontend depois | 4 | 0 | 0 | 4 |

Valores da consulta executada nesta entrega, não uma garantia sobre avisos publicados posteriormente. Ambos os comandos `npm audit --audit-level=high` terminaram com **exit 0**.

Entre as versões resolvidas estão Zod 4.6.7 nos dois projetos, ESLint 10.15.0, `body-parser` 2.4.0 e `proxy-addr` 2.0.8 no backend; React Router 7.18.6, Vite 6.4.6, Sharp 0.35.5 e Vitest 4.1.12 no frontend. Correções transitivas incluem as cadeias de `brace-expansion`, `ip-address`, `js-yaml`, `undici` e outras identificadas nos relatórios. Manifestos e lockfiles continuam sendo lidos juntos; não usar resoluções antigas de outro gerenciador.

### Quatro moderados ainda presentes

São quatro entradas na cadeia de build `@sentry/vite-plugin` → `@sentry/bundler-plugins` → `glob`/`minimatch`, incluindo dependências afetadas indiretamente. Os avisos diretos são [Glob — cancelamento de travessia](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) e [Minimatch — amplificação no processamento de padrões](https://github.com/advisories/GHSA-g3hv-75wg-m249).

A correção oferecida pelo npm exige levar o plugin Sentry de major 5 para 11. Permanece como pendência explícita, sem upgrade forçado ou alegação de zero vulnerabilidades no frontend. Essa migração precisa validar o build e o upload/remoção de source maps no ambiente autorizado. Não foi adotada exceção para high/critical. O gate definido pela task usa high como limiar, exibindo os demais achados no relatório.

## CI e instalação

Auditoria high/critical passa a ser bloqueante nos jobs backend/frontend. Erro de consulta também falha, sem `continue-on-error`. Jobs usam `.nvmrc`; `checkout` e `setup-node` passam à versão 6, com permissões de leitura do repositório. Mantidos os gatilhos de PR para main e push em main.

O backend executa a suíte com concorrência limitada a dois arquivos e agora também constrói a imagem Docker. O passo seguinte valida usuário sem root, instancia o Prisma Client gerado e verifica ausência de `.env`. O frontend usa Vitest com `forks` e até dois workers, além de typecheck, lint e build. O job de navegador mantém a cobertura existente; os cenários opt-in com API/fixtures não se tornam testes integrados de CI apenas por constarem na pasta E2E.

Verificações negativas locais, em diretório temporário isolado e sem instalar código vulnerável:

- Um lockfile gerado com React Router 7.18.1 faz o mesmo comando de auditoria retornar **exit 1**, com achado high confirmado no JSON.
- Alterar o manifesto desse projeto temporário para uma versão diferente faz `npm ci --ignore-scripts` retornar **exit 1**, preservando o hash do lockfile. O erro confirma que a instalação não regulariza silenciosamente um manifesto divergente.
- YAML/JSON foram analisados localmente; os três jobs apontam para `.nvmrc` e os dois passos de auditoria não permitem falha.

Não foi aberto PR com dependência vulnerável nem executado workflow remoto nesta entrega, pois não houve commit/push. O teste negativo comprova o comportamento do comando; não comprova regras de proteção da branch. Para impedir merge de check falho, as regras do GitHub precisam exigir esses checks.

## Imagem e boot

Adicionados `backend/Dockerfile`, `.dockerignore` e `railway.json`. O Dockerfile usa Node 24.22.3 Bookworm Slim com digest, OpenSSL/certificados e etapas separadas de instalação/runtime. `npm ci --omit=dev` e `prisma generate` acontecem no build, sem banco ou segredos. O contexto só permite arquivos necessários; a etapa final roda como usuário `node` e não contém `.env`, scripts de QA, testes ou ESLint. O CLI do Prisma é necessário ao boot e continua na imagem.

O manifesto pressupõe Root Directory `/backend` e configuração `/backend/railway.json` no serviço Railway. Define build Docker, `npm start`, health `/api/health`, timeout 120 segundos e três reinícios por falha. Não foi presumida nem alterada a configuração do painel. A instalação do frontend na Vercel também precisa ser conferida como `npm ci`/Node 24 antes de publicar.

Em PostgreSQL 16 descartável, a imagem construída:

1. Aplicou as **15 migrations** ao iniciar em banco vazio e respondeu health **200**.
2. Reiniciou sobre o banco existente, informou ausência de migrations pendentes e respondeu health **200**.
3. Com banco indisponível, encerrou com **exit 1** antes de iniciar a API.
4. Foi inspecionada com Node 24.22.3, UID 1000 e Prisma Client instanciável, sem arquivos privados/de teste verificados.

A imagem foi construída e executada localmente; isso não constitui deploy da Railway. Não foi feita auditoria de vulnerabilidades do sistema operacional da imagem. O digest impede mudança silenciosa da base, mas exige atualização explícita para receber patches futuros. Não se afirma reprodução idêntica dos bytes dos pacotes Debian instalados.

## Regressão e evidências

Backend completo com runtime e dependências novos: **541 testes aprovados**, zero falhas/cancelamentos/ignorados. Frontend completo: **169 testes aprovados em 31 arquivos**. Lint sem erros, mantendo dois avisos no backend e 129 no frontend.

Typecheck e build aprovados. O build conserva o aviso de chunk acima de 500 kB e apresenta aviso de anotação de comentário de terceiro em Zod; o bundler remove a anotação e conclui. Nenhuma supressão foi adicionada para obter aprovação.

Chromium: **26 cenários aprovados**, zero falhas/ignorados, cobrindo smoke/lazy routes, páginas legais, vitrine, checkout/pagamento, reserva e agenda. Cenários de negócio dessa rodada usam respostas controladas da API; não substituem os cenários opt-in com API/banco reais. A acessibilidade não apresentou violações críticas nas páginas auditadas, mas a landing mantém uma violação séria de contraste em oito elementos, já registrada anteriormente. Não se afirma acessibilidade completa nem fechamento do QA global.

Uma tentativa com `pool=threads` ficou sem resultados de teste e foi interrompida. O teste focado em processo separado passou; a suíte completa com `forks`/dois workers passou em seguida. O workflow usa o modo validado, sem considerar a tentativa interrompida como aprovação e sem atribuir uma causa conclusiva a uma dependência específica.

Logs e relatórios JSON em `docs/evidencias-testes` usam o prefixo `2026-11-20-inf2`. Não preservar `.env`, tokens, bancos, dependências temporárias ou fixture vulnerável junto das evidências.

## Continuidade e limites

Os preflights de identidade/e-mail/documento e as conciliações autorizadas continuam necessários antes de publicar as migrations das entregas anteriores. O novo manifesto não resolve colisões históricas e não autoriza reset, alteração de checksum ou marcação artificial de migration como aplicada.

Permanecem a atualização principal do plugin de build do Sentry, a conferência das configurações de runtime/contexto/proxy dos provedores, as pendências funcionais do plano e o QA global/aceite do release. Upload real de source maps, entrega Resend, Mercado Pago e produção não foram validados nesta etapa. Nenhum seed demonstrativo ou saneamento retroativo foi executado.
