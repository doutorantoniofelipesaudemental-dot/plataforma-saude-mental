const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCsv, gerarPilares, EIXOS_OFICIAIS } = require('../../scripts/plano-diretor/pilares');

const CSV = [
  'slug,titulo,eixo_nome,revisar,status',
  'b-texto,"Título, com vírgula",Transtornos Mentais,não,publicado',
  'a-texto,"Aspas ""duplas""",Transtornos Mentais,não,publicado',
  'rev-texto,Em revisão,Transtornos Mentais,sim,publicado',
  'agendado-texto,Agendado,Transtornos Mentais,não,agendado',
  'fora-texto,Fora,Transtornos Mentais,não,fora',
  'sem-eixo,Sem eixo,Eixo inventado,não,publicado',
].join('\n');

test('parseCsv lê campos com vírgula e aspas', () => {
  const r = parseCsv(CSV);
  assert.equal(r.length, 6);
  assert.equal(r[0].titulo, 'Título, com vírgula');
  assert.equal(r[1].titulo, 'Aspas "duplas"');
});

test('gerarPilares: só publicado, sem revisão, eixo oficial, ordem alfabética', () => {
  const p = gerarPilares(parseCsv(CSV));
  assert.deepEqual(p['Transtornos Mentais'].map((x) => x.slug), ['a-texto', 'b-texto']);
  assert.equal(Object.keys(p).length, EIXOS_OFICIAIS.length);
});

test('parseCsv aceita CRLF', () => {
  const r = parseCsv(CSV.replace(/\n/g, '\r\n'));
  assert.equal(r[0].slug, 'b-texto');
  assert.equal(r[0].status, 'publicado');
});
