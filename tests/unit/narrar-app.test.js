const { test } = require('node:test');
const assert = require('node:assert/strict');
const n = require('../../scripts/narrar-app.js');

test('juntarLinhas: quebra dentro do parágrafo não vira frase nova', () => {
  const mdx = 'Professor não adoece só de cansaço.\nAdoece de entrar numa sala que\ndeixou de ser lugar de ensino.\n\nOutro parágrafo.';
  assert.equal(n.juntarLinhas(mdx), 'Professor não adoece só de cansaço. Adoece de entrar numa sala que deixou de ser lugar de ensino.\nOutro parágrafo.');
});

test('juntarLinhas: componente e título continuam em bloco próprio', () => {
  const mdx = '<Lead>\nTexto do lead.\n</Lead>\n## Título\nCorpo.';
  const linhas = n.juntarLinhas(mdx).split('\n');
  assert.equal(linhas[0], '<Lead>');
  assert.equal(linhas[1], 'Texto do lead.');
  assert.equal(linhas[2], '</Lead>');
  assert.equal(linhas[3], '## Título');
});

test('prepararTexto: sem CRM/RQE no corpo, com aviso de protocolos e um só aviso de referências', () => {
  const mdx = 'export const metadata = {\n  titulo: \'T\',\n};\n\n<p>Corpo do texto.</p>\n<RefsNote>\n<ol><li>Ref</li></ol>\n</RefsNote>\n<h2>Referências</h2>\n<ol><li>Outra</li></ol>';
  const p = n.prepararTexto({ titulo: 'T', mdx });
  assert.match(p.texto, /Corpo do texto\./);
  assert.equal(p.texto.split('As referências estão no fim da página.').length - 1, 1);
  assert.ok(p.texto.endsWith(n.PROTOCOLOS));
});

test('prepararTexto: reprova identificação do médico no corpo', () => {
  const mdx = '<p>Dr. Antônio Felipe, CRM-BA 41322.</p>';
  assert.throws(() => n.prepararTexto({ titulo: 'T', mdx }), /identificação do médico/);
});

test('werDe: 0 para texto igual, proporção de erros para texto diferente', () => {
  assert.equal(n.werDe('a b c d', 'a b c d'), 0);
  assert.equal(n.werDe('a b c d', 'a b x d'), 0.25);
  assert.equal(n.werDe('Um, dois!', 'um dois'), 0);
});

test('medirAudio: lê volume médio, pico e maior silêncio do ffmpeg', () => {
  const saida = '[Parsed_volumedetect_0] mean_volume: -21.4 dB\n[Parsed_volumedetect_0] max_volume: -3.2 dB\n[silencedetect] silence_end: 4.1 | silence_duration: 0.8\n[silencedetect] silence_end: 9.0 | silence_duration: 2.5';
  assert.deepEqual(n.medirAudio(saida), { medioDb: -21.4, picoDb: -3.2, silencioMaxSeg: 2.5 });
});

test('julgarAudio: passa quando tudo confere e reprova cada falha', () => {
  const ok = { duracaoSeg: 100, esperadaSeg: 101, analise: { medioDb: -20, picoDb: -3, silencioMaxSeg: 0.9 }, wer: 0.1 };
  assert.deepEqual(n.julgarAudio(ok), []);
  assert.equal(n.julgarAudio({ ...ok, duracaoSeg: 80 }).length, 1);
  assert.equal(n.julgarAudio({ ...ok, analise: { ...ok.analise, picoDb: 0 } }).length, 1);
  assert.equal(n.julgarAudio({ ...ok, analise: { ...ok.analise, silencioMaxSeg: 3 } }).length, 1);
  assert.equal(n.julgarAudio({ ...ok, wer: 0.4 }).length, 1);
});

test('auditarTexto: aponta "psiquiatra" junto do Dr. Antônio e "Antonio" sem acento', () => {
  assert.deepEqual(n.auditarTexto({ titulo: 'T', mdx: 'Dr. Antônio Felipe, psiquiatra.', texto: 'ok' }).length, 1);
  assert.deepEqual(n.auditarTexto({ titulo: 'T', mdx: 'Texto comum.', texto: 'O Antonio disse' }).length, 1);
  assert.deepEqual(n.auditarTexto({ titulo: 'T', mdx: 'Texto comum.', texto: 'Texto limpo.' }), []);
});
