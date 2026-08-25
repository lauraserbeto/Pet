# EML-1 — Integrar Resend + recuperação de senha real

> Sprint 2 · Semana 4 (15–21/set) · Backend · Prioridade Crítico · Esforço M · Responsável R2

## Contexto
O fluxo de recuperação de senha já gera token seguro, invalida tokens anteriores e grava
expiração de 1h — mas **não envia e-mail**. Em
`backend/src/useCases/auth/PasswordResetUseCase.js:40-60` o envio está apenas comentado
(exemplos de Resend/Nodemailer) e, na prática, só há um `console.log` do link (linha 60).
O usuário nunca recebe nada. Precisamos de um `EmailService` real e reutilizável, porque o
mesmo serviço servirá também ao e-mail de recusa (REC-1) e, no futuro, às confirmações.

## Objetivo
Criar um `EmailService` reutilizável baseado em Resend e ligá-lo ao `ForgotPasswordUseCase`,
de forma que o e-mail de recuperação chegue de verdade ao endereço cadastrado com um link
funcional — mantendo o token single-use e a expiração de 1h já existentes.

## Escopo / Passos
1. Criar `backend/src/services/EmailService.js` encapsulando o cliente Resend (`RESEND_API_KEY`), com um método genérico `send({ to, subject, html })` e helpers por template (ex.: `sendPasswordReset(to, resetUrl)`).
2. Adicionar `RESEND_API_KEY`, `FRONTEND_URL` e `EMAIL_FROM` à validação de env (schema de env do boot) e ao `.env.example`.
3. Em `PasswordResetUseCase.js:40-60`, substituir o bloco comentado + `console.log` pela chamada real `EmailService.sendPasswordReset(user.email, resetUrl)`.
4. Manter a resposta genérica anti-enumeração ("Se esse e-mail estiver cadastrado…") e o comportamento de invalidar tokens anteriores e expirar em 1h.
5. Tratar falha de envio sem vazar existência do e-mail: logar via pino, retornar a mesma mensagem genérica ao cliente.
6. Montar o link como `${FRONTEND_URL}/redefinir-senha?token=${rawToken}` (rota que o `ResetPasswordUseCase` já consome).

## Arquivos envolvidos
- `backend/src/services/EmailService.js` — novo serviço reutilizável (Resend).
- `backend/src/useCases/auth/PasswordResetUseCase.js:40-60` — troca do `console.log` pelo envio real.
- `backend/.env.example` e validação de env do boot — `RESEND_API_KEY`, `FRONTEND_URL`, `EMAIL_FROM`.

## Dependências (Depende de / Bloqueia)
- Depende de: nenhuma.
- Bloqueia: **REC-1** (e-mail de recusa usa o mesmo `EmailService`).

## Critério de aceite (Definition of Done)
- [ ] `EmailService` genérico e reutilizável (não acoplado a recuperação de senha).
- [ ] E-mail real de recuperação chega ao endereço cadastrado com link funcional que abre a tela de redefinição.
- [ ] Token continua single-use e expira em 1h (sem regressão do `ResetPasswordUseCase`).
- [ ] E-mail inexistente continua recebendo resposta genérica (sem enumeração) e sem erro.
- [ ] `RESEND_API_KEY`, `FRONTEND_URL` e `EMAIL_FROM` validados no boot e documentados em `.env.example`.

## Testes
- Solicitar recuperação para e-mail cadastrado → e-mail recebido; clicar no link redefine a senha com sucesso.
- Solicitar para e-mail inexistente → mesma mensagem genérica, nenhum e-mail, sem erro 500.
- Falha simulada do provider (chave inválida) → resposta genérica ao cliente + erro logado no pino.
- Rodar `npm test` no `backend/` (`node --test`); mockar o `EmailService` nos testes de useCase para não disparar envio real.

## Notas técnicas / armadilhas
- Não logar o `rawToken` em produção (o `console.log` atual é só de DEV — remover ao integrar).
- `EMAIL_FROM` precisa ser um remetente/domínio verificado no Resend, senão o envio falha silenciosamente.
- Isolar o cliente Resend atrás do `EmailService` para permitir mock em teste e troca de provider futura.
- Não bloquear a resposta HTTP esperando o provider indefinidamente; tratar timeout/erro e seguir com a mensagem genérica.
- Reaproveitar o padrão de erros do projeto (`next(AppError)`), mas aqui o caminho feliz e o de e-mail inexistente devem ser indistinguíveis para o cliente.
