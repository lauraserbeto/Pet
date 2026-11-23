# Documentação acadêmica — PFC do Pet+

Documento oficial do Projeto Integrador (PFC) do Pet+, entregue à orientação do curso.

| Arquivo | O que é |
|---|---|
| [`PFC-Especificacao-PetPlus-v7.2.pdf`](PFC-Especificacao-PetPlus-v7.2.pdf) | **Documento de Especificação de PFC**, versão **7.2** (22/11/2026), 85 páginas. Exportado do Google Docs. **Fonte oficial.** |
| [`PFC-Especificacao-PetPlus-v7.2.txt`](PFC-Especificacao-PetPlus-v7.2.txt) | Texto extraído automaticamente do PDF, só para busca textual (por exemplo, com grep). Sem tabelas, figuras nem formatação. Cada bloco começa com `[p.N]`, a página no PDF. |

Orientador principal: Prof. Luiz Carlos Barbosa Martins. A equipe e as funções estão na seção 3 do documento.

## Histórico de versões (seção 00 do documento)

| Versão | Período / fase | Data | Resumo |
|---|---|---|---|
| 6.0 | 6º / 01 | 08/03/2026 | Ajustes na documentação, planejamento do semestre, criação inicial do back-end e integração com front-end e banco |
| 6.1 | 6º / 02 | 19/04/2026 | Back-end próprio (Node.js, Express, Prisma) no lugar do Supabase; API no Railway; autenticação; perfil público e aprovação/onboarding de parceiros; CRUD de produtos; refinamento de UI/UX |
| 7.0 | 7º / 01 | 07/09/2026 | Regras de acesso ao carrinho do Tutor; remoção de dados demonstrativos; Sentry; melhorias iniciais de segurança |
| 7.1 | 7º / 02 | 18/10/2026 | Checkout com pedidos e pagamento simulado; acompanhamento de pedidos; e-mails de recuperação e recusa; reenvio de cadastro recusado; gestão de serviços e política de cobrança; endpoints de agendamento; Mercado Pago Sandbox opcional |
| **7.2** | 7º / 03 | **22/11/2026** | Contratação e acompanhamento de serviços; agenda dos parceiros; pré-pagamento e estorno simulados; avaliações por transação concluída; indicadores comerciais reais; carrinho, checkout e pedidos aprimorados (paginação, recuperação de falhas, proteção contra repetição); segurança, validação cadastral, moderação, acessibilidade e padronização visual; mais testes e verificações de infraestrutura |

## Sumário e onde cada assunto está no repositório

A página indicada é a do sumário do PDF. A última coluna aponta a documentação técnica do repositório que sustenta (ou deve ser conferida contra) cada seção.

| Parte / seção | Pág. | Documentação relacionada no repositório |
|---|---|---|
| **Parte 00** — Histórico de versão | 3 | `docs/Sprints/PLANO-RETOMADA-E-FECHAMENTO-2026-11-16.md` (registros das entregas) |
| **Parte 01** — 1 Identificação · 2 Descrição geral (2.1 Resumo do negócio, 2.2 Problemas) · 3 Equipe · 4 Repositórios e artefatos | 5–8 | `docs/funcional/01-visao-geral.md`; `README.md` da raiz; pitch em `pitch/` |
| **Parte 02** — 5 Situação atual · 6 Objetivos do semestre · 7 Cronograma | 9–14 | `docs/Sprints/README.md`, `STATUS-PROJETO-2026-11-16.md`, `PLANO-DESENVOLVIMENTO.md`/`.pdf` |
| **Parte 03** — 8 Público-alvo · 9 Contexto de negócio · 10 Soluções existentes · 11–12 Pesquisa com usuários | 15–21 | `docs/funcional/01-visao-geral.md`, `02-perfis-de-usuario.md` |
| 13 Regras de negócio | 22 | `docs/funcional/03-regras-de-negocio.md` |
| 14 Requisitos funcionais · 15 Requisitos não funcionais | 29 · 39 | `docs/funcional/04-requisitos.md`, `REVISAO-REQUISITOS-*.md`, `REQUISITOS-TEXTOS-PARA-DOCUMENTO.md` |
| **Parte 04** — 16 Design e UX (16.1 Fluxo de navegação, 16.2 Protótipos) | 43–54 | `docs/funcional/05-jornadas-de-usuario.md`, `docs/design-system.md`, `docs/auditoria-visual/` |
| 17 Gestão e modelagem (17.1 Abordagem ágil, 17.2 Diagramas) | 54–58 | `docs/Sprints/` (sprints e tasks), `docs/funcional/diagramas/` |
| 18 Dados e modelagem (18.1 Modelo de dados, 18.2 Estrutura e manipulação) | 59–62 | `docs/backend/02-banco-de-dados.md`, `backend/prisma/schema.prisma` e `migrations/` |
| 19 Solução tecnológica e experimentação inicial | 63 | `docs/backend/01-arquitetura.md` |
| **Parte 05** — 20 Arquitetura geral · 21 Tecnologias e ferramentas | 65–67 | `docs/backend/01-arquitetura.md`, `docs/funcional/SECOES-IMPLEMENTACAO-ARQUITETURA-PLANEJAMENTO.md` |
| 22 Implementação por camadas (22.1 Front-end, 22.2 Back-end, 22.3 Integração) | 68–72 | `docs/frontend/`, `docs/backend/03-api-endpoints.md`, `docs/integration-plan/` |
| 23 Organização do código e repositório | 73 | estrutura do repositório; `docs/runbooks/deploy-reprodutivel.md` |
| **Parte 06** — 24 Qualidade e testes | 75 | `docs/backend/04-seguranca-e-testes.md`, `docs/evidencias-testes/`, `docs/Sprints/Sprint-5-Fechamento/*-IMPLEMENTACAO-E-VALIDACAO.md`, `docs/Sprints/Sprint-5-Fechamento/RELEASE-CHECKLIST.md` |
| 25 Segurança da informação | 78 | `docs/backend/04-seguranca-e-testes.md`; registros SEC-2, E-09, E-10, E-35 |
| 26 Extensões e tecnologias complementares | 81 | registros de PAG-2 (Mercado Pago Sandbox), Sentry, Resend |
| 27 Avaliação geral do projeto integrador | 82 | `docs/Sprints/AUDITORIA-QUALIDADE-ESTABILIZACAO-PRE-SPRINT-4.md` |

## Cuidados ao usar e atualizar

- **O PDF é a referência oficial**; o `.txt` é derivado. Ao gerar uma nova versão, substituir os dois e atualizar a tabela de histórico acima. Manter o nome com a versão (`…-v7.3.pdf`) e remover a anterior só se a equipe não precisar dela no repositório; o histórico do Git preserva as versões já commitadas.
- A versão 7.2 descreve o estado de 22/11/2026. Entregas locais desta data que ainda não foram commitadas nem publicadas (por exemplo, a CSP efetiva da E-35) **só valem em produção após o deploy**. Conferir os registros `*-IMPLEMENTACAO-E-VALIDACAO.md` antes de citar algo como publicado.
- O PDF tem cerca de 17 MB. Se o tamanho do repositório incomodar, avaliar o Git LFS para PDFs antes de versionar novas edições.
- O documento não contém e-mails, telefones nem documentos pessoais (conferido na extração). Contém nomes e matrículas da equipe, já públicos no projeto.
