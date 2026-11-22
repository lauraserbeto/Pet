# E-09 / DEC-E — Senha, identidade de e-mail e recuperação de acesso

Entrega local de 19/11/2026, sobre `d593b03` e as entregas locais anteriores da branch `codex/retomada-servicos`. Sem commit, push, publicação ou consulta ao banco de produção. As verificações utilizam PostgreSQL 16 descartável.

## Problemas e decisões

Cadastro, troca autenticada e recuperação aplicavam políticas diferentes. O consumo do token de recuperação não era protegido contra duas requisições simultâneas. A busca por e-mail dependia do valor literal gravado, enquanto o frontend removia espaços e convertia a caixa; uma conta antiga podia deixar de ser encontrada.

A regra DEC-E foi centralizada no frontend e no backend: pelo menos oito caracteres, uma letra maiúscula ASCII e um número. Novas senhas usam bcrypt custo 12 e aceitam no máximo 72 bytes UTF-8, limite do algoritmo instalado. Espaços da senha são preservados. O limite é de bytes, portanto caracteres acentuados podem atingir o teto antes de 72 caracteres.

O login não exige a nova política para conferir um hash existente. Senhas antigas e hashes de custo 10 continuam válidos; não há alteração forçada ou rehash automático no login. A política nova passa a valer ao cadastrar ou gravar uma nova senha.

## Identidade de e-mail e dados antigos

Cadastro, login e recuperação removem espaços das bordas e convertem o e-mail para minúsculas. Pontos e aliases `+` são preservados. A senha nunca passa por essa normalização.

A migration `20261119010000_users_email_canonical` cria uma função SQL de normalização e um índice único por expressão. O conjunto de espaços removidos acompanha `String.trim()`, incluindo tabulações e espaços Unicode. A consulta de conta usa a mesma função e recusa uma identificação ambígua. O índice protege inclusive gravações concorrentes ou realizadas fora do cadastro HTTP.

A migration não atualiza endereços existentes, não mescla contas e não escolhe um proprietário para uma colisão. Função, verificação e índice ficam em um único bloco atômico. Havendo duplicatas canônicas, a aplicação da migration para com `E09_EMAIL_COLLISIONS`, revertendo função e índice. A auditoria precisa anteceder a publicação, pois o boot da API executa `prisma migrate deploy`.

### Preflight antes de publicar

1. Utilizar uma conexão autorizada, preferencialmente com permissão somente de leitura, e executar no backend: `EMAIL_AUDIT_READONLY=true node scripts/audit-email-identities.js`. Em PowerShell, definir a variável com `$env:EMAIL_AUDIT_READONLY='true'` antes do comando.
2. Conferir total de usuários, quantidade de e-mails não canônicos e grupos de colisão. O script abre transação somente leitura, sem UPDATE/DELETE. O relatório contém IDs e fingerprints, sem imprimir endereços, senhas ou tokens; deve permanecer sob acesso restrito.
3. Se houver colisões, suspender o deploy desta migration e definir a conciliação com os responsáveis pelas contas. O script não realiza saneamento. Depois da correção autorizada, repetir a auditoria.
4. Aplicar a migration somente com preflight resolvido e conferir o status. Caso uma tentativa anterior tenha falhado, verificar o rollback efetivo antes de usar o procedimento de recuperação do Prisma. Não marcar uma migration como aplicada sem executar sua alteração.

A auditoria de produção e qualquer saneamento continuam pendentes. As duas simulações de upgrade foram feitas apenas em bases locais descartáveis.

## Gravação de credenciais e tokens

Emissão de link, redefinição e troca autenticada compartilham a ordem de bloqueio **User → PasswordResetToken**, dentro de transações. O cálculo bcrypt fica fora da transação para evitar manter o lock durante o trabalho de CPU.

Na recuperação, a emissão invalida links anteriores e persiste apenas SHA-256 do token aleatório, com expiração de uma hora. Conta desconhecida, desativada ou ambígua recebe a mesma resposta genérica. O envio é feito depois do commit; uma falha de entrega invalida somente o link que tentou enviar. O log da falha não recebe a URL, o token ou o objeto bruto do provedor. Duas solicitações de recuperação podem produzir duas mensagens, mas apenas o link da última emissão permanece válido.

Na redefinição, o consumo exige token não utilizado e não expirado. A atualização da senha também exige que o hash da conta continue igual ao lido na validação e que a conta esteja ativa. A troca autenticada exige a senha atual e a mesma guarda de concorrência. Uma operação concorrente não pode sobrescrever a senha usando credenciais antigas.

Consumo, gravação e invalidação dos demais links ocorrem na mesma transação. Falhas desfazem todas essas alterações. Senha repetida ou fora da política não consome um link válido. A recuperação mantém o template e o serviço de e-mail existentes.

