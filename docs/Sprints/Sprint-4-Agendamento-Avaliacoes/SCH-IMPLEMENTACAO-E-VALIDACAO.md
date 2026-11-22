# SCH-1 e SCH-2 — Agenda real do parceiro

Entrega local de 16/11/2026 na branch `codex/retomada-servicos`, sobre `5d11b7e`, preservando SRV-Fpub, PAG-2 e BKG-1/BKG-2. Sem commit ou publicação.

## Comportamento implementado

- `/dashboard/schedule` exige perfil Hotel (3) ou Pet Sitter (4). O menu existente já era restrito a esses perfis; o acesso direto pela URL agora tem a mesma restrição.
- A agenda consome `GET /appointments/provider`, sem ID de parceiro fornecido pelo navegador. A API determina a propriedade pela sessão.
- Foram retirados `appointmentsData`, os horários livres inventados, o formulário sem persistência de criação pelo parceiro e os botões sem implementação.
- Dia e semana apresentam uma linha do tempo com os horários reais ocupados, sem limitar os registros à antiga faixa de 08h–18h. Semana começa na segunda-feira; as setas avançam um dia ou sete dias conforme a visão.
- Seleção de data, retorno para hoje, filtro por status e atualização manual. Atualização periódica a cada 15 segundos.
- A seleção do período usa o fuso do navegador, informado na interface. ISO da API é convertido para esse fuso; datas de calendário não são interpretadas como meia-noite UTC.
- Uma hospedagem que atravessa dias aparece em cada dia ocupado, sinalizada quando começou antes do dia exibido. O intervalo é semiaberto: terminar à meia-noite não ocupa o dia seguinte. O cartão preserva início/fim completos, sem inventar outro atendimento.
- Cartões mostram serviço, pet, tutor/telefone quando retornados, observações, período, total, status e pagamento/estorno. Cores são acompanhadas de rótulos textuais.
- Cache da agenda separado por conta; retorno ao login após 401 preserva o destino da agenda.

## Ações e regras

| Situação do agendamento | Ações do parceiro |
| --- | --- |
| PENDENTE / PRESENCIAL | Confirmar ou recusar |
| PENDENTE / PRE_PAGO | Sem ação; aguarda pagamento do tutor |
| AGUARDANDO_CONFIRMACAO / PRE_PAGO com pagamento aprovado | Confirmar ou recusar |
| CONFIRMADO antes do início | Cancelar; conclusão ainda indisponível |
| CONFIRMADO a partir do início | Concluir; cancelamento indisponível |
| CONCLUIDO, RECUSADO ou CANCELADO | Sem novas transições |

A fronteira de início acompanha a regra atual do backend: `now >= start_time` permite concluir. A interface atualiza essa elegibilidade a cada segundo, e a mutation volta a conferir o horário antes do PATCH. A API continua sendo a autoridade.

Todas as ações pedem confirmação. Recusa/cancelamento de reserva paga informam o estorno integral **simulado**. Não há cobrança ou estorno em um provedor externo.

Antes da mutation, o detalhe é consultado novamente. Mudanças de status, total, período, serviço, pet, política ou pagamento exigem nova conferência. Não há atualização otimista de status; a tela usa o registro retornado pelo backend. Cliques repetidos são bloqueados enquanto a ação está em andamento. O cache é invalidado também em erro.

Erro de consulta permite tentar novamente sem perder data, visão e filtro. Se um refetch falhar, os dados anteriores são preservados com aviso de possível desatualização. Falha na ação permanece no diálogo, com opção de voltar ou tentar novamente. Um pagamento pré-pago inconsistente impede ações e pede conciliação.

## Relação entre critérios e verificações

| Critério | Verificação |
| --- | --- |
| Dados reais e ausência de mocks na agenda | Testes de componente e E2E com API/PostgreSQL locais |
| Decisão por política e pagamento gravados na reserva | Testes de elegibilidade, componente e navegador |
| Recusa/cancelamento e estorno | E2E com registro aprovado e estado REFUNDED retornado pela API |
| Conclusão e limite do início | Teste de fronteira exata, componente e E2E com atendimento já iniciado |
| Dia/semana, madrugada e hospedagem entre dias | Helpers de período, componente e navegador; virada de ano e término à meia-noite |
| Loading, vazio, erro e tentativa posterior | Testes de componente com falhas controladas |
| Mudança concorrente e clique repetido | Testes de componente: impede PATCH com snapshot desatualizado e evita duplicação |
| Separação por conta e perfil | Componente troca de usuário; E2E de URL negada e consultas/alteração por outro parceiro na API |
| Regressão do tutor | Suíte de BKG e regressão completa do frontend |

