# Auditoria de formatação e apresentação do "PFC Documento"

Data: 28/10/2026. O documento não foi alterado.

## Como a análise foi feita

**Fontes:**

- **Estrutura real (DOCX exportado pelo Drive):** estilos, títulos, numeração automática, recuos, espaçamentos, quebras, seções, cabeçalho, rodapé e as 77 tabelas. A análise foi feita por leitura do XML.
- **Aparência real (PDF baixado pelo Google Docs, 79 páginas):** páginas renderizadas uma a uma, para conferir quebras, espaços em branco, títulos isolados, sobreposições e paginação.

**Limitações:**

- **Sugestões pendentes.** O PDF foi gerado com sugestões ainda pendentes. Em alguns trechos ele mostra o texto antigo e o novo lado a lado, como no detalhamento da RNE-009. Isso some quando as sugestões forem aceitas ou rejeitadas e não é tratado aqui como defeito de formatação.
- **Modelo da instituição.** Não há modelo nem regulamento da instituição disponível. O documento usa um modelo visual da UniEVANGÉLICA, com cabeçalho e rodapé em imagem e margens próprias. Onde a ABNT diverge desse modelo, o ponto aparece como "verificar com o modelo da disciplina", e não como erro.
- **Tipo de documento.** É um documento de especificação de projeto integrador, e não um TCC. A NBR 14724 (trabalhos acadêmicos) serve de referência para a apresentação. A NBR 6024 (numeração progressiva) e a NBR 6027 (sumário) se aplicam diretamente.

**Legenda:**

- **Prioridade:** **Crítica** compromete a entrega ou a conformidade. **Importante** afeta legibilidade ou consistência de forma visível. **Opcional** melhora o acabamento.
- **Natureza:** **[N]** é exigência normativa, **[R]** é recomendação de apresentação e **[E]** é preferência estética.

## Correção prévia (28/10)

Ao conferir o documento depois que a Laura aceitou as sugestões, 13 trechos antigos ainda estavam no texto, ao lado do texto novo.

- **Causa:** foram as substituições feitas por digitação sobre um trecho selecionado nas revisões das seções 10 e 13 a 15. No modo Sugestão, digitar sobre uma seleção inseriu o texto novo sem marcar o antigo como exclusão.
- **Trechos afetados:** detalhamentos da RNE-009 e da RNE-010, RF-002, RF-023, RNF-001 (dois trechos), RNF-008, RNF-012, 22.4, Modelo de Dados, introdução da Parte 02, Situação Atual e Arquitetura.
- **Correção:** os 13 trechos foram marcados como sugestões de exclusão, com "Localizar e substituir" e o campo de substituição vazio. Esse método gera exclusões corretamente.
- **Pendente:** a Laura precisa aceitar essas 13 sugestões antes da etapa de formatação.

## 1. Diagnóstico geral

A identidade visual é consistente e profissional:

- cabeçalho e rodapé institucionais em todas as páginas;
- Arial 12 no corpo do texto, com espaçamento de 1,5;
- tabelas de requisitos padronizadas (69 de 71 com o mesmo desenho).

Os problemas estão em quatro áreas:

1. **Estrutura de títulos e sumário.** O sumário foi colado de outro arquivo e está desatualizado. A numeração das seções tem um número repetido. Estilos de título são usados em textos que não são títulos.
2. **Rodapé.** A imagem do rodapé cobre a última linha de texto em várias páginas.
3. **Parágrafos montados à mão.** Há trechos com uma linha por parágrafo, recuos feitos com espaços e 316 parágrafos vazios usados como espaçamento.
4. **Figuras.** Rótulos ficam separados das figuras, há um gráfico duplicado, diagramas difíceis de ler e só uma figura tem legenda e fonte.

Os itens das áreas 1 e 3 se resolvem melhor ajustando os **estilos de parágrafo** do Google Docs (Normal, Título 1, Título 2) do que corrigindo cada ocorrência à mão.

## 2. Inconsistências e correções propostas

### 2.1. Sumário, numeração e paginação

