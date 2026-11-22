# Pet+ — contexto para continuar as implementações locais

Atualizado em 20/11/2026. Este documento permite iniciar uma sessão em outra IA. Deve ser lido junto aos registros de implementação indicados abaixo; não substitui a inspeção do diff atual.

## 1. Pedido e autorização da usuária

Laura autorizou implementar o restante do plano sequencialmente nesta branch, sem dividir entre colegas. A orientação vigente é **não commitar por enquanto**. Não houve autorização para push, deploy, alteração do banco publicado ou saneamento automático de dados históricos. Preparar uma mudança local não equivale a autorização para publicá-la.

Último bloco entregue: **E-16/INF-2**. Próxima frente indicada: conferir candidaturas/onboarding e configurações, depois as demais pendências funcionais e QA global. Não declarar toda a Sprint 5 ou o projeto concluído.

## 2. Estado Git e ambiente

- Workspace Windows: `C:\PI - 2026\Pet`; shell PowerShell.
- Branch: `codex/retomada-servicos`.
- HEAD: `d593b03`, merge do PR #52 de avaliações AVL-1.
- Na conferência anterior à criação deste arquivo: 261 entradas em `git status --short`, entre arquivos modificados, novos e a exclusão do lockfile legado do Yarn. O número crescerá com este documento.
- Índice vazio: nenhuma alteração estava em stage. As implementações estão no working tree, não em commits novos.
- Backup anterior preservado em stash `ca63bf003f8b242b47effbbd0f7d4427fe1a2be2`. **Não reaplicar esse stash:** as alterações já foram reaplicadas e integradas. Não apagá-lo sem decisão explícita.
- Não descartar arquivos não rastreados: incluem implementações, testes, migrations, documentos e evidências importantes.
- Não foi feito novo fetch nesta entrega de infraestrutura. Se for necessário atualizar da main, primeiro proteger o working tree e revisar o delta; não presumir que o remoto continua igual.
- Nenhum AGENTS.md foi identificado nas verificações anteriores; reconferir instruções caso surjam arquivos novos.

Runtime validado: **Node 24.22.3 / npm 11.19.1**. A instalação global do computador continua inalterada (era Node 24.18.0/npm 11.16.0). Para a validação, foi usado runtime oficial temporário com SHA-256 verificado; ele foi removido ao final. Usar `.nvmrc`/gerenciador de versões para retomar no runtime validado.

Git usa normalização de finais de linha no Windows. `git diff --check` passou com normalização CRLF. Desabilitar autocrlf para esse diagnóstico pode fazer linhas inteiras antigas aparecerem como adicionadas e produzir falsos achados de whitespace; não reformatar o repositório inteiro por isso.

## 3. Fontes para reconstruir as decisões

1. [Plano de retomada e fechamento](Sprints/PLANO-RETOMADA-E-FECHAMENTO-2026-11-16.md). **Ler os registros finais de entregas:** o cabeçalho e partes iniciais preservam o diagnóstico antigo, com branches/status anteriores.
2. [Auditoria histórica](Sprints/AUDITORIA-QUALIDADE-ESTABILIZACAO-PRE-SPRINT-4.md), com acompanhamentos no início. Os achados históricos precisam ser reproduzidos novamente antes de implementar.
3. Especificações das Sprints 4 e 5 e registros de implementação abaixo.
4. [Contexto anterior de outubro](CONTEXTO-HANDOFF-PETPLUS-2026-10-22.md), apenas como histórico.
5. `docs/funcional/03-regras-de-negocio.md` e demais documentos funcionais. Existem também rascunhos/revisões acadêmicas locais; não confundir proposta de requisito com comportamento comprovado.

O PR #52 foi revisado antes da integração. Dois achados foram corrigidos localmente após o merge: criação de review exclusiva de Tutor e alinhamento dos índices únicos da migration com o Prisma. A revisão está em `docs/Sprints/REVISAO-PR52-AVL1-2026-11-17.md`.

## 4. Implementações acumuladas a revisar e commitar futuramente

Os blocos abaixo **já estão implementados localmente**. Antes de recriar qualquer funcionalidade, conferir os arquivos e os documentos detalhados.

### Vitrine e serviços — SRV-Fpub

Catálogo público ligado a parceiros operacionais e serviços ativos, sem preços padrão inventados. Disponibilidade pública de Pet Sitter considera sua aprovação/candidatura. Serviços e unidade de cobrança são utilizados no fluxo real de reserva. Reutiliza SRV-1/SRV-F1/SRV-F2 já existentes; não criar CRUD paralelo.

