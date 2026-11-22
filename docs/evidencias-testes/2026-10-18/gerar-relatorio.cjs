const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('../../../frontend/node_modules/jsdom');
const sharp = require('../../../frontend/node_modules/sharp');

const root = path.resolve(__dirname, '../../..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const cases = [
  { id: 'CT-01', requirements: 'RF-001; RNE-001', requirement: 'Cadastro público', scenario: 'Tentativa de criar administrador pelo cadastro público.', expected: 'HTTP 422; operação rejeitada.', suite: 'backend', match: 'POST /register com role_id 1 (ADMIN)', source: 'backend/tests/integration/authRoutes.test.js', type: 'Integração HTTP; rejeição antes do acesso ao banco.', visual: true },
  { id: 'CT-02', requirements: 'RF-002; RNF-001', requirement: 'Controle de acesso', scenario: 'Login de usuário com is_active=false.', expected: 'Use case rejeita acesso com statusCode 403.', suite: 'backend', match: 'Usuário com is_active = false é bloqueado', source: 'backend/tests/unit/loginUseCase.test.js', type: 'Unitário; repositório e comparação de senha simulados.', visual: true },
  { id: 'CT-03', requirements: 'RF-016*', requirement: 'Recuperação de senha', scenario: 'Redefinição com a mesma senha atual.', expected: 'Reutilização recusada sem consumir o token.', suite: 'backend', match: 'reset de senha rejeita reutilizar a senha atual', source: 'backend/tests/unit/passwordResetUseCase.test.js', type: 'Unitário; persistência simulada; não envia e-mail real.', visual: true },
  { id: 'CT-04', requirements: 'RF-014', requirement: 'Carrinho do tutor', scenario: 'Adição de item ao carrinho pelo perfil Tutor.', expected: 'Resposta de sucesso 2xx.', suite: 'backend', match: 'addItem: TUTOR (5) retorna sucesso', source: 'backend/tests/integration/cartRoutes.test.js', type: 'Integração HTTP com Prisma simulado; não é teste com PostgreSQL.' },
  { id: 'CT-05', requirements: 'RF-022*; RNE-013*', requirement: 'Geração de pedidos', scenario: 'Finalização de carrinho com um lojista.', expected: 'Criar pedido/itens, registrar preço, baixar estoque e limpar carrinho.', suite: 'backend', match: 'Sucesso (Happy-Path Single Provider)', source: 'backend/tests/integration/orderRoutes.test.js', type: 'Integração HTTP com Prisma/repositórios simulados.', visual: true },
  { id: 'CT-06', requirements: 'RF-022*', requirement: 'Validação de estoque', scenario: 'Pedido com quantidade superior ao estoque disponível.', expected: 'HTTP 409; pedido não criado.', suite: 'backend', match: '409 e rollback se estoque for insuficiente na validação prévia', source: 'backend/tests/integration/orderRoutes.test.js', type: 'Integração HTTP com dependências simuladas; rejeição na validação prévia.' },
  { id: 'CT-07', requirements: 'RF-024*; RNE-011*', requirement: 'Pedidos do tutor', scenario: 'Consulta de pedidos autenticada como tutor A.', expected: 'Consulta limitada ao tutor A, sem retornar pedidos do tutor B.', suite: 'backend', match: 'isolamento de tutor — tutor A não vê pedidos de tutor B', source: 'backend/tests/integration/orderRoutes.test.js', type: 'Integração HTTP; consulta/persistência simuladas.' },
  { id: 'CT-08', requirements: 'RF-026*; RNE-010*', requirement: 'Propriedade do serviço', scenario: 'Parceiro tenta editar serviço de outra conta.', expected: 'HTTP 403; alteração não autorizada.', suite: 'backend', match: 'PUT /providers/services/:id: bloqueia serviço de outro parceiro', source: 'backend/tests/integration/serviceRoutes.test.js', type: 'Integração HTTP com Prisma/repositórios simulados.', visual: true },
  { id: 'CT-09', requirements: 'RF-023*; RNE-023*', requirement: 'Pagamento idempotente', scenario: 'Repetição de notificação de pagamento aprovado.', expected: 'Pedido confirmado uma vez, sem reaplicar efeitos.', suite: 'backend', match: 'webhook consulta pagamento e marca pedido PAGO atomicamente; duplicação não reaplica', source: 'backend/tests/unit/mercadoPagoPayment.test.js', type: 'Unitário; banco e gateway simulados; não comprova sandbox externo.', visual: true },
  { id: 'CT-10', requirements: 'RF-023*; RNE-023*', requirement: 'Confirmação na interface', scenario: 'Retorno com aprovação na URL, sem confirmação do backend.', expected: 'Interface aguarda confirmação e não anuncia pedido pago.', suite: 'frontend', match: 'retorno aprovado na URL aguarda webhook e não anuncia pedido pago', source: 'frontend/src/pages/CheckoutPaymentPage.test.tsx', type: 'Componente com respostas de API simuladas.', visual: true },
  { id: 'CT-11', requirements: 'RF-017*; RNE-016*', requirement: 'Correção de cadastro', scenario: 'Parceiro salva correções e solicita reanálise.', expected: 'Salvar os dados antes de chamar o reenvio.', suite: 'frontend', match: 'salva as correções e só então reenvia', source: 'frontend/src/pages/parceiro/CorrecaoCadastro.test.tsx', type: 'Componente com serviços simulados.', visual: true },
];