| Localização | Problema identificado | Correção proposta | Prioridade | Justificativa |
| --- | --- | --- | --- | --- |
| Rodapé, todas as páginas | **Não existe número de página.** O rodapé tem só a imagem com o endereço, e o sumário cita páginas. | Inserir número de página (Inserir → Números de página), no canto superior ou inferior direito, sem sobrepor as imagens do modelo. | Crítica [N] | A NBR 14724 exige paginação. Sem ela, o sumário não funciona. |
| Sumário (p. 2–3) | **O sumário é texto colado, e não o sumário automático.** Os links levam a outro documento (`1JeDF…`). As páginas citadas vão até 30, mas o documento tem 79. Cada linha tem um número de lista "1." a "46." à esquerda. | Depois de corrigir os títulos (2.2), apagar o sumário atual e inserir o automático (Inserir → Sumário → com números de página). | Crítica [N] | A NBR 6027 pede correspondência exata de títulos, numeração e páginas. O sumário automático se atualiza com um clique. |
| Sumário × corpo | **Os números não batem.** O sumário vai até "27 Avaliação" e trata "23 Organização do código" como seção. No corpo, essa parte é "22.4", a Qualidade tem "23." digitado à mão e a numeração automática também dá 23 à Segurança. A entrada 22.3 está ausente. | Decidir a numeração (ver 2.2, item "Qualidade") e deixar todos os títulos com numeração automática. O sumário passa a refletir o corpo. | Crítica [N] | Número repetido e sumário divergente são erros de numeração progressiva (NBR 6024). |
| Sumário, p. 3 | O sumário termina com página e meia, e o resto da p. 3 fica em branco. | Ajustar sozinho quando o sumário automático for gerado. | Opcional [E] | — |

### 2.2. Títulos e hierarquia

| Localização | Problema identificado | Correção proposta | Prioridade | Justificativa |
| --- | --- | --- | --- | --- |
| "23. QUALIDADE DO SOFTWARE E TESTES" (p. 70) | O número foi digitado à mão, com ponto. A seção seguinte, "Segurança", recebe 23 automático, e a numeração fica duplicada. | Aplicar a numeração automática da lista dos demais títulos. **Decisão necessária (ver seção 7):** promover "Organização do código" a seção 23, que é o que o sumário atual e o orientador usam, ou mantê-la como 22.4. | Crítica [N] | Numeração progressiva sem saltos nem duplicidade (NBR 6024). |
| "22.1- Front-end", "22.2 - Back-end", "22.3 - Integração", "22.4. ORGANIZAÇÃO…" | Números digitados à mão, com hífen ou ponto, em formatos diferentes. O "22.4" nem é título: é um parágrafo em negrito, e por isso não entra no sumário. | Usar Título 2 com numeração automática no formato "22.1 Front-end", sem hífen nem ponto final. | Importante [N] | A NBR 6024 separa número e título só por um espaço. |
| 19 parágrafos de título vazios (antes das PARTES 01, 03, 04 e 05, em 12 Resultados, 13–15, 16.1, 17.2 e 20) | Aparecem como linhas em branco na estrutura e no sumário automático. Um deles contém um gráfico. | Mudar para Texto normal ou excluir a linha vazia. A imagem passa para um parágrafo normal. | Importante [R] | Evita entradas vazias no sumário. |
| "PERFIL DOS USUÁRIOS…", "INTERESSE NO APP…", "CANAIS DE COMPRA…", "BARREIRAS…" (12 Resultados) | Estão no estilo Título 1, sem número, no mesmo nível das seções. | Transformar em títulos de figura (legenda, ver 2.5) ou em Título 3 sem número. | Importante [N] | No sumário pareceriam seções principais. São títulos dos gráficos. |
| "Nome do Produto:", "Descrição do Produto:", "Fluxo do Admin/Lojista/Hotel/Pet Sitter/Tutor:", "Caminho principal…", "Fluxograma…:", "Wireframe:", "Diagrama Entidade-Relacionamento (DER):", "Front-end - Desenvolvimento da Interface:" | Usam Título 2 em rótulos internos. Oito linhas do "Caminho principal que o Tutor percorre" ("- Acessa a plataforma." e outras) também estão em Título 2. | Passar para Texto normal, com negrito nos rótulos. As oito linhas do Tutor viram itens de lista. | Importante [R] | Evita dezenas de entradas indevidas no sumário e mantém a hierarquia limpa. |
| Títulos de seção (Título 1 numerado) | Os recuos variam (962, 1162, 1163, 1275, 1293, 1295 e 1296 twips), e a distância entre número e texto também ("8 PÚBLICO-ALVO" × "10    SOLUÇÕES EXISTENTES"). Alguns estão justificados, o que espaça as letras nos títulos longos ("PARTE 03 – ENTENDIMENTO …", p. 14). | Formatar um título corretamente e usar "Atualizar Título 1 para corresponder". Alinhar à esquerda, sem justificar. | Importante [R/E] | Uma regra única aplicada a todos, sem retoque manual. |
| PARTES 00–06 × seções | As partes e as seções têm a mesma aparência (Arial 12, negrito, caixa alta), então a hierarquia não aparece. | Diferenciar as PARTES de forma leve, por exemplo com corpo 14 ou espaço maior antes, mantendo fonte e cor do modelo. | Opcional [R] | A NBR 6024 pede destaque gráfico progressivo entre os níveis. |
| "RESPOSITÓRIOS E ARTEFATOS DO PROJETO" | Erro de digitação no título, que também aparece no sumário. | "REPOSITÓRIOS E ARTEFATOS DO PROJETO". | Importante [E] | Erro visível no sumário. |

