# E-10 / DEC-F — Documentos e aceite dos termos

Entrega local de 20/11/2026, na branch `codex/retomada-servicos`, sobre `d593b03` e as entregas locais anteriores. Sem commit, push, publicação ou consulta ao banco de produção.

## Comportamento implementado

### Documentos de parceiros

O cadastro de Lojista e Hotel exige CNPJ. Pet Sitter pode usar CPF ou CNPJ. Os dígitos verificadores são conferidos no backend, incluindo chamadas diretas ao use case, e no formulário. Sequências numéricas repetidas, comprimentos incorretos, caracteres indevidos e dígitos verificadores inválidos são recusados. O antigo retorno `Bypass mode` foi removido.

CNPJ numérico e alfanumérico são aceitos. No formato alfanumérico, as primeiras doze posições aceitam letras ASCII/números e as duas últimas são dígitos. O cálculo usa ASCII menos 48 e módulo 11, conforme o [manual técnico da Receita Federal/Serpro](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf), consultado em 20/11/2026. O exemplo oficial `12.ABC.345/01DE-35` integra os testes.

Novos documentos são gravados sem pontuação/espaços e com letras maiúsculas. A API não descarta caracteres estranhos para transformar um documento inválido em válido. O teclado do campo CNPJ permite letras; a máscara mantém essas letras e apresenta a pontuação. CPF continua com teclado numérico e entrada somente de dígitos na máscara. Em telas pequenas, documento e e-mail ocupam linhas próprias para permitir a leitura completa do documento.

Esta validação é matemática e de formato: não consulta a Receita, não verifica titularidade, situação cadastral ou existência de uma empresa. A análise administrativa dos parceiros permanece necessária.

A consulta prévia reconhece documentos legados formatados. Um índice único por expressão também arbitra cadastros concorrentes, inclusive quando a consulta inicial ainda não encontrou a outra gravação. O cadastro aninhado de usuário/parceiro é atômico; falha comercial não deixa usuário ou aceite sem o parceiro correspondente. Erros de duplicidade retornam 409 sem expor o documento ou a conta existente.

### Aceite explícito, data e versão

O backend exige `terms_accepted: true` e `terms_version` igual à versão vigente. Omissão, false, texto `"true"`, versão ausente ou desatualizada retornam 422. Data e versão não são inferidas da simples existência da conta. Campos não permitidos no payload, como `terms_accepted_at`, são descartados; o horário do novo aceite é definido no servidor ao criar a conta.

`User` ganha `terms_accepted_at` e `terms_version`, ambos opcionais para acomodar o legado. O default de `terms_accepted` muda para false. Uma constraint impede metadados incompletos ou associados a false. A migration não altera o booleano de usuários existentes nem preenche data/versão para eles. O booleano antigo true, isoladamente, não comprova um aceite versionado. Não foi exigido novo aceite de contas antigas neste semestre, conforme DEC-F.

A política atual é publicada em `GET /api/v1/legal/policy`, sem autenticação e com `Cache-Control: no-store`. O backend centraliza a versão em `src/constants/legalPolicy.js`. Foi mantida `2026-02-20`, correspondente à data dos textos existentes de Termos e Privacidade; seu conteúdo não foi reescrito por esta task.

O frontend também identifica a versão dos textos incluídos no build em `content/legal/version.ts`. Esse identificador representa o texto efetivamente disponível ao usuário, não uma configuração substituída automaticamente pela resposta da API. Um teste confere sua correspondência com a política e os textos da base atual. Ao atualizar textos no futuro, publicar os textos e o identificador correspondente e alinhar a política da API. Frontend antigo diante de versão diferente bloqueia o cadastro: ele não pode afirmar que exibiu o texto novo.

O formulário mostra a versão e exige a caixa desmarcada inicialmente. Consulta pendente ou falha impede envio; há tentativa manual em caso de erro. Uma alteração da versão em cache remove o aceite anterior. Os links dos documentos abrem outra aba, preservando o formulário. As duas páginas legais exibem a versão do texto incluído no build, além da data existente.

Não são armazenados IP, user agent ou histórico de aceites. O modelo F1 registra o aceite do cadastro no usuário. Histórico por documento, reaceite de usuários antigos e novas versões permanecem no backlog.

## Migrations e preflight antes de publicar

1. `20261120000000_registration_consent`: adiciona campos opcionais, muda o default para false e cria a constraint de consistência. Preserva todos os aceites antigos sem inventar datas/versões.
2. `20261120010000_provider_document_canonical`: cria função de normalização e índice único em um bloco atômico. Antes do índice, detecta colisões e interrompe com `E10_DOCUMENT_COLLISIONS`. O rollback da função e do índice foi verificado. Não faz UPDATE, limpeza ou mesclagem de parceiros.

Antes de um deploy, executar `scripts/audit-registration-identities.js` com conexão autorizada, preferencialmente credencial somente leitura, e `REGISTRATION_AUDIT_READONLY=true`. Em PowerShell: `$env:REGISTRATION_AUDIT_READONLY='true'`, seguido de `node scripts/audit-registration-identities.js` no backend. O script abre transação somente leitura e pode rodar antes das novas migrations, sem depender de seus campos ou função.