function parseReport(name) {
  const document = new JSDOM(fs.readFileSync(path.join(__dirname, name), 'utf8'), { contentType: 'text/xml' }).window.document;
  return [...document.querySelectorAll('testcase')].map((item) => ({
    name: item.getAttribute('name'),
    status: item.querySelector('failure, error') ? 'REPROVADO' : item.querySelector('skipped') ? 'NÃO EXECUTADO' : 'APROVADO',
  }));
}

const reports = { backend: parseReport('backend-junit.xml'), frontend: parseReport('frontend-junit.xml') };
for (const row of cases) {
  const matched = reports[row.suite].filter((item) => item.name.includes(row.match));
  if (matched.length !== 1) throw new Error(`${row.id}: esperado exatamente um teste, encontrados ${matched.length}.`);
  row.result = matched[0].status;
  row.testName = matched[0].name;
}

const summary = Object.fromEntries(Object.entries(reports).map(([suite, items]) => [suite, {
  tests: items.length,
  passed: items.filter((item) => item.status === 'APROVADO').length,
  failed: items.filter((item) => item.status === 'REPROVADO').length,
  skipped: items.filter((item) => item.status === 'NÃO EXECUTADO').length,
}]));
const evidence = { date: '18/10/2026', branch: git('branch', '--show-current'), commit: git('rev-parse', 'HEAD'), node: process.version, summary, cases };
fs.writeFileSync(path.join(__dirname, 'rastreabilidade.json'), JSON.stringify(evidence, null, 2) + '\n');