Validações já concluídas: typecheck; lint dos arquivos da entrega sem erros; build aprovado com o aviso existente de chunk grande; 26 testes focados aprovados; suíte completa do frontend com **22 arquivos e 124 testes aprovados**, usando `--maxWorkers=1 --no-file-parallelism --testTimeout=15000` via CLI, sem alterar a configuração versionada.

Primeira rodada de navegador: quatro cenários aprovados, sendo hotel/desktop e sitter/celular com API controlada, mais hotel/desktop e sitter/celular com API e PostgreSQL reais. As telas de dia foram inspecionadas em 1280 e 390 px, sem overflow horizontal. Os cenários reais confirmaram, cancelaram, recusaram, concluíram e verificaram estorno, persistência após reload e resultados visíveis na consulta do tutor. Outra conta não recebeu esses agendamentos nem conseguiu alterá-los (403).

Os testes integrados autenticam por JWT de fixture. Eles não constituem uma nova validação completa da tela de login. Os estados já iniciados e pagos são preparados diretamente no banco de teste; a criação e o pagamento pela jornada do tutor são cobertos separadamente pela BKG/PAG-2.

Regressão final do navegador: **30 cenários aprovados, zero falhas e zero ignorados**, com um worker. Inclui os dois casos integrados de BKG, os dois integrados de SCH e o bloqueio da URL da agenda para lojista e tutor. Os cenários controlados de checkout não validam o provedor Mercado Pago externo. O teste existente de acessibilidade da página inicial continua registrando uma violação séria de contraste (dez elementos), sem violação crítica; esse débito não foi corrigido nem ocultado nesta etapa.

## Reproduzir a rodada integrada

1. Provisionar PostgreSQL local descartável com nome contendo `test`; aplicar as oito migrations com `DATABASE_URL` explicitamente apontando para ele.
2. Configurar API com `NODE_ENV=test`, segredo JWT fictício, `FRONTEND_URL` do preview, Mercado Pago e Sentry desativados e dados fictícios de e-mail. Não iniciar o comando de produção usando o `.env` publicado.
3. Com o mesmo banco/segredo e `RUN_DB_INTEGRATION_TESTS=true`, executar `node scripts/qa-schedule-fixture.js <caminho-json-temporario>` no backend. O helper recusa destinos que não correspondam ao banco local de teste permitido.
4. Iniciar a API com essas variáveis e gerar o build do frontend.
5. No frontend, definir `SCH_E2E_FIXTURE` para o JSON e `SCH_E2E_API` para `http://127.0.0.1:<porta>/api/v1`; executar `npx playwright test e2e/schedule-real.spec.ts --workers=1`.
6. A fixture não deve ser reutilizada sem renovação após mutações: gerar novas contas/registros para cada rodada. Encerrar API/container e remover o JSON ao terminar.

Nesta execução, o PostgreSQL 16 descartável usa `127.0.0.1:55441`, e a API local usa a porta 3303. O proxy de transporte do Playwright encaminha as requisições para essa API, sem substituir as respostas de negócio. Nenhum acesso foi feito ao banco publicado ou aos provedores de pagamento/e-mail.

Após a regressão final, a API de teste foi encerrada, o container descartável foi parado e os dois JSONs temporários de fixtures de SCH/BKG foram removidos.

Sem as variáveis de fixture/API, os dois E2E integrados ficam explicitamente ignorados. O provisionamento automático dessa API no CI continua no escopo de QA-2/QA-3. Capturas de teste ficam em `frontend/test-results`, são temporárias e não representam evidências de produção.

## Limites

Esta entrega gerencia solicitações existentes; a criação continua sendo feita pelo tutor na BKG. Não foi implementada uma nova API de disponibilidade, capacidade de hospedagem ou criação pelo parceiro. A visualização por período filtra os registros retornados pelo endpoint atual no cliente; não acrescenta paginação no servidor.

A API precisa incluir a migration e o endpoint de pagamento/estorno da PAG-2 antes da publicação conjunta. Não houve migration em produção. As demais telas demonstrativas, avaliações, indicadores, segurança e fechamento do plano permanecem nas suas tasks; a conclusão local de SCH não encerra o projeto.
