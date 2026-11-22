# Revisão do PR #52 — AVL-1 e menção à PRD-2

Revisão realizada em 17/11/2026. Commit analisado: `ad21e2666de5bed9f9c77bacf7046c648d04d553`, de Layssafernandes, na branch `feature/reviews-avl-1`.

PR: https://github.com/lauraserbeto/Pet/pull/52

Atualização de 18/11/2026: a usuária mesclou o PR, incorporado na main `d593b03`. Os dois achados abaixo foram corrigidos **localmente** na retomada: gate de Tutor e nova migration `20261118000000_align_review_unique_indexes`, sem editar a migration publicada. A comparação de schema ficou limpa em banco novo e em banco atualizado com avaliação preexistente. A seção original permanece como registro da revisão do commit `ad21e26`; correções e AVL-2 estão descritas em `Sprint-4-Agendamento-Avaliacoes/AVL-2-IMPLEMENTACAO-E-VALIDACAO.md`. Não houve publicação dessas correções nesta sessão.

## Parecer

**AVL-1 funcional, com dois ajustes recomendados antes do aceite final.** O fluxo principal funciona e os testes passaram. A comparação entre migration e schema, entretanto, não está limpa. A criação também não restringe o autor ao perfil Tutor, conforme o contrato anunciado na rota.

O PR estava aberto, sem merge, e os quatro checks consultados estavam concluídos com sucesso: backend, frontend, E2E e Vercel Preview Comments. Isso não comprova a ausência dos achados abaixo nem valida o ambiente de produção.

`git fetch origin --prune` identificou a branch nova. `git pull --ff-only origin main` retornou `Already up to date`: a main e o HEAD local continuam em `5d11b7e405ceacbc36b28ee47a9b4ead53683876`. O código da colega foi testado em cópia temporária isolada. As implementações locais de SRV-Fpub, PAG-2, BKG e SCH foram preservadas; não houve merge dessa branch, commit ou publicação.

## Achados reproduzidos

### 1. [P2] Alinhar os índices da migration com o schema Prisma