const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const wrap = (value, limit) => {
  const lines = [];
  for (const word of value.split(/\s+/)) {
    if (!lines.length || lines[lines.length - 1].length + word.length + 1 > limit) lines.push(word);
    else lines[lines.length - 1] += ` ${word}`;
  }
  return lines;
};
const text = (x, y, lines, size = 28, color = '#16334b', weight = 400) =>
  `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? '1.25em' : '0'}">${escape(line)}</tspan>`).join('')}</text>`;
const visualCases = cases.filter((item) => item.visual);
const all = Object.values(summary).reduce((acc, item) => ({ tests: acc.tests + item.tests, passed: acc.passed + item.passed, failed: acc.failed + item.failed, skipped: acc.skipped + item.skipped }), { tests: 0, passed: 0, failed: 0, skipped: 0 });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1320" viewBox="0 0 1800 1320">
<title>Rastreabilidade de requisitos e testes do Pet+</title>
<desc>Oito exemplos relacionam requisitos, cenários executados e seus resultados. A execução selecionada possui ${all.tests} testes, sendo ${all.passed} aprovados.</desc>
<rect width="1800" height="1320" fill="#ffffff"/>
<rect x="0" y="0" width="1800" height="10" fill="#168fca"/>
${text(60, 74, ['Pet+ | Requisitos e evidências de teste'], 42, '#123149', 700)}
${text(60, 120, [`Execução: 18/10/2026 | ${evidence.branch} | commit ${evidence.commit.slice(0, 7)}`], 25, '#465b6c')}
${text(60, 160, [`Recorte: ${all.tests} testes | ${all.passed} aprovados | ${all.failed} falhas | ${all.skipped} ignorados`], 26, '#146d4a', 700)}
<rect x="50" y="192" width="1700" height="64" fill="#eaf4fa"/>
${text(70, 234, ['REQUISITO'], 25, '#123149', 700)}
${text(550, 234, ['CENÁRIO EXECUTADO'], 25, '#123149', 700)}
${text(1480, 234, ['RESULTADO'], 25, '#123149', 700)}
${visualCases.map((row, index) => {
  const y = 256 + index * 108;
  return `<rect x="50" y="${y}" width="1700" height="108" fill="${index % 2 ? '#f5f8fa' : '#ffffff'}"/>
  ${text(70, y + 34, [`${row.id} · ${row.requirements}`], 26, '#123149', 700)}
  ${text(70, y + 72, wrap(row.requirement, 32), 25, '#465b6c')}
  ${text(550, y + 37, wrap(row.scenario, 55), 27)}
  ${text(1480, y + 57, [row.result], 25, row.result === 'APROVADO' ? '#146d4a' : '#a1272e', 700)}`;
}).join('\n')}
<line x1="50" y1="1140" x2="1750" y2="1140" stroke="#cbd6de"/>
${text(60, 1186, ['Resultado do teste não equivale ao aceite integral do requisito.'], 27, '#123149', 700)}
${text(60, 1227, ['* IDs propostos na revisão documental; confirmar numeração no documento final.'], 23, '#465b6c')}
${text(60, 1263, ['Recorte local com simulações. Não inclui PostgreSQL real, navegador E2E ou validação externa.'], 23, '#465b6c')}
</svg>`;
fs.writeFileSync(path.join(__dirname, 'matriz-rastreabilidade.svg'), svg);

