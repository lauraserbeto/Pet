# E-13 — Retorno e correção do cadastro recusado

Entrega local de 22/11/2026, na branch `codex/retomada-servicos`, sobre HEAD `d593b03` e as alterações anteriores. Sem commit, push, deploy, migration nova ou acesso ao banco publicado.

## Reprodução e escopo

A E-13 já estava parcialmente tratada. `ProtectedRoute` encaminhava lojista/hotel REJEITADO à correção, mas `LoginPage` ainda escolhia `/dashboard` como primeiro destino. Quatro testes novos reproduziram essa passagem intermediária, inclusive quando havia o destino do e-mail ou um checkout antigo no sessionStorage. O formulário já bloqueava nome curto, UF com tamanho errado e CEP inválido, porém aceitava uma UF inexistente como ZZ, não verificava os demais limites da API e apresentava as falhas apenas por toast. O teste antigo de falha no reenvio podia passar antes de a requisição acabar; a asserção foi substituída pela mensagem efetiva da falha.

Escopo de retorno direto: **lojistas e hotéis recusados**. O caminho de candidatura do Pet Sitter foi preservado em `/onboarding/sitter`; não converter esse processo em aprovação comercial. A coerência completa de todos os destinos/papéis continua sendo a E-33.

## Comportamento implementado

- Login de lojista/hotel REJEITADO vai diretamente a `/parceiro/corrigir-cadastro`, com replace e descarte do destino anterior. Não monta o painel como passagem. Tutor com intenção de checkout e parceiro aprovado mantêm os destinos existentes.
- A rota de correção declara os papéis parceiros 2/3/4, mantendo `allowRejectedProvider`; administrador e tutor não recebem o formulário comercial. O link continua exigindo autenticação.
- Nome comercial: trim e 2–150 caracteres. UF: trim, maiúsculas e lista real de UFs. CEP opcional: oito dígitos com hífen opcional, normalizado para oito dígitos. Telefone, endereço e cidade respeitam os limites de 20, 255 e 100 caracteres da API. Campos opcionais vazios continuam permitidos, conforme o contrato existente; não foram criadas exigências novas de cadastro.
- Mensagens por campo, `aria-invalid`, `aria-describedby` e foco no primeiro campo inválido. O formulário usa submit sem recarga da página.
- As operações continuam separadas: primeiro PUT dos dados, depois POST de reenvio. Falha no PUT impede o POST. Falha no POST informa que as correções foram salvas, conserva os dados e permite tentar de novo. Erros também ficam visíveis na página, sem depender da duração do toast.
- Trava imediata e botão desabilitado durante o envio; o estado local impede reenvio após sucesso. Depois do POST confirmado, a tela consulta novamente o usuário para atualizar a sessão. Para lojista/hotel EM_REVISAO, o guard existente retorna à home com a informação de análise, sem liberar o painel.

Não houve alteração nas regras de autorização ou transição da API. Foi conferido no navegador que a API recusa UF inexistente com 422, permite a correção/reenvio pelo proprietário e mantém o painel protegido antes e depois do reenvio.

## Validação

- Frontend: **229 testes aprovados em 44 arquivos**, incluindo sete testes novos de LoginPage e expansão dos testes de correção. Os 26 testes direcionados de login/correção/guard passaram antes da regressão completa.
- Typecheck e build aprovados. Lint sem erros: 121 avisos frontend e um backend. Avisos preexistentes de tamanho de chunk e anotação de dependência permanecem.
- **Quatro cenários Chromium com API e PostgreSQL reais**, lojista/hotel em 1280 e 390 px: login direto ou pelo link protegido; ausência de passagem pelo dashboard; validação local sem envio; 422 da API; falha controlada de salvamento; dados persistidos com falha controlada de reenvio; nova tentativa; EM_REVISAO; estado atualizado na sessão; painel/login ainda bloqueados aguardando aprovação.
- **25 cenários de regressão no navegador aprovados**, cobrindo smoke, pagamento com API controlada, documentos legais, vitrine, agendamento e agenda. Não são 25 jornadas com provedores externos reais.
- Oito capturas em `evidencias-e13/navegador/`; amostras desktop/celular inspecionadas. A posição do header fixo em captura de página inteira depende da rolagem no instante da captura e não comprova defeito de navegação.

Backend: **559 testes aprovados**, zero falhas, cancelados ou ignorados, com PostgreSQL 16 local. A primeira execução herdou os valores de remetente/URL do servidor de QA e falhou em três asserções que esperavam os valores fixos das fixtures; a regressão foi repetida com `EMAIL_FROM=no-reply@petplus.test` e `FRONTEND_URL=http://localhost:5173` e passou integralmente. Não foi alterado código de produção para acomodar essa configuração de teste.

## Reprodução segura e limites

Usado banco exclusivo `petplus_e13_test`, PostgreSQL 16 local em 127.0.0.1:55432. As 15 migrations existentes foram aplicadas nessa base. Os bancos locais de desenvolvimento/CI e a produção foram preservados. API temporária em 3313; build servido pelo preview em 4173.

O helper `backend/scripts/qa-provider-correction-fixture.js` exige NODE_ENV=test, RUN_DB_INTEGRATION_TESTS=true, endereço e nome exatos da base e arquivo absoluto exclusivo. Cria quatro contas sintéticas; não limpa tabelas. O arquivo de saída contém credenciais de QA e deve permanecer temporário, nunca em evidências/versionamento. O E2E é opt-in por E13_FIXTURE; sua ausência resulta em skip explícito.

As respostas 503 de salvamento e reenvio foram injetadas de propósito; os demais acessos e a persistência foram reais no banco local. Não foi enviado e-mail pelo Resend nem validado o gateway. A candidatura do Pet Sitter e a regressão global de todas as permissões não foram encerradas por esta entrega. Os dois endpoints de correção/reenvio não foram transformados em transação única ou protocolo de processamento exatamente uma vez. Se a leitura de sessão falhar após reenvio confirmado, não se desfaz o sucesso nem se repete automaticamente o POST; uma nova leitura/reabertura consulta o estado persistido.

Na primeira preparação do QA, o helper referenciou funções internas não exportadas do seed; isso foi corrigido no próprio helper. A primeira rodada de navegador consultou por engano `/products/me`, que é tratado como ID de produto inválido (422); o teste passou a consultar a rota privada real `/providers/me/metrics`. Não houve alteração de produção para acomodar essas falhas de preparação.

Próxima frente: **E-33**, reproduzindo o que ainda falta nas guardas e destinos pós-login. Demais pendências, decisões de configurações e QA/release continuam abertas.

Encerramento conferido: API e preview temporários encerrados; banco exclusivo `petplus_e13_test` e fixture com credenciais removidos. Container `petplus-dev-local` e seus demais bancos preservados. HEAD `d593b03`, stash e índice vazio mantidos. Alterações anteriores preservadas, sem commit ou publicação.
