# Pet+ - Plano de retomada e fechamento

Preparado em 16/11/2026. Status: **proposta para análise, sem implementação autorizada por este documento**.

Atualização de 16/11: execução autorizada pela Laura, em entregas sequenciais, sem divisão entre colegas e sem commits por enquanto. O status original acima corresponde à preparação do plano; os registros finais identificam as entregas implementadas localmente.

Base técnica: main `5d11b7e`, consultada no diagnóstico de 16/11. O workspace continua na branch `chore/remove-env-local`, cinco commits atrás dessa referência. Nenhuma atualização de branch ou alteração da aplicação é parte desta entrega de planejamento.

## 1. Objetivo e resultado esperado

Concluir a vitrine real, conectar a jornada de agendamento ao backend existente e terminar avaliações, indicadores e validação de release, sem perder as correções de comércio e segurança já entregues.

O trabalho mantém os IDs das sprints e da estabilização. Os blocos abaixo reorganizam a execução; não criam sprints adicionais nem substituem os critérios originais. Quando uma especificação antiga contradisser DEC-A/DEC-B ou E-04, corrigir o trecho antes da implementação.

Dois marcos intermediários:

- **Jornada de serviços integrada:** tutor solicita atendimento; parceiro recebe e decide; tutor acompanha/cancela; pagamento e estorno simulados funcionam quando a política exigir.
- **Release completo do escopo priorizado:** compra e agendamento validados, avaliações e painéis reais, segurança/infraestrutura verificadas e checklist aprovado.

Não tratar o primeiro marco como conclusão de todas as Sprints 4 e 5. Em caso de prazo curto, qualquer adiamento de uma entrega obrigatória deve ser aprovado e registrado, não omitido do relatório.

## 2. O que preservar e o que não entra agora

### Entregas a reutilizar

- E-01 a E-06: gates, listagem administrativa, limites de imagens, regras de agendamento, endereço no pedido e total coerente.
- SRV-1/SRV-F1/SRV-F2: serviços e gestão pelo parceiro.
- AGD-2/E-04: rotas de agendamento, preço do serviço, política congelada, conflitos e estados.
- Infraestrutura atual de testes, migrations, autenticação, serviços HTTP, React Query e CI.
- Pagamento de pedidos e integração opcional PGT-1, sem estendê-los indevidamente a Appointment.

### Fora do escopo desta retomada, salvo nova decisão

- Compra anônima, cobrança real em produção, split/repasse financeiro e gateway real para agendamentos.
- Cloudinary/STO-1 como requisito de liberação: permanece opcional.
- Recomendação por IA, chat, notificações em tempo real, cupons, descontos e cálculo de frete.
- Controle de capacidade de hotel não modelado. Não prometer vagas disponíveis que o sistema não controla.
- Reescrita de arquitetura ou redesign geral sem necessidade funcional.

## 3. Preparação e acordos antes de codificar

Responsabilidade: equipe, com uma pessoa responsável por registrar os acordos. Nomes a confirmar.

1. Escolher uma base atualizada da main e criar branches de tarefa sem sobrescrever documentos locais. Atualização de branch depende de autorização nova da Laura.
2. Conferir se a main avançou desde `5d11b7e`; se avançou, revisar somente o delta antes de manter este plano.
3. Executar a linha de base: lint, testes, typecheck, build e E2E atuais. Registrar commit, ambiente e falhas prévias.
4. Confirmar responsáveis e disponibilidade. Limitar cada pessoa a uma entrega principal em implementação por vez; revisão e testes acompanham a entrega.
5. Atualizar o board pelos critérios atuais: entregue, parcial, pendente ou aguardando validação externa. Não reabrir PRD-2 como totalmente ausente, pois seu objetivo principal foi absorvido por E-01.
6. Definir os contratos compartilhados descritos abaixo e registrar decisões de modelagem pendentes.
7. Identificar quais itens históricos E-07 a E-19 continuam reproduzíveis. Corrigir apenas o restante, sem repetir mudanças já incorporadas.

### Contratos compartilhados

| Contrato | Acordo necessário |
| --- | --- |
| Serviços públicos | `starting_price`, preços/unidades dos serviços ativos, parceiro operacional e comportamento sem serviço |
| Appointment | Campos de tutor/parceiro/pet/serviço, período, total, política congelada, status e ações permitidas |
| Pagamento de Appointment | Endpoint, valores de status, datas e valor; retorno de pagamento/estorno nas consultas |
| Erros | Códigos existentes para conflito de horário, parceiro indisponível, dados inválidos e sessão expirada; adicionar apenas códigos necessários |
| Listagens | Paginação, ordenação, filtros e total quando aplicáveis; não criar convenções diferentes entre tutor e parceiro |
| Datas e valores | ISO no transporte; apresentação no fuso definido para a aplicação; BRL; cálculo monetário no backend sem perder precisão |

Campos e endpoints novos são propostas até a revisão do contrato. O frontend pode trabalhar com respostas simuladas desse contrato enquanto o backend é implementado, mas o aceite final exige integração real em banco de teste.

### Decisões que precisam de registro

- **Unidade da avaliação de produtos:** recomendar uma avaliação por item de pedido concluído e por agendamento concluído, evitando que uma constraint única no pedido impeça avaliar produtos diferentes. A equipe deve confirmar a unidade, inclusive como tratar o mesmo produto repetido, antes da migration de AVL-1. Não alterar essa regra silenciosamente.
- **Indicadores financeiros:** definir quais registros representam pagamento efetivo no modo simulado, como tratar cancelamento/estorno e qual data referencia a receita. Não somar somente `status=PAGO`, pois o pedido pode avançar para PREPARANDO/ENVIADO/CONCLUIDO sem deixar de ter sido pago. Não anunciar saldo disponível para saque sem sistema de repasse.
- **Prazo de fechamento:** datas e disponibilidade ainda não informadas. Os blocos são uma ordem de entrega, não uma promessa de duração.

## 4. Ordem de execução e dependências

```text
Preparação + contratos + linha de base
  |
  +-- SRV-Fpub (listagens) ------------------+--> BKG-1 --> BKG-2 --+
  |                                        |                      |
  +-- PAG-2 -------------------------------+----------------------+
  |                                                               +--> QA-2: agendamento real
  +-- SCH-1 --> SCH-2 ---------------------------------------------+
  |
  +-- AVL-1 --> AVL-2 --> AVL-F1 --> AVL-F2 --> QA-3: avaliação real
  |
  +-- DSH-1 --> DSH-2 --> conferência dos totais
  |
  +-- E-08/E-09/E-10/E-12 + SEC-2/INF-2 --> regressão + gate de release

QA-2 acompanha cada entrega desde o início; QA-3 conclui a validação global.
```

Não é necessário esperar PAG-2 para começar seleção e criação presencial em BKG-1 ou listagem em SCH-1. O ramo pré-pago integrado depende de PAG-2. AVL-1 pode começar com fixtures de transações concluídas depois da decisão de modelagem, sem esperar todas as telas de agendamento.

## 5. Bloco A - Fechar a vitrine e iniciar a jornada

### A1. SRV-Fpub - concluir o restante, não refazer os detalhes

Prioridade: imediata. Trilha sugerida: frontend do tutor. Esforço relativo: pequeno/médio, a confirmar após diff.

Trabalho:

- Ligar as listagens de hotéis/sitters ao `starting_price` do backend.
- Exibir "A partir de" com o menor preço real. Retirar fallback R$ 150/R$ 50 e uso da tarifa geral como preço da reserva.
- Retirar notas, reviews aleatórias, distâncias, experiência e selos sem fonte real nas listagens.
- Tratar carregamento, falha, ausência de serviços e campos opcionais sem inventar valores.
- Preservar os detalhes entregues em 11/11 e as restrições de parceiro operacional.
- Revisar filtros/ordenação que dependiam de valores fabricados.

Aceite e testes:

- Serviços R$ 60 e R$ 120 resultam em card "A partir de R$ 60" e detalhe coerente.
- Parceiro sem serviço ativo não entra na vitrine, conforme contrato atual.
- Falha da API mostra erro, não preço fictício ou lista falsa.
- Testes de componentes e contrato de listagem verificam o preço e os estados.

### A2. PAG-2 - pagamento e estorno de agendamento

Prioridade: alta, caminho crítico do pré-pago. Trilha: backend transacional. Esforço: grande pelo risco transacional, mesmo que a spec antiga indique médio.

Trabalho:

- Criar registro de pagamento próprio de Appointment, com unicidade, valor congelado, status e datas de pagamento/estorno. Não reaproveitar PaymentAttempt de Order.
- Adicionar pagamento simulado do tutor proprietário, por exemplo `POST /api/v1/appointments/:id/pay`, após confirmar o contrato.
- Pagamento e transição para AGUARDANDO_CONFIRMACAO na mesma transação.
- Recusa/cancelamento elegível de pré-pago pago gera estorno integral persistido junto com a transição.
- Consultas de agendamento retornam o estado do pagamento; o frontend não deduz pagamento só pelo rótulo da política.
- Serializar operações concorrentes ou usar atualização condicional consistente. Evitar pagar uma reserva cancelada, confirmar sem pagamento ou estornar duas vezes.
- Definir resultado de repetição: devolver o estado já válido ou conflito padronizado, sem novo efeito financeiro.

Aceite e testes com PostgreSQL isolado:

- Pré-pago nasce PENDENTE; só pagamento aprovado o leva a AGUARDANDO_CONFIRMACAO.
- Tutor de outra conta não paga; parceiro não confirma pré-pago não pago.
- Presencial segue sem pagamento online, com aceite do parceiro.
- Repetição e concorrência de pagamento, cancelamento e estorno não duplicam efeitos.
- Falha entre pagamento/estorno e mudança de status causa rollback total.
- Alteração da política atual do parceiro não muda a política de uma reserva existente.

## 6. Bloco B - Contratação e agenda reais

### B1. BKG-1 e BKG-2 - tutor

Trilha: frontend transacional. Começar BKG-1 em paralelo à PAG-2 com contrato acordado; aceitar BKG-2 após integração da PAG-2.

Trabalho:

- Substituir os botões sem fluxo por seleção de serviço ativo, pet próprio e período.
- Exigir tutor autenticado; preservar destino/contexto ao entrar ou cadastrar conta. Não criar fluxo anônimo de reserva.
- Sem pet: orientar cadastro e retomar a intenção sem perder seleção indevidamente.
- Prévia pelo preço do serviço e mesmas regras de unidade/arredondamento do backend. Hotel por diária; sitter por hora iniciada, conforme regra vigente.
- Após criar, usar total e política retornados pelo backend. Se o total diferir da prévia, informar e exigir concordância antes de pagar, sem confirmar cobrança automaticamente.
- Presencial: mensagem de solicitação PENDENTE, não de atendimento confirmado.
- Pré-pago: pagar no modo simulado, mostrar AGUARDANDO_CONFIRMACAO e permitir retomar o pagamento elegível sem criar outra reserva.
- Conectar Meus Agendamentos a dados reais, com status, pet, parceiro, período, valor e cancelamento permitido.
- Tratar sessão expirada, rede, conflito de horário, mudança de preço e parceiro indisponível.
- Evitar duplo envio; em resposta incerta, consultar a reserva criada ou usar estratégia de idempotência acordada, sem repetir criação às cegas.
- Atualizar/invalidate cache após criar, pagar ou cancelar; remover mocks.

Aceite:

- Tutor cria reserva presencial e a vê PENDENTE no próprio histórico.
- Tutor cria pré-pago, paga uma vez e vê o status correto; pode retomar após recarregar a página.
- Histórico não mostra dados de outra conta e não usa conteúdo fictício.
- Cancelamento reflete status e estorno quando aplicável.
- Conflito não gera segunda reserva nem mensagem falsa de sucesso.

### B2. SCH-1 e SCH-2 - hotel e Pet Sitter

Trilha: frontend do parceiro. Compartilhar serviço HTTP e tipos com BKG, sem duplicar chamadas.

Trabalho:

- Substituir `appointmentsData` pelos registros do parceiro autenticado.
- Exibir pet, tutor apenas com campos necessários, serviço, período, total e status.
- Confirmar, recusar e concluir conforme ator, horário, política e estado permitidos pelo backend.
- No presencial, aceitar/recusar PENDENTE; no pré-pago não pago, não oferecer confirmação/recusa indevida.
- Conclusão somente quando elegível; cancelamento conforme regra vigente.
- Visões dia/semana com datas reais, fuso consistente e estado vazio por período.
- Confirmar ações sensíveis, impedir envios repetidos e tratar 409 de alteração concorrente recarregando o estado.

Aceite:

- Solicitação criada no tutor aparece na agenda do parceiro correto.
- A decisão do parceiro aparece no histórico do tutor após atualização/refetch.
- Nenhum parceiro consulta/altera atendimento de outro.
- Calendário e lista não inventam horários ou disponibilidade/capacidade de hotel.

### Marco B - jornada integrada de serviços

Demonstrar, com banco isolado e interfaces integradas: hotel presencial; sitter pré-pago; confirmação; recusa com estorno; cancelamento elegível; conclusão; tentativa proibida por outra conta; conflito de horário.

Esse marco depende de PAG-2, BKG-1/2 e SCH-1/2 integradas. Smoke ou teste com respostas simuladas não substitui o conjunto.

## 7. Trilha paralela obrigatória - integridade, segurança e infraestrutura

Antecipar os itens de risco antes do aceite das jornadas. A atribuição abaixo é sugestão de área; os IDs originais continuam sendo as unidades de acompanhamento.

| Item | Entrega restante | Critério mínimo de fechamento |
| --- | --- | --- |
| E-08 | Estoque, cancelamento e pagamento de Order | Decremento seguro em concorrência; estoque nunca negativo; cancelamento elegível devolve estoque uma vez; transições condicionais; parceiro não confirma pagamento por atalho. Eventos de gateway e conciliação continuam respeitados. |
| E-09 / DEC-E | Política única de senha, e-mail e reset | Aplicar 8 caracteres, maiúscula e número nos fluxos; custo 12 nas novas gravações, sem invalidar hashes antigos de custo 10; consumo atômico de reset. Antes de normalizar e-mails/criar índice, identificar colisões e aprovar saneamento. |
| E-10 / DEC-F | Documento e aceite de termos | Validar documento conforme regra; persistir valor normalizado; exigir aceite real e gravar data/versão no novo cadastro. Não inventar consentimento retroativo para usuários antigos; definir tratamento de legado e conflitos antes da migration. |
| E-12 | Exclusão de pet/endereço | Usar estados oficiais e testar recurso próprio/alheio e vínculo bloqueante, conforme política vigente; não herdar verificações de strings antigas. |
| E-07 / E-14 / SEC-2 | Erros e mensagens | UUID inválido e regra de negócio retornam erro adequado, não 500; frontend entende os códigos reais; erro interno não expõe dados. |
| E-15 / SEC-2 | Métricas e minimização | Métricas somente admin/coleta autorizada; respostas públicas e dados de tutor limitados ao necessário. |
| SEC-2 | Rate limit global | Limite testado atrás do proxy, mantendo auth mais restrito e sem quebrar webhook legítimo, health ou coleta. Definir política por grupo de rotas antes de aplicar indiscriminadamente. |
| E-16 / INF-2 | Dependências e deploy | Corrigir problemas reportados e registrar a política da auditoria; só depois torná-la bloqueante. Manifesto reprodutível, versão Node suportada/compatível com dependências e CI, instalação por lockfile, Prisma e migrations validados. Não copiar Node 20 da spec antiga sem rever o suporte. |
| CFG-1 | Persistência ou indisponibilidade honesta | Conferir escopo original/atores e endpoints; salvar de verdade o que está no escopo. Não simular logout global ou configuração inexistente; retirar/desabilitar com estado claro até implementação. |
| E-13 / E-18 / E-19 | Retomada, merge/cache e pedidos | Reproduzir primeiro; corrigir retorno de parceiro recusado, estados incertos da compra, atualização de cache e paginação realmente pendentes. Não assumir que todos os achados antigos continuam presentes. |

Os efeitos em pedidos com Mercado Pago exigem análise própria: reposição de estoque local não substitui estorno financeiro. Não mudar regras de cancelamento do gateway silenciosamente.

### Gate de integridade

Antes de liberar a jornada de compra revisada: testes de concorrência/rollback relevantes aprovados, cancelamento sem efeito duplicado, pagamento sem atalho, endereço preservado e total exibido igual ao aceito/cobrado.

Antes de expor um novo contrato privado: autorização, propriedade, validação de entrada e seleção de campos verificadas. Revisão global da SEC-2 não fica como justificativa para adiar esses testes da própria task.

## 8. Bloco C - Avaliações e indicadores

### C1. AVL-1 / AVL-2 - backend

Trilha: backend de plataforma. Pode iniciar após o acordo da unidade de avaliação, com fixtures de transações concluídas.