### Pagamentos de agendamento — PAG-2

Pagamento e estorno **simulados** de Appointment, com registro próprio, unicidade e lock compartilhado com mudanças de status. Contrato retorna pagamento nas consultas. Não confundir com pagamento de Order ou afirmar integração real de agendamentos com gateway.

Detalhes: [PAG-2](Sprints/Sprint-4-Agendamento-Avaliacoes/PAG-2-CONFIGURACAO-E-VALIDACAO.md).

### Jornada do tutor — BKG-1/BKG-2

Reserva protegida com serviços/pets reais, período, prévia, criação pendente, pagamento simulado pelo total do backend, histórico, cancelamento e estorno. Rascunho vinculado à conta/parceiro e retorno de login/cadastro de pet. Recuperação de envio incerto sem repetir criação automaticamente.

Detalhes: [BKG](Sprints/Sprint-4-Agendamento-Avaliacoes/BKG-IMPLEMENTACAO-E-VALIDACAO.md).

### Agenda do parceiro — SCH-1/SCH-2

Agenda real de Hotel/Pet Sitter (papéis 3/4), visões dia/semana, filtros, períodos que atravessam dias e atualização manual/periódica. Confirmar, recusar, cancelar e concluir conforme estado, política, pagamento e horário. Confirmações, bloqueio de duplicação, consulta do estado e erros/retry. Removidos horários livres e indicadores fictícios no escopo.

Detalhes: [SCH](Sprints/Sprint-4-Agendamento-Avaliacoes/SCH-IMPLEMENTACAO-E-VALIDACAO.md).

### Avaliações — integração AVL-1, AVL-2, AVL-F1/F2

Reutilizada a Review do PR #52. Unidade: produto/pedido ou parceiro/agendamento. Criação exclusiva de Tutor com origem elegível e prevenção de duplicidade. Agregação on-read em lote com média e contagem reais; ausência de avaliações não vira nota inventada.

Formulário nos históricos concluídos; consulta própria; recuperação de timeout/duplicidade sem repetir POST cegamente; listagem paginada, distribuição completa de notas e ordenação determinística. Cards/detalhes usam agregados reais. Removidos depoimentos/ratings fictícios no escopo público; produto com erro não é substituído por produto demonstrativo.

Detalhes: [AVL-2](Sprints/Sprint-4-Agendamento-Avaliacoes/AVL-2-IMPLEMENTACAO-E-VALIDACAO.md) e [AVL-F](Sprints/Sprint-5-Fechamento/AVL-F-IMPLEMENTACAO-E-VALIDACAO.md).

### Indicadores — DSH-1/DSH-2

Painéis de parceiro/admin conectados a dados reais, com regras explícitas de período, estados e receita. Não confundir receita reconhecida, tentativa de pagamento, pagamento simulado de agendamento e saldo disponível. Consultar as definições detalhadas antes de alterar somas.

Detalhes: [DSH](Sprints/Sprint-5-Fechamento/DSH-IMPLEMENTACAO-E-VALIDACAO.md).

### Integridade de pedidos — E-08

Estoque protegido contra concorrência e valor negativo, criação transacional, cancelamento elegível com reposição uma única vez e transições condicionais. Removido atalho indevido de confirmação de pagamento pelo parceiro. Pagamento/webhook e cancelamento compartilham proteções de concorrência. Estorno financeiro de gateway continua exigindo tratamento próprio; reposição local não equivale a estorno real.

Detalhes: [E-08](Sprints/Sprint-5-Fechamento/E-08-IMPLEMENTACAO-E-VALIDACAO.md).

### Credenciais — E-09 / DEC-E

Senha com política comum de oito caracteres, maiúscula, número e limite de 72 bytes UTF-8. Bcrypt custo 12 nas novas gravações, preservando login legado de custo 10. E-mail normalizado nas entradas sem remover pontos/aliases nem alterar a senha informada.

Reset emitido/consumido atomicamente, com locks por usuário, proteção contra concorrência e invalidação de links. Falha de entrega invalida apenas o próprio link, sem imprimir URL/token. Migration de unicidade canônica exige preflight de colisões; não reescreve automaticamente o legado.

