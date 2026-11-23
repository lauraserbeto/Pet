# E-33 — Permissões de rotas e retomada após login

Implementação local de 22/11/2026, branch `tasks-laura`, HEAD `d593b03`, preservando todas as entregas anteriores. Sem commit, push, deploy, migration nova ou alteração do banco publicado.

## Reprodução

A proteção dos módulos específicos do dashboard já existia e foi mantida. Restavam: perfil e pets do tutor sem allowedRoles, onboarding sem restrição de papel, destinos preservados no login somente para tutor e perda de query/hash em parte dos retornos de sessão expirada. O guard do sitter redirecionava no effect, mas ainda renderizava o filho na mesma passagem, permitindo sua montagem antes do redirecionamento. Estados de onboarding desconhecidos não eram barrados pelo guard. Login apresentava qualquer 403 como conta em análise, inclusive conta desativada.

Dez casos dos testes de reprodução falharam antes das correções, incluindo destino de admin/parceiros e montagem indevida de conteúdo de sitter. A E-13 já havia resolvido o retorno direto do lojista/hotel REJEITADO e foi preservada.

## Implementação

`frontend/src/lib/routeAccess.ts` reúne a matriz do painel, usada pelas rotas, pelo Sidebar e pela escolha de destino após login. A API continua responsável pela autorização dos dados; a matriz é uma política de navegação e apresentação.

| Área | Papéis permitidos |
| --- | --- |
| Visão geral e conta do painel | Admin, lojista, hotel e sitter |
| Perfil comercial e financeiro | Lojista, hotel e sitter |
| Produtos e pedidos da loja | Lojista |
| Agenda e serviços | Hotel e sitter |
| Configurações, aprovações, usuários e avaliações de sitter | Admin |
| Clientes, rota demonstrativa fora do menu | Parceiros |
| Perfil, pets, pedidos, agendamentos e contratação do tutor | Tutor |
| Checkout e seus retornos | Tutor |
| Onboarding | Pet Sitter |
| Correção comercial | Parceiros, com a exceção de acesso para recusado já existente |

Todas as rotas do tutor e os filhos do dashboard possuem declaração explícita de papéis. O menu usa a mesma matriz e seus caminhos são conferidos pelo TypeScript. Quem está no painel e abre um módulo de outro perfil continua vendo Acesso Negado, sem montar a página ou consultar sua API. Tutor que abre o dashboard continua sendo encaminhado ao próprio perfil.

### Retorno de autenticação

- Admin, lojista, hotel, sitter operacional e tutor retomam destinos internos compatíveis, preservando pathname, query e hash.
- Destino de outro papel, tela de autenticação ou caminho protegido desconhecido é descartado em favor do destino padrão da conta. Não se encaminha um tutor ao painel por um destino deixado por outra sessão.
- Recusa de lojista/hotel tem prioridade e leva à correção. Pendência/revisão não libera o painel. Sitter precisa de onboarding COMPLETED **e** parceiro APROVADO para entrar no painel; demais situações passam pelo onboarding.
- O tratamento global de 401 registra a localização protegida completa antes de sair. Não sobrescreve o destino ao já estar no login. A escolha final usa o perfil retornado pela API no login.
- Destinos externos, barras invertidas, controles, separadores codificados ambíguos e URLs inválidas são recusados. Segmentos relativos são normalizados antes da conferência do perfil. Falha no sessionStorage opcional não impede o login; o estado da rota ainda pode carregar o destino.
- A navegação pós-login usa replace. Não há retomada arbitrária de uma intenção antiga depois de atravessar o processo de aprovação/onboarding: os estados restritos têm prioridade.

### Onboarding sem montagem indevida ou ciclo

O guard não renderiza o filho enquanto precisa redirecionar para o onboarding ou sair dele. Isso também se aplica a estados desconhecidos ou inconsistentes; não foram adicionados estados legados como se significassem aprovação.

A página consulta o usuário e atualiza o AuthContext. Um cadastro COMPLETED sem parceiro APROVADO mostra Painel ainda indisponível e permite nova consulta, evitando o ciclo onboarding → painel → onboarding. Não foi saneado esse legado no banco. Falha de leitura mostra retry, sem logout artificial por indisponibilidade de rede. O botão Voltar para o Início da tela de análise agora leva à home, não ao login.