- Modelar Review e migration conforme origem/alvo; não confundir com avaliação administrativa de candidatura do sitter.
- Nota inteira de 1 a 5; autor proprietário; alvo realmente pertencente ao pedido/agendamento; origem CONCLUIDO nas constantes atuais.
- Impedir duplicidade em banco e no fluxo concorrente conforme unidade aprovada.
- Consultas públicas paginadas, com dados mínimos do autor, sem documento, e-mail privado ou hash.
- Média/contagem reais por alvo, calculadas em lote nas listagens para evitar N+1.
- Sem avaliação: contagem zero e média ausente/neutra acordada; não exibir cinco estrelas fictícias.

Aceite: criação válida; nota inválida; origem incompleta/alheia; alvo diferente do comprado; duplicidade concorrente; agregados corretos; paginação; alvo sem avaliações.

### C2. AVL-F1 / AVL-F2 - interface

- Disponibilizar avaliação apenas para compra/atendimento elegível, sem confiar nessa ocultação como proteção de API.
- Formulário de nota/comentário, sucesso e validação; atualizar avaliação e agregados após envio.
- Listas paginadas e estados vazios/erro em produto/hotel/sitter.
- Retirar todos os ratings, reviews, depoimentos e distribuições de notas fabricados no escopo público.

Aceite: uma compra/atendimento concluído é avaliado pela conta correta e aparece no alvo; outra conta e origem não concluída são rejeitadas também pela API.

### C3. DSH-1 / DSH-2 - dados e telas

- Registrar a definição de receita e datas antes da query. Pagamento simulado representa movimentação de teste, não dinheiro efetivamente recebido.
- Métricas do parceiro isoladas pela conta, contagens e séries diárias reais; admin agrega sem expor dados privados indevidos.
- Reutilizar as mesmas regras para evitar divergência entre total da plataforma e soma dos parceiros.
- Ligar Overview/Finance e painel administrativo aos endpoints; valores vazios são zero/ausentes, nunca mocks.
- Não apresentar saque, saldo disponível ou taxas como operações existentes sem contrato e persistência.

Aceite: dataset conhecido com pago, aguardando, cancelado/estornado e concluído; números conferem por parceiro e no admin; fuso/período corretos; nenhum acesso cruzado.

## 9. Bloco D - QA, operação e fechamento documental

### QA-2 durante as entregas

- Testes unitários de regra e integração HTTP por task.
- PostgreSQL separado para persistência, migrations, rollback e concorrência. Nunca usar produção para limpeza/seed.
- Testes de componentes com mocks como complemento, identificados como simulações.
- E2E integrado com frontend/API/banco de teste para compra e reservas, sem serviços externos obrigatórios.
- Dados determinísticos, relógio/fuso controlado onde necessário, isolamento entre contas e limpeza segura.
- Não desabilitar a proteção de produção para fazer a suíte passar; configurar rate limits adequadamente no ambiente isolado.

### QA-3 e gate final

- E2E de recusa/correção/reenvio e de avaliação após conclusão.
- Regressão de cadastro, login, recuperação, carrinho/merge, compra, moderação e gestão de serviços.
- Desktop/mobile, teclado, foco, rótulos, contraste e mensagens nas telas prioritárias; testar também loading/erro/vazio.
- Registrar falhas e corrigir antes do aceite, sem converter silenciosamente teste falho em ignorado.
- Resend real: envio, template/logo, link temporário e cenário de falha; ocultar tokens/PII nas evidências.
- Mercado Pago de pedidos, se incluído na demonstração: aprovado/recusado, assinatura, duplicidade e retorno sem pagar. Sem aceite externo, registrar a limitação e usar modo simulado acordado, não alegar validação do sandbox.
- Conferir configuração e migrations do ambiente publicado, health, logs e procedimento de backup/restauração com o responsável. Não executar mudanças de produção por este plano.
- Preparar dados seguros e ensaiar a demonstração a partir do commit candidato, sem depender de registros pessoais.

### Evidência obrigatória por entrega

| Campo | Conteúdo |
| --- | --- |
| Identificação | Task original e critérios atendidos |
| Versão | Commit e PR |
| Execução | Data, ambiente, comando/cenário e responsável |
| Resultado | Esperado e obtido, incluindo falhas/restrições |
| Prova | Relatório CI/JUnit, teste de banco ou captura sem segredos |
| Rastreabilidade | Requisito do documento final, sem presumir que IDs propostos foram adotados |

Usar nova pasta/data para novas evidências. Não sobrescrever os relatórios de 18/10 para fazê-los parecer execução da versão atual.

Atualizar status das specs, READMEs e checklist conforme cada entrega; manter histórico datado. A questão acadêmica de REGIS depende do material/retorno do professor e deve ser acompanhada separadamente, sem inventar sua definição.

## 10. Distribuição sugerida para quatro pessoas

Papéis organizam áreas de trabalho, não atribuem nomes ou disponibilidade. Negociar a distribuição e registrar no board antes de começar.

| Trilha | Primeira entrega | Entregas seguintes | Revisão cruzada |
| --- | --- | --- | --- |
| R1 - backend transacional | PAG-2 | E-08; contribuição em INF-2/SEC-2 | R2 revisa modelagem, autorização e transações |
| R2 - backend plataforma | Itens de segurança imediatos e contrato Review; AVL-1 após acordo | AVL-2, E-09/E-10/E-12 conforme risco e DSH backend | R1 revisa integridade e queries |
| R3 - frontend tutor | Fechamento SRV-Fpub | BKG-1/BKG-2; AVL-F1/AVL-F2 | R4 revisa estados, acessibilidade e integração |
| R4 - frontend parceiro e QA | SCH-1 e cenários de teste | SCH-2; integração de telas DSH; coordenação QA-2/QA-3 | R3 revisa calendário, contratos e navegação |

Backend de DSH pertence a DSH-1/2; integração de telas é parte do mesmo aceite, mesmo que distribuída entre pessoas. Não encerrar a task só pela API.

R4 coordena evidências, mas **cada pessoa testa a própria entrega**. R2 não deve acumular todas as pendências ao mesmo tempo; priorizar por risco e repartir correções pequenas com R1 conforme a conclusão de PAG-2. Se a capacidade for insuficiente, replanejar antes de iniciar mais frentes.

## 11. Cadência e marcos, sem datas inventadas

| Marco | Condição de entrada | Condição de saída |
| --- | --- | --- |
| M0 - base acordada | Confirmação de responsáveis/capacidade | Main conferida, linha de base registrada, contratos e decisões necessárias aprovados |
| M1 - vitrine coerente | M0 | SRV-Fpub completa nas listagens e detalhes; testes dos preços/estados |
| M2 - serviços ponta a ponta | Contratos + base E-04; M1 para consistência pública | PAG-2, BKG e SCH integradas, cenários do marco B demonstrados |
| M3 - avaliações e indicadores | Unidade de review e definição financeira aprovadas | AVL e DSH integradas, sem dados fabricados, totais conferidos |
| M4 - candidato de release | M2/M3 e correções obrigatórias aceitas | CI, jornadas, segurança/infra, validações externas aplicáveis e checklist aprovados |

AVL e DSH podem avançar em paralelo ao M2. A numeração dos marcos serve ao acompanhamento deste plano e não substitui os nomes históricos M0-M5 das sprints originais.

Após estimar os diffs de cada tarefa e conhecer a disponibilidade, a equipe deve estimar por entrega, reservando tempo explícito para revisão, integração e correção de falhas. Não converter automaticamente uma task em um dia nem prometer prazo pela quantidade de pessoas.

Acompanhamento recomendado: em cada checkpoint curto, registrar o que foi integrado, qual dependência bloqueia a próxima entrega e qual evidência falta. Fechamento de task exige PR revisado e critérios verificados, não apenas branch pronta.

## 12. Gestão de conflitos e mudanças de banco

- Um responsável coordena cada migration; antes de criar a próxima, atualizar a base para não gerar alterações conflitantes em Prisma.
- Migrations novas para pagamento de Appointment, Review, termos ou saneamento devem ter sequência revisada e aplicação testada em banco isolado. Nunca editar uma migration já aplicada.
- Definir comportamento dos registros antigos sem inventar pagamento, consentimento ou autoria histórica.
- Designar um responsável pelo serviço HTTP/tipos de Appointment compartilhado entre BKG e SCH; o outro consome o contrato ou combina mudanças pequenas em PRs distintos.
- Combinar propriedade temporária dos controllers/rotas compartilhados entre PAG, SEC e DSH; evitar dois grandes PRs alterando o mesmo trecho.
- PR pequeno por entrega ou correção coerente; revisão de segurança para contratos públicos/privados e de banco para mudanças transacionais.
- Fixar uma versão candidata para QA final. Hotfix exige regressão dos fluxos afetados; evidências devem identificar a versão posterior.