Detalhes: [E-09](Sprints/Sprint-5-Fechamento/E-09-IMPLEMENTACAO-E-VALIDACAO.md).

### Cadastro — E-10 / DEC-F

Documento normalizado e validado, incluindo CNPJ numérico/alfanumérico. Lojista/Hotel exigem CNPJ; Pet Sitter aceita CPF ou CNPJ. Unicidade canônica protegida no banco. Aceite legal obrigatório no novo cadastro, com data/versão e política consultável pela API. Legado permanece sem consentimento inventado. Frontend bloqueia divergência/indisponibilidade da versão legal e preserva o formulário ao abrir textos.

Detalhes e preflight: [E-10](Sprints/Sprint-5-Fechamento/E-10-IMPLEMENTACAO-E-VALIDACAO.md).

### Remoção de recursos — E-12

Estados oficiais/aliases usados para bloquear remoção de pet com atendimento ativo, mesmo atrasado. Sem histórico, exclusão física; com histórico somente terminal, arquivamento com preservação de atendimentos/pagamentos/avaliações. Pet arquivado não ocupa limite ativo nem permite nova reserva/edição. Lock compartilhado com criação de reserva.

Último endereço bloqueado com pedidos não encerrados, conforme regra vigente. Promoção do principal e mutações transacionais por conta. Checkout relê o endereço dentro da transação; snapshot dos pedidos permanece intacto. Interface aguarda confirmação da API, conserva recurso em conflito e impede reenvio pendente.

Detalhes: [E-12](Sprints/Sprint-5-Fechamento/E-12-IMPLEMENTACAO-E-VALIDACAO.md).

### Segurança HTTP e privacidade — E-07/E-14/E-15 + SEC-2

Erros de Auth/Product/Provider/User e autenticação/perfil padronizados. UUID/body da revisão administrativa validados. Alterações comerciais validam nome, CEP e UF, descartando campos não editáveis. JWT aceita o algoritmo de emissão HS256 e consulta estado/papel atuais da conta.

Envio de candidatura exclusivo de Pet Sitter; revisão recusa candidatura de outro perfil. Avaliação/onboarding e perfil/avatar passam a transações atômicas, com rollback comprovado. **Isso não encerra o restante de E-11.**

Métricas somente Admin ativo. Contratos públicos usam listas de campos, inclusive relações. Perfil público do sitter omite telefone, CEP e endereço completo; cidade/UF permanecem. Contatos necessários no agendamento continuam disponíveis apenas aos envolvidos autorizados. Hotel/Lojista podem divulgar contato comercial. Texto livre publicado pelo parceiro não é varrido para identificar contatos escritos manualmente.

Logs/Sentry minimizam dados; erros inesperados não devolvem SQL/stack, usam ID de correlação. Códigos operacionais conhecidos 503 de pagamento são preservados com mensagem constante. Checkout conserva conflito real de estoque e ação de retorno ao carrinho.

Limites por IP/processo: API 300/5min; auth 20/15min; webhook 600/min; health 60/min; métricas 60/min. Grupos operacionais têm contadores independentes; métricas contam também tentativas sem sessão. Proxy configurável por `TRUST_PROXY_HOPS`; um salto e IPv6 /56 testados localmente. Não há contador compartilhado entre instâncias nem comprovação da topologia publicada.

Detalhes: [SEC-2](Sprints/Sprint-5-Fechamento/SEC-2-IMPLEMENTACAO-E-VALIDACAO.md).

### Infraestrutura — E-16 / INF-2 (última entrega)

Runtime em `.nvmrc`, engines e npm único. Removidos `backend/yarn.lock` e override pnpm/Vite antigo. Lockfiles atualizados sem `--force`/upgrade principal forçado. Auditoria high/critical bloqueante nos dois jobs; actions checkout/setup-node v6; permissões de leitura; backend testa com concorrência 2 e frontend com forks/2 workers.

Novo Dockerfile multi-stage: Node 24.22.3 Bookworm Slim fixado por digest, OpenSSL/certificados, `npm ci --omit=dev` e Prisma gerado. Runtime não root, sem `.env`, testes ou scripts de QA. Contexto por lista permitida em `.dockerignore`. `railway.json` define build, health e reinícios. O boot **já** aplicava migrations e foi mantido.

Imagem aplicou 15 migrations em banco vazio, reiniciou sem pendências e respondeu health 200. Banco indisponível produziu exit 1 antes da API. Teste negativo isolado confirmou auditoria recusando pacote high e npm ci recusando manifesto divergente sem alterar lockfile.

