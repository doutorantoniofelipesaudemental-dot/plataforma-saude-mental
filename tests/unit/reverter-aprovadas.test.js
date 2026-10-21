const test = require('node:test');
const assert = require('node:assert/strict');
const { reverterTexto, reverterJson } = require('../../scripts/revisao/reverterAprovadasSemRegistro');

test('frontmatter com "aprovada" volta a "pendente" e perde o revisadoEm que acompanhava', () => {
  const antes = '---\ntitulo: X\nrevisaoMedica: aprovada\nrevisadoEm: 2026-10-19T10:00:00.000Z\n---\nCorpo.';
  const r = reverterTexto(antes);
  assert.equal(r.mudou, true);
  assert.equal(r.texto, '---\ntitulo: X\nrevisaoMedica: pendente\n---\nCorpo.');
});

test('CRLF: a linha trocada mantém o fim de linha; o arquivo não fica com finais misturados', () => {
  const antes = '---\r\ntitulo: X\r\nrevisaoMedica: aprovada\r\nrevisadoEm: 2026-10-01T09:45:45.973Z\r\n---\r\nCorpo.\r\n';
  const r = reverterTexto(antes);
  assert.equal(r.texto, '---\r\ntitulo: X\r\nrevisaoMedica: pendente\r\n---\r\nCorpo.\r\n');
  const linhas = r.texto.split('\n').slice(0, -1);
  assert.equal(linhas.filter((l) => !l.endsWith('\r')).length, 0);
});

test('texto que não tem "aprovada" no frontmatter não muda', () => {
  const t = '---\nrevisaoMedica: pendente\n---\nTexto que fala em revisaoMedica: aprovada no corpo.';
  assert.deepEqual(reverterTexto(t), { texto: t, mudou: false });
});

test('registro JSON: cada "aprovada" vira "pendente" e o resto do arquivo fica igual', () => {
  const j = '{"id":1,"rascunho":{"revisaoMedica": "aprovada"}}\n{"id":2,"rascunho":{"revisaoMedica": "aprovada"}}';
  const r = reverterJson(j);
  assert.equal(r.mudou, 2);
  assert.equal(r.texto, '{"id":1,"rascunho":{"revisaoMedica": "pendente"}}\n{"id":2,"rascunho":{"revisaoMedica": "pendente"}}');
});