## 13. Critério de conclusão do plano

- [ ] Vitrine mostra serviços/preços verdadeiros e nenhum indicador inventado no escopo público.
- [ ] Tutor e parceiro concluem as jornadas presencial e pré-paga de agendamento com estados corretos.
- [ ] Pagamento/estorno simulados de Appointment são persistidos, atômicos e idempotentes.
- [ ] Compra mantém estoque, endereço e total consistentes, inclusive em falha/cancelamento concorrente.
- [ ] Avaliações só são aceitas de origens elegíveis e aparecem com agregados reais.
- [ ] Indicadores do parceiro/admin usam definições consistentes e dados reais, identificando a simulação financeira.
- [ ] Autorização, senha, termos, documentos, exclusões, métricas e erros cumprem os critérios priorizados.
- [ ] Infra reproduzível e auditoria bloqueante aprovadas; vulnerabilidades e exceções, se houver, são explícitas e aceitas, sem afirmar zero sem prova.
- [ ] Jornadas integradas e QA das telas prioritárias passam; pendências são conhecidas e não ocultadas.
- [ ] Documentação, board, requisitos, evidências e checklist refletem o mesmo commit candidato.
- [ ] Integrações externas usadas na apresentação possuem validação própria ou limitação explicitamente acordada.

Qualquer retirada de item obrigatório exige mudança de escopo aprovada, com motivo e impacto. Cloudinary e recursos explicitamente opcionais podem continuar no backlog sem serem apresentados como entregues.

## 14. Primeiro lote proposto para execução após aprovação

1. Confirmar responsáveis, capacidade, unidade de avaliação e definição dos indicadores.
2. Autorizar a atualização segura da base e registrar a linha de base.
3. R3 fecha as listagens da SRV-Fpub; R1 detalha/implementa PAG-2.
4. R4 inicia agenda real e testes; R2 resolve as proteções imediatas e prepara AVL-1 conforme decisão aprovada.
5. R3 segue para BKG; integrar os fluxos usando o contrato compartilhado.

Não iniciar Cloudinary, gateway de produção ou novas funcionalidades paralelas antes desse lote. Esta ordem não autoriza execução automática: o próximo pedido deve indicar a task a começar e os responsáveis combinados.

## Referências

- [Diagnóstico de 16/11](<C:/PI - 2026/Pet/docs/Sprints/STATUS-PROJETO-2026-11-16.md>).
- [Decisões de estabilização](<C:/PI - 2026/Pet/docs/Sprints/PAUTA-FASE-0-DECISOES-ESTABILIZACAO.md>).
- [Auditoria e backlog E-xx](<C:/PI - 2026/Pet/docs/Sprints/AUDITORIA-QUALIDADE-ESTABILIZACAO-PRE-SPRINT-4.md>).
- [SRV-Fpub](<C:/PI - 2026/Pet/docs/Sprints/Sprint-3-Servicos-Agendamento/SRV-Fpub-exibir-servicos-reais.md>).
- [Sprint 4](<C:/PI - 2026/Pet/docs/Sprints/Sprint-4-Agendamento-Avaliacoes/README.md>).
- [PAG-2](<C:/PI - 2026/Pet/docs/Sprints/Sprint-4-Agendamento-Avaliacoes/PAG-2-pagamento-agendamento-prepago-estorno.md>).
- [BKG-1](<C:/PI - 2026/Pet/docs/Sprints/Sprint-4-Agendamento-Avaliacoes/BKG-1-fluxo-agendamento-front-parte-1.md>).
- [AVL-1](<C:/PI - 2026/Pet/docs/Sprints/Sprint-4-Agendamento-Avaliacoes/AVL-1-avaliacoes-backend-parte-1.md>).
- [Sprint 5](<C:/PI - 2026/Pet/docs/Sprints/Sprint-5-Fechamento/README.md>).
- [Checklist de release](<C:/PI - 2026/Pet/docs/Sprints/Sprint-5-Fechamento/RELEASE-CHECKLIST.md>).

## Registro desta preparação

Foi criado apenas este documento de planejamento, com leitura dos documentos locais e do diagnóstico imediatamente anterior. Não houve nova consulta remota, nova execução de testes, alteração de aplicação, troca/merge de branch, commit, publicação ou acesso ao banco de produção.

### Execução iniciada em 16/11/2026

A Laura autorizou executar a retomada, sem divisão entre integrantes. Foi criada a branch de trabalho (hoje `tasks-laura`) a partir de `origin/main` em `5d11b7e`, preservando os documentos locais e sem commit.

Primeira entrega local: restante das listagens da SRV-Fpub. HotelsPage e WalkersPage usam uma listagem compartilhada, preço `starting_price`, serviços ativos da API, busca por nome/local/serviço, filtro por serviço real e ordenação por nome/preço. Foram retirados ratings, reviews aleatórias, distâncias, experiência, disponibilidade e filtros sem implementação. Favoritos e navegação para detalhes foram preservados. Não foi alterado o backend nesta etapa.

Verificações: dez testes de componentes aprovados; typecheck e lint dos arquivos de componentes/páginas aprovados; build aprovado com avisos de bundle/importação mista; quatro cenários Playwright aprovados (hotéis/sitters, 375/1280 px), com API simulada, capturas e verificação de ausência de overflow horizontal. O Chromium compatível foi instalado após a primeira tentativa constatar sua ausência. As capturas em `frontend/test-results` são temporárias, não evidências versionadas de produção.

Na primeira entrega, PAG-2 e os demais blocos ainda estavam pendentes. Este registro não declara todo o plano concluído nem substitui a validação com dados reais da API publicada.

### Segunda entrega local - PAG-2

Pagamento simulado e estorno de Appointment implementados com registro próprio, unicidade e lock compartilhado entre pagamento e mudanças de status. API retorna payment nas consultas. Migration nova validada em PostgreSQL 16 descartável; oito migrations aplicadas e nenhuma diferença de schema. Suíte completa backend com banco: 410 aprovados, zero falhas/ignorados. Sem commit, publicação ou acesso ao banco de produção. Detalhes no documento PAG-2-CONFIGURACAO-E-VALIDACAO.md da Sprint 4. BKG e SCH continuam pendentes.

### Terceira entrega local - BKG-1/BKG-2

Jornada do tutor conectada: rota protegida, serviços/pets, período e prévia, criação PENDENTE, pagamento simulado explícito pelo total do backend, histórico real, cancelamento e apresentação do estorno. Rascunho por conta/parceiro, retorno do cadastro de pet/login e recuperação de envio incerto. Frontend: 109 testes aprovados em execução sequencial; typecheck/build e lint sem erros; regressão Playwright de 24 cenários aprovada, incluindo API/PostgreSQL reais. Confirmação via API do parceiro refletida no histórico. Detalhes e limites em BKG-IMPLEMENTACAO-E-VALIDACAO.md. Sem commit ou publicação. Próxima frente: SCH-1/SCH-2; demais blocos continuam pendentes.

### Quarta entrega local - SCH-1/SCH-2

Agenda real de hotéis/Pet Sitters conectada ao endpoint do parceiro, com acesso à rota restrito aos papéis 3/4. Retirados mocks, horários livres inventados e controles sem persistência. Visões dia/semana, filtro de status, intervalos que atravessam dias, horários locais e atualização manual/periódica. Confirmar/recusar conforme política/pagamento; cancelar confirmado antes do início; concluir a partir do início. Ações com confirmação, consulta prévia do estado, bloqueio de duplicação, erro/retry e estorno simulado retornado pelo backend.

Verificações: typecheck e lint dos arquivos da entrega aprovados; build aprovado com aviso de chunk grande; 124 testes frontend aprovados em execução sequencial; 30 cenários Playwright aprovados, zero falhas/ignorados. Os cenários com API/PostgreSQL locais verificaram as ações dos dois perfis, persistência, estornos, consulta do tutor e isolamento entre parceiros. Não houve nova alteração funcional no backend nesta etapa; foi adicionado um gerador protegido de fixtures locais. Detalhes, reprodução e limites em SCH-IMPLEMENTACAO-E-VALIDACAO.md.

