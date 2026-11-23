# E-12 — Remoção de pets e endereços

Entrega local de 20/11/2026, sobre `d593b03` e as entregas anteriores da branch `tasks-laura`. Sem commit, push, publicação ou acesso ao banco de produção.

## Problemas confirmados e comportamento adotado

Os handlers usavam status em inglês para consultar dados gravados com os estados atuais em português. A verificação do pet também excluía da análise atendimentos ativos com início passado. As validações de vínculo, propriedade e contagem eram feitas antes das gravações, deixando intervalos para alterações concorrentes.

Havia ainda uma inconsistência entre a documentação e a relação de banco: a regra permitia remover pet com atendimentos encerrados e preservar o histórico, mas a FK de `Appointment.pet_id` impedia apagar fisicamente esse pet. Não foi removida essa proteção nem adicionada exclusão em cascata de atendimentos.

### Pets

- `PENDENTE`, `AGUARDANDO_CONFIRMACAO` e `CONFIRMADO` impedem remoção, independentemente da data. Um atendimento atrasado precisa ser concluído ou cancelado pelo fluxo permitido; ele não vira concluído por estar no passado.
- A decisão utiliza `normalizeAppointmentStatus` e `isAppointmentTerminalStatus`, das constantes oficiais. Aliases legados são reconhecidos. Estado desconhecido não comprova encerramento e impede remoção até ser conferido.
- Sem agendamentos, a exclusão continua física. Com histórico somente terminal, o pet recebe `archived_at`: sai da lista, da contagem do limite e da métrica administrativa de pets ativos. GET/PUT do tutor retornam 404 e novas reservas são recusadas. Não há endpoint público para reativá-lo.
- O registro permanece vinculado ao atendimento encerrado; pagamentos e avaliações não são excluídos ou recriados. Tutor e parceiro autorizado continuam acessando o histórico.
- Remoção usa transação e lock na linha do pet proprietário, compartilhado com a criação de reservas. A criação relê pet/dono/arquivamento depois do lock. Uma reserva que passou pela validação inicial não usa um pet removido enquanto aguardava outra transação.
- Pet inexistente, alheio ou já removido recebe 404, sem revelar a existência de outro cadastro. Atualização também exige `archived_at` nulo para não editar um pet removido durante uma requisição concorrente.

A migration `20261120020000_pet_archive` adiciona um campo opcional. Não arquiva registros existentes e não modifica atendimentos ou pagamentos históricos. O upgrade de 14 para 15 migrations foi verificado com pet, atendimento e pagamento legados.

### Endereços

- A regra de negócio vigente foi mantida: não excluir o último endereço da conta enquanto existirem pedidos não encerrados. Isso inclui `AGUARDANDO_PAGAMENTO`, `PAGO`, `PREPARANDO` e `ENVIADO`, mesmo que o pedido já tenha snapshot de entrega.
- `CONCLUIDO` e `CANCELADO` não impedem remoção. A decisão usa normalização e estados terminais oficiais; aliases são reconhecidos e estado desconhecido impede a exclusão do último até conferência.
- Havendo outro endereço, a remoção é permitida. Se o removido era principal, o mais recente é promovido na mesma transação, com desempate determinístico por ID. Nenhum campo de `Order.shipping_address` é alterado.
- Criação, edição, definição de principal e remoção passam por transação Serializable e lock por usuário. Propriedade, quantidade e vínculos são conferidos dentro da operação. A consulta de CEP continua fora da transação.
- Conflitos de serialização retornam 409 com orientação para atualizar e tentar novamente. Não há repetição automática de uma exclusão.
- O checkout preserva a validação prévia e também relê o endereço dentro da transação Serializable que cria os pedidos. A cópia de entrega vem dessa leitura, incluindo a edição/exclusão concorrente na proteção transacional.

O snapshot do pedido permite preservar a entrega sem depender do cadastro vivo do endereço, mas não foi usado para revogar silenciosamente a regra existente sobre o último endereço. Alterar essa regra é uma decisão de negócio futura.

### Interface

A remoção deixa de retirar cartões antes de receber a confirmação da API. Em 409, o recurso continua visível e a mensagem do backend é apresentada. Em sucesso, a consulta é atualizada. Enquanto a remoção está pendente, seus controles ficam desabilitados; os endereços também bloqueiam edição/definição de principal durante outra mutação dessas ações.

A confirmação do pet esclarece que o histórico de atendimentos será preservado. A do endereço esclarece que pedidos já realizados mantêm sua entrega. Os controles de endereço passam a ficar visíveis também no celular e ao navegar por teclado, com nomes acessíveis para remoção.

