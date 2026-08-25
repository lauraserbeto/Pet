# REC-2 — Tela de correção de cadastro recusado (exige login)

> Sprint 2 · Semana 5 (22–28/set) · Frontend · Prioridade Alta · Esforço M · Responsável R4

## Contexto
No fluxo de recusa (REC-1), o parceiro recebe um e-mail com o `rejection_reason` e um link
para corrigir o cadastro — mas essa **tela ainda não existe**. Decisão de negócio: a
correção **exige login** (o link não dá acesso direto; o parceiro precisa se autenticar),
mostra o motivo da recusa no topo, permite corrigir os dados cadastrais e reenviar, o que
move o status para `EM_REVISAO` (endpoint de reenvio de REC-1). Precisamos criar a
tela/rota que o link do e-mail aponta.

## Objetivo
Criar a rota/tela de correção acessada pelo link do e-mail de recusa: protegida por login,
exibindo o `rejection_reason` no topo, com formulário de correção dos dados cadastrais e
ação de reenviar que chama o endpoint de reenvio (status → `EM_REVISAO`).

## Escopo / Passos
1. Criar a rota de correção (ex.: `/parceiro/corrigir-cadastro`) e registrá-la no roteamento centralizado (lazy loading, como as demais rotas).
2. Proteger a rota: se não autenticado, redirecionar para login preservando o retorno (voltar à correção após autenticar). Reusar o guard/`AuthContext` existente.
3. Carregar os dados do parceiro logado (`GET /providers/me`) e o `rejection_reason` para exibir em destaque no topo (alerta/banner).
4. Formulário de edição dos campos cadastrais reutilizando os componentes/serviços já usados na vitrine (`providerService`), com validação e estados de loading/erro.
5. Ação "Reenviar para análise": chama o endpoint de reenvio (REC-1), que aplica as correções e move o status para `EM_REVISAO`; feedback de sucesso e redirecionamento adequado.
6. Bloquear/avisar caso o parceiro não esteja em `REJEITADO` (ex.: já `EM_REVISAO` ou `APROVADO`) — não permitir reenvio fora de estado.

## Arquivos envolvidos
- `frontend/src/pages/...CorrecaoCadastro.tsx` — nova tela de correção.
- Roteamento centralizado (arquivo de rotas com lazy loading) — registrar a rota protegida.
- `frontend/src/contexts/AuthContext` — guard de login/redirect.
- `frontend/src/lib/services/providerService.ts` — carregar (`GET /providers/me`) e reenviar (endpoint de REC-1).

## Dependências (Depende de / Bloqueia)
- Depende de: **REC-1** (link do e-mail, `rejection_reason` e endpoint de reenvio `→ EM_REVISAO`).
- Bloqueia: nenhuma.

## Critério de aceite (Definition of Done)
- [ ] O link do e-mail leva à tela de correção.
- [ ] A tela **exige login**: usuário não autenticado é enviado ao login e retorna à correção após autenticar.
- [ ] O `rejection_reason` aparece em destaque no topo da tela.
- [ ] O parceiro corrige os dados e reenvia; o status passa a `EM_REVISAO`.
- [ ] Reenvio fora do estado `REJEITADO` é bloqueado com aviso claro.

## Testes
- Abrir o link deslogado → redireciona ao login → após autenticar, cai na tela de correção com o motivo exibido.
- Abrir o link logado (parceiro `REJEITADO`) → tela com motivo + formulário; reenviar → sucesso e status `EM_REVISAO`.
- Parceiro em `EM_REVISAO`/`APROVADO` → tela avisa que não há recusa pendente e não permite reenvio.
- Falha de rede no carregamento/reenvio → estados de erro tratados (retry), sem quebrar a tela.

## Notas técnicas / armadilhas
- O link do e-mail **não** autentica por si só; a proteção é por login — nunca embutir token de acesso na URL.
- Preservar o destino de retorno ao redirecionar para login (evitar perder o link após autenticar).
- Reaproveitar os componentes de formulário da vitrine/`PublicProfile` para não duplicar validação de campos cadastrais.
- Tratar os quatro estados (loading/erro/vazio/sucesso); usar `HamsterLoader` no carregamento.
- Após reenvio bem-sucedido, refletir o novo status em tela sem `window.location.reload()` (alinhado ao fix de UX-2).