Sem commit, publicação ou acesso ao banco publicado. A jornada de serviços está conectada localmente dos dois lados, sem transformar esta entrega em aceite de toda a Sprint 4/5. Próxima frente prevista no plano: avaliações (AVL-1/AVL-2 e interfaces), acompanhada dos itens restantes de estabilização e QA. A decisão de unidade de avaliação deve ser registrada antes de uma migration de Review.

### Revisão de entrega da equipe - 17/11/2026

Após autorização da Laura, realizado fetch e pull com fast-forward da main: ela permanece em `5d11b7e`, sem atualização a incorporar. Identificada a branch `feature/reviews-avl-1`, commit `ad21e26` de Layssafernandes, com PR #52 aberto e checks verdes. A implementação de Review foi revisada em cópia temporária isolada, sem merge na branch de retomada e sem alterar as implementações locais.

Suíte backend da branch revisada: 428 testes aprovados com PostgreSQL descartável, zero falhas/ignorados; 29 testes novos de Review aprovados; validações adicionais reais confirmaram os fluxos principais. Permanecem dois ajustes para aceite: alinhar índices parciais da migration com as unicidades do Prisma (migrate diff retorna 2) e compatibilizar o gate de perfil com o contrato de criação exclusiva por Tutor. Detalhes em REVISAO-PR52-AVL1-2026-11-17.md, com evidências reproduzíveis.

Não iniciar outra implementação independente de AVL-1 nem duplicar a migration Review. AVL-2 deve reutilizar a entrega revisada, após corrigir/integrar e validar a combinação com PAG-2/BKG/SCH. A menção a PRD-2 no título do PR não corresponde a alterações novas de produtos: seu escopo principal já consta na base pela E-01.

### Quinta entrega local - integração da main e AVL-2 - 18/11/2026

Após a Laura confirmar o merge do PR #52, a branch foi atualizada por fast-forward para a main `d593b03`. Backup de todas as alterações locais mantido em stash `ca63bf0`. Reaplicação preservou SRV-Fpub/PAG-2/BKG/SCH; conflito do schema resolvido mantendo Review e AppointmentPayment. Nenhum commit de entrega foi criado e os arquivos permanecem fora do estágio.

Os dois achados da revisão foram corrigidos localmente: criação de review exclusiva de Tutor, com papel validado da sessão, e migration nova `20261118000000_align_review_unique_indexes`, sem editar a migration publicada. Testados banco novo com dez migrations e atualização de nove para dez com avaliação preexistente: dados/unicidade preservados e nenhuma diferença entre banco e schema.

AVL-2 usa cálculo on-read e GROUP BY em lote no ReviewRepository. Produtos, hotéis e sitters retornam `rating_avg` (uma casa decimal; null sem avaliações) e `rating_count` (zero sem avaliações) nas listagens/detalhes públicos. Produtos dentro do perfil público da loja recebem os mesmos agregados. Origens não concluídas ficam fora. Swagger atualizado; seis testes reais da nova entrega e suíte completa do backend aprovados: 450 testes, zero falhas/ignorados. Lint sem erros, com quatro avisos preexistentes. Detalhes em AVL-2-IMPLEMENTACAO-E-VALIDACAO.md.

Sem publicação ou acesso ao banco de produção. Próxima frente de avaliações: AVL-F1/AVL-F2, para criação/listagem e apresentação dos agregados na interface. Os demais itens de segurança, indicadores e QA continuam pendentes conforme o plano; a disponibilidade dos agregados não encerra toda a Sprint 5.

Regressão de navegador após a integração: 28 de 30 cenários passaram na primeira rodada. Os dois com timeout (captura do pagamento e navegação inicial da agenda do hotel) passaram no reteste isolado com limite local de 60 segundos, sem alterar a configuração versionada nem os testes. A ocorrência permanece registrada, sem causa conclusiva, no documento da AVL-2. Os cenários com API/PostgreSQL reais de tutor e parceiro passaram.

### Sexta entrega local - AVL-F1/AVL-F2 - 18/11/2026

Formulário de avaliação ligado aos históricos de pedidos e agendamentos concluídos, exclusivo de Tutor. Unidade preservada: produto/pedido ou parceiro/agendamento. Consulta própria ao abrir o diálogo, leitura após envio/reload, proteção contra cliques repetidos e recuperação de timeout/duplicidade sem repetir POST automaticamente. Novos contratos de resumo/distribuição e consulta própria da API, sem nova migration. Paginação por cabeçalhos preserva o corpo público existente e ordenação usa created_at/id.

Cards e detalhes usam médias/contagens reais. Produto, hotel e Pet Sitter compartilham avaliações paginadas e distribuição completa por nota. Ordenação por melhor nota usa dados reais. Removidos ratings, distribuições e depoimentos fictícios no escopo público, inclusive página inicial, Sobre, loja e satisfação de parceiros. Falha no detalhe de produto não é mais substituída por produto fictício. Outros indicadores institucionais/dashboard não foram tratados como reais por essa remoção.

Backend com PostgreSQL local: 454 testes aprovados, zero falhas/ignorados. Frontend: 139 testes aprovados em 23 arquivos. Typecheck/build aprovados; lint sem erros, com avisos mantidos. Os três fluxos novos passaram com API/PostgreSQL reais na primeira execução focada; a regressão completa posterior identificou timeout de fonte externa na captura do hotel, isolado no teste sem mudar as fontes da aplicação. O resultado final da regressão e as evidências estão em `Sprint-5-Fechamento/AVL-F-IMPLEMENTACAO-E-VALIDACAO.md`.

Sem commit, push, publicação ou acesso ao banco de produção. Os testes reais de navegador são opt-in e ainda exigem provisionamento de fixtures/API no CI. A próxima frente prevista é DSH-1/DSH-2, reutilizando as métricas administrativas já existentes e conferindo receita, período, isolamento e dados demonstrativos antes de alterar contratos. Os itens restantes de integridade, segurança, infraestrutura e QA global continuam no plano.

Regressão final desta entrega: 33 cenários Playwright aprovados juntos, zero falhas/ignorados, incluindo os sete cenários com API/PostgreSQL reais. Capturas de formulário/painel em celular e desktop inspecionadas e preservadas com os logs em `docs/evidencias-testes`. A auditoria da landing mantém uma violação séria de contraste, em oito elementos, sem violações críticas; esse resultado não encerra o QA de acessibilidade.

### Sétima entrega local - DSH-1/DSH-2 - 19/11/2026

Overview/Finance do parceiro conectados a métricas privadas por conta, com período/atualização, estados vazios/erro, totais, estados, serviços contratados e dez registros recentes. Removidos os valores, transações, data fixa, saques e controles sem persistência. Administrador mantém os indicadores institucionais e ganha o mesmo bloco comercial, calculado em repositório compartilhado. Sem nova migration.

Definições registradas: janela civil de São Paulo; pedidos/agendamentos por criação; vendas reconhecidas em PAGO/PREPARANDO/ENVIADO/CONCLUIDO, excluindo cancelados e tentativas não aprovadas. Sem data universal de pagamento de Order, a tela não usa updated_at nem apresenta fluxo de caixa/saldo para saque. Pagamentos/estornos simulados de Appointment usam suas próprias datas e ficam separados. Snapshot comercial RepeatableRead e cache por usuário/período.

Validação: 462 testes backend com PostgreSQL local, zero falhas/ignorados; 149 testes frontend em 24 arquivos; typecheck/build aprovados; lint sem erros (quatro avisos backend e 129 frontend). Navegador: 31 cenários aprovados, zero falhas; cinco cenários reais DSH e 26 verificações existentes. Sete cenários reais anteriores BKG/SCH/AVL foram ignorados nesta rodada por falta de suas fixtures e não contam como reexecutados. Capturas de cinco perfis em celular/desktop inspecionadas. Detalhes e critérios em `Sprint-5-Fechamento/DSH-IMPLEMENTACAO-E-VALIDACAO.md`.

Sem commit, push, publicação ou acesso ao banco publicado. Próxima frente: reproduzir e completar a integridade de pedidos E-08 e os itens restantes de segurança/infraestrutura, reutilizando o que já estiver entregue. O QA global, o provisionamento dos cenários reais no CI e o aceite de release permanecem pendentes; DSH não encerra a Sprint 5 inteira.

### Oitava entrega local - E-08 - 19/11/2026

Finalização relê o carrinho em transação Serializable e usa decremento condicional. Conflito de serialização retorna 409, sem repetição automática de criação. Nova migration CHECK para estoque não negativo, preservando negativos legados sem validação histórica automática quando existem. Onze migrations e upgrade de dez para onze com negativo fictício validados em PostgreSQL isolado.