### 2.3. Parágrafos, recuos e espaçamento

| Localização | Problema identificado | Correção proposta | Prioridade | Justificativa |
| --- | --- | --- | --- | --- |
| 22.1, 22.2, 22.3 e 22.4 (p. 64–69) e alguns parágrafos de 23 | **Uma linha por parágrafo.** O texto foi colado de um PDF ou e-mail com quebra em cada linha (cerca de 100 parágrafos curtos). As margens direitas ficam irregulares, e qualquer edição desalinha tudo. | Juntar as linhas de cada parágrafo, retirando as quebras internas, e aplicar o estilo de corpo do texto. | Crítica [R] | É o problema visual mais evidente nas p. 64–69 e impede a manutenção do texto. |
| Introdução da Parte 02 (p. 10) e Objetivos (p. 12) | Frases cortadas ao meio por parágrafo vazio: "…responsividade e testes / ⏎ / de integração…" e "…utilizando Prisma. A / ⏎ / arquitetura definida…". | Juntar as duas metades de cada frase. | Importante [R] | Cria um espaço em branco no meio da frase. |
| Situação atual (5), Objetivos (6) e outros | O recuo de primeira linha foi feito com três espaços digitados. Em outros trechos é recuo de verdade (0,6 cm) ou não existe. | Retirar os espaços iniciais e usar o mesmo recuo de primeira linha em todo o corpo, definido no estilo Normal. | Importante [R] | Uniformidade e manutenção. A ABNT não fixa o valor, mas pede consistência. |
| Corpo do texto | Os recuos à esquerda variam: 1812, 1898, 2125, 2160 e 2880 twips. | Padronizar o corpo em um único recuo à esquerda, o atual de 1812 twips (3,2 cm a partir da margem), reservando recuo maior só para listas. | Importante [R] | Mantém o alinhamento do modelo e resolve as variações. |
| Documento todo | **316 parágrafos vazios** usados como espaço, com até 12 seguidos na capa e grupos de 3 a 8 em várias seções. | Trocar os grupos por "espaço antes/depois" no estilo e excluir os vazios redundantes. Na capa, manter só o necessário para o leiaute. | Importante [R] | Espaçamento estável e previsível. Influencia diretamente as quebras de página. |
| Documento todo | O controle de linhas órfãs e viúvas está desligado no padrão do documento. | Ativar "Evitar linhas órfãs e viúvas" no estilo Normal (Formatar → Espaçamento entre linhas e parágrafos → Espaçamento personalizado). | Importante [R] | Evita linhas soltas no topo ou no pé das páginas. |
| Listas | Coexistem marcadores automáticos (●), hífens digitados ("- Acessa…", "- Perfil e senha:…") e numeração 1.–3. (18.2). Na 22.2, "-Carrinho:" está sem espaço e sem negrito, diferente dos demais itens. | Converter os hífens em lista com marcadores. Manter numeração só onde há sequência. Padronizar o negrito dos rótulos. | Importante [R] | Consistência entre seções equivalentes. |
| Contratos da 22.2 (p. 66–67) | Itens justificados, com rotas longas, criam espaços enormes entre as palavras ("moderação          administrativa por"). | Alinhar à esquerda só esses itens de lista. | Opcional [E] | Justificar linhas com rotas longas distorce o espaçamento. |
| Avaliação Geral | "Possibilidades de evolução futura:" está sem negrito, enquanto os outros rótulos da seção estão em negrito. | Aplicar negrito. | Opcional [E] | Consistência local. |

