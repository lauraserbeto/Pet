# E-20 — Nenhuma confirmação de sucesso sem resposta 2xx: implementação e validação

22/11/2026 · branch `tasks-laura` · alterações locais, **sem commit, push ou deploy**. Sem mudança de backend ou migration.

Origem: auditoria pré-Sprint 4, E-20 / AUD-21. Critério: nenhuma tela anuncia sucesso sem resposta 2xx. As configurações (CFG-1) devem ser implementadas ou marcadas como demonstrativas, sem ações de segurança simuladas. O Contato deve enviar de verdade ou ser marcado como demonstrativo. "Reservar/Agendar" fica desabilitado até a BKG.

## Situação de cada frente

| Frente | Antes | Agora |
|---|---|---|
| Contato (`/contact`) | O formulário mostrava "Mensagem enviada!" e um toast de sucesso sem enviar nada | Abre o aplicativo de e-mail do usuário (`mailto:`) com o assunto `[Pet+] <assunto>` e o corpo (mensagem, nome, e-mail) preenchidos. A confirmação diz "Sua mensagem está pronta… Para concluir, envie por lá" e oferece o endereço como alternativa. Decisão da Laura: abrir o e-mail e manter os canais fictícios |
| Limpar carrinho | O toast "Carrinho limpo" aparecia antes do resultado: numa falha, o usuário via o erro **e** o sucesso | `clearCart()` retorna `true`/`false`, e o toast de sucesso só aparece com 2xx (ou no carrinho anônimo, que é local) |
| Configurações (CFG-1) | Formulários que só disparavam toasts, inclusive "logout forçado de todos" | Já resolvido antes desta entrega: a tela descreve o comportamento real, sem ações simuladas. O backend de configurações está planejado em [G07](../../auditoria-visual/2026-11-20/G07-PLANO-BACKEND-CONFIGURACOES.md) e aguarda as decisões D1–D3 |
| Reservar/Agendar | Botões sem fluxo real | A BKG foi entregue: "Agendar" leva a `/tutor/agendar/:id`, que cria o agendamento pela API, e fica desabilitado sem serviços. `components/ServiceCard.tsx` não é importado em lugar nenhum (pode ser removido na higiene, E-22) |

Varredura: os demais `toast.success`/`toast.info` do frontend ficam depois de uma chamada bem-sucedida da API, ou descrevem uma ação local (copiar, filtro).

Acessibilidade de brinde no Contato: rótulos associados aos campos (`htmlFor`/`id`, inclusive o Select de assunto). A confirmação usa `role="status"`, o botão principal é primary-700 com o rótulo "Abrir e-mail com a mensagem", e um texto de apoio diz para onde vai a mensagem.

## Arquivos

`frontend/src/pages/ContactPage.tsx`, `frontend/src/pages/ContactPage.test.tsx` (novo), `frontend/src/components/cart/CartContext.tsx`, `frontend/src/pages/CartPage.tsx`.

## Validação

- **Frontend:** 39 arquivos / **193 testes** (2 novos em `ContactPage.test.tsx`: mailto montado, sem anúncio de envio; campos vazios não abrem o e-mail). Typecheck sem erros, lint com 0 erros (os 4 avisos nos arquivos tocados já existiam), build aprovado.
- **Navegador + API reais:** **7/7** cenários.
  - Contato vazio não abre o e-mail.
  - O `mailto:` sai com assunto e corpo, capturado via CDP sem abrir aplicativo externo.
  - Não aparece a mensagem "enviada".
  - "Escrever outra mensagem" volta ao formulário.
  - Carrinho: falha simulada (500) mostra só o erro e mantém o item; a 2ª tentativa mostra "Carrinho limpo", e a API confirma 0 itens.
  - Prints e `resultado.json` em [`evidencias-e20/`](evidencias-e20/), com e-mails de teste mascarados. O toast de erro no canto do print do Contato é da tentativa anterior com campos vazios.

## Limites

- O `mailto:` depende de haver um aplicativo de e-mail configurado no dispositivo. Por isso a confirmação mostra o endereço como alternativa. Não há envio pelo servidor nem registro da mensagem.
- O FAQ da página de Contato ainda cita "Reportar Problema" e "5 dias úteis". O texto não foi revisado nesta entrega.
- O backend de configurações (CFG-1/G07) continua pendente das decisões D1–D3.
