# Scripts de QA local (auditoria visual, E-11, E-20)

Scripts de QA local usados entre 20 e 22/11/2026, guardados no repositório para reprodução das verificações. **Só para o banco local descartável** (`petplus_dev_test` em `127.0.0.1:55432`). Nunca rodar com a URL do `backend/.env`, que aponta para produção.

| Script | O que faz |
|---|---|
| `ux-fixture.js <saida.json>` | **Apaga (TRUNCATE) o banco de teste** e cria as contas tutor, admin, store, empty, hotel, sitter, rejected e pending, com pedidos, parceiros pendente/em revisão/recusado e tokens JWT. Exige `NODE_ENV=test`, `RUN_DB_INTEGRATION_TESTS=true`, `DATABASE_URL` local com `test` e `JWT_SECRET` igual ao da API local. Gravar a saída como `ux-accounts.json` **nesta pasta**: os outros scripts a leem daqui. |
| `ux-fixture-public.js` | Completa os perfis públicos do hotel e do sitter (descrição, cidade, galeria). |
| `capture.js` | Capturas da auditoria visual por rota e papel (Playwright). |
| `verify-e11.js` / `verify-e20.js` | Verificação real das entregas E-11 e E-20. Gravam prints e `resultado.json` em `docs/Sprints/Sprint-5-Fechamento/evidencias-*`. |

Cuidados:
- `ux-accounts.json` contém tokens: **não versionar** (adicionar ao `.gitignore` ou apagar depois de usar).
- Os scripts usam `require('C:/PI - 2026/Pet/frontend/node_modules/@playwright/test')`. Ajustar o caminho se o repositório estiver em outro lugar.
- O limite de requisições da API é por IP. Por isso os scripts injetam `x-forwarded-for` com `ctx.route(...).fallback`, só para `localhost:3000`. Com `extraHTTPHeaders` o cabeçalho vai também para o Vite e quebra o CORS. A API precisa de `TRUST_PROXY_HOPS=1`.
- Mascarar e-mails antes de cada print.
