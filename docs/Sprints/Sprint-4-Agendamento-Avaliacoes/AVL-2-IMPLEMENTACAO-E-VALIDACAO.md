# AVL-2 — Agregados reais e integração de AVL-1

Implementação local em 18/11/2026 na branch `tasks-laura`, atualizada por fast-forward para a main `d593b03` após o merge do PR #52. Sem commit de entrega ou publicação.

## Atualização da base

O trabalho anterior foi preservado com `git stash push --include-untracked`. Backup mantido: `ca63bf003f8b242b47effbbd0f7d4427fe1a2be2`.

Após o pull, o backup foi reaplicado. O único conflito foi no fim de `schema.prisma`: foram preservados o modelo Review da main, o AppointmentPayment da PAG-2 e as duas relações de Appointment. Os arquivos foram retirados do estágio automático produzido pelo stash; não restam conflitos. A comparação do frontend rastreado com o backup não mostrou diferenças.

Não reaplicar esse stash por cima da entrega atual: ele é uma cópia de segurança anterior à integração, não um passo pendente.

## Correções da revisão de AVL-1

### Migration compatível com Prisma

A migration original `20261026000000_add_review_model` foi mantida intacta. A nova `20261118000000_align_review_unique_indexes` substitui, em uma transação, os dois índices parciais por índices UNIQUE convencionais compatíveis com `@@unique` do schema.

PostgreSQL permite múltiplos NULLs nesses índices: a troca preserva uma avaliação por produto/pedido e uma por agendamento. Não há mudança na unidade de avaliação nem exclusão de reviews.

### Perfil Tutor no POST

`ReviewController` passa `req.userRole` ao use case. `CreateReviewUseCase` recusa papéis diferentes de 5 antes de consultar/gravar a origem. O papel vem do estado de autenticação validado pelo middleware, sem confiar no corpo do cliente.

GET permanece público. As verificações de propriedade, conclusão, vínculo e duplicidade da entrega da colega foram preservadas. A documentação Swagger de erros foi alinhada ao 422 efetivamente utilizado para validação.

## Estratégia de agregação

Foi escolhido cálculo **on-read**, centralizado em `ReviewRepository`:

- Uma consulta `groupBy` para os produtos de cada conjunto retornado.
- Uma consulta `groupBy` para os parceiros de cada conjunto retornado.
- Sem consultas por item, colunas derivadas ou cache persistente a reconciliar.
- Conjunto vazio não consulta Review.
- Uma revisão com origem não concluída não entra no agregado, inclusive se inserida diretamente como dado legado inconsistente.
- O agregado usa os campos de alvo/origem correspondentes à compra ou ao agendamento, sem misturar avaliações de produtos com avaliações de parceiros.
- Uma falha na consulta é propagada como erro; não é apresentada como uma nota inventada ou zero avaliações.

O teste em lote usa cem produtos e verifica uma única chamada de agregação. Isso comprova a estratégia de consulta, sem representar um benchmark de produção.

## Contrato público

Campos adicionados, preservando os existentes:

```json
{
  "rating_avg": 4.3,
  "rating_count": 4
}
```

Sem avaliação:

```json
{
  "rating_avg": null,
  "rating_count": 0
}
```

`rating_avg` é número arredondado a uma casa decimal, podendo serializar como inteiro quando exato. `rating_count` é a quantidade de reviews consideradas. A política de arredondamento é a mesma em todos os alvos.

| Endpoint | Agregado |
| --- | --- |
| GET /api/v1/products | Por produto da página |
| GET /api/v1/products/:id | Do produto |
| GET /api/v1/providers/hotels | Por hotel retornado |
| GET /api/v1/providers/sitters | Por Pet Sitter retornado |
| GET /api/v1/providers/:id | Do parceiro e dos produtos públicos incluídos no detalhe |

Produtos aninhados no perfil comercial são agregados em um segundo lote, sem uma consulta por produto. Um detalhe de lojista sem reviews de agendamento mantém o neutro no nível do parceiro, além dos agregados dos produtos. A listagem administrativa e a listagem de produtos do dashboard não foram convertidas em novas APIs de avaliação.

As respostas públicas continuam passando pelos selects/serializadores existentes que removem dados sensíveis. A documentação Swagger inclui `ReviewSummary` e os cinco contratos públicos acima.

## Verificações concluídas