### 2.4. Margens, rodapé e quebras de página

| Localização | Problema identificado | Correção proposta | Prioridade | Justificativa |
| --- | --- | --- | --- | --- |
| Rodapé (p. 9, 12, 52, 56 e outras) | **A imagem do rodapé cobre a última linha de texto.** A imagem tem 2,22 cm de altura, e a margem inferior é de 2,05 cm. | Aumentar a margem inferior para cerca de 2,8 cm (Arquivo → Configuração da página), mantendo o rodapé. | Crítica [R] | Há texto ilegível no documento entregue. |
| Margens laterais | Esquerda 1,5 cm e direita 1,25 cm, mais o recuo de 3,2 cm do corpo. A NBR 14724 recomenda 3 cm à esquerda e 2 cm à direita. | Verificar com o modelo da disciplina. Se o modelo da UniEVANGÉLICA definir essas margens, manter. | Opcional [N] | A identidade do modelo institucional tem prioridade, e a mudança afetaria todas as páginas. |
| Início das PARTES | As Partes 00, 02, 05 e 06 começam no topo da página. As Partes 01 (p. 5), 03 (p. 14) e 04 (p. 41) começam no meio. | Começar todas as PARTES em página nova (Inserir → Quebra → Quebra de página antes do título). | Importante [R] | Padroniza a divisão do documento. Acrescenta cerca de 2 a 3 páginas. |
| Títulos isolados no pé da página | "19.2 Experimentação Técnica…" (p. 59) e "21 TECNOLOGIAS E FERRAMENTAS…" (p. 63) ficam na última linha, com o texto na página seguinte. | Resolver com "Manter com o próximo" nos estilos de título e com a remoção dos parágrafos vazios. Se ainda ocorrer, usar quebra de página antes do título, só na revisão final. | Importante [R] | Título isolado prejudica a leitura. |
| Rótulos separados das figuras | "Fluxograma de Análises do Administrador:" (p. 42→43), "Fluxograma do Cadastro do Lojista:" (p. 43→44), "Fluxograma do Cadastro do Pet Sitter:" (p. 46→47) e "Fluxograma de Navegação do Tutor:" (p. 49, com a figura e uma página quase vazia em seguida). | Transformar os rótulos em legenda junto da figura (2.5) e aplicar "Manter com o próximo". | Importante [R] | A figura fica longe do título. |
| Páginas com grande área vazia | p. 19 (metade), 45, 49 (2/3 vazia), 51, 54, 55 e 60. | A maior parte se resolve com os itens acima. Na revisão final, ajustar o tamanho das figuras que não cabem. | Opcional [R] | Depende das correções anteriores. |
| Tabelas de requisitos | Em algumas tabelas, a linha do item fica numa página e a linha "Detalhamento" na seguinte (RNE-014 p. 25→26, RF-011 p. 31→32, RF-030 p. 36→37). | Avaliar na revisão final, depois das outras correções, e usar quebra de página só nos casos que restarem. | Opcional [R] | As quebras mudam a cada ajuste. Corrigir antes seria retrabalho. |

### 2.5. Tabelas e figuras

