# E-17 — Dados demonstrativos restantes nas jornadas públicas

22/11/2026, branch `tasks-laura`, sobre `34c7fa8`. Alterações locais, sem commit/push/deploy. Nenhuma alteração de API, banco, migrations ou ambiente.

## Diagnóstico

Os achados antigos da AUD-09 estavam em grande parte resolvidos por SRV-Fpub, AVL e DSH: serviços e preços públicos vêm da API, avaliações são agregadas dos registros reais, há estados vazio/erro na vitrine, e o produto não usa mais uma ficha técnica fictícia. Não foram reimplementadas essas entregas.

Foram reproduzidos resíduos de conteúdo e apresentação:

- Landing tratava falha da API como ausência de produtos, chamava a seleção inicial do catálogo de mais procurados sem indicador que sustentasse isso e usava foto genérica para produto sem foto.
- Hotel rotulava o menor preço como diária, mesmo quando o serviço mais barato tinha unidade HORA; a ausência da lista de animais virava proibição de cães/gatos.
- Produto declarava Em estoque mesmo com quantidade zero. A condição agora usa status ACTIVE e quantidade positiva; ambos os botões de compra ficam desabilitados sem estoque, e o handler também impede adicionar. O backend continua sendo a autoridade de estoque e disponibilidade.
- Loja recebia uma foto genérica como se fosse sua imagem; agora usa placeholder neutro quando não há foto cadastrada.
- Sobre anunciava milhares de pets felizes, webcam e supervisão 24h generalizadas, sem esses dados para todos os parceiros.
- FAQ afirmava chat ao vivo, prazos de atendimento/aprovação, reembolso de 50% por antecedência, botão de disputa e campos de cadastro de pet inexistentes. O onboarding também prometia análise em 48 horas.

## Alterações

Landing mantém os dados da API e agora separa erro de vazio com retry. Descarta resposta tardia após desmontagem/nova tentativa e substitui a seleção anterior pelo resultado novo, inclusive vazio. Título da seção não afirma ranking de procura; fotos ausentes usam ícone neutro. Contagens de categoria sem fonte, que não estavam sendo exibidas, foram retiradas da definição. O destaque de segurança absoluta virou referência à análise cadastral efetivamente existente.

Hotel apresenta a unidade do serviço ativo de menor preço tanto no resumo quanto na barra de ação; a lista usa os rótulos DIARIA/HORA do contrato. Preços não finitos ou não positivos não entram na exibição. Animais não informados geram mensagem de informação ausente, em vez de recusa presumida. Comodidades continuam sendo as cadastradas pelo parceiro.

Sobre descreve a consulta das condições de cada hotel, sem prometer webcam ou supervisão universal. FAQ foi alinhado ao cadastro, à análise sem SLA garantido, ao contato via mailto e ao cancelamento elegível com estorno integral **simulado**, sem faixas fictícias ou restituição financeira real. O prazo de 48 horas do onboarding foi removido. Contatos fictícios, telefone, redes e endereço foram preservados conforme decisão da Laura; a página continua apenas preparando uma mensagem no aplicativo de e-mail.

## Validação e alcance

- Regressão completa frontend: **289 testes em 47 arquivos aprovados**. Cinco testes novos cobrem erro/retry/vazio na landing, imagem ausente, avaliação sem nota, preço/unidade/animais do hotel e produto sem estoque. Após a última alteração dos botões de compra, esses cinco foram repetidos e passaram.
- Typecheck e build aprovados. Lint sem erros; 116 avisos frontend permanecem. Avisos de chunk/dependência preexistentes não foram encerrados.
- Navegador: cenários com respostas **controladas da API**, em 1280/390 px, para falha e recuperação do catálogo, foto ausente, avaliação vazia, indisponibilidade de estoque, unidade de preço do hotel, FAQ, Sobre e placeholder da loja. A regressão também cobre navegação, checkout, agenda, vitrine e acessibilidade parcial. Resultado final em `evidencias-e17/resultado.json`.
- A primeira rodada não localizou no desktop o botão Comprar exclusivo do layout móvel; o locator passou a incluir esse elemento oculto para conferir seu disabled. Nenhuma regra de produção foi alterada para contornar o teste.
- Backend não foi modificado nem reexecutado nesta frente; a última regressão anterior continua registrada como 561 testes aprovados na correção do CI. Os testes desta entrega não comprovam provedores externos ou persistência real.