Conta desativada no login apresenta a mensagem real da API; só a mensagem de cadastro em análise é tratada como análise. Removida a impressão do erro de login no console.

## Testes e evidências

- **559 testes backend aprovados**, PostgreSQL 16 local, zero falhas/ignorados/cancelados. O helper de parceiros operacionais de teste agora registra COMPLETED em vez do valor genérico COMPLETE; não houve alteração nas regras de produção do backend.
- **284 testes frontend em 46 arquivos aprovados**. Cobertura de destinos, segurança do caminho, expiração, restrições do sitter, ausência de montagem do filho, erros de onboarding e mensagem de conta desativada. Testes sobre a configuração real do router conferem os papéis de cada rota.
- Typecheck e build aprovados. Lint completo: zero erros, 118 avisos frontend e um backend. Avisos preexistentes de chunk grande e anotação de dependência permanecem.
- **39 cenários Chromium aprovados**: 13 novos com API/PostgreSQL reais e 26 existentes de smoke, API controlada, documentos legais, acessibilidade parcial, checkout, vitrine, agendamento e agenda. Os 13 reais também foram repetidos para renovar evidências aguardando o carregamento dos dados.
- Nos testes reais: cinco perfis em 1280/390 px; login a partir de URL protegida; admin/tutor com JWT realmente expirado; query/hash preservados; menu por papel; URL de outro perfil sem consulta ao recurso; 403 administrativo para parceiro; sitter em revisão e legado inconsistente sem API de serviços; motivo correto de conta desativada.
- Dez capturas finais das rotas retomadas, com dados de QA e e-mails mascarados. Diretório `evidencias-e33/navegador/`. O resumo estruturado fica em `evidencias-e33/resultado.json`.
- Axe da landing permanece sem violações críticas, mas com **uma violação séria de contraste em dois elementos**. A E-33 não encerra acessibilidade global.

## Ambiente, reprodução e limites

Foi criada uma base exclusiva `petplus_e33_test` em 127.0.0.1:55432, preservando os bancos de desenvolvimento/CI e a produção. Aplicadas as 15 migrations existentes, sem migration nova. API de QA em 3333; preview em 4173. Runtime local Node 24.18.0; a referência de infraestrutura continua sendo a registrada na INF-2.

`backend/scripts/qa-route-access-fixture.js` exige base/nome/endereço exatos, NODE_ENV=test, RUN_DB_INTEGRATION_TESTS=true e arquivo absoluto exclusivo. Gera contas sintéticas e JWTs expirados/válidos. O arquivo com credenciais fica temporariamente no cache ignorado do backend e não pertence às evidências. `E33_FIXTURE` habilita os testes reais; sem ela o skip é explícito.

A preparação do QA identificou documentos sintéticos acima do limite e nomes repetidos entre perfis; o helper foi corrigido, sem alterar o schema. A primeira rodada de navegador detectou callbacks de proxy ainda ativos no encerramento; o teste passou a aguardar sua conclusão. Nenhuma regra de produção foi afrouxada para os testes passarem. Cabeçalhos de IP de QA são enviados apenas à API local para separar limites; isso não valida o proxy publicado.

Não foram validados Resend, Sentry ou Mercado Pago externos. A revisão não transforma o frontend em barreira de segurança nem substitui autorização por propriedade/status na API. A organização global de sessão e serviços legados fora destes fluxos continua na E-32. Legado inconsistente não foi corrigido em produção, e a aprovação permanece dependente das regras da E-11. Dados demonstrativos restantes e acessibilidade global continuam pendentes.

Próxima frente sugerida: **E-17**, reproduzir os dados fabricados ainda presentes antes de alterar; depois, demais itens de interface, segurança/higiene, decisões de produto e QA/release. Restam nove frentes técnicas da fila anteriormente contada, além das decisões e do fechamento final.

Encerramento conferido: API temporária e preview encerrados, sem listeners de QA em 3333/4173; fixture com credenciais e base exclusiva `petplus_e33_test` removidas. Container `petplus-dev-local` e demais bancos preservados. HEAD `d593b03`, stash e índice vazio mantidos. Diff dos arquivos desta entrega sem erros de whitespace. Sem commit ou publicação.