Os controllers de autenticação encaminham falhas ao tratamento central de erros. Validações retornam 422, credenciais incorretas 401, conflitos 409 e links inválidos/usados/expirados 400. Falhas inesperadas não devolvem a mensagem bruta do banco ou do provedor ao cliente.

## Relação entre critérios e verificações

| Critério | Verificação executada |
| --- | --- |
| Política igual em cadastro, troca e reset | `credentialPolicy.test.js`: composição, espaços e fronteiras de 72 bytes ASCII/UTF-8 nas três entradas. `passwordPolicy.test.ts` e `ResetPasswordPage.test.tsx`: mesma regra e bloqueio antes do transporte. |
| Normalizar e-mail sem alterar senha ou aliases | Testes do serviço frontend, política backend e integração de cadastro/login/recuperação. |
| Manter acesso de contas antigas | Banco real: login com senha antiga fora da nova política e custo 10, sem reescrever o hash; login/recuperação com caixa e bordas antigas, preservando o endereço armazenado. |
| Uma identidade por e-mail | Dois cadastros concorrentes com variantes criam somente uma conta; índice recusa duplicata direta. |
| Consumo único e proteção de concorrência | Banco real: mesmo token concorrente, tokens diferentes da mesma conta, reset contra troca autenticada e emissão concorrente. |
| Reversão integral | Trigger de falha em gravação confirma rollback do consumo; nova tentativa com o mesmo link funciona depois de retirar a falha controlada. |
| Recuperação sem exposição da existência da conta | Conta ausente/desativada tem resposta genérica, sem envio. Falha controlada de entrega invalida o próprio token. |
| Migration segura para legado | Upgrade de 11 para 12 migrations preserva o endereço antigo e bloqueia duplicata. Base com colisão para com diagnóstico explícito, preserva ambas as contas e reverte função/índice. |

## Resultados locais e evidências

- Backend completo: **491 testes aprovados**, zero falhas/ignorados. Inclui 13 verificações novas da política e da integração de credenciais, além das regressões anteriores.
- Conferência final das rotas de autenticação: seis testes aprovados após atualizar o teste de cadastro ADMIN para usar uma senha válida e confirmar a recusa especificamente em `role_id`. O Swagger registra a política e os códigos de erro atuais. Não houve nova mudança funcional depois da suíte completa.
- Frontend completo: **156 testes aprovados em 27 arquivos**, zero falhas. Sete novos testes cobrem política, transporte do e-mail e validação do formulário.
- Typecheck e build aprovados. Build mantém aviso de chunk acima de 500 kB; não foi realizado benchmark de desempenho.
- Lint sem erros: quatro avisos existentes no backend e 129 no frontend.
- PostgreSQL: 12 migrations aplicadas em base vazia e nenhuma diferença no schema pelo Prisma. Upgrade de 11 para 12 aprovado com legado preservado; cenário separado com colisão recusado e rollback confirmado.
- Chromium: **dois cenários aprovados**, em 1280 e 390 pixels, com API e PostgreSQL reais locais. O fluxo confirma recuperação, recusa de senha fraca antes de chamar a API, recusa de senha atual sem consumir o link, redefinição, login com e-mail normalizado, recusa da senha antiga e recusa do token já utilizado. As quatro capturas de erro/sucesso foram inspecionadas.

Logs e capturas ficam em `docs/evidencias-testes`, com prefixo `2026-11-19-e09`. Os geradores `qa-credentials-fixture.js` e `qa-auth-server.js` exigem ambiente de teste e banco local autorizado. O segundo substitui somente o transporte de recuperação por um arquivo temporário: não modifica o contrato HTTP nem envia e-mail ao Resend. Fixture e outbox não fazem parte das evidências versionáveis.

O teste de navegador é opt-in, com `AUTH_E2E_FIXTURE`, `AUTH_E2E_API` e `QA_AUTH_OUTBOX_FILE`, após gerar o build e iniciar a API de QA. Sem essas condições, ele é ignorado explicitamente. As capturas demonstram a interface; as verificações HTTP e de banco sustentam as regras de persistência e concorrência.

Os testes de navegador locais não comprovam a entrega pelo Resend publicado. Os cenários reais de banco não utilizam serviços externos. A regressão de navegador global não foi reexecutada nesta entrega; os dois cenários novos são a validação focada da jornada de credenciais.

## Limites e continuidade

- JWTs já emitidos não são revogados por esta entrega. A invalidação de sessões/refresh token permanece no escopo de segurança posterior; as verificações atuais de conta ativa continuam vigentes.
- E-10/DEC-F continua pendente: validação/persistência de documento e registro do aceite real dos termos, sem inventar consentimento retroativo.
- O provisionamento das fixtures e API para os cenários reais de navegador no CI e o aceite global de release permanecem pendentes.
- Esta entrega local não encerra todos os itens da Sprint 5 e não representa uma validação da base publicada.