| Localização | Problema identificado | Correção proposta | Prioridade | Justificativa |
| --- | --- | --- | --- | --- |
| Gráficos de "Canais de compra" (p. 20 e 21) | O gráfico "Onde compram produtos / Compras online" aparece duas vezes. A imagem está repetida no mesmo parágrafo. | Excluir a cópia duplicada. | Importante [E] | Repetição de conteúdo. |
| Figuras (gráficos da pesquisa, fluxogramas, protótipo, DER, arquitetura, rastreabilidade) | Só a figura do pipeline (p. 72) tem legenda e fonte. As demais têm rótulos em formatos diferentes (caixa alta acima, "Fluxograma …:" acima com dois-pontos, texto centralizado abaixo). | Padronizar como "Figura N – Título" acima da figura e "Fonte: …" abaixo, em corpo 10, centralizado. | Importante [N] | NBR 14724 (ilustrações). Também resolve os rótulos separados das figuras. |
| Fluxogramas (p. 42–51), DER do módulo 2 (p. 55), rastreabilidade (p. 73) | Diagramas pequenos e de baixo contraste, com texto ilegível em tamanho de página (DER 2 e fluxogramas). | Exportar de novo as imagens em resolução maior e ampliar até a largura do texto, ou dividir os diagramas grandes. | Importante [R] | Legibilidade. Exige que a equipe refaça as imagens. |
| Cor do cabeçalho das tabelas | 72 tabelas (Histórico e as 71 de requisitos) usam azul `006FC0`. As cinco tabelas gerais restantes (as duas de Problemas, Equipe, Artefatos e Cronograma) usam `4F81BC`. | Usar `006FC0` em todas. | Opcional [E] | Consistência entre tabelas. |
| Largura das tabelas | Larguras de 8.923 a 10.545 twips. Artefatos (4) e Cronograma (7) passam da área de texto (10.302). Problemas (2.2) e Equipe (3) são mais estreitas. | Ajustar as tabelas gerais à largura do texto e alinhá-las à mesma margem esquerda das tabelas de requisitos. | Importante [R] | Alinhamento e uso uniforme do espaço. |
| Alinhamento nas células | Textos longos centralizados nas tabelas Histórico (descrição), Equipe (função), Artefatos (descrição) e Cronograma (atividades). | Centralizar só cabeçalhos e campos curtos (versão, data, matrícula). Textos longos alinhados à esquerda, com espaçamento simples. | Importante [R] | Leitura de texto longo centralizado é difícil. |
| Tabela do Cronograma (p. 13–14) | A tabela continua na p. 14 sem repetir o cabeçalho. | Marcar "Fixar linha do cabeçalho" (Propriedades da tabela → Linha). | Opcional [R] | Leitura da continuação. |
| Tabelas gerais | Não têm título nem fonte. | Avaliar com o modelo: "Quadro N – Título" acima, para Histórico, Problemas, Equipe, Artefatos e Cronograma. Não recomendo título em cada uma das 69 tabelas de requisitos: o "ID" já identifica, e a numeração ficaria extensa. | Opcional [N] | ABNT e IBGE para tabelas e quadros, aplicadas de forma proporcional. |

### 2.6. Capa e elementos pré-textuais

| Localização | Problema identificado | Correção proposta | Prioridade | Justificativa |
| --- | --- | --- | --- | --- |
| Capa (p. 1) | Traz só "Documento de Especificação de PFC" e "Pet+". Faltam autores, curso, cidade e ano. | Verificar com o modelo da disciplina. Se não houver orientação contrária, acrescentar curso, equipe ou orientador, cidade e ano na parte inferior. | Opcional [N] | Elementos de capa da NBR 14724. Depende do modelo da instituição. |

## 3. Estratégia de padronização

1. **Estilos como fonte única.** Ajustar e salvar no Google Docs:
   - **Texto normal:** Arial 12, justificado, espaçamento 1,5, recuo esquerdo de 3,2 cm, recuo de primeira linha único, espaço depois de 6 pt e controle de órfãs e viúvas ligado.
   - **Título 1 (seções numeradas):** alinhado à esquerda, recuo e tabulação únicos, "Manter com o próximo".
   - **Título 2 (subseções x.y):** idem.

   Usar "Atualizar … para corresponder" em cada estilo. Assim, todas as ocorrências passam a seguir a mesma regra.
2. **Uma lista de numeração só para os títulos.** É a lista que já numera as seções 1 a 25, com dois níveis (x e x.y). Os números digitados à mão saem.
3. **Títulos só onde há seção.** Rótulos, linhas de passo a passo e legendas voltam a ser texto normal ou legenda.
4. **Sumário automático por último,** depois que os títulos estiverem corretos.
5. **Figuras e tabelas com modelo de legenda único,** com o mesmo texto, tamanho e posição em todas.

## 4. Impactos previstos