Auditoria final: backend **zero achados**; frontend **quatro moderados**, zero high/critical. Restantes estão na cadeia de build `@sentry/vite-plugin`/bundler/glob/minimatch. A correção indicada exige plugin major 5 → 11; permanece pendente, sem override incompatível. Não afirmar zero vulnerabilidades no frontend.

Detalhes: [INF-2](Sprints/Sprint-5-Fechamento/INF-2-IMPLEMENTACAO-E-VALIDACAO.md) e [runbook](runbooks/deploy-reprodutivel.md).

## 5. Banco e migrations locais ainda a publicar

Há **15 migrations no total**, sete novas locais acumuladas sobre a base integrada:

1. `20261116000000_appointment_payments`
2. `20261118000000_align_review_unique_indexes`
3. `20261119000000_products_stock_nonnegative`
4. `20261119010000_users_email_canonical`
5. `20261120000000_registration_consent`
6. `20261120010000_provider_document_canonical`
7. `20261120020000_pet_archive`

Não editar migrations antigas já publicadas. E-09/E-10 exigem auditoria/conciliação autorizada de e-mails/documentos antes da publicação. Scripts somente leitura: `backend/scripts/audit-email-identities.js` e `audit-registration-identities.js`. Consultar seus requisitos e os registros detalhados; não imprimir documentos ou e-mails nos relatórios.

Não executar `migrate dev`, `reset`, `db push`, seed demonstrativo ou saneamento em produção. Não usar `migrate resolve` apenas para contornar falha sem diagnóstico. O boot aplica migrations, portanto um push/deploy futuro tem impacto de banco e precisa ser planejado.

## 6. Última validação comprovada

- Backend: **541 testes**, todos aprovados com PostgreSQL 16 local, zero ignorados/cancelados.
- Frontend: **169 testes / 31 arquivos**, todos aprovados com Node 24.22.3 e dependências atualizadas.
- Typecheck/build aprovados. Lint zero erros: dois avisos backend e 129 frontend.
- Última rodada Chromium: **26 cenários**, todos aprovados, para smoke/lazy routes, legal, vitrine, checkout/pagamento, reserva e agenda. Negócio nessa rodada usa API controlada; não equivale a validação integrada real de todos os módulos.
- SEC-2: dois cenários adicionais reais com API/PostgreSQL, desktop/celular, aprovados antes da atualização de dependências. E-12 e entregas anteriores também têm cenários reais próprios documentados.
- Builds mantêm chunk maior que 500 kB e aviso de comentário de terceiro em Zod. A landing mantém uma violação séria de contraste em oito elementos; não houve violação crítica nas páginas auditadas. Acessibilidade completa segue pendente.
- Uma execução Vitest com threads ficou sem progresso e foi interrompida; a execução final em forks passou. Não atribuir causa conclusiva sem investigação adicional.

Evidências em `docs/evidencias-testes`, com prefixos por entrega. Últimos: `2026-11-20-sec2` e `2026-11-20-inf2` (24 logs/relatórios neste último). Relatórios negativos são testes deliberados e documentados, não falhas da execução final. Não copiar fixtures/outbox/tokens como evidência.

Recursos de QA encerrados: containers e redes temporários removidos; portas 3314/4173/55451 livres ao final. Recursos SEC-2 também já encerrados. Runtime Windows temporário e fixture negativa removidos. Imagem local `petplus-backend:inf2-20261120` preservada para revisão. Não há servidor de QA que a próxima IA possa presumir ativo.

## 7. Pendências reais e próxima sequência

### Funcionais — reproduzir antes de alterar

1. **E-11, candidaturas/onboarding:** revisão completa de estados, duplicidades, reenvio, concorrência, apresentação de fotos/feedback e coerência entre User, Provider e SitterEvaluation. Algumas proteções foram feitas na SEC-2; não recriá-las nem declarar o fluxo inteiro encerrado.
2. **CFG-1:** conferir o escopo de configurações e persistência; salvar o que tem endpoint e indicar honestamente o que não existe. Não simular sucesso, logout global ou funcionalidade ausente.
3. **E-13/E-18/E-19:** conferir retomada após login/correção de parceiro recusado, compra em estado incerto, sincronização/cache e paginação. Parte já foi tratada ao longo das entregas; reproduzir os achados restantes antes de implementar.
4. Conferir demais itens históricos/DoD pelo plano e pelo código, sem classificar uma task inteira apenas pelo título do commit ou por checks verdes.