const intro = `# Evidências de testes e rastreabilidade de requisitos\n\nExecução registrada em ${evidence.date}, branch \`${evidence.branch}\`, commit \`${evidence.commit}\`, Node.js ${evidence.node}.\n\n## Resultado efetivamente obtido\n\n| Suíte selecionada | Executados | Aprovados | Falhas | Ignorados |\n| --- | --- | --- | --- | --- |\n${Object.entries(summary).map(([suite, item]) => `| ${suite} | ${item.tests} | ${item.passed} | ${item.failed} | ${item.skipped} |`).join('\n')}\n\nAs contagens foram extraídas dos relatórios JUnit desta execução. Este é um recorte, não a suíte completa. Não foram executados testes com banco real, E2E de navegador ou serviços externos. O código testado é o commit acima da Tasks-Laura; não representa uma execução integral da main mais recente.\n\nOs IDs com asterisco são sugestões de numeração apresentadas em \`docs/funcional/REQUISITOS-TEXTOS-PARA-DOCUMENTO.md\`. Se o documento acadêmico adotou outros IDs, atualizar os vínculos antes de publicar.\n\n## Matriz de rastreabilidade\n\n| Caso | Requisitos | Cenário | Resultado esperado | Resultado obtido | Evidência |\n| --- | --- | --- | --- | --- | --- |\n${cases.map((row) => `| ${row.id} | ${row.requirements} | ${row.scenario} | ${row.expected} | ${row.result}: asserções do caso satisfeitas. | ${row.suite}-junit.xml; caso detalhado abaixo. |`).join('\n')}\n\n## Fichas prontas para transposição\n\n`;
const cards = cases.map((row) => `### ${row.id} — ${row.requirement}\n\n**Requisito relacionado:** ${row.requirements}.\n\n**Cenário executado:** ${row.scenario}\n\n**Tipo e ambiente:** ${row.type}\n\n**Resultado esperado:** ${row.expected}\n\n**Resultado obtido:** ${row.result}. ${row.result === 'APROVADO' ? 'As asserções do teste foram satisfeitas durante a execução registrada.' : 'Consultar o relatório bruto antes de declarar atendimento.'}\n\n**Evidência:** relatório \`${row.suite}-junit.xml\`, teste “${row.testName}”.\n\n**Arquivo do teste:** \`${row.source}\`.\n`).join('\n');
const closing = `\n## Texto para acrescentar à seção 23\n\nPara relacionar os testes aos requisitos do Pet+, foi elaborada uma matriz de rastreabilidade contendo o identificador do requisito, o cenário exercitado, o resultado esperado, o resultado obtido e a referência da evidência. Em uma execução local de um recorte dos testes automatizados, foram registrados ${all.tests} testes, com ${all.passed} aprovações, ${all.failed} falhas e ${all.skipped} casos ignorados. Os resultados incluem verificações de cadastro, acesso, recuperação de senha, carrinho, pedidos, serviços e comportamento de componentes da interface. Os relatórios JUnit e as fichas dos casos permitem localizar o teste correspondente a cada requisito e identificar se houve uso de dependências simuladas. A aprovação de um cenário demonstra o comportamento exercitado, mas não representa, isoladamente, o atendimento integral do requisito nem comprova o funcionamento do ambiente de produção ou de serviços externos.\n\n**Legenda da figura:** Figura X — Exemplos da relação entre requisitos, cenários de teste executados e resultados obtidos no Pet+. Fonte: elaboração própria, com base nos relatórios de execução de 18/10/2026, commit ${evidence.commit.slice(0, 7)}.\n\n## Evidências complementares a reunir\n\n- CI: captura ou link da execução, identificando commit, data e jobs concluídos. Um print verde comprova os jobs daquela execução; os casos e asserts precisam ser vinculados à matriz.\n- PostgreSQL: execução de \`cartOrderDb.test.js\` em banco isolado, quando disponível, com relatório próprio. Não usar esta execução com mocks como comprovação de transação no banco real.\n- E-mail: teste manual registrado, com mensagem recebida e resultado do link, removendo dados pessoais e tokens das imagens.\n- Sandbox: pagamento de teste e webhook aceito, com estado correspondente do pedido e identificação do caso. Não usar teste de gateway simulado como prova de pagamento externo.\n- Usabilidade/responsividade: identificar tela, tamanho, passos, resultado e evidência; manter falhas e pendências registradas.\n\n## Modelo para casos ainda não executados\n\n**Caso:** preencher identificador.\n\n**Requisito:** preencher ID e descrição.\n\n**Data, ambiente e versão:** preencher após a execução.\n\n**Pré-condições e passos:** descrever conta, dados de teste e ações.\n\n**Resultado esperado:** definir antes de executar.\n\n**Resultado obtido:** NÃO EXECUTADO até haver execução registrada.\n\n**Evidência:** indicar relatório, captura ou execução do CI.\n\n**Pendência:** registrar falha ou limitação e ação necessária.\n`;
fs.writeFileSync(path.join(__dirname, 'MATRIZ-E-FICHAS.md'), intro + cards + closing);
sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, 'matriz-rastreabilidade.png')).then(() => {
  console.log(JSON.stringify({ ...evidence, cases: cases.length, figure: 'matriz-rastreabilidade.png' }, null, 2));
}).catch((error) => { console.error(error.message); process.exitCode = 1; });