- `prisma validate` e geração do Prisma Client sobre o schema integrado: aprovados.
- Lint backend: zero erros, quatro avisos preexistentes.
- Validação manual da documentação Swagger: cinco respostas públicas e componente `ReviewSummary` presentes.
- Seis testes com API/PostgreSQL reais de agregação, permissão e unicidade: aprovados.
- Suíte completa backend com PostgreSQL descartável: **450 testes aprovados, zero falhas/ignorados**.
- Primeira execução da suíte completa teve um teste antigo de recuperação de senha divergindo apenas por `FRONTEND_URL=4173`; repetida com a URL 5173 esperada por esse teste, sem mudar o teste. A primeira tentativa de testes HTTP sob sandbox restrita teve EACCES de loopback e foi substituída pela execução com acesso local autorizado.
- Regressão do navegador sobre os trinta cenários existentes: 28 passaram na primeira rodada; dois tiveram timeout no limite padrão de 30 segundos (captura da tela de pagamento e carregamento inicial da agenda do hotel). Os dois passaram em reteste isolado, com `--last-failed --workers=1 --timeout=60000`, em 8.7 e 23.2 segundos, sem mudança no código ou na configuração versionada dos testes. Não foi identificada causa conclusiva para a intermitência. Não houve uma segunda rodada completa de trinta testes todos juntos.
- Os quatro cenários com API/PostgreSQL reais de BKG/SCH foram exercitados após a integração; asserções de persistência, pagamento/estorno simulados, propriedade e consultas do tutor passaram. Os testes controlados de checkout não validam um provedor Mercado Pago externo.
- O navegador usou o preview do build existente do frontend preservado; não houve alteração funcional no frontend nesta etapa. O teste existente da landing continua registrando uma violação séria de contraste (dez elementos), sem violação crítica; esse débito não foi corrigido nesta entrega.

### Critérios exercitados

| Critério | Evidência |
| --- | --- |
| Notas 4, 5 e 3 resultam em média 4 e contagem 3 | Produtos, hotéis e sitters na lista e detalhe, com reviews criadas via API |
| Sem reviews retorna neutro | Produto e parceiro existentes sem avaliações |
| Próxima leitura reflete nova review | Quarta nota 5 altera produto para 4.3/4 |
| Origem não concluída não contamina resultado | Review de pedido pendente inserida como legado fica fora |
| Evitar N+1 | Teste com cem produtos e uma agregação em lote |
| Não vazar dados sensíveis | Respostas reais sem documento e hash do parceiro |
| Papel atual do autor é aplicado | Antigo tutor, agora administrador e dono da origem, recebe 403 e não grava |
| Unicidade sobrevive à correção | Seis POSTs concorrentes geram um 201 e cinco 409 |

### Migration em banco novo e em atualização

Foi usado PostgreSQL 16 descartável, publicado em `127.0.0.1:55443`, sem acesso ao banco publicado.

1. Banco `petplus_test` vazio recebeu as dez migrations. `prisma migrate diff --from-url ... --to-schema-datamodel prisma/schema.prisma --exit-code` retornou sem diferenças.
2. Banco separado `petplus_upgrade_test` recebeu somente as nove migrations anteriores à correção. Uma avaliação fictícia foi persistida com os índices parciais originais.
3. Foi aplicada a migration corretiva. A avaliação e seus vínculos foram preservados; tentar duplicá-la continuou gerando P2002.
4. A comparação entre banco atualizado e schema também terminou sem diferenças.

O helper de testes passou a incluir Review na limpeza explícita do banco isolado. As rotinas continuam exigindo autorização e URL local de teste; não se destinam a bancos publicados.

Ao concluir, a API local foi encerrada, o container com os dois bancos descartáveis foi parado e as fixtures/cópia temporária das migrations foram removidas. As saídas da suíte e das duas rodadas do navegador foram preservadas em `docs/evidencias-testes/2026-11-18-avl2-*.log`.

## Limites e próximos passos

A entrega disponibiliza os agregados no backend. A interface para criar/listar avaliações e a apresentação desses números nas telas pertencem a **AVL-F1/AVL-F2** e continuam pendentes desta implementação. Não houve integração de recomendação, moderação ou edição/exclusão de reviews fora do escopo atual.

Antes de publicar o backend integrado, aplicar as migrations ainda não publicadas de PAG-2 e esta correção, conforme o estado real do ambiente. Não executar reset ou reescrever a migration original de Review. A sessão não alterou produção nem publicou banco/código.

As jornadas de tutor/parceiro e os pagamentos simulados mantêm seus limites documentados em BKG/SCH/PAG-2. A validação externa de Resend/Mercado Pago e os demais itens de fechamento não são substituídos pelos testes desta entrega.
