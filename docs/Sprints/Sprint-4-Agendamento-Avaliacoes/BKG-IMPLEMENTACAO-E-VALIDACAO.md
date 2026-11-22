# BKG-1 e BKG-2 - Jornada do tutor

Implementação local em 16/11/2026, branch codex/retomada-servicos sobre main 5d11b7e, com as alterações locais anteriores de SRV-Fpub e PAG-2. Sem commit ou publicação.

## Jornada entregue

- Botões de hotel/sitter levam a /tutor/agendar/:providerId.
- A rota exige perfil Tutor; visitante vai ao login com destino interno preservado.
- Formulário consulta serviços ativos e pets próprios na API.
- Seleção de serviço, pet, início/fim e observações; validação de datas e limites.
- Prévia pelo preço do serviço: diária por calendário de São Paulo (mínimo uma) ou hora iniciada, conforme backend. Datas são enviadas como ISO com fuso.
- Total e política definitivos são os retornados na criação; não há pagamento automático.
- Presencial fica PENDENTE, aguardando decisão do parceiro.
- Pré-pago permite revisão do total e confirmação explícita do pagamento simulado.
- Reservas existentes podem ser consultadas e pagas pelo histórico; recarregar o formulário após criação recupera o ID, sem outro POST.
- Histórico real, filtros Todos/Hotéis/Pet Sitters, atualização manual e consulta periódica.
- Cancelamento elegível exige confirmação; pagamento/estorno são apresentados conforme dados persistidos.
- Serviço HTTP e componentes de resumo/ações podem ser reutilizados na integração da agenda, respeitando os papéis.

## Preservação e tratamento de falhas

O rascunho em sessionStorage é separado por usuário e parceiro. Não contém senha/JWT; armazena escolhas do formulário, ID criado e sinalização de envio incerto. Outra conta não reutiliza o rascunho automaticamente.

O cadastro de pet reutiliza a página existente, com destino de retorno interno validado. Após criar o pet, a reserva é retomada com os campos salvos.

Sessão expirada nas rotas de reserva/histórico preserva o destino antes do redirecionamento ao login.

Antes do POST, o envio é marcado como incerto. Falha de rede, timeout ou 5xx não aciona um segundo POST automaticamente. O usuário pode verificar a solicitação no histórico: busca por serviço, pet e período exato; se encontrada, retoma o registro; se não, libera uma nova tentativa consciente. Se a consulta falhar, o reenvio permanece bloqueado.

Essa recuperação não é uma chave global de idempotência para criação. A proteção de conflitos do backend continua necessária para requisições simultâneas do mesmo pet/período. Pagamento/cancelamento possuem as proteções próprias da PAG-2.

Antes de pagar/cancelar, a tela consulta o estado mais recente. Mudança de total/status exige nova conferência; erros são apresentados, e o cache é invalidado. A mudança de estado feita pelo parceiro é vista no refetch manual/periódico.

Não foram adicionados dados de cartão, pagamento real, compra anônima ou confirmação automática do parceiro.

## Validações

- Typecheck aprovado.
- Build aprovado; permanece aviso de chunk grande. Sem mudança de bundling neste escopo.
- Lint frontend: zero erros; 135 avisos no conjunto do repositório.
- Suíte frontend: 20 arquivos, 109 testes aprovados. Execução local sequencial, maxWorkers=1 e testTimeout=15000 via CLI, sem alterar a configuração versionada. Rodadas anteriores em paralelo tiveram timeouts; um teste de abas foi adaptado ao acionamento por teclado do Radix.
- Playwright completo: 24 cenários aprovados, incluindo regressão de páginas legais, vitrine, compra/pagamento de pedidos e a nova jornada.
- Nova jornada: quatro cenários com API controlada (presencial/pré-pago, 390/1280 px), um cenário de visitante e dois cenários com API/PostgreSQL reais.
- Rodada integrada: hotel pré-pago e sitter presencial; cria, paga quando aplicável, recarrega, consulta, confirma via API do parceiro e cancela. Estorno simulado exibido e persistido para o hotel.
- Conferência final: sete cenários de agendamento aprovados. Uma rodada anterior de capturas teve falha intermitente na abertura do diálogo de cancelamento no cenário móvel pré-pago; esse cenário passou em cinco repetições com trace e na rodada final, sem causa conclusiva identificada. A ocorrência permanece registrada para acompanhamento, sem atribuí-la a uma falha do backend ou afirmar que foi corrigida.
- Capturas de formulário, diálogo e histórico geradas em frontend/test-results; verificação de ausência de overflow horizontal. Capturas são temporárias e podem ser substituídas pela próxima execução.

O teste integrado usa usuários/pets/serviços fictícios, JWTs de teste e um PostgreSQL 16 descartável, publicado apenas em loopback na porta 55440. As oito migrations foram aplicadas nesse banco. Nenhuma operação foi feita no banco publicado ou em provedores de pagamento/e-mail.

Após a conferência final, a API de teste foi encerrada, o container descartável foi parado e o JSON temporário de fixture foi removido.

## Reproduzir testes integrados

1. Criar PostgreSQL local descartável com nome de banco contendo test e aplicar as migrations com DATABASE_URL explicitamente apontando para ele.
2. Definir JWT_SECRET fictício, NODE_ENV=test, FRONTEND_URL do preview, LOG_LEVEL=silent, Mercado Pago desativado, Sentry desativado e credenciais fictícias de e-mail.
3. Com RUN_DB_INTEGRATION_TESTS=true, executar o script backend/scripts/qa-booking-fixture.js passando o caminho de um JSON temporário. Ele valida o destino local de teste antes de escrever dados.
4. Iniciar a API local com o mesmo segredo e o mesmo banco; gerar o build do frontend.
5. Executar os testes com BKG_E2E_FIXTURE apontando para o JSON e BKG_E2E_API apontando para a API local. O teste recusa base externa. O proxy de transporte do Playwright não substitui respostas de negócio.
6. Encerrar os processos/containers criados e remover o JSON temporário. Não versionar tokens de teste.

Na ausência dessas variáveis, os dois cenários reais ficam explicitamente ignorados. A configuração atual do CI não passa a provisionar a API integrada só pela inclusão do arquivo; essa automação completa permanece para QA-2/QA-3.

## Limites e publicação

A interface depende da API com a migration e o endpoint de pagamento da PAG-2. Não houve publicação ou migration em produção.

Os testes integrados autenticam por JWT de fixture: não representam uma nova validação completa da tela de login/cadastro com credenciais reais.

A confirmação do parceiro foi testada diretamente na API. A agenda visual do parceiro ainda pertence a SCH-1/SCH-2 e não foi implementada nesta etapa.

Os demais itens de estabilização, avaliações, indicadores e fechamento do plano continuam separados desta entrega. Testes locais aprovados não são aceite automático de todo o projeto.