## Preservado e pendências

Ilustrações decorativas e categorias de navegação não representam fotos reais de parceiros. Painel ilustrativo de Partners marcado como Exemplo, tela Customers com DemoBanner e metas explicitamente futuras do Sobre não foram apresentados como resultados operacionais nem transformados em módulos reais. Arquivos de protótipo sem rota, componentes sem uso e contador promocional não renderizado ficam para a E-36. Esta entrega não removeu essas pastas nem alterou decisões de produto.

Acessibilidade completa permanece na E-34; a execução atual da landing registrou uma violação séria de contraste em um elemento, sem críticas. E-31 continua abrangendo os demais estados de erro não auditados nesta frente. Próxima frente sugerida: **E-23**, reproduzir o que resta da padronização de Finance/Orders. Oito frentes técnicas permanecem, além das decisões de produto e do QA/release.

Resultado final do navegador: **28 cenários aprovados**, sendo dois novos E-17 e 26 de regressão. Os dois E-17 foram repetidos para capturas com o resumo de avaliações no contrato correto e sem loader pendente; as duas capturas finais foram inspecionadas. Respostas controladas não foram apresentadas como banco real. Não houve seed, processo de API ou banco temporário nesta frente.

## Revisão posterior (22/11/2026)

A revisão do diff local encontrou cinco problemas, reproduzidos no código e corrigidos sem mudança de backend:

1. **Barra fixa do hotel** (≥ 640 px): preço e unidade saíam colados ("R$ 25,00por hora"), inclusive para leitor de tela. Agora há um espaço real no texto.
2. **Detalhe do produto indisponível:** os dois botões ficavam desabilitados, mas com a aparência de ativos (laranja, hover), e o selo "Produto indisponível" mantinha o ponto verde pulsando. Agora os botões aparecem cinza, com cursor de bloqueado, e o ponto fica neutro.
3. **Card de destaque da landing:** produto ativo sem estoque (a vitrine pública lista produtos ACTIVE sem filtrar estoque) ainda oferecia "Adicionar". Agora o botão mostra "Esgotado" e fica desabilitado.
4. **Shopping (`/shopping`):** ainda usava uma foto genérica do Unsplash como foto do produto, o mesmo problema já corrigido na landing. Agora usa um placeholder neutro ("Produto sem foto cadastrada"). O botão de carrinho de produto esgotado fica desabilitado ("Esgotado: <nome>").
5. **Shopping com falha da API:** mostrava um toast, "0 produtos" e "Nenhum produto encontrado — ajuste os filtros". Agora mostra "Não foi possível carregar o catálogo", o contador "Catálogo indisponível" e "Tentar novamente", e descarta resposta tardia após desmontagem.

O backend continua revalidando o estoque ao adicionar e ao criar o pedido. A interface não reserva estoque.

Validação da revisão:
- Frontend com **293 testes em 48 arquivos**: 2 novos em `PublicData.test.tsx` (espaço preço/unidade, destaque esgotado) e 2 em `ShoppingPage.test.tsx` (novo; erro com retry, placeholder e esgotado).
- Typecheck e build aprovados. Lint com 0 erros e **115 avisos** (um a menos).
- `e2e/public-data.spec.ts` ampliado com o card esgotado da landing, o erro/retry/placeholder/esgotado do Shopping e o espaço preço/unidade no desktop: **2/2 cenários** em 1280/390 px, com respostas controladas da API. Novas capturas `shopping-esgotado-sem-foto.png` em `evidencias-e17/navegador/`.
- A regressão completa de navegador (26 cenários) não foi repetida nesta revisão.
