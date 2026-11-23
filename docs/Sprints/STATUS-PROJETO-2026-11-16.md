# Pet+ - Estado do projeto e pendências em 16/11/2026

## Base e limites da avaliação

- Referências remotas atualizadas por `git fetch origin` em 16/11/2026.
- Main consultada: `5d11b7e405ceacbc36b28ee47a9b4ead53683876`, merge do PR #50 em 11/11/2026.
- Branch local preservada: `chore/remove-env-local`, HEAD `de08b4b`, de 28/10/2026.
- Comparação: HEAD local é ancestral da main; está 5 commits atrás, sem commits exclusivos nessa comparação.
- Não houve checkout, pull, merge, alteração da aplicação ou acesso ao banco de produção.
- Documentos e código da main foram confrontados por leitura. Não foi executada uma nova suíte local nem uma nova auditoria de dependências.
- O estado dos checks do último commit foi consultado na API pública do GitHub. Isso não representa teste manual novo das jornadas publicadas nem comprovação de configuração externa do Resend/Mercado Pago.
- Esta avaliação não repete integralmente os 40 achados da auditoria de outubro. Achados históricos não reconferidos não são tratados como falhas atuais comprovadas.

## 1. Parecer

O Pet+ possui uma base funcional de comércio, autenticação, moderação e gestão de serviços, com testes automatizados e publicação contínua. A estabilização E-01 a E-06 foi incorporada ao código. O último avanço foi a apresentação de serviços reais nos detalhes públicos dos parceiros.

O projeto, entretanto, ainda não pode ser descrito como concluído no escopo completo planejado: o fluxo de agendamento pela interface não foi entregue, as agendas são demonstrativas, não há sistema de avaliações de clientes no backend e os painéis ainda não apresentam os indicadores comerciais previstos.

Há trabalho pendente das Sprints 4 e 5, além de refinamentos herdados. O calendário original dos documentos não é evidência de conclusão. A prioridade deve ser atualizar o quadro pelo estado das entregas, sem simplesmente avançar o número da sprint.

## 2. Últimas alterações na main

| Data | Commit/PR | Alteração |
| --- | --- | --- |
| 11/11 | `a516bd0`, merge `5d11b7e`, PR #50 | SRV-Fpub: detalhes de hotel e sitter mostram serviços ativos reais e preços; backend passa a exigir serviço ativo na vitrine e retorna `starting_price`. Retira rating e badge fabricados do detalhe de produtos retornado pelo parceiro. |
| 28-29/10 | `5236a3a`, merge `c5dde7a`, PR #49 | Inclusão do pitch em PDF. Não é implementação funcional. |
| 28/10 | `de08b4b`, merge `ceaf535`, PR #48 | Remove `.env.local` do versionamento e reforça regras de ignore. Isso não comprova rotação de segredos eventualmente expostos no histórico. |
| 26/10 | `45c0e77`, PR #47 | E-06: total do checkout coerente com o cobrado; remove frete, cupom e desconto PIX fictícios e simplifica pagamento simulado. |
| 25/10 | `05b76d9`, PR #46 | E-05: snapshot do endereço de entrega persistido no pedido e apresentado no detalhe de tutor/lojista. |
| 25/10 | `74e8367`, PR #45 | E-03: limites de corpo por rota, tratamento de 413/400 e validação de imagens. |
| 24/10 | `8d5a733`, PR #44 | E-04: política congelada na reserva, preço pelo serviço, conflitos de horário e transições de agendamento conforme DEC-A/DEC-B. |
| 24/10 | `03db53f`, PR #43 | E-01: aprovação operacional do parceiro no backend, sessão restrita de rejeitado e desativação de conta. |
| 23/10 | `9944a32`, PR #40 | E-02: listagem administrativa de parceiros protegida. |
| 23/10 | PRs #41 e #42 | Evidências de testes da Fase 2 acadêmica, auditoria, decisões e plano de estabilização. |

