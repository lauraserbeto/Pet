# SEC-2 — Erros, permissões, privacidade e limites de requisições

Entrega local de 20/11/2026, sobre `d593b03` e as alterações anteriores da branch `codex/retomada-servicos`. Abrange as pendências reproduzidas de E-07, E-14 e E-15 e o escopo de hardening da SEC-2. Sem commit, push, publicação ou acesso ao banco de produção. Nenhuma migration nova neste bloco.

## Comportamento implementado

### Erros e validações

Auth, Product, Provider e os handlers restantes de User encaminham os erros ao tratamento central. As recusas de autenticação e perfil usam o mesmo envelope `{ error: { code, message }, message }`. Token inválido recebe 401; perfil não autorizado, 403; UUID/dados inválidos, 422; recurso inexistente, 404; conflito de negócio, 409. Mantidas as validações de UUID já presentes nas outras rotas, com validação adicionada à revisão administrativa de candidaturas.

Erros inesperados devolvem mensagem genérica e identificador de requisição, sem SQL, mensagem do Prisma, stack ou credenciais. Violações de unicidade não expõem nomes de colunas/índices. Os códigos operacionais `PAYMENT_GATEWAY_DISABLED` e `TEST_ACCOUNT_REQUIRED` continuam disponíveis nas respostas 503, com mensagem constante e segura. Isso preserva o contrato conhecido pelo cliente sem devolver texto arbitrário de um provedor externo.

O ID de correlação informado pelo cliente só é aceito se tiver formato UUID; caso contrário, um novo ID é gerado. O mesmo valor aparece no cabeçalho e no corpo do erro inesperado. A rota inexistente não repete a URL enviada na mensagem.

As alterações de perfil comercial validam nome, CEP e UF e descartam campos não editáveis. Tutor/administrador não usam endpoints privados de perfil de parceiro. A própria conta de parceiro pendente continua podendo corrigir seus dados conforme o fluxo existente; aprovação operacional é verificada nas operações que a exigem. O formulário de correção antecipa a validação de nome, CEP e formato da UF e conserva o erro estruturado da API por meio do `httpClient`.

O envio de candidatura é exclusivo de Pet Sitter. Revisão administrativa valida UUID, estado permitido, feedback e papel do candidato, impedindo a aprovação de candidatura atribuída a outro perfil. Também foram corrigidas duas gravações parciais: avaliação + estado de onboarding e avatar + perfil comercial agora são gravados em transação. Falha na segunda gravação reverte a primeira.

### Checkout

O frontend conserva a mensagem real de conflitos da API, inclusive `CONFLICT` com estoque insuficiente. Exibe a orientação e a ação **Ir para o Carrinho**, sem tentar efetuar pagamento quando a criação do pedido falha. Erros 5xx recebem mensagem segura de indisponibilidade; conexão e limite de requisições têm tratamento próprio. A recuperação existente de pedido já criado/pagamento pendente foi preservada.

### Autorização e minimização

`GET /api/metrics` exige sessão válida e papel administrativo da conta atual. Conta desativada e token com papel antigo não contornam a consulta do estado atual feita pelo middleware. A coleta RED permanece global, inclusive para recusas por limite e parser; somente a leitura exige administrador.

A representação pública de parceiro passa a usar uma lista explícita de campos, inclusive nos objetos `user`, `products`, `services` e `_count`. Novas colunas privadas não entram automaticamente no retorno. Documento, e-mail, identificador da conta, consentimentos, motivo de rejeição e relações internas ficam fora da vitrine.

Pet Sitter publica cidade/UF, sem telefone, CEP ou endereço completo nos campos estruturados. Foram retirados os atalhos públicos de ligação/WhatsApp; a ação disponível continua sendo consultar os serviços e agendar pela plataforma. Hotel e Lojista podem publicar contato comercial. Papel ausente/desconhecido não autoriza contato público. Os contatos necessários ao atendimento continuam disponíveis no DTO de agendamento para os envolvidos já autorizados; isso não torna a consulta do agendamento pública.

Dados de usuário em agendamentos também usam campos explícitos. O resumo de tutor conserva somente ID, nome, telefone e e-mail no contexto privado autorizado. O detalhe público do produto deixa de consultar o telefone pessoal da conta do lojista.

Textos livres, imagens e JSON que o próprio parceiro publica não são inspecionados para localizar contatos escritos dentro do conteúdo. A proteção aqui descrita se refere aos campos estruturados e às relações retornadas pela API.