Pagamento simulado, transições, cancelamento e preferência/webhook usam lock de Order e guardas de estado. Lojista não confirma PAGO em nenhum modo. Cancelamento elegível sem tentativa de gateway devolve estoque na mesma transação, uma única vez. Qualquer tentativa externa exige conciliação; não foi criado estorno automático ou liberação de estoque enquanto a preferência puder cobrar. Edição de quantidade do carrinho voltou a carregar o parceiro necessário à validação.

Validação: 478 testes backend aprovados, zero falhas/ignorados; dezesseis cenários novos reais de concorrência, autorização, rollback, CHECK e gateway controlado. Cinco cenários de navegador aprovados, sendo dois checkouts reais desktop/celular com pagamento simulado, estoque e cancelamento, e três regressões com respostas controladas. Lint sem erros, com quatro avisos existentes. Aplicação frontend sem alteração nesta etapa; não houve nova execução de sua suíte inteira ou build. Detalhes em `Sprint-5-Fechamento/E-08-IMPLEMENTACAO-E-VALIDACAO.md`.

Sem commit, push, publicação ou acesso a dados publicados. Histórico de cancelamento/estoque e cancelamento de gateway exigem conciliação própria. Próxima frente prevista: E-09/DEC-E (senha, e-mail e reset), seguida dos demais itens de segurança/infraestrutura e QA. Antes de alterar dados de e-mail ou índice, identificar colisões e tratar o saneamento conforme o plano; não inferir consentimentos ou corrigir dados legados automaticamente.

### Nona entrega local - E-09 / DEC-E - 19/11/2026

Política de senha única em cadastro, troca e reset: oito caracteres, maiúscula e número, bcrypt custo 12 nas novas gravações e limite de 72 bytes UTF-8. Login legado preservado, inclusive custo 10 e senha fora da política nova. E-mail normalizado nas entradas, preservando pontos/aliases e senha exata; consulta reconhece bordas/caixa antigas sem reescrever os registros.

Migration por expressão única, com verificação de colisões e bloco atômico; auditoria somente leitura sem endereços no relatório. Não houve saneamento automático ou consulta à produção. Upgrade local de onze para doze migrations preservou legado; outra base com colisões parou com diagnóstico explícito e rollback da função/índice. Preflight e conciliação autorizada precisam anteceder qualquer deploy dessa migration, porque o boot aplica migrations.

Emissão, consumo e troca autenticada compartilham lock de usuário. Atualização condicional de token/hash e invalidação de links na mesma transação impedem sobrescrita por credenciais antigas; falha de gravação permite rollback e nova tentativa. Falha de entrega invalida somente o próprio link, com log sem URL/token. Controllers usam tratamento central de erros.

Verificação: 491 testes backend aprovados com PostgreSQL local, zero falhas/ignorados; 156 testes frontend em 27 arquivos; typecheck/build aprovados; lint sem erros, mantendo quatro avisos backend e 129 frontend. Dois fluxos Chromium reais, desktop/celular, aprovados com API/banco locais e transporte de e-mail capturado em arquivo temporário. Quatro capturas inspecionadas. Detalhes, critérios e preflight em `Sprint-5-Fechamento/E-09-IMPLEMENTACAO-E-VALIDACAO.md`.

Sem commit, push ou publicação. A revogação de JWTs existentes não foi implementada nesta entrega. Próxima frente: E-10/DEC-F, documento e aceite real de termos, respeitando o legado. Demais itens de segurança/infraestrutura, QA global e aceite de release continuam pendentes.

### Décima entrega local - E-10 / DEC-F - 20/11/2026

Cadastro exige aceite booleano true e a versão vigente dos textos. Data definida no servidor, versão gravada com usuário e parceiro em operação atômica. Campos opcionais preservam o legado sem inventar aceite histórico; default muda para false e constraint protege a consistência. API pública informa a política; o frontend compara a versão com os textos incluídos no build e bloqueia indisponibilidade/divergência. Links legais preservam o formulário em outra aba.

CPF e CNPJ passam por validação de formato e dígitos verificadores. CNPJ numérico/alfanumérico é aceito; Lojista/Hotel exigem CNPJ e Pet Sitter aceita CPF ou CNPJ. Cadastro grava documento normalizado; índice único por expressão protege concorrência e reconhece pontuação/caixa legadas. Migration não limpa registros; preflight somente leitura identifica inválidos e colisões, sem imprimir documentos. Upgrade de doze para quatorze migrations e cenário de colisão foram verificados em bases locais descartáveis.

Backend completo: 504 testes aprovados, zero falhas/ignorados. Frontend completo: 162 testes em 29 arquivos. Typecheck/build aprovados, lint sem erros; três avisos backend e 129 frontend mantidos. Detalhes, critérios, resultados finais de navegador e procedimento de preflight em `Sprint-5-Fechamento/E-10-IMPLEMENTACAO-E-VALIDACAO.md`.

Sem commit, push, publicação ou acesso à produção. Auditorias/conciliações de e-mails e documentos precisam anteceder o deploy; dados históricos não foram regularizados automaticamente. Próxima frente prevista: E-12, conferindo exclusão de pets/endereços, estados oficiais, propriedade e vínculos bloqueantes. Demais itens de segurança/infraestrutura, QA global e aceite de release continuam pendentes.

Validação final de navegador da E-10: cinco cenários aprovados, incluindo cadastro de Pet Sitter com CPF, além dos dois cenários reais da E-09 aprovados na rodada inicial. Inspeção visual levou ao ajuste de largura do documento no celular; os dois cadastros desktop/celular foram revalidados. Capturas e logs preservados em `docs/evidencias-testes`, sem outbox, fixture ou tokens. Recuperação em QA utiliza transporte local de e-mail, sem provar nova entrega pelo Resend publicado.

### Décima primeira entrega local - E-12 - 20/11/2026

Remoção de pets e endereços passa a usar normalização e estados terminais oficiais, incluindo compatibilidade legada e recusa conservadora de estados desconhecidos. Pet com atendimento ativo, mesmo atrasado, não pode ser removido. Sem histórico, exclusão física; com atendimentos somente encerrados, arquivamento com retirada da lista/limite, preservando consultas, pagamentos e avaliações. Nova migration opcional não arquiva dados existentes. Criação de reserva relê pet e propriedade depois do lock compartilhado com a remoção.

Último endereço continua bloqueado com pedidos não encerrados; com outros endereços, exclusão permitida e promoção do principal na mesma transação. Mutações de endereço usam lock por conta e Serializable. Checkout relê o endereço dentro de sua transação; conflito retorna 409 sem repetição automática. O snapshot dos pedidos não é alterado. Interface aguarda confirmação da API antes de retirar o cartão, impede reenvio durante pendência e mantém controles de endereço disponíveis no celular.

Verificação: 522 testes backend, zero falhas/ignorados; 166 testes frontend em 30 arquivos; typecheck/build aprovados; lint sem erros, com três avisos backend e 129 frontend. Dois cenários Chromium reais, desktop/celular, aprovados com API e PostgreSQL locais; seis capturas inspecionadas. Quinze migrations, diff de schema sem diferenças e upgrade de quatorze para quinze validados. Detalhes e critérios em `Sprint-5-Fechamento/E-12-IMPLEMENTACAO-E-VALIDACAO.md`.

Sem commit, push, publicação ou acesso à base publicada. Não há limpeza retroativa, conversão automática de status, reativação de pet arquivado ou encerramento automático de atendimento vencido. Próxima frente: conferir os itens restantes E-07/E-14/SEC-2 (erros, validações e permissões), E-15 (métricas/minimização) e E-16/INF-2 antes do QA global e aceite de release, reutilizando as correções já presentes. Preflights de e-mail/documento continuam exigidos antes de publicar as migrations.

### Décima segunda entrega local - E-07/E-14/E-15 e SEC-2 - 20/11/2026

Conferidas e corrigidas as pendências restantes de erros nos controllers Auth/Product/Provider/User e nos middlewares de autenticação/perfil. UUID/body de revisão de candidatura são validados antes do banco; alterações comerciais validam nome, CEP e UF. JWT fica restrito ao algoritmo usado na emissão, mantendo a consulta de conta/papel atual. Submissão de candidatura exige Pet Sitter e revisão recusa cadastro de outro perfil. Perfil/avatar e avaliação/onboarding passam a gravar atomicamente, com rollback testado. Essa correção não encerra o restante do fluxo E-11.

