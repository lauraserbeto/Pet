# Auditoria visual — Fase 3 (P1 por tela): implementação e validação

20/11/2026 · branch `tasks-laura` · alterações locais, **sem commit, push ou deploy**.

Origem: [relatório](index.html), grupos G09, G11, G12, G13, G14 e G15, com a decisão G12 da [Fase 0](FASE0-DECISOES.md).

## O que mudou

| Grupo | Mudança | Onde |
|---|---|---|
| G11 | `starting_price` entrou no contrato público de parceiro. O campo é derivado dos serviços ativos (já públicos) e era descartado pela lista de campos da SEC-2: todo card da vitrine mostrava “Preço não informado” e a ordenação por menor preço não funcionava. | `backend/src/utils/publicProvider.js` (+ teste) |
| G12 | Regra única de completude em `backend/src/utils/profileCompleteness.js`, usada pela vitrine e por `/providers/completeness`. **Obrigatórios** (decidem a vitrine, exatamente a regra que a listagem já aplicava): descrição, telefone, cidade, CEP; Hotel/Pet Sitter com serviço ativo; Hotel com ≥ 1 imagem; Pet Sitter com tipo de serviço. **Recomendados**: foto, horário, animais aceitos, comodidades, 3 imagens. A resposta mantém `isComplete`/`missingFields` (agora só obrigatórios) e ganhou `recommendedFields`. O banner do painel diz “Para aparecer na vitrine, falta…” só quando falta obrigatório; recomendações aparecem como sugestão em “Meu Perfil Público”. Rótulos em `frontend/src/lib/profileCompleteness.ts`; botão do banner sem `<Button>` dentro de `<Link>`. | backend + `DashboardLayout`, `PublicProfile`, `providerService` |
| G09 | “Minha Conta” do Admin não consulta mais `/providers/me` (403) e não mostra tipo/status de parceiro nem “Editar Perfil Público”; exibe “Administrador da plataforma”. Parceiros sem mudança. | `pages/dashboard/Account.tsx` |
| G13 | Card de agendamento no mesmo padrão do card de pedido: cabeçalho em faixa com parceiro e serviço, selo de status com a mesma paleta (fundo 50, texto 700, borda 200), dados em grade com rótulos, ações em rodapé. Datas sem segundos. Abas no padrão `ui/tabs`. Em Pedidos, “Pagar pedido” virou botão primário antes de “Ver detalhes” (contorno), como em Agendamentos. | `AppointmentSummary.tsx` (também usado em Agenda e Reserva), `appointmentBooking.ts`, `TutorAppointments.tsx`, `TutorOrders.tsx` |
| G14 | Visão Geral do parceiro com o cabeçalho do Admin: título, “loja · atualizado às HH:MM”, atalhos como botões de contorno (continuam links), “Atualizar métricas” e seletor de período alinhados. O seletor segue nativo (acessível e coberto pelos testes unitário/E2E) com a aparência do `ui/select`. Aviso técnico reduzido a uma frase, com “Como os valores são contados” sob demanda. Estados por contagem e pedidos recentes com selos da mesma paleta; bloco único ocupa a largura toda; pedido como `#ABCD1234`. | `PartnerMetricsPage.tsx`, `CommerceMetricsPanel.tsx` (também usado pelo Admin) |
| G15 | Botão “Adicionar ao Carrinho” não encolhe mais no celular (24 px → 52 px); logo da loja sem imagem mostra iniciais em vez de `<img src="">` quebrada; botões de quantidade com `aria-label`. | `ProductDetailPage.tsx` |

## Validação

Runtime: Node 24.18.0 global (a referência do projeto é 24.22.3, em `.nvmrc`).

- **Backend:** **547/547** aprovados com PostgreSQL 16 local descartável (banco separado `petplus_ci_test`, 15 migrations), zero ignorados/cancelados. Novos: 5 testes de `profileCompleteness` e 1 de contrato `starting_price`. Lint limpo nos arquivos tocados.
- **Frontend:** 37 arquivos / **186 testes** aprovados (novos: `Account.test.tsx`, recomendações em `PublicProfile.test.tsx`, `appointmentDate.test.ts`). Typecheck sem erros; lint 0 erros (128 avisos, mesmo total anterior); build aprovado.
- **Navegador com API e banco reais:** **15/15** cenários em desktop 1440 e celular 390 — contrato da API (`starting_price`, completude do Hotel com recomendados), vitrine com preço, botão do carrinho com 52 px e sem imagem vazia, Minha Conta de Admin e Hotel, ausência do banner de bloqueio e presença das sugestões, históricos sem segundos e com pagar como botão primário, Visão Geral da loja e do Hotel, Agenda. Prints e `resultado.json` em [`fase3/`](fase3/), com e-mails mascarados.

### Achado de ambiente (não é regressão)

Na primeira execução do backend, 12 testes de concorrência falharam com `P2028: Unable to start a transaction in the given time`. Causa: a URL usava `localhost`, que nesta máquina resolve primeiro para IPv6 (`::1`), enquanto o container escuta só em `127.0.0.1`; cada conexão nova esperava cerca de 2 s e estourava o `maxWait` do Prisma. Com `127.0.0.1` na URL, o mesmo teste devolveu o 409 esperado e a suíte inteira passou. **Usar `127.0.0.1` (não `localhost`) na `DATABASE_URL` dos testes locais com Docker no Windows.**

## Não validado / pendências

- E2E do Playwright (`npm run test:e2e`) não executados.
- Login real com senha (sessões por token de teste).
- `CommerceMetricsPanel` também é usado no painel do Admin; verificado só pela suíte unitária e pelo print da loja.
- Restam para as Fases 4–5: G16–G26 do relatório e os itens anotados na [Fase 2](FASE2-IMPLEMENTACAO-E-VALIDACAO.md).