### QA e release

- Regressão integrada global de compra/agendamento/avaliação/painéis com API e banco reais sobre o mesmo candidato a commit.
- Provisionar API/fixtures dos E2E reais no CI, se o plano exigir; hoje são opt-in e não rodam efetivamente sem suas variáveis/fixtures.
- Corrigir/conferir contraste, navegação por teclado, estados de carregamento/erro e responsividade nas telas prioritárias.
- Atualizar board, critérios das tasks, requisitos, evidências e checklist para o mesmo estado final; cabeçalhos históricos não são status atual.
- Conferir Root Directory `/backend`, Config File `/backend/railway.json`, runtime/contexto/proxy e variáveis no provedor; instalação frontend na Vercel por npm ci/Node 24. Nenhum painel publicado foi alterado nesta entrega.
- Conferir checks obrigatórios/proteção de main: workflow com gate falho não impede merge sozinho sem regra de branch. Nenhuma regra remota foi configurada.
- Executar preflights e conciliações autorizadas antes de publicar migrations.
- Planejar upgrade principal do plugin Sentry e validar upload/remoção de source maps. Auditoria npm não cobre o Debian/binários da imagem.
- Validar integrações externas no ambiente autorizado: Resend, Sentry, Mercado Pago Sandbox, notificações e proxy real. Mocks não comprovam esses serviços.

### Limites mantidos / fora do escopo sem nova decisão

Compra anônima; cobrança real de produção; split/repasse; gateway real de agendamentos; recomendação IA; chat/realtime; cupons/descontos/frete; capacidade hoteleira não modelada; redesign amplo. Cloudinary/STO-1 permanece opcional.

Não foram implementados refresh token/revogação geral de JWT após troca de senha, contador de rate limit compartilhado entre instâncias ou apagamento completo de dados pessoais. Arquivar pet preservando histórico não é exclusão integral de dados da pessoa. Não prometer essas garantias na documentação.

## 8. Orientação para preparar os commits depois da autorização

Antes de qualquer stage, inventariar `git status`, `git diff` e arquivos novos. **Não usar `git add .` indiscriminadamente.** Há documentos acadêmicos e contextos anteriores no working tree além do código dessas entregas. Separar o que pertence à entrega do que deve permanecer local, sem apagar nada.

Uma divisão possível, a revisar pelas dependências do diff: serviços/reservas/agenda; avaliações; indicadores; integridade de pedidos; credenciais/cadastro; remoção de recursos; SEC-2; INF-2; documentação/evidências. Arquivos como schema, app, controllers e testes atravessam blocos; não produzir commits intermediários quebrados nem separar migrations do código que depende delas. A divisão é uma sugestão, não autorização de commit.

Verificar especialmente: sete migrations novas, scripts de auditoria/QA, schemas, políticas de segurança, novas páginas/serviços/hooks/componentes, testes unitários/DB/E2E, `.nvmrc`, `.npmrc`, Dockerfile/ignore, Railway, workflow, lockfiles e exclusão intencional do Yarn lock. Não incluir `.env`, node_modules, dist, test-results, outbox, fixture, tokens ou runtime temporário.

## 9. Roteiro inicial para a próxima IA

1. Ler este contexto e os últimos registros do plano.
2. Conferir branch/HEAD/index/conflitos e preservar todo o working tree.
3. Preparar Node 24.22.3/npm 11.19.1 sem alterar instalação global sem necessidade.
4. Escolher a próxima pendência reproduzível, preferencialmente E-11, e informar a usuária antes de atuar.
5. Usar banco local descartável para testes. Os helpers exigem `NODE_ENV=test`, `RUN_DB_INTEGRATION_TESTS=true` e URL local de banco contendo `test`.
6. Executar verificações adequadas e registrar resultados reais, distinguindo testes simulados, DB e serviços externos.
7. Atualizar registros e encerrar recursos temporários. Continuar **sem commit/push/deploy**, até instrução explícita em contrário.

Para retomar o raciocínio em uma frase: as jornadas principais e os blocos locais de integridade, segurança e infraestrutura avançaram e foram testados; o trabalho seguinte é fechar as pendências funcionais comprovadas e o QA de release, sem perder o grande conjunto ainda não commitado e sem confundir validação local com publicação.