### Logs e Sentry

O log HTTP conserva método, ID, status e duração, sem URL/query ou corpo da requisição. A serialização de erro conserva tipo e código, retirando mensagem bruta e stack do log. Caminhos não reconhecidos são agregados em `METHOD unmatched` nas métricas, evitando armazenar identificadores enviados na URL e criar uma chave para cada caminho arbitrário.

O filtro de eventos do Sentry descarta usuário, URL, corpo, cookies, cabeçalhos, mensagens brutas, extras, breadcrumbs e variáveis locais de stack. Mantém contexto técnico permitido, rota parametrizada, método e ID de correlação. A mensagem da exceção é substituída por texto constante; arquivos/linhas da stack permanecem para localizar a origem. A redação recursiva auxiliar também passa a limitar profundidade sem liberar o conteúdo excedente.

Essa minimização reduz detalhes disponíveis para diagnóstico. A investigação deve partir do ID de requisição, código, rota, versão implantada e linha da falha. Não foi validado envio real ao Sentry; nos testes o DSN fica vazio e o filtro é exercitado localmente com dados sentinela.

## Política de limites

Contagem por IP, por processo, usando o armazenamento em memória do `express-rate-limit`. Respostas 429 incluem código `RATE_LIMITED` e `Retry-After`.

| Grupo | Limite | Janela | Aplicação |
| --- | --- | --- | --- |
| API geral | 300 | 5 minutos | Rotas sob `/api`, incluindo rotas inexistentes; health, métricas e POST do webhook usam contadores próprios. |
| Autenticação | 20 | 15 minutos | `/api/v1/auth`; permanece mais restrito e também atravessa o limite geral. |
| Webhook | 600 | 1 minuto | `/api/v1/orders/webhook`; POST não consome o contador geral. Assinatura e processamento continuam obrigatórios quando o gateway está habilitado. |
| Health | 60 | 1 minuto | `/api/health`; diagnóstico não depende do saldo do contador da API. |
| Métricas | 60 | 1 minuto | `/api/metrics`; aplicado antes da autenticação, inclusive a tentativas recusadas. Não depende do contador geral. |

Preflight CORS válido continua sendo respondido antes dos limites. Health e webhook têm proteção própria; a isenção do contador geral não significa acesso ilimitado. O teste de webhook confirma independência de contador e a resposta operacional com gateway desabilitado, sem substituir o teste real do Mercado Pago Sandbox.

`TRUST_PROXY_HOPS` aceita um inteiro de 0 a 5. O padrão local/teste é 0 e o de produção é 1, compatível com a configuração anterior; o `.env.example` esclarece a configuração local. Foram testados um proxy, IP extra à esquerda e agrupamento IPv6 /56. A quantidade real de saltos e a reescrita de cabeçalhos pela infraestrutura publicada precisam ser conferidas antes do deploy. Não usar `trust proxy: true` ou aumentar saltos apenas para eliminar um aviso.