Referências: [migration, linhas 17–20](https://github.com/lauraserbeto/Pet/blob/ad21e2666de5bed9f9c77bacf7046c648d04d553/backend/prisma/migrations/20261026000000_add_review_model/migration.sql#L17), [schema, linhas 371–372](https://github.com/lauraserbeto/Pet/blob/ad21e2666de5bed9f9c77bacf7046c648d04d553/backend/prisma/schema.prisma#L371).

A migration cria dois índices UNIQUE **parciais**, usando `WHERE ... IS NOT NULL`. O schema declara `@@unique` sem esse predicado. Com Prisma 5.22.0, o banco produzido pelas oito migrations não corresponde ao modelo declarado.

Reprodução no PostgreSQL 16 descartável:

```powershell
npx prisma migrate deploy
npx prisma migrate diff --from-url $env:DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script --exit-code
```

O deploy das migrations passou. O diff retornou **código 2**, com:

```sql
CREATE UNIQUE INDEX "reviews_order_id_product_id_key" ON "reviews"("order_id", "product_id");
CREATE UNIQUE INDEX "reviews_appointment_id_key" ON "reviews"("appointment_id");
```

Os índices parciais já ocupam esses nomes no banco. O resultado não é uma falha atual na criação de avaliações — a unicidade funcionou nos testes —, mas deixa inconsistência no versionamento e pode gerar colisões ao produzir/aplicar migrations futuras.

Correção recomendada: representar a mesma unicidade no SQL e no Prisma. Para o modelo atual, os índices UNIQUE convencionais do PostgreSQL já permitem múltiplos NULLs, preservando a regra desejada. Se a migration ainda não foi aplicada em ambiente compartilhado, revisar seu SQL; se já foi aplicada, corrigir por uma nova migration, sem reescrever o histórico aplicado. O aceite deve incluir um novo `migrate diff` sem diferenças.

### 2. [P2] Verificar o perfil Tutor na criação

Referências: [rota POST, linha 96](https://github.com/lauraserbeto/Pet/blob/ad21e2666de5bed9f9c77bacf7046c648d04d553/backend/src/routes/reviewRoutes.js#L96), [entrada do use case](https://github.com/lauraserbeto/Pet/blob/ad21e2666de5bed9f9c77bacf7046c648d04d553/backend/src/useCases/reviews/CreateReviewUseCase.js#L19).

A documentação da rota anuncia criação por tutor autenticado. A implementação aplica `authMiddleware` e verifica a propriedade da origem, mas não valida `req.userRole`/papel atual do autor.

Reprodução: um usuário fictício possui um agendamento CONCLUIDO próprio; seu papel no banco é alterado para Administrador (role 1), e é emitido um JWT correspondente. O POST com essa origem retorna **201**, em vez do 403 esperado pelo contrato exclusivo de Tutor.

O teste depende de uma origem própria elegível, por exemplo mantida após mudança de perfil. **Não houve demonstração de avaliação de transação alheia nem de falsificação de propriedade.** Essas verificações funcionaram.

Correção recomendada: autorizar explicitamente role 5 no POST, usando o papel validado pelo middleware, e incluir regressão com outro perfil que seja proprietário de uma origem elegível. Caso o produto pretenda permitir avaliação por qualquer comprador, independentemente do papel atual, essa exceção deve ser decidida e documentada; o contrato atual diz Tutor.

## Critérios funcionais confirmados

| Critério de AVL-1 | Resultado |
| --- | --- |
| Modelo Review e migration | Criados; migration aplica, com o desalinhamento de índices descrito acima |
| Origem concluída | Pedido/agendamento CONCLUIDO aceita review; agendamento PENDENTE é rejeitado |
| Propriedade | Outro tutor recebe 403 |
| Alvo coerente | Produto fora do pedido e prestador diferente do agendamento são rejeitados |
| Duplicidade | Produto/pedido duplicado recebe 409; concorrência real de oito POSTs gerou uma criação e sete conflitos |
| Múltiplos produtos do mesmo pedido | Cada produto pode receber sua avaliação, sem bloquear o segundo |
| Listagem por alvo | GET público filtra o alvo e retorna metadados de paginação |
| Nota e comentário | Testes enviados cobrem faixa da nota e limite de comentário; PostgreSQL também recusou nota 6 |
| Dados do autor | Select explícito e resposta real sem senha, documento ou e-mail do autor |
| Perfil autorizado | Falta o gate explícito descrito no achado 2 |

A unidade adotada na branch é **produto + pedido** para compra e **agendamento** para hotel/sitter. Não é uma avaliação única para todo o pedido. Essa definição deve constar na documentação atualizada dos requisitos/AVL antes da integração.

Média e contagem agregadas, interfaces de avaliação e remoção dos mocks restantes pertencem a **AVL-2, AVL-F1 e AVL-F2**. Não foram cobradas como pendências indevidas de AVL-1.

## PRD-2

O título do commit/PR menciona conclusão da PRD-2, mas seu diff altera nove arquivos relacionados a Review e registro da rota; **não altera criação, edição, listagem ou detalhe de produtos**.

As proteções principais da PRD-2 já estavam na main pelo commit `03db53f`, de 24/10/2026, associado à E-01:

- Criação/edição exigem lojista aprovado e ativo por `findOperationalStore`.
- Listagem/detalhe públicos filtram produto ativo de lojista operacional.
- Erros operacionais e campos públicos dos parceiros possuem tratamento próprio.

A suíte da branch conserva os testes de produtos, e todos passaram. Portanto, é correto reconhecer o escopo principal de PRD-2 como já atendido na base analisada; não atribuir uma nova implementação de PRD-2 a este diff. Recomenda-se ajustar título/descrição/board para evitar ambiguidade de escopo e autoria.

## Verificações e evidências

- Instalação isolada por lockfile, sem modificar as dependências ou Prisma Client do workspace.
- `npm run lint`: zero erros, quatro avisos em arquivos preexistentes.
- Arquivo novo de testes de Review: **29 aprovados**. Esses testes simulam o acesso ao banco.
- Suíte completa da branch com `RUN_DB_INTEGRATION_TESTS=true` e PostgreSQL 16 descartável: **428 aprovados, zero falhas e zero ignorados**.
- Oito migrations aplicadas em banco vazio: sucesso.
- Comparação banco/schema: diferença detectada, exit code 2.
- Auditoria complementar com API e banco reais: **11 verificações passaram; uma apontou a divergência de papel do autor**. Paginação com datas iguais e página alta foram sondadas e não falharam nesta execução; não são achados comprovados desta revisão.

Evidências locais:

- `docs/evidencias-testes/2026-11-17-avl1-audit.cjs`: script complementar, com recusa explícita de banco/ambiente fora da cópia temporária e porta autorizadas.
- `docs/evidencias-testes/2026-11-17-avl1-resultados.json`: resultado das doze verificações.
- `docs/evidencias-testes/2026-11-17-avl1-backend-tests.log`: saída da suíte completa da branch.

O script de auditoria não é um teste verde disfarçado: captura cada divergência no JSON. Seu exit code só indica se conseguiu executar a auditoria; os campos `passed` precisam ser conferidos.

O banco usado foi `petplus_test` em `127.0.0.1:55442`, exclusivo desta revisão. Nenhuma credencial real, e-mail ou pagamento externo foi utilizado. A consulta pública do GitHub foi usada para conferir PR/checks, pois o GitHub CLI instalado não estava autenticado.

Ao concluir, o container descartável foi encerrado e a cópia temporária da branch/dependências foi removida. As evidências acima permanecem no workspace.

## Encaminhamento

Solicitar correção dos dois pontos no PR #52 e adicionar os cenários de regressão correspondentes, preferencialmente incluindo teste com PostgreSQL para consistência da migration. Depois, repetir a comparação de schema e os testes afetados antes do aceite. A integração com nossas alterações locais de PAG-2/BKG/SCH precisa de validação própria após a atualização do PR.

Esta revisão não duplicou a implementação de AVL-1 nem iniciou uma segunda migration de Review. A continuação de AVL-2 deve reaproveitar o modelo revisado.
