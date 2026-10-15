// Assinatura oficial do CFM: 5 linhas no portal/blog, 3 nas mídias sociais.
// Fonte única: IDENTIFICACAO_COMPLETA (conformidadeCfm.js); HTMLs e CLAUDE.md têm de coincidir.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { IDENTIFICACAO_COMPLETA } = require('../../backend/lib/conformidadeCfm');
const { IDENTIFICACAO_3_LINHAS } = require('../../backend/lib/legendaInstagram');
const { checarEticaCfm, LINHAS_PORTAL } = require('../../backend/lib/checagensAprovacao');

const RAIZ = path.join(__dirname, '..', '..');
const OFICIAL = [
  'Dr. Antônio Felipe — Médico — CRM-BA 41322',
  'Especialista em Medicina de Família e Comunidade — RQE 26638',
  'Atua no Pronto Atendimento Psiquiátrico e na Atenção Primária à Saúde',
  'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho',
  'NÃO ESPECIALISTA',
];
const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8').replace(/\r\n/g, '\n');

test('assinatura de 5 linhas: texto oficial, com "NÃO ESPECIALISTA" isolado na última linha', () => {
  assert.deepStrictEqual(IDENTIFICACAO_COMPLETA.split('\n'), OFICIAL);
  assert.deepStrictEqual(LINHAS_PORTAL, OFICIAL);
  assert.strictEqual(LINHAS_PORTAL.at(-1), 'NÃO ESPECIALISTA');
  // a assinatura curta das mídias sociais (3 linhas) é outra: não lista pós-graduações e mantém "·", PAP e APS
  assert.ok(!IDENTIFICACAO_3_LINHAS.includes('Pós-graduação'));
  assert.ok(OFICIAL[3].includes('Terapia Cognitivo-Comportamental'), 'a TCC está na assinatura padrão');
});

test('checagem CFM do portal exige as 5 linhas exatas (a 4ª SEM ponto final)', () => {
  const texto = 'Se você anda cansado, saiba que cuidar de si também é cuidar de quem você ama, e tudo bem pedir ajuda no seu tempo.';
  assert.deepStrictEqual(checarEticaCfm(`${texto}\n\n${OFICIAL.join('\n')}`).falhas, []);
  const semPonto = OFICIAL.join('\n').replace('Trabalho', 'Trabalho.'); // o ponto final da redação antiga agora é erro
  assert.ok(checarEticaCfm(`${texto}\n\n${semPonto}`).falhas.some((f) => /5 linhas/.test(f)));
  const semNao = OFICIAL.slice(0, 4).join('\n');
  assert.ok(checarEticaCfm(`${texto}\n\n${semNao}`).falhas.some((f) => /5 linhas/.test(f)));
});

test('CLAUDE.md traz o mesmo padrão de 5 linhas do código', () => {
  assert.ok(ler('CLAUDE.md').includes(OFICIAL.join('\n')));
});

test('HTMLs do portal: as 5 linhas aparecem, cada uma no seu lugar, com NÃO ESPECIALISTA por último', () => {
  for (const pagina of ['index.html', 'blog.html', 'artigo.html', 'instagram.html']) {
    const html = ler(`public/${pagina}`);
    for (const linha of OFICIAL.filter((l) => l !== OFICIAL[0] && l !== 'NÃO ESPECIALISTA')) {
      assert.ok(html.includes(linha), `${pagina}: falta "${linha.slice(0, 40)}…"`);
    }
    assert.ok(html.includes(OFICIAL[0]) || pagina === 'index.html', `${pagina}: falta a linha do CRM`);
    assert.ok(/NÃO ESPECIALISTA/.test(html), `${pagina}: falta NÃO ESPECIALISTA`);
    assert.ok(!/com pós-graduações em Psiquiatria/.test(html), `${pagina}: ainda tem a bio antiga sem "NÃO ESPECIALISTA"`);
  }
});

test('páginas públicas (início, blog, artigo e Instagram) trazem a nota de transparência de IA (Res. CFM 2.454/2026), igual à fonte única', () => {
  const { AVISO_CFM } = require('../../backend/lib/conformidadeCfm');
  for (const pagina of ['index.html', 'blog.html', 'artigo.html', 'instagram.html']) {
    const html = ler(`public/${pagina}`);
    assert.ok(html.includes(AVISO_CFM), `${pagina}: falta a nota de IA com a Resolução CFM 2.454/2026`);
    assert.strictEqual((html.match(/id="nota-ia"/g) || []).length, 1, `${pagina}: a nota de IA deve aparecer uma só vez (id nota-ia)`);
  }
  // A página pré-renderizada parte do mesmo template, então herda a nota.
  const { renderizarArtigoHtml } = require('../../backend/lib/renderizarArtigo');
  const pre = renderizarArtigoHtml({
    titulo: 'Teste', slug: 'teste', resumo: 'Resumo', conteudo: '<p>Texto</p>', categoria: 'Teste', autor: 'Dr. Antônio Felipe',
    tempoLeitura: 1, publicadoEm: new Date('2026-10-05'), atualizadoEm: new Date('2026-10-05'),
  });
  assert.ok(pre.includes(AVISO_CFM), 'página pré-renderizada sem a nota de IA');
});