Métricas de leitura exigem administrador ativo. Respostas públicas usam listas explícitas de campos e deixam de expor contato residencial do Pet Sitter; contatos necessários ao atendimento continuam restritos aos envolvidos autorizados. Log HTTP e Sentry minimizam dados, retirando URL/corpo e mensagens brutas de erro. Checkout conserva conflito real de estoque e oferece retorno ao carrinho. Erros internos recebem mensagem segura e ID; códigos operacionais de indisponibilidade de pagamento são preservados sem texto arbitrário.

Política por IP/processo: API 300/5min, auth 20/15min, webhook 600/min, health 60/min e métricas 60/min. Grupos de operação têm contadores próprios, com testes de saturação, preflight, proxy de um salto e IPv6 /56. `TRUST_PROXY_HOPS` é configurável; a topologia publicada ainda exige conferência. Contadores não são compartilhados entre instâncias e não foi realizado teste de carga.

Validação: 541 testes backend aprovados com PostgreSQL local, zero falhas/ignorados; 169 testes frontend em 31 arquivos; typecheck/build aprovados; lint sem erros, dois avisos backend e 129 frontend. Dois cenários Chromium aprovados com API/banco reais, desktop/celular, verificando perfil público, autorização de métricas e conflito de estoque sem pedido/baixa adicional. Quatro capturas inspecionadas. Quinze migrations anteriores aplicadas, nenhuma nova neste bloco. Evidências com prefixo `2026-11-20-sec2` e critérios em `Sprint-5-Fechamento/SEC-2-IMPLEMENTACAO-E-VALIDACAO.md`.

Sem commit, push, deploy ou acesso à produção. Próxima frente prevista: E-16/INF-2, conferindo dependências, Node, instalação por lockfile e política do CI. Demais pendências funcionais registradas, candidaturas, QA global e aceite de release permanecem abertos. Auditorias de e-mail/documento continuam exigidas antes de publicar as migrations; não houve saneamento retroativo ou validação real de serviços externos nesta entrega.

### Décima terceira entrega local - E-16 / INF-2 - 20/11/2026

Runtime centralizado em `.nvmrc`: Node 24.22.3/npm 11.19.1 validados, com engines Node 24/npm 11 nos projetos. Os três jobs do CI usam a mesma referência; actions de checkout/setup atualizadas e permissões de leitura. Removidos o lockfile legado do Yarn e o override antigo do pnpm; preservado npm como gerenciador único. Instalações reais por `npm ci` aprovadas com os lockfiles atualizados.

Auditoria passou de dez achados no backend (um crítico/cinco altos/quatro moderados) para zero. Frontend passou de 24 (oito altos/16 moderados) para quatro moderados na cadeia de build do plugin Sentry. Não foi aplicado upgrade principal forçado; a migração do plugin permanece registrada. Ambos os comandos `npm audit --audit-level=high` retornaram zero e passaram a falhar o job em high/critical, sem `continue-on-error`. Fixture isolada confirmou exit 1 com pacote vulnerável; divergência manifesto/lock também foi recusada pelo npm ci sem alterar o lock. Não houve PR remoto nem configuração de proteção da branch.

Imagem Docker multi-stage com Node fixado por digest, OpenSSL, dependências de execução e Prisma gerado, sem `.env`, testes ou scripts de QA, rodando como usuário não root. `railway.json` define build, boot, health e reinícios para contexto `/backend`; configuração absoluta `/backend/railway.json` precisa ser conferida no provedor. O boot já aplicava migrations e foi mantido. Imagem aplicou 15 migrations em PostgreSQL 16 vazio, respondeu health 200, reiniciou sem pendências e não iniciou a API com banco indisponível. Não houve migration nova nem seed.

Regressão: 541 testes backend e 169 frontend/31 arquivos aprovados; typecheck/build e lint sem erros, mantendo avisos registrados. Vitest validado em forks/dois workers, após interromper tentativa sem progresso com threads. Vinte e seis cenários Chromium aprovados, incluindo rotas lazy, checkout e interfaces com API controlada; não substituem a regressão real integrada. Contraste sério da landing em oito elementos permanece aberto. Logs/relatórios com prefixo `2026-11-20-inf2`, critérios em `Sprint-5-Fechamento/INF-2-IMPLEMENTACAO-E-VALIDACAO.md` e procedimento em `docs/runbooks/deploy-reprodutivel.md`.

Sem commit, push, deploy, atualização global do Node do computador ou acesso ao banco publicado. Próxima frente: conferir e fechar as pendências funcionais ainda reproduzíveis (candidaturas E-11, configurações/indisponibilidade honesta CFG-1, retomada/estados E-13/E-18/E-19), seguida do QA global e aceite de release. Preflights de e-mail/documento, contexto/runtime/proxy nos provedores, regras de merge e upgrade principal do plugin Sentry continuam explícitos; esta entrega não encerra toda a Sprint 5.

### Décima quarta entrega local - E-11 / DEC-D - 22/11/2026

Moderação de parceiros com máquina de transições (422 em transição inválida), Pet Sitter aprovado só pela avaliação, candidatura única com reenvio após recusa, revisão só de candidatura PENDING com lock, estados coerentes entre User, Provider e SitterEvaluation, e painel com reenvio distinto e motivo obrigatório. Backend 553/553, frontend 191/191, 9/9 cenários reais. Sem migration, commit ou publicação. Detalhes em [E-11](Sprint-5-Fechamento/E-11-IMPLEMENTACAO-E-VALIDACAO.md).

### Décima quinta entrega local - E-20 / AUD-21 - 22/11/2026

Nenhuma confirmação de sucesso sem 2xx. O Contato abre o aplicativo de e-mail (`mailto:`) com assunto e corpo preenchidos, e a confirmação pede para concluir o envio por lá. "Limpar carrinho" só mostra sucesso com resposta 2xx. CFG-1 (tela sem ações simuladas) e "Agendar" (BKG real) foram conferidos. Frontend 193/193 e 7/7 cenários reais. Sem backend, migration, commit ou publicação. Detalhes em [E-20](Sprint-5-Fechamento/E-20-IMPLEMENTACAO-E-VALIDACAO.md).


### Entrega local — E-19 — 22/11/2026

Paginação de Orders/TutorOrders ligada à API, com total real, cache por conta/página/busca e componente reutilizável. Busca global da loja por ID parcial/cliente, literal e parametrizada. Indicadores agregados no backend, independentes da página/busca; receita segue a regra DSH e mês civil de São Paulo. Novo envelope opt-in view=page preserva array/cabeçalhos legados. Ordenação por data/ID, query inválida 422, tratamento de resposta sem metadados e erro/retry. Removido rodapé de navegação inativo.

Validação: 554 testes backend com PostgreSQL local; 198 frontend/41 arquivos; typecheck/build/lint sem erros (um aviso backend e 124 frontend). Dois cenários Chromium reais, desktop/celular, aprovados; quatro capturas mascaradas inspecionadas. Banco novo exclusivo de QA, sem migration nova, sem usar os bancos locais de desenvolvimento/CI ou a produção. Registro: Sprint-5-Fechamento/E-19-IMPLEMENTACAO-E-VALIDACAO.md.

Sem commit/push/deploy. Próxima pendência sugerida: E-18 (sucesso com pedido real, merge do carrinho, atualização do cache), reproduzindo o que ainda faltar antes de alterar. Demais pendências e QA de release continuam abertos.


### Entrega local — E-18 — 22/11/2026

Confirmação ligada aos pedidos reais por URL/consulta autenticada, com estados pendente/cancelado/erro e sem prazo ou pagamento fictício. Histórico invalidado após criação/pagamento; carrinho consultado sem DELETE extra. Criação incerta bloqueia outro envio na mesma tela e orienta revisão no histórico. Merge opt-in com baseline/quantidade-alvo, transação Serializable e conflitos sem sobrescrita; intenção local por conta persiste em erro/reload. Compra e alterações bloqueadas até resolver sincronização; escolha explícita permite usar apenas o carrinho da conta, sem apagar o servidor. Cache separado por conta e respostas tardias da sessão anterior ignoradas. Sem migration nova.

Regressão final: 559 testes backend com PostgreSQL local; 213 frontend/43 arquivos; typecheck/build/lint sem erros (um aviso backend e 122 frontend). Vinte e oito cenários Chromium aprovados, incluindo dois reais em desktop/celular com perda deliberada da primeira resposta de merge após commit. Seis capturas inspecionadas. Dois testes antigos da agenda foram alinhados ao guard existente sem afrouxar a verificação de acesso. Contraste sério em dois elementos da landing permanece pendente. Critérios e limites em Sprint-5-Fechamento/E-18-IMPLEMENTACAO-E-VALIDACAO.md.