Referências consultadas: [Express — proxies](https://expressjs.com/en/guide/behind-proxies/) e [express-rate-limit — identificação de IP atrás do proxy](https://express-rate-limit.mintlify.app/guides/troubleshooting-proxy-issues). Os testes locais não comprovam a topologia real da Railway.

Em múltiplas instâncias, cada processo terá um contador próprio. Um limite compartilhado exigirá armazenamento comum e configuração correspondente; isso não foi implementado nesta entrega. Os valores são uma política inicial, sem benchmark de capacidade ou teste de carga da produção.

## Critérios e evidências

| Critério | Verificação executada |
| --- | --- |
| Erros sem informação interna | `securityContracts.test.js`: falha com SQL/sentinela, ID inválido substituído, envelope seguro, encaminhamento da rota de lojas, UUID/body 422, token malformado/HS384 401, rota desconhecida e códigos operacionais 503. |
| Acesso a métricas | `securityPrivacyDb.test.js`: 401 sem token, 403 Tutor, 200 Admin, revogação do papel administrativo e conta desativada; consulta usa estado real do PostgreSQL. |
| Limites sem bloquear grupos independentes | `requestLimits.test.js`: API saturada → 429, health disponível, webhook com tratamento próprio, métricas disponíveis para Admin e preflight 204; tentativas sem sessão também esgotam o contador de métricas. |
| IP e IPv6 | Limite com um proxy não é contornado variando o IP adicional à esquerda; mesmo /56 compartilha contador, outra rede recebe contador independente. |
| Privacidade pública | `securityPrivacy.test.js` verifica exclusão recursiva de novas colunas/relações privadas; testes com banco confirmam listagem/detalhe de Sitter e contato comercial de Hotel. |
| Contatos somente no contexto autorizado | Teste real de agendamento consulta tutor/parceiro, limita campos e recusa uma terceira conta. |
| Perfil e candidatura | Papel inadequado 403/422; nome/UF/CEP inválidos 422 sem escrita; dados válidos normalizados; triggers de falha comprovam rollback de perfil/avatar e avaliação/onboarding. |
| Logs/Sentry | Eventos com dados sentinela e log serializado de processo filho não contêm o conteúdo privado testado. |
| Mensagem de compra | Testes de `checkoutError` e `CheckoutPage` exercitam ApiError real 409, texto específico e ação de retorno, sem chamar pagamento após falha de criação. |
| Navegador com persistência real | `security-real.spec.ts`: perfil público mínimo, métricas 401/403/200, estoque reduzido após carregar carrinho, POST real 409, aviso e retorno ao carrinho; consulta confirma nenhum pedido criado e estoque sem baixa adicional. |

## Resultados e reprodução

 - Backend completo com PostgreSQL 16 local: **541 testes aprovados**, zero falhas, cancelamentos ou cenários ignorados. Inclui 19 cenários novos de segurança nesta entrega, além da atualização dos contratos existentes.
 - Frontend completo: **169 testes aprovados em 31 arquivos**, zero falhas. Typecheck e build aprovados; permanece o aviso de chunk maior que 500 kB.
 - Lint aprovado sem erros: dois avisos existentes no backend e 129 no frontend.
 - Chromium com API/banco reais: **dois cenários aprovados**, desktop e celular; quatro capturas inspecionadas. Não foi reexecutada a suíte global de navegador nesta etapa.
 - Banco descartável com as 15 migrations anteriores aplicadas. Não houve migration nem alteração de schema neste bloco.

Na primeira execução completa do frontend, um worker não iniciou e deixou seis cenários sem executar. A repetição sem build concorrente aprovou todos os arquivos. No backend, os stubs dos testes de upload foram adaptados para aceitar transações de callback, mantendo as validações e os limites de upload. O teste de navegador foi alinhado ao contrato de pedidos em array. Os resultados acima correspondem às execuções finais, sem contar uma execução incompleta como aprovação.

Resultados finais e logs desta entrega são registrados em `docs/evidencias-testes` com prefixo `2026-11-20-sec2`. As capturas de perfil e conflito no checkout foram inspecionadas em 1280 e 390 pixels. O avatar e os produtos da fixture são ilustrativos; as capturas evidenciam o comportamento, não uma revisão da identidade visual.

Para reproduzir, utilizar PostgreSQL local descartável `petplus_test`, aplicar as 15 migrations e configurar `NODE_ENV=test`, `RUN_DB_INTEGRATION_TESTS=true` e credenciais exclusivamente de teste. A suíte completa utiliza `node --test --test-concurrency=2`; o frontend, `npm test -- --pool=threads --maxWorkers=1 --no-file-parallelism --testTimeout=15000`. Typecheck, build e lint complementam a verificação.

O navegador exige build, API local e `backend/scripts/qa-security-fixture.js <arquivo-temporario-exclusivo>`. Definir `SEC_E2E_FIXTURE` com esse arquivo e `SEC_E2E_API` com a URL local terminada em `/api/v1`, então executar `npx playwright test e2e/security-real.spec.ts --workers=1`. Sem esses requisitos, os dois cenários são explicitamente ignorados. As validações de segurança do helper impedem uso do banco publicado; a fixture contém tokens de teste e deve ser removida após a execução, nunca copiada para as evidências.

## Limites e continuidade

Não há aceite de publicação ou de toda a Sprint 5. Permanecem os itens de dependências/infraestrutura E-16/INF-2, as pendências funcionais ainda registradas no plano e a regressão global/QA de release. A submissão atômica corrigida aqui não encerra a revisão completa de estados, duplicidades e concorrência das candidaturas da E-11.

Não foram adicionados refresh token, revogação geral de JWT após troca de senha, armazenamento compartilhado de limites ou limpeza de dados legados. Os preflights de e-mail/documento das E-09/E-10 continuam necessários antes das migrations na base publicada. Resend, Sentry, Mercado Pago, proxy publicado e carga real não foram validados nesta etapa.
