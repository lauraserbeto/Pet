# Build, dependências e deploy do Pet+

Configuração preparada e testada localmente em 20/11/2026. Este procedimento não autoriza nem registra publicação. As variáveis e a topologia dos serviços publicados ainda precisam ser conferidas no momento do release.

## Ambiente e instalação

O runtime validado é Node **24.22.3**, com npm **11.19.1**. A versão está em `.nvmrc`; os três jobs do CI usam esse arquivo. Ambos os projetos declaram Node 24/npm 11 e usam `.npmrc` com `engine-strict=true`. O `packageManager` documenta a versão do npm, mas não instala nem atualiza o gerenciador automaticamente. O computador da pessoa desenvolvedora também precisa usar um runtime atualizado.

O único gerenciador suportado por este fluxo é npm. Usar `npm ci` dentro de `backend` e de `frontend`; os dois `package-lock.json` são versionados. Divergência entre manifesto e lockfile deve ser corrigida e revisada no desenvolvimento, sem substituir `npm ci` por `npm install` no build publicado. O lockfile legado do Yarn e o override legado do pnpm foram retirados.

Para atualizar uma dependência, revisar a versão e o diff do lockfile, executar a auditoria e repetir as verificações afetadas. Não aplicar `npm audit fix --force` como procedimento de publicação. O npm 11.19.1 pode emitir avisos sobre scripts de instalação ainda sem política `allowScripts`; esses avisos não foram tratados como vulnerabilidades corrigidas ou como revisão completa dos scripts de terceiros.

## Política de auditoria

Os jobs de backend e frontend executam `npm audit --audit-level=high`, sem `continue-on-error`. Achados high/critical e falhas da própria consulta encerram a etapa com erro. O comando consulta o banco de avisos do registry, que muda ao longo do tempo; um resultado limpo hoje não dispensa novas consultas.

Achados moderados/baixos continuam no relatório, mesmo quando o comando termina com código zero. O limiar não filtra nem apaga esses achados. A auditoria cobre o grafo npm, inclusive desenvolvimento; não constitui auditoria de toda a imagem Debian, dos binários nativos nem do código da aplicação.

Na consulta desta entrega: backend zero achados; frontend quatro moderados ligados à cadeia do plugin de build do Sentry, nenhum high/critical. A correção automática indicada para essa cadeia exige upgrade principal de `@sentry/vite-plugin` de 5 para 11. Não foi aplicado override transitivo incompatível nem upgrade forçado. Uma atualização futura deve validar configuração, upload/remoção de source maps e compatibilidade do plugin. Consulte o registro de [implementação INF-2](../Sprints/Sprint-5-Fechamento/INF-2-IMPLEMENTACAO-E-VALIDACAO.md).

Checks com falha só impedem merge se as regras de proteção da branch os tornarem obrigatórios. Esta entrega altera o workflow, sem configurar proteção da branch ou executar um novo PR no GitHub.

## Imagem do backend

Executar a partir da raiz do repositório:

```sh
docker build --tag petplus-api:local ./backend
```

O contexto é `backend`, com `.dockerignore` por lista permitida. Não usar a raiz inteira como contexto nem passar segredos em `ARG`. O build não precisa de banco, JWT, Resend ou Mercado Pago. A imagem usa Node 24.22.3 por digest, instala OpenSSL/certificados, executa `npm ci --omit=dev` e gera o Prisma Client. A etapa final contém dependências de execução, fonte, schema e migrations; roda com o usuário `node`, sem root. O CLI do Prisma permanece porque o boot aplica migrations.

A imagem base está fixada por digest para evitar mudança silenciosa. Atualizações de segurança do Node/Debian exigem novo digest/build, revisão e testes; o digest não garante ausência de vulnerabilidades. A instalação de pacotes Debian segue os repositórios da distribuição, portanto não se afirma reprodução idêntica de todos os bytes do sistema operacional.

## Railway e sequência de release

O manifesto `backend/railway.json` descreve build Docker, `npm start`, health `/api/health`, timeout de 120 segundos e até três reinícios por falha. Ele pressupõe contexto de fonte em **`/backend`**. No serviço Railway, conferir Root Directory e selecionar o arquivo de configuração **`/backend/railway.json`**, conforme a configuração de monorepo. Essas opções do painel não foram alteradas nem verificadas nesta entrega.

Antes de publicar a sequência atual de migrations, executar os preflights de identidade/e-mail/documento descritos nas E-09/E-10 e conciliar conflitos autorizados. Não normalizar registros ou inventar aceite de termos retroativamente. Uma colisão deve impedir o release até ser resolvida; não contornar a proteção marcando migration com erro como aplicada sem analisar o banco.

O comando de início permanece:

```sh
prisma migrate deploy && node src/server.js
```

Ele já existia antes da INF-2 e foi preservado. Aplica migrations pendentes antes de iniciar a API; falha encerra o processo. Não executar `migrate dev`, `db push`, `reset` ou seed de demonstração no release. O Prisma usa locks próprios nas migrations; não adicionar uma segunda aplicação das mesmas migrations em pre-deploy sem revisar o fluxo. Um novo release sobre banco atualizado deve indicar ausência de migrations pendentes.

Conferir no gerenciador de segredos as variáveis exigidas por `backend/src/config/env.js`, incluindo banco, JWT, frontend e remetente Resend. Mercado Pago/Sentry seguem opcionais conforme suas flags. Não copiar `.env` para a imagem ou para evidências. A porta vem de `PORT`; o health verifica também a conexão com PostgreSQL.

Conferir `TRUST_PROXY_HOPS` e a reescrita de `X-Forwarded-For` no ambiente publicado antes do release. Os limites de requisição são por processo; não presumir contador único ao aumentar réplicas. As verificações locais de proxy não substituem essa conferência.

Para o frontend, conferir Root Directory `frontend`, Node 24 e instalação `npm ci` na Vercel. O build continua `npm run build`. O upload de source maps só é habilitado com as variáveis próprias do Sentry; build local sem token não comprova upload real. As configurações do painel da Vercel não foram alteradas nesta entrega.

## Verificação e recuperação

Após um release autorizado, conferir logs de migration, health 200, acesso às rotas e os fluxos transacionais prioritários. Não considerar somente o health como aceite funcional. Se migration falhar, a API nova não deve iniciar; analisar a causa e o estado da migration antes de repetir. Reverter a imagem não reverte automaticamente alterações do banco.

Se um aviso high/critical novo fizer o CI falhar, corrigir o pacote afetado ou registrar e aprovar uma decisão específica de risco. Não restaurar `continue-on-error`, usar `--omit=dev` para ocultar o achado, retirar o pacote do lockfile manualmente ou elevar o limiar para obter um check verde.

## Referências

- [Node — releases e suporte](https://nodejs.org/en/about/previous-releases).
- [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) e [npm audit](https://docs.npmjs.com/cli/audit/).
- [Railway — Dockerfiles](https://docs.railway.com/builds/dockerfiles), [configuração versionada](https://docs.railway.com/config-as-code/reference) e [monorepos](https://docs.railway.com/deployments/monorepo).
- [setup-node](https://github.com/actions/setup-node) e [checkout](https://github.com/actions/checkout).
