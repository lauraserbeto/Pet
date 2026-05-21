/* ═══════════════════════════════════════════════════════════════
   PET+ PITCH DECK — Speaker Notes
   3-5 bullets por slide. Cronometragem total: ~10-12min.
   Rodízio: Marcel (M) / Laura (L) / Layssa (Ly) / Vitor (V).
   ═══════════════════════════════════════════════════════════════ */

window.SPEAKER_NOTES = [
  // ── 1. Capa ──
  {
    title: 'Abertura — Pet+',
    speaker: 'Marcel',
    duration: '~30s',
    bullets: [
      'Bom dia, banca. Somos Marcel, Laura, Layssa e Vitor, alunos do 6º período de Engenharia de Software da UniEVANGÉLICA.',
      'O projeto que vamos apresentar hoje é o Pet+ — uma plataforma que integra tudo o que um tutor de pet precisa num só lugar.',
      'Em 10 minutos vamos contar o problema que identificamos, como resolvemos, e mostrar a plataforma que está no ar agora em petplus.vercel.app.'
    ],
    transition: 'Começando pelo problema que motivou tudo isso.'
  },

  // ── 2. Problema ──
  {
    title: 'O Problema',
    speaker: 'Laura',
    duration: '~60s',
    bullets: [
      'O mercado pet brasileiro é o terceiro maior do mundo — R$ 77 bilhões por ano segundo a Abinpet — mas a experiência ainda é fragmentada.',
      'Quem é tutor entende: precisa viajar e fica buscando hotel em grupo de WhatsApp; quer comprar ração e não sabe se a loja é confiável; tem dúvida sobre cuidador e não acha referência.',
      'Do outro lado, lojistas e cuidadores pequenos não têm visibilidade — dependem de boca-a-boca e planilha pra gerir clientes.',
      'A dor não é falta de serviço, é falta de organização.'
    ],
    transition: 'É aí que o Pet+ entra.'
  },

  // ── 3. Solução ──
  {
    title: 'A Solução',
    speaker: 'Laura',
    duration: '~45s',
    bullets: [
      'O Pet+ é o ponto de encontro entre quem cuida do pet e quem oferece esse cuidado.',
      'Num só lugar, o tutor compra produtos, reserva hospedagem, contrata pet sitter e gerencia a vida do animal.',
      'E parceiros — lojistas, hotéis e cuidadores — ganham um canal de venda e um painel completo de gestão.',
      'Não é só uma loja. Não é só um app de hospedagem. É a plataforma que conecta os dois lados.'
    ],
    transition: 'Vamos detalhar quem usa isso.'
  },

  // ── 4. Perfis ──
  {
    title: 'Para quem é?',
    speaker: 'Layssa',
    duration: '~45s',
    bullets: [
      'A plataforma atende cinco perfis distintos — cada um com sua própria jornada e seu próprio painel.',
      'O Tutor é o centro: ele descobre, compra, reserva e acompanha tudo do pet num só lugar.',
      'Lojistas, Hotéis e Pet Sitters são os parceiros que oferecem produtos e serviços; cada um tem cadastro próprio com regras próprias.',
      'E o Administrador garante a qualidade da plataforma: aprovando quem entra e mantendo a confiança da comunidade.'
    ],
    transition: 'Agora a parte mais importante — mostrar como isso ficou.'
  },

  // ── 5. Demo Vitrine ──
  {
    title: 'Demo — A vitrine do tutor',
    speaker: 'Marcel',
    duration: '~90s',
    bullets: [
      'Essa é a primeira tela que o tutor vê. Hero com mensagem clara, vitrine de produtos da semana, categorias visuais e seções de serviços — tudo navegável.',
      'Cada produto tem nome, marca, avaliações reais, preço com e sem desconto, badges e botão "adicionar" direto.',
      'Reparem que a paleta laranja é nossa identidade — Pet+ tem que ter cara de marca, não de protótipo.',
      'E quando você clica numa categoria, cai num catálogo filtrado. É loja completa, não vitrine estática.'
    ],
    transition: 'Mas o Pet+ não é só shopping. Vamos para os serviços.'
  },

  // ── 6. Hotéis e Sitters ──
  {
    title: 'Demo — Hotéis e Pet Sitters',
    speaker: 'Vitor',
    duration: '~90s',
    bullets: [
      'À esquerda, a busca de hotéis: nome, foto, distância, comodidades, diária e avaliação. À direita, a mesma lógica para pet sitters — só que com tarifa por hora e tipos de serviço (sitter, dog walker, day care).',
      'Cada parceiro pode ser favoritado e tem página própria — galeria, descrição, horários, animais aceitos.',
      'Toda essa lista é alimentada pelos parceiros que se cadastram na plataforma e foram aprovados pelo time admin.',
      'O tutor vê só quem passou pelo filtro de qualidade — não é uma lista qualquer.'
    ],
    transition: 'Quando o tutor decide comprar, entra em jogo um detalhe que a gente adora.'
  },

  // ── 7. Carrinho ──
  {
    title: 'Demo — Carrinho que funciona offline',
    speaker: 'Vitor',
    duration: '~75s',
    bullets: [
      'O carrinho do Pet+ tem uma característica que poucas plataformas têm: o tutor pode montar tudo antes mesmo de fazer login.',
      'Adicionou produto sem estar logado? Tudo bem. Quando ele entra na conta, o carrinho é preservado e mesclado com o que ele já tinha.',
      'Cupom, frete grátis acima de R$ 199, controle de quantidade — tudo que uma loja real precisa.',
      'Isso reduz atrito. O usuário não perde o que estava fazendo só porque pediu pra logar no meio do caminho.'
    ],
    transition: 'Agora a visão do outro lado: do parceiro.'
  },

  // ── 8. Dashboard ──
  {
    title: 'Demo — Dashboard do parceiro',
    speaker: 'Layssa',
    duration: '~90s',
    bullets: [
      'Esse é o painel que o hotel, lojista ou pet sitter vê quando entra no Pet+. Receita do mês, agendamentos, novos clientes, ticket médio — tudo num lance só.',
      'Os gráficos mostram desempenho semanal e quais serviços estão bombando.',
      'Embaixo, a agenda do dia com cada pet, dono e status. Meta mensal com barra de progresso pra dar motivação.',
      'O parceiro deixa de gerir negócio em caderno: passa a ver dados que ajudam ele a crescer.'
    ],
    transition: 'Mas pra essa plataforma funcionar, confiança é tudo.'
  },

  // ── 9. Confiança ──
  {
    title: 'Confiança por design',
    speaker: 'Layssa',
    duration: '~75s',
    bullets: [
      'Aqui vocês veem dois pilares de confiança da plataforma. À esquerda, o painel admin de aprovação: ninguém vira parceiro sem passar por análise manual de documento e negócio.',
      'À direita, a Escola de Heróis — um quiz que todo pet sitter precisa passar antes de receber pets.',
      'As perguntas são reais: como fazer Manobra de Heimlich canina, lidar com ansiedade de separação, separar briga de cães.',
      'Quem tutor confia o pet a um estranho? Quem o Pet+ aprovou. É marketing que vira mecanismo de segurança.'
    ],
    transition: 'O resultado dessa combinação de produto e processo é o nosso diferencial.'
  },

  // ── 10. Diferenciais ──
  {
    title: 'Diferenciais',
    speaker: 'Marcel',
    duration: '~75s',
    bullets: [
      'Quatro coisas que tornam o Pet+ diferente de qualquer concorrente que já vimos.',
      'Um: plataforma única — não escolhe entre ser loja ou ser app de serviço, é os dois.',
      'Dois: confiança por design — aprovação manual e Escola de Heróis pra pet sitter, não basta cadastrar.',
      'Três: pronto pro parceiro — dashboard real com gráficos e gestão, não só uma página de perfil.',
      'Quatro: está no ar agora. Não é protótipo, não é figma — é petplus.vercel.app funcionando.'
    ],
    transition: 'E como ganhamos dinheiro com isso? Falamos do modelo a seguir.'
  },

  // ── 11. Status + Modelo ──
  {
    title: 'Status, Roadmap e Modelo',
    speaker: 'Laura',
    duration: '~75s',
    bullets: [
      'O que já está pronto: cadastro de cinco perfis, vitrine completa, carrinho híbrido, dashboard de parceiro, painel admin, onboarding de sitter com Escola.',
      'No roadmap próximo: sistema de avaliações reais, app mobile e integração com gateways de pagamento.',
      'O modelo de negócio combina três receitas: comissão sobre venda no shopping, assinatura mensal para parceiros premium, e taxa por reserva de hospedagem e serviços.',
      'É um modelo de marketplace clássico — quanto mais parceiros, mais valor pro tutor; quanto mais tutores, mais valor pro parceiro.'
    ],
    transition: 'E é com isso que encerramos.'
  },

  // ── 12. Fechamento ──
  {
    title: 'Obrigado',
    speaker: 'Quarteto',
    duration: '~20s',
    bullets: [
      'O Pet+ é uma plataforma feita por quatro alunos de engenharia que entenderam que tecnologia bem aplicada resolve problema real.',
      'Está no ar em petplus.vercel.app. Nosso Instagram é @petplusbr, sigam pra acompanhar os próximos lançamentos.',
      'Obrigado pela atenção. Estamos abertos para perguntas.'
    ],
    transition: null
  }
];