## Critérios e evidências

| Critério | Verificação |
| --- | --- |
| Estados corretos, inclusive aguardando confirmação | Testes de política e PostgreSQL com todos os estados ativos, aliases, estados desconhecidos e datas futuras/passadas. |
| Propriedade e autenticação | HTTP 401 sem sessão; 404 para recurso alheio/inexistente; UUID inválido recusado antes do acesso; pedidos de outra conta não bloqueiam a conta proprietária. |
| Remover pet sem perder histórico | Remoção física sem vínculo; arquivamento com vínculo terminal; atendimento/pagamento/avaliação preservados; consulta do tutor/parceiro e bloqueio de novo agendamento/edição. |
| Limite de pets ativos | Pet arquivado não ocupa uma das dez posições da lista ativa. |
| Reserva contra remoção | Dois testes reais concorrentes, com e sem histórico: apenas reserva ou remoção é aceita; não há agendamento de pet apagado/arquivado. |
| Remoção duplicada | Uma operação aceita; a outra retorna 404; histórico preservado uma única vez. |
| Último endereço e snapshot | Estados ativos bloqueiam; terminais liberam; remover/editar cadastro não altera endereço copiado no pedido. |
| Principal e limite de endereços | Exclusão promove o mais recente; exclusões simultâneas não removem todos com pedido ativo; definição de principal concorrente não deixa dois principais; criação simultânea respeita cinco endereços. |
| Rollback | Trigger de falha ao promover endereço reverte a exclusão e mantém o principal anterior. |
| Checkout contra remoção | Teste real concorrente: pedido conserva endereço ou remoção vence sem pedido, baixa de estoque ou perda do carrinho. |
| Interface sem sucesso antecipado | Quatro testes de componente: cancelar confirmação não chama API; pendência impede reenvio; conflito mantém cartão; sucesso atualiza a lista. |

## Resultados locais

- Backend completo: **522 testes aprovados**, zero falhas/ignorados, incluindo 16 testes novos com PostgreSQL e dois de política de remoção. A rodada focada anterior passou com os 18 cenários; 108 verificações existentes de compatibilidade de pedidos/agendamentos também passaram.
- Frontend completo: **166 testes aprovados em 30 arquivos**, zero falhas. Quatro cenários novos verificam confirmação, pendência, conflito e atualização de lista.
- Typecheck/build aprovados. Lint sem erros, mantendo três avisos backend e 129 frontend. O build mantém o aviso existente de chunk maior que 500 kB; não foi realizado benchmark de desempenho.
- PostgreSQL 16: 15 migrations aplicadas, nenhuma diferença de schema pelo Prisma. Upgrade separado de 14 para 15 preservou o pet, o atendimento e o pagamento legados, sem arquivamento automático.
- Chromium: **dois cenários aprovados**, em 1280 e 390 pixels, com API e banco reais locais. Confirmam cancelamento da confirmação, 409 em pet ativo, remoção física/arquivamento permitidos, acesso ao histórico, promoção do próximo endereço, 409 no último endereço com pedido pago, snapshot de entrega preservado e ausência de rolagem horizontal na tela conferida. As seis capturas foram inspecionadas.

Logs e capturas estão em `docs/evidencias-testes`, com prefixo `2026-11-20-e12`. O gerador `backend/scripts/qa-resource-deletion-fixture.js` exige ambiente de teste, autorização de banco local e arquivo temporário exclusivo. O teste de navegador é opt-in com `DEL_E2E_FIXTURE` e `DEL_E2E_API`, após iniciar a API de QA e gerar o build. Ele é ignorado explicitamente sem esses requisitos.

Fixture, tokens, outbox e cópia temporária das migrations não são preservados nas evidências. Os recursos locais de QA são encerrados ao final. A suíte global de navegador não foi reexecutada nesta etapa; esta é uma verificação focada, sem validação de serviços externos ou da aplicação publicada.

## Limites e continuidade

O arquivamento é a remoção da lista operacional, com preservação dos registros de atendimento; não constitui apagamento de todos os dados da pessoa. Não foram criados reativação, limpeza retroativa, conversão automática de status desconhecidos ou cancelamento automático de atendimentos atrasados.

Os preflights de e-mails e documentos, definidos na E-09/E-10, continuam necessários antes de publicar a sequência de migrations. Esta entrega não regulariza a base publicada. Os itens restantes de erros, permissões, métricas, rate limit, dependências, CI e QA global permanecem no plano.