- **Paginação:**
  - A margem inferior maior acrescenta páginas.
  - As PARTES em página nova acrescentam de 2 a 3 páginas.
  - Juntar as linhas da 22.x e remover parágrafos vazios reduz páginas.
  - O total deve ficar entre 78 e 84 páginas.
- **Sumário:** precisa ser gerado de novo depois das alterações. Os números de página do atual estão errados de qualquer forma.
- **Numeração:** se "Organização do código" virar a seção 23, Qualidade passa a 24, Segurança a 25, Extensões a 26 e Avaliação a 27. Essa numeração coincide com o sumário atual e com a usada pelo orientador nos apontamentos ("26 — Extensões"). Se continuar como 22.4, Qualidade fica 23, Segurança 24, Extensões 25 e Avaliação 26.
- **Sugestões pendentes:** as alterações de formatação devem ser feitas **depois** de aceitar ou rejeitar as sugestões das revisões anteriores. Sobre texto com sugestão pendente, a mudança de estilo fica confusa e pode duplicar trechos.
- **Conteúdo:** nenhuma alteração de texto técnico, requisito, identificador ou relacionamento. As únicas mudanças de texto são o erro "RESPOSITÓRIOS", os números de título digitados à mão e a junção de frases quebradas.

## 5. Plano de execução

1. **Pré-requisitos:**
   - aceitar ou rejeitar todas as sugestões pendentes;
   - criar uma versão nomeada no histórico, por exemplo "Antes da formatação" (Arquivo → Histórico de versões → Nomear versão atual). Ela serve de ponto de retorno.
2. **Configuração da página:** margem inferior e, se aplicável, as margens laterais.
3. **Estilos:** Texto normal, Título 1 e Título 2 (estratégia 1).
4. **Títulos:**
   - remover os títulos vazios;
   - rebaixar rótulos e linhas indevidas para texto normal;
   - aplicar numeração automática à Qualidade e às subseções 22.x;
   - corrigir "RESPOSITÓRIOS".
5. **Parágrafos:**
   - juntar as linhas da 22.x e das frases cortadas;
   - retirar os espaços iniciais;
   - excluir parágrafos vazios redundantes;
   - converter hífens em listas.
6. **Figuras e tabelas:**
   - excluir o gráfico duplicado;
   - aplicar legendas;
   - padronizar largura, cor e alinhamento das tabelas;
   - fixar o cabeçalho do cronograma.
7. **Quebras de página:** PARTES em página nova.
8. **Número de página e sumário automático.**
9. **Revisão final de quebras:** títulos, rótulos e tabelas de requisitos que ainda fiquem separados, e páginas vazias.
10. **Exportar o PDF final e validar** (seção 6).

Os passos 2 e 3, o número de página e o sumário (passo 8) eu faço pelo navegador com segurança.

Os passos 4 a 6 envolvem centenas de pequenas edições: juntar cerca de 100 linhas, excluir cerca de 300 parágrafos vazios, ajustar cerca de 60 títulos. Pelo navegador funcionam, mas são lentos e sujeitos a erro de cursor, como os que já aconteceram e foram corrigidos nas rodadas anteriores. Por isso a proposta é fazer em lotes, conferindo cada lote contra a exportação do documento.

Refazer as imagens (fluxogramas, DER) depende da equipe.

## 6. Critérios de validação

1. **Texto preservado:** comparar o texto exportado antes e depois. Só podem mudar os pontos listados: espaços iniciais, parágrafos vazios, junção de linhas, números de título e o erro de digitação. Nenhuma palavra de requisito, ID ou relacionamento pode mudar.
2. **Estrutura:** no DOCX exportado, todos os títulos usam Título 1 ou Título 2, a sequência numérica não tem saltos nem repetições e não existe título vazio.
3. **Sumário:** cada entrada corresponde a um título do corpo, com o mesmo número e a página correta, conferida no PDF.
4. **Páginas:** no PDF final, nenhuma linha coberta pelo rodapé, nenhum título ou rótulo isolado no pé da página, PARTES no início da página e páginas vazias só onde forem intencionais.
5. **Tabelas e figuras:** mesma cor de cabeçalho, mesma largura de referência, legendas no mesmo formato e nenhuma figura duplicada.