Não confundir a Fase 2 acadêmica das evidências com a Fase 2 de estabilização E-07 a E-16: o registro de testes acadêmicos não prova execução dessas correções.

Histórico remoto: [main no GitHub](https://github.com/lauraserbeto/Pet/commits/main/).

## 3. CI e publicação do último commit

Consulta do commit `5d11b7e` na API pública do GitHub:

| Verificação | Resultado registrado |
| --- | --- |
| Backend - testes unitários e integração | Sucesso |
| Frontend - typecheck, testes e build | Sucesso |
| E2E - smoke Playwright | Sucesso |
| Vercel | Sucesso |
| Railway, contexto `pet-plus - Pet` | Sucesso |

Execução dos checks em 11/11/2026: [GitHub Actions](https://github.com/lauraserbeto/Pet/actions/runs/42961864304).

O workflow mantém `npm audit --audit-level=high` com `continue-on-error: true` nos dois jobs. Portanto, checks verdes não comprovam ausência de vulnerabilidades high. Não foi consultada a situação atual das dependências via nova execução de `npm audit`.

O conjunto de arquivos E2E na main é `a11y.spec.ts`, `legal.spec.ts`, `payment.spec.ts` e `smoke.spec.ts`. A presença desses testes não comprova os aceites completos de compra, agendamento, recusa/reenvio e avaliação exigidos no fechamento. Em especial, as jornadas que não existem na aplicação não podem ser consideradas integralmente testadas.

## 4. Estado das sprints anteriores

### Sprints 0 a 2

As implementações de fundação, pedidos, autenticação, segurança básica, checkout, pagamento simulado, e-mail de recuperação, recusa/reenvio e pedidos do tutor/lojista estão presentes no histórico e no código. Isso não equivale a revalidar integralmente cada critério de aceite nesta avaliação.

Pendências herdadas reconfirmadas ou que continuam exigindo fechamento específico:

- **CFG-1 / configurações:** a tela Settings contém handlers que apenas mostram toast de sucesso, sem persistência correspondente. Há inclusive confirmação visual de logout global sem operação correspondente. Não considerar configuração salva só pelo toast.
- **CHK-2/CHK-3/PED-F:** a estabilização corrigiu endereço e totais; ainda é necessário fechar os refinamentos de estados de erro, merge, cache e paginação previstos no backlog da auditoria. Não foi refeita aqui a auditoria completa dessas três tasks.
- **Política de senha / E-09 / DEC-E:** cadastro da API continua com mínimo de 6; cadastro e troca autenticada continuam usando custo bcrypt 10. A decisão de política única e custo 12 não está integralmente aplicada.
- **Termos / E-10 / DEC-F:** schema ainda tem `terms_accepted` com default true; entrada é opcional e cadastro grava true. Não há data e versão de aceite no modelo revisado.
- **Exclusão de endereços / E-12:** `AddressController` ainda usa `PENDING`, `PREPARING`, `SHIPPED` como estados impeditivos, incompatíveis com os estados portugueses atuais dos pedidos.
- **Estoque/cancelamento / E-08:** `UpdateOrderStatusUseCase` faz atualização direta de status, sem recomposição do estoque ou guarda condicional de concorrência nessa operação. A confirmação manual de `PAGO` pelo parceiro é bloqueada quando o Mercado Pago está ativo, não genericamente em todos os modos.

Esses pontos não anulam as entregas anteriores, mas impedem descrevê-las como uma base sem ressalvas.

### Sprint 3

| Task | Situação observada |
| --- | --- |
| SRV-1 | CRUD backend presente; é a base da gestão de serviços já entregue. |
| AGD-2 | Backend presente, posteriormente corrigido por E-04. Não confundir com fluxo de contratação na interface. |
| SRV-F1 / SRV-F2 | Gestão de serviços e política de cobrança na interface incorporadas antes desta revisão. |
| CHK-3 | Implementação presente; refinamentos herdados de erros devem ser reavaliados no fechamento. |
| PRD-2 | O objetivo central de restringir operação/publicação de produtos por parceiro aprovado foi absorvido por E-01. Não continuar classificando a task como totalmente ausente com base na auditoria de 22/10. Aceite completo requer mapear os critérios aos testes atuais. |
| PGT-1 | Implementação opcional de sandbox de pedidos presente. Aceite externo de credenciais, compra aprovada/recusada e webhook não foi verificado nesta consulta. Não cobre agendamentos. |
| SRV-Fpub | **Parcial:** última entrega implementou detalhes e backend, mas não concluiu o escopo das listagens incluído na especificação de 23/10. |

### Por que a SRV-Fpub ainda é parcial

A especificação atual exige detalhes e listagens com serviços reais, preço mínimo dos serviços ativos e retirada de campos fabricados.

O commit de 11/11 alterou `HotelDetailsPage`, `WalkerDetailsPage`, `ProviderController` e `GetProviderDetailsUseCase`. Não alterou `HotelsPage` ou `WalkersPage`.

Na main, as listagens ainda contêm:

- `HotelsPage.tsx:75-77`: nota 5.0, quantidade de reviews por `Math.random()` e preço por `daily_rate` ou fallback 150.
- `WalkersPage.tsx:45-47`: nota 5.0, reviews aleatórias e preço por `hourly_rate` ou fallback 50.
- Distâncias, experiência e outros atributos fixos também permanecem nas listagens.

O backend passou a retornar `starting_price`, mas essas telas ainda não o consomem. Assim, o preço do card pode divergir do preço mostrado no detalhe e do serviço efetivamente reservado. O fechamento deve ligar os cards ao menor preço real e remover dados sem fonte.

Fontes na versão auditada: [HotelsPage](https://github.com/lauraserbeto/Pet/blob/5d11b7e405ceacbc36b28ee47a9b4ead53683876/frontend/src/pages/HotelsPage.tsx#L75), [WalkersPage](https://github.com/lauraserbeto/Pet/blob/5d11b7e405ceacbc36b28ee47a9b4ead53683876/frontend/src/pages/WalkersPage.tsx#L45).

## 5. Sprint 4 - ainda não entregue

| Task | Situação | Evidência ou pendência principal |
| --- | --- | --- |
| PAG-2 | Pendente | Sem rota de pagamento de Appointment, sem modelo próprio de pagamento/estorno de agendamento. `UpdateAppointmentStatusUseCase` reserva explicitamente o estorno à PAG-2. |
| AVL-1 | Pendente | Não há modelo Review, rotas ou use cases de avaliações de clientes. SitterEvaluation é candidatura administrativa e não substitui Review. |
| BKG-1 | Não entregue | Hotel mantém `onClick={() => {}}` em Reservar agora; sitter apenas abre a aba de serviços. Não há envio da reserva com pet e período pela interface. |
| SCH-1 | Pendente | Schedule ainda usa `appointmentsData` fixo e não consulta a agenda real. |
| STO-1 | Opcional, não implementada | Sem integração Cloudinary identificada. Pode ser adiada sem bloquear o escopo essencial. |
| AVL-2 | Pendente | Sem Review, não há agregação real de notas/quantidades. Depende de AVL-1. |
| BKG-2 | Pendente | TutorAppointments ainda renderiza `mockHotels` e `mockSitters`; falta acompanhamento/cancelamento real e ramo pré-pago. |
| SCH-2 | Pendente | Gestão completa do ciclo e calendário real dependem de SCH-1. |

Conclusão: os sete itens obrigatórios da Sprint 4 ainda precisam de entrega/integração; STO-1 é opcional. As estruturas de backend já existentes são pré-requisitos, não conclusão dessas tasks.

### Regra vigente para implementar a Sprint 4

Usar as decisões de estabilização de 23/10, e não os parágrafos antigos dos READMEs:

```text
Todo Appointment nasce PENDENTE e guarda a política da reserva.
PRESENCIAL: PENDENTE -> parceiro confirma ou recusa.
PRE_PAGO: PENDENTE -> tutor paga -> AGUARDANDO_CONFIRMACAO
         -> parceiro confirma ou recusa.
Recusa/cancelamento de pré-pago já pago exige estorno persistido.
```

Preço = preço do serviço reservado x unidades. E-04 já entrega política congelada, preço, validações e controle de conflito por pet/sitter. PAG-2 deve acrescentar o pagamento/estorno próprio de Appointment, sem reutilizar indevidamente PaymentAttempt, que pertence a Order.

Fontes: [CreateAppointmentUseCase](https://github.com/lauraserbeto/Pet/blob/5d11b7e405ceacbc36b28ee47a9b4ead53683876/backend/src/useCases/appointments/CreateAppointmentUseCase.js), [UpdateAppointmentStatusUseCase](https://github.com/lauraserbeto/Pet/blob/5d11b7e405ceacbc36b28ee47a9b4ead53683876/backend/src/useCases/appointments/UpdateAppointmentStatusUseCase.js).

## 6. Sprint 5 - pendente de fechamento

| Task | Situação | O que falta |
| --- | --- | --- |
| INF-2 | Parcial | Migrations no start já existem. Não foi identificado manifesto Docker/Railway/Nixpacks; falta `engines.node` no backend e auditoria high bloqueante. Validar o estado real de vulnerabilidades e do deploy. |
| DSH-1 | Pendente | Overview mantém gráficos e atendimentos fixos; Finance usa `mockKPIs`, `mockChartData` e `mockTransactions`. |
| AVL-F1 | Pendente | Sem backend de reviews e sem fluxo real de escrever avaliações pós-conclusão. |
| QA-2 | Parcial, base existente | Existem testes e CI; falta evidenciar o conjunto de jornadas de release, principalmente agendamento e avaliações ainda ausentes. |
| SEC-2 | Parcial | Há autenticação reforçada, limites de corpo, Helmet e 404 centralizado. `/api/metrics` continua pública, rate limit está limitado ao grupo de auth e persistem handlers legados com 500 direto. |
| DSH-2 | Parcial, escopo comercial pendente | Admin possui métricas reais de usuários/parceiros/catálogo, mas não receita/pedidos/agendamentos no contrato consultado. |
| AVL-F2 | Pendente | Avaliações reais, paginação/estado vazio e remoção integral dos ratings fabricados não entregues. |
| QA-3 | Parcial, sem aceite final | Há smoke/a11y pontual, mas não evidência de revisão global e aprovação do checklist de release, que permanece desmarcado. |

A ausência de marcação no checklist não prova, sozinha, ausência de implementação. Nesta revisão, entretanto, vários itens desmarcados têm correspondência direta com código ainda mockado ou contratos ausentes.

## 7. Pendências que merecem prioridade

### A. Concluir a coerência da vitrine

Fechar SRV-Fpub nas listagens com `starting_price` e retirar notas/reviews/distâncias/selos inventados. Isso evita que o usuário veja preço sem correspondência com os serviços e fornece base consistente à BKG-1.

### B. Entregar a jornada mínima de agendamento

PAG-2, BKG-1/BKG-2 e SCH-1/SCH-2 são a principal lacuna funcional entre a API existente e a promessa de contratação de serviços. As frentes podem avançar em paralelo com contrato compartilhado de Appointment, respeitando as dependências de pagamento e os estados vigentes.

### C. Revisar integridade e segurança antes do aceite

- E-08: estoque em cancelamento, atualização condicional e proteção contra efeitos concorrentes.
- E-09/DEC-E: mesma política de senha no frontend/backend e custo bcrypt acordado.
- E-10/DEC-F: aceite real dos termos com data/versão; verificação e normalização de documentos conforme escopo decidido.
- E-12: bloqueios de exclusão com estados oficiais.
- E-15/SEC-2: proteger métricas e revisar minimização de dados.
- INF-2: auditoria bloqueante após corrigir vulnerabilidades; deploy reproduzível.

Os itens E-07 a E-16 foram planejados na auditoria, mas a existência desse planejamento não representa sua implementação. Alguns pontos foram antecipados em E-01 a E-06; mapear por critério para não duplicar correções.

### D. Implementar avaliações e painéis

AVL-1 -> AVL-2 -> AVL-F1 -> AVL-F2. DSH-1 -> DSH-2. A modelagem das avaliações deve confirmar a unidade de avaliação para pedidos com vários produtos, preservando autoria, origem concluída e unicidade correta.

### E. Fechar QA e documentação

QA-2/QA-3 devem acompanhar as entregas, com cenários positivos e negativos, evidências por requisito e identificação de commit. Encerrar o checklist apenas após comprovação. Incluir validações externas de Resend e Mercado Pago quando esses fluxos fizerem parte do aceite.

## 8. Documentação desatualizada

- O plano de estabilização E-01 a E-06 ainda declara no topo que nada foi implementado, apesar dos commits de 23 a 26/10.
- SRV-Fpub ainda preserva a informação histórica de que não estava implementada em 23/10. Registrar o avanço de 11/11 e as pendências atuais, sem apagar a proveniência histórica.
- READMEs de sprints preservam comportamentos anteriores de agendamento. As decisões DEC-A/DEC-B e a implementação E-04 devem prevalecer na revisão do contrato.
- O checklist de release não foi preenchido; não marcar tudo só por CI verde.
- Documentos locais não rastreados de 15 a 28/10 e evidências de 18/10 precisam manter datas/versões. Não trocar seus resultados por conclusões desta avaliação.
- A exigência acadêmica sobre REGIS permanece dependente da definição do orientador; não foi resolvida por esta inspeção técnica.

## 9. Próximo passo recomendado

Atualizar o board com esta classificação, distribuir a conclusão da SRV-Fpub e as frentes da Sprint 4, e transformar as pendências de integridade/segurança em aceites vinculados às tasks existentes. A Sprint 5 deve ser tratada como fechamento dependente dessas entregas, não como uma etapa já concluída pelo calendário.

Antes de implementar na máquina atual, atualizar a base de trabalho para a main conforme escolha da Laura, preservando os documentos locais. O fetch desta avaliação não incorporou os cinco commits à branch local.

## Fontes locais de planejamento

- [Sprints](<C:/PI - 2026/Pet/docs/Sprints/README.md>).
- [Auditoria de outubro](<C:/PI - 2026/Pet/docs/Sprints/AUDITORIA-QUALIDADE-ESTABILIZACAO-PRE-SPRINT-4.md>).
- [Decisões de estabilização](<C:/PI - 2026/Pet/docs/Sprints/PAUTA-FASE-0-DECISOES-ESTABILIZACAO.md>).
- [Plano E-01 a E-06](<C:/PI - 2026/Pet/docs/Sprints/PLANO-IMPLEMENTACAO-FASE-1-ESTABILIZACAO.md>).
- [SRV-Fpub](<C:/PI - 2026/Pet/docs/Sprints/Sprint-3-Servicos-Agendamento/SRV-Fpub-exibir-servicos-reais.md>).
- [Sprint 4](<C:/PI - 2026/Pet/docs/Sprints/Sprint-4-Agendamento-Avaliacoes/README.md>).
- [Sprint 5](<C:/PI - 2026/Pet/docs/Sprints/Sprint-5-Fechamento/README.md>).
- [Checklist de release](<C:/PI - 2026/Pet/docs/Sprints/Sprint-5-Fechamento/RELEASE-CHECKLIST.md>).

Os links locais de código não foram utilizados como prova das alterações de 11/11, pois a branch local está atrás da main. Para essas evidências, foram usados links do GitHub fixados no commit efetivamente consultado.