Sem commit, push, deploy ou banco publicado. Próxima pendência sugerida: E-13 (retorno e correção de parceiro recusado), seguida de E-33 e demais itens, reproduzindo antes de alterar. Não declarar toda a sprint concluída.

### Entrega local — E-13 — 22/11/2026

Reproduzido o destino intermediário `/dashboard` no login do lojista/hotel recusado, apesar de o guard já redirecionar à correção. O login agora escolhe a correção diretamente. Formulário valida UFs existentes e todos os limites de texto previstos na API, normaliza nome/UF/CEP, mostra erros por campo e falhas persistentes na página. Distingue falha ao salvar de correção salva sem reenvio e atualiza a sessão depois do reenvio confirmado. Rota de correção restrita a parceiros; caminho de candidatura do sitter preservado.

Backend 559/559 com PostgreSQL local; frontend 229 testes/44 arquivos; typecheck/build/lint sem erros, com 121 avisos frontend e um backend. Quatro cenários reais de navegador com API/PostgreSQL em desktop/celular e 25 cenários de regressão aprovados. As falhas de transporte foram controladas; persistência e mudança para EM_REVISAO foram verificadas na API real local. Resultados finais, reprodução e limites em [E-13](Sprint-5-Fechamento/E-13-IMPLEMENTACAO-E-VALIDACAO.md).

Sem migration nova, commit, push, deploy ou acesso a produção. Próxima frente: E-33, seguida das demais pendências e QA global. A E-13 não encerra as candidaturas de sitter ou toda a revisão de permissões.

### Entrega local — E-33 — 22/11/2026

Permissões do painel compartilhadas entre rotas, menu e retomada. Perfil/pets do tutor e onboarding restritos aos respectivos papéis; todos os filhos do painel com declaração explícita de perfis. Login de todos os papéis retoma destino interno compatível, com query/hash; destino de outro papel ou ambíguo é descartado. Expiração 401 guarda a localização protegida completa. Recusa/análise/onboarding têm prioridade, preservando E-13. Guard do sitter não monta conteúdo que precisa redirecionar; cadastro COMPLETED sem parceiro aprovado mostra indisponibilidade com retry, sem ciclo entre painel/onboarding. Conta desativada mostra o motivo correto.

Backend 559/559 com PostgreSQL local; frontend 284/46 arquivos; 39 cenários Chromium aprovados, sendo 13 com API/banco reais nos cinco perfis, desktop/celular e JWT expirado. Capturas finais aguardam o carregamento e mascaram e-mails. Typecheck/build/lint sem erros, um aviso backend e 118 frontend. A11y continua com uma violação séria de contraste em dois elementos da landing. Helper de parceiros operacionais de teste alinhado ao estado COMPLETED, sem alterar aprovação de produção. Detalhes em [E-33](Sprint-5-Fechamento/E-33-IMPLEMENTACAO-E-VALIDACAO.md).

Sem commit, push, publicação ou migration nova. Próxima frente sugerida: reproduzir E-17 e seguir as demais pendências; nove frentes técnicas restantes, além das decisões e QA/release.

### Entrega local — E-17 — 22/11/2026

Conferida a integração já existente de preços, serviços, avaliações e indicadores; removidos resíduos de afirmações sem fonte no Sobre/landing/FAQ/onboarding. Landing distingue erro de vazio e tem retry; produto/loja sem foto usam placeholder, hotel mostra a unidade real do serviço mais barato e não presume restrições de animais. Produto sem estoque não anuncia disponibilidade nem permite compra pelos botões desktop/móvel. Contatos fictícios e telas explicitamente demonstrativas preservados conforme decisões anteriores.

Frontend 289 testes/47 arquivos aprovados, mais repetição dos cinco direcionados após o último ajuste; 28 cenários Chromium com respostas controladas, incluindo dois E-17 desktop/celular. Typecheck/build/lint sem erros (116 avisos frontend). Contraste sério em um elemento da landing permanece na E-34. Sem backend/migration/banco ou validação externa nesta etapa; última regressão backend anterior: 561. Registro: [E-17](Sprint-5-Fechamento/E-17-IMPLEMENTACAO-E-VALIDACAO.md). Sem commit/push/deploy. Próxima frente sugerida: E-23; oito frentes técnicas restantes, além das decisões e QA/release.

### Entrega local — Revisão da E-17 e E-23 — 22/11/2026

A revisão do diff local da E-17 encontrou e corrigiu cinco resíduos, só no frontend: preço e unidade colados na barra do hotel; botões de produto indisponível com aparência de ativos; destaque da landing e Shopping oferecendo produto esgotado; foto genérica no Shopping; e falha do Shopping apresentada como "nenhum produto". A E-23 (AUD-31) levou Pedidos ao padrão do Financeiro (StatCard, Card, Table, lista no celular, nomes acessíveis, "Vendas reconhecidas no mês"), aplicou os tokens da marca ao gráfico e à tabela do Financeiro e deixou "Descartar" do Perfil visível no celular, ativo só com alteração. Axe sem violações sérias nas três telas. Frontend 296/48 arquivos; E2E reais E-19 2/2 e E-33 13/13 em bases exclusivas, removidas ao final. Sem backend, migration, commit ou publicação. Detalhes em [E-17](Sprint-5-Fechamento/E-17-IMPLEMENTACAO-E-VALIDACAO.md) e [E-23](Sprint-5-Fechamento/E-23-IMPLEMENTACAO-E-VALIDACAO.md).

### Entrega local — E-31 — 22/11/2026

Estados de erro honestos (AUD-22). Um helper (`isMissingResourceError`) e um componente (`ResourceLoadError`) passam a ser usados nos detalhes de hotel, pet sitter, loja e produto: 404/ID inválido mostra "não encontrado" sem nova tentativa; falha mostra a mensagem real com "Tentar novamente". A loja deixou de afirmar "não encontrada" em queda de rede e passou a descartar resposta tardia; o produto passou para `httpClient` e não repete 404; a Conta não mostra status antigo da sessão na falha. Itens já resolvidos antes foram conferidos e mantidos. Frontend 306/49 arquivos; 19/19 cenários com API/PostgreSQL reais em base exclusiva removida ao final; 28 de regressão. Sem backend, migration, commit ou publicação. Detalhes em [E-31](Sprint-5-Fechamento/E-31-IMPLEMENTACAO-E-VALIDACAO.md).

### Entrega local — E-34 — 22/11/2026

Acessibilidade (AUD-40). `lang="pt-BR"`; `Dialog` em português, com opção sem botão de fechar e devolução de foco ao elemento de origem; 6 modais e 2 drawers migrados; nomes acessíveis em botões de ícone; rótulos no formulário de pet; contraste dos textos secundários, selos e botões; textos sem `animate-pulse`; gráfico decorativo oculto; regiões roláveis focáveis. Portão `e2e/a11y.spec.ts` reescrito: reprova sérias e críticas em 12 rotas públicas, checkout e painel de 3 perfis, em 1280/390, e testa foco e Esc dos modais. Varredura real: 76 combinações, de 33 com violações para 0; 6/6 modais acessíveis. De passagem: fotos reais na avaliação de sitter (RF-010), remoção do carrinho sem sucesso falso e redes do Contato sem "Abrindo…". Frontend 308/50 arquivos; 38 testes Chromium. Sem backend, migration, commit ou publicação. Detalhes em [E-34](Sprint-5-Fechamento/E-34-IMPLEMENTACAO-E-VALIDACAO.md).

### Entrega local — E-35 — 22/11/2026

CSP efetiva (AUD-41). A política Report-Only teria quebrado a API fora de produção (origem fixa no `vite.config.ts`) e a prévia `blob:` do onboarding, e o Zod gerava violação de `eval`. Agora `vercel.json` é a fonte única, com o cabeçalho efetivo; o preview lê o arquivo e troca só a origem da API; `csp.test.ts` garante a política; Zod em `jitless`. Portão `e2e/csp.spec.ts`: cabeçalho efetivo, rotas sem violação e script injetado bloqueado. Varredura real com a política efetiva: 35 rotas, 0 violações; contraprovas (injeção bloqueada; política antiga quebraria o `blob:`). De passagem, acessibilidade do onboarding, do endereço e do botão de cadastro. Guarda do token avaliada sem mudança: recomendação e decisão pendente registradas. Frontend 310/51 arquivos; 42 testes Chromium com a CSP ativa. Sem backend, migration, commit ou publicação. Detalhes em [E-35](Sprint-5-Fechamento/E-35-IMPLEMENTACAO-E-VALIDACAO.md).