## 7. Andamento da execução (28/10)

Concluído no Google Docs (modo Edição, ponto de retorno: versão "Antes da formatação (28/10)"):

- Margem inferior de 2,8 cm e números de página no cabeçalho (sem número na capa).
- "RESPOSITÓRIOS" corrigido para "REPOSITÓRIOS".
- Seções 23 a 27 com numeração automática: 23 Organização do código e repositório, 24 Qualidade, 25 Segurança, 26 Extensões, 27 Avaliação. Os prefixos digitados "22.4." e "23." foram removidos.
- Subseções 22.1 Front-end, 22.2 Back-end e 22.3 Integração como Título 2 numerado; os prefixos digitados foram removidos.
- Rótulos que estavam como título passaram a texto normal: Nome do Produto, Descrição do Produto, Fluxo de cada perfil, "Caminho principal...", Wireframe, DER, "Front-end - Desenvolvimento da Interface" e as oito linhas do caminho do Tutor.
- Gráfico duplicado da seção 12 ("Onde compram / Compras online") removido.
- Linhas quebradas unidas em parágrafos: 22.1, 22.2 e 22.3, o item TypeScript da seção 21 e os itens "Testes de integração com banco de dados" e "Integração contínua" da seção 24 (73 parágrafos a menos no total). Na lista de contratos da 22.2, os itens quebrados foram unidos, a lista foi alinhada à esquerda e "-Carrinho:", "-Pedidos:" e "- Pets:" receberam os espaços que faltavam.
- Espaçamento: "reaispermanecem" corrigido para "reais permanecem".
- Frases cortadas por linha em branco unidas: "responsividade e testes / de integração" (Parte 02), "processados pela aplicação. A / arquitetura" (Objetivos) e "o perfil do / usuário" (Segurança, JWT).
- Espaços digitados no início de parágrafos removidos (72 ocorrências). Nas seções 5, 6 e 25 foi aplicado recuo de primeira linha de 0,61 cm, o mesmo do restante do corpo.
- Negrito em "Possibilidades de evolução futura:" e em "Testes de integração com banco de dados:".
- "Evitar linhas únicas" (controle de linhas órfãs e viúvas) ativado em todo o documento.
- Partes 01, 03 e 04 começam em página nova ("Adicionar quebra de página antes do texto" no título).
- Sumário: o conteúdo antigo, copiado de outro documento, foi excluído e o bloco de sumário do Docs foi atualizado a partir dos títulos deste documento. Ele lista as Partes 00 a 06, as seções 1 a 27 e as subseções, com números de página.
- Formatação do sumário (escolhida pela Laura): Arial 10, espaçamento simples, Partes em negrito, sem recuo e com 8 pt antes; seções sem negrito, com recuo de 0,5 cm; subseções com recuo de 1 cm. Cabe em uma página. Atenção: o botão "Atualizar sumário" do Docs pode desfazer essa formatação; se for usado, reaplicar.
- Figuras: 22 legendas no padrão "Figura N – Título", em negrito e centralizadas, acima da imagem; abaixo de cada uma, "Fonte: elaborado pelos autores (2026)." (Figuras 1 a 20, conforme definido pela Laura). Nas Figuras 21 (pipeline) e 22 (rastreabilidade), a linha de baixo manteve a fonte original ("Fonte: repositório do projeto…" e "Fonte: elaboração própria…").

Verificação: a cada lote, a exportação do documento manteve o mesmo texto da exportação anterior, ignorando espaços (fora do sumário, que foi refeito, e das legendas e fontes inseridas). Na exportação final: 26 imagens (a única removida foi a duplicada), 22 legendas, 22 linhas de fonte e nenhuma linha quebrada restante.

Não feito (opcional):

- Cor do cabeçalho de 5 tabelas (4F81BC em vez de 006FC0): as duas de "Problemas Identificados", Equipe, Repositórios e Cronograma. No Docs: selecionar as células do cabeçalho, clicar em Cor de fundo e escolher a cor personalizada 006FC0.
- Títulos e parágrafos vazios restantes e listas com hífen (impacto visual pequeno).
- Revisão de página a página no PDF final (títulos isolados no pé da página e páginas com grande área vazia), que depende de baixar o PDF.