O relatório contém totais, contagem de booleanos true, quantidade de documentos não canônicos, IDs de parceiros inválidos e fingerprints/IDs dos grupos de colisão. Não imprime documentos, e-mails, senhas ou datas de aceite e não modifica registros. O relatório deve permanecer sob acesso restrito; seus IDs não tornam os dados anônimos.

Se houver colisões, suspender a publicação da migration do índice, definir conciliação autorizada e repetir a auditoria. Documentos inválidos também precisam ser triados; não são reescritos ou considerados regularizados por este índice. O índice confere unicidade da forma normalizada, não validade cadastral dos registros antigos.

Como o boot da API executa migrations, não iniciar o deploy sem esse preflight e o preflight de e-mails da E-09 resolvidos. Se a migration do documento falhar, a de consentimento anterior pode já ter sido aplicada; conferir o estado de cada migration antes de qualquer recuperação pelo Prisma. Não usar `resolve --applied` para pular a alteração que falhou.

A auditoria e conciliação em produção continuam pendentes. Todas as bases utilizadas nesta entrega são locais e descartáveis.

## Critérios e verificações

| Critério | Evidência de teste |
| --- | --- |
| CPF/CNPJ válido, inclusive alfanumérico | Testes unitários backend/frontend com exemplos, DV errado, repetições, símbolos e normalização. Testes do serviço substituem a expectativa antiga de bypass. |
| Regras por perfil | Schema/use case e integração de cadastro dos quatro perfis; CPF recusado para Lojista/Hotel. |
| Aceite explícito e versão | Omissão/false/tipo incorreto/versão antiga recusados sem criar usuário; horário enviado pelo cliente ignorado. |
| Preservação de legado | Upgrade de 12 para 14 migrations mantém booleanos, documentos e metadados nulos, sem preenchimento retroativo. |
| Unicidade e concorrência | Documento legado formatado reconhecido; dois cadastros concorrentes geram apenas um usuário/parceiro, com conflito seguro para o outro. |
| Atomicidade | Trigger de falha comercial confirma rollback de usuário/parceiro e aceite. |
| Integridade dos metadados | Default false e constraint recusando informação incompleta ou aceite false com data/versão. |
| Preflight sem alterações | Auditoria identifica inválidos sem imprimir documentos e sem modificar parceiros; upgrade com colisões bloqueia índice e reverte função. |
| Consentimento no formulário | Envio bloqueado sem caixa marcada; versão real incluída; indisponibilidade/retry, divergência de versão e remoção do aceite anterior cobertos. |

## Resultados locais e evidências

- Backend completo: **504 testes aprovados**, zero falhas/ignorados. A entrega adiciona oito cenários com PostgreSQL e cinco testes unitários; os testes antigos que aceitavam qualquer CNPJ de 14 dígitos foram corrigidos para a regra atual.
- Frontend completo: **162 testes aprovados em 29 arquivos**, zero falhas. Após a inspeção visual, ajustes de largura no celular e entrada de CPF foram conferidos novamente com os seis testes focados, typecheck e build.
- Lint sem erros: três avisos existentes backend e 129 frontend. Conferência adicional dos arquivos finais frontend sem erros. Build aprovado, mantendo o aviso existente de chunk maior que 500 kB.
- PostgreSQL 16: 14 migrations aplicadas em base vazia; nenhuma diferença entre schema e banco pelo Prisma. Upgrade de 12 para 14 e cenário de colisão foram aprovados nas duas bases separadas, sem alterar documentos legados ou inventar aceites.
- Navegador: **sete cenários distintos aprovados durante a entrega**. Dois são regressões reais da E-09, desktop/celular, executadas na rodada inicial. A rodada final da E-10 aprovou cinco cenários: dois cadastros reais de Tutor e Hotel/Lojista com CNPJ numérico/alfanumérico, um cadastro real de Pet Sitter com CPF e dois cenários com metadados controlados para indisponibilidade/retry e divergência de versão. As seis capturas finais de formulário/Termos/Privacidade foram inspecionadas, além das capturas preservadas da regressão de senha.

Os cenários de cadastro utilizam API e PostgreSQL locais. O teste de falha de metadados e o de versão diferente controlam essa resposta da API e não representam uma indisponibilidade real publicada. A recuperação usa o transporte de e-mail local já existente para QA, sem acessar o Resend. Não houve cobrança ou uso de gateway externo.

Logs e capturas estão em `docs/evidencias-testes`, com prefixo `2026-11-20-e10`. A regressão de navegador global não foi repetida; os cenários reais continuam opt-in. Para o cadastro, definir `REG_E2E_API` com a API local, iniciar o servidor de QA e gerar o build antes de executar `npx playwright test e2e/registration-real.spec.ts --workers=1`. A API precisa estar com as 14 migrations aplicadas e as fixtures de cadastro devem ser exclusivas da execução; repetir a rodada exige limpar somente essas contas fictícias no banco local e considerar o rate limit da API.

Fixture, outbox e cópia temporária das migrations não integram as evidências versionáveis. Recursos locais de QA são encerrados ao concluir a validação.

## Limites

Esta entrega não representa uma revisão jurídica dos textos, consulta cadastral oficial, saneamento de legado, histórico de consentimentos, reaceite geral ou encerramento de todas as pendências da Sprint 5. O QA global, provisionamento dos cenários reais no CI, itens restantes de segurança/infraestrutura e aceite de release continuam no plano.
