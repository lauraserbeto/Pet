# Evidências de execução de testes

Data do registro: 18/10/2026.

Versão do código selecionada: branch `Tasks-Laura`, commit `176e5a42156870d5e18c755fa70e8508099ecff1`.

Este diretório reúne relatórios gerados pelos executores de testes e a matriz de rastreabilidade preparada para a documentação acadêmica. Os relatórios não representam teste integral da main nem validação de produção. A referência remota da main consultada anteriormente era `c1d53f0`; as entregas adicionais dessa referência não são implicitamente validadas por esta execução.

Os testes selecionados usam dependências simuladas ou caminhos de validação que não acessam banco. O ambiente da execução deve usar banco local de teste e credenciais fictícias, sem chamadas reais de pagamento ou envio de e-mail.

## Resultado da execução

- Backend: 104 testes aprovados, sem falhas ou casos ignorados, em sete arquivos selecionados.
- Frontend: 15 testes aprovados, sem falhas ou casos ignorados, em três arquivos selecionados.
- Runtime local: Node.js v24.18.0.

A primeira tentativa foi bloqueada pelo ambiente restrito: EACCES nas conexões locais do Supertest e EPERM em arquivos temporários do Vitest. Os relatórios dessa tentativa foram preservados nos arquivos `backend-bloqueio-ambiente-junit.xml` e `frontend-bloqueio-ambiente-junit.xml`. A repetição com permissões adequadas gerou `backend-junit.xml` e `frontend-junit.xml`, ambos aprovados. Não houve alteração no código da aplicação ou dos testes entre as tentativas.

## Arquivos para o documento

- `matriz-rastreabilidade.png`: figura com oito exemplos, pronta para inserir como imagem.
- `matriz-rastreabilidade.svg`: versão vetorial da mesma figura.
- `MATRIZ-E-FICHAS.md`: matriz completa, 11 fichas, legenda e parágrafo para acrescentar à seção 23.
- `rastreabilidade.json`: relação estruturada entre requisitos, casos e resultados extraídos dos relatórios JUnit.
- `gerar-relatorio.cjs`: geração dos documentos a partir dos dois relatórios finais, usando jsdom e sharp já presentes no frontend.

## Recorte executado

Backend: `authRoutes.test.js`, `loginUseCase.test.js`, `passwordResetUseCase.test.js`, `cartRoutes.test.js`, `orderRoutes.test.js`, `serviceRoutes.test.js` e `mercadoPagoPayment.test.js`.

Frontend: `CheckoutPaymentPage.test.tsx`, `postLoginRedirect.test.ts` e `CorrecaoCadastro.test.tsx`.

No backend foram definidos `NODE_ENV=test`, `LOG_LEVEL=silent`, `DATABASE_URL` de PostgreSQL local de teste, `RUN_DB_INTEGRATION_TESTS=false`, `MERCADO_PAGO_ENABLED=false`, Sentry desativado e credenciais fictícias para inicialização. A integração de pagamento é exercitada por dependências injetadas de teste, sem cobrar ou enviar e-mails reais.

Os executores foram configurados com saída JUnit: `node --test --test-reporter=junit --test-reporter-destination=...` e `vitest run --reporter=junit --outputFile.junit=...`, indicando explicitamente os arquivos do recorte. Essa seleção não inclui `cartOrderDb.test.js`, E2E do Playwright ou testes de agendamento incorporados posteriormente à main.
