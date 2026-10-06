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
  'Dr. Antônio Felipe · Médico · CRM-BA 41322',
  'Especialista em Medicina de Família e Comunidade · RQE 26638',
  'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)',
  'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Terapia Cognitivo-Comportamental, Neuropsicologia e Medicina do Trabalho.',
  'NÃO ESPECIALISTA',
];
const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8').replace(/\r\n/g, '\n');

test('assinatura de 5 linhas: texto oficial, com "NÃO ESPECIALISTA" isolado na última linha', () => {
  assert.deepStrictEqual(IDENTIFICACAO_COMPLETA.split('\n'), OFICIAL);
  assert.deepStrictEqual(LINHAS_PORTAL, OFICIAL);
  assert.strictEqual(LINHAS_PORTAL.at(-1), 'NÃO ESPECIALISTA');
  assert.deepStrictEqual(IDENTIFICACAO_3_LINHAS.split('\n'), OFICIAL.slice(0, 3));
});

test('checagem CFM do portal exige as 5 linhas exatas (inclusive o ponto final da 4ª)', () => {
  const texto = 'Se você anda cansado, saiba que cuidar de si também é cuidar de quem você ama, e tudo bem pedir ajuda no seu tempo.';
  assert.deepStrictEqual(checarEticaCfm(`${texto}\n\n${OFICIAL.join('\n')}`).falhas, []);
  const semPonto = OFICIAL.join('\n').replace('Trabalho.', 'Trabalho');
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
    for (const linha of OFICIAL.filter((l) => l !== 'Dr. Antônio Felipe · Médico · CRM-BA 41322' && l !== 'NÃO ESPECIALISTA')) {
      assert.ok(html.includes(linha), `${pagina}: falta "${linha.slice(0, 40)}…"`);
    }
    assert.ok(html.includes('Dr. Antônio Felipe · Médico · CRM-BA 41322'), `${pagina}: falta a linha do CRM`);
    assert.ok(/NÃO ESPECIALISTA/.test(html), `${pagina}: falta NÃO ESPECIALISTA`);
    assert.ok(!/com pós-graduações em Psiquiatria/.test(html), `${pagina}: ainda tem a bio antiga sem "NÃO ESPECIALISTA"`);
  }
});

test('template público do artigo traz a nota de transparência de IA (Res. CFM 2.454/2026), igual à fonte única', () => {
  const { AVISO_CFM } = require('../../backend/lib/conformidadeCfm');
  const html = ler('public/artigo.html');
  assert.ok(html.includes(AVISO_CFM), 'artigo.html: falta a nota de IA com a Resolução CFM 2.454/2026');
  assert.ok(html.includes('id="nota-ia"'), 'artigo.html: a nota de IA perdeu o id nota-ia');
  // A página pré-renderizada parte do mesmo template, então herda a nota.
  const { renderizarArtigoHtml } = require('../../backend/lib/renderizarArtigo');
  const pre = renderizarArtigoHtml({
    titulo: 'Teste', slug: 'teste', resumo: 'Resumo', conteudo: '<p>Texto</p>', categoria: 'Teste', autor: 'Dr. Antônio Felipe',
    tempoLeitura: 1, publicadoEm: new Date('2026-10-05'), atualizadoEm: new Date('2026-10-05'),
  });
  assert.ok(pre.includes(AVISO_CFM), 'página pré-renderizada sem a nota de IA');
});
