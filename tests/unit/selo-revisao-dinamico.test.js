const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../../backend/lib/revisaoMedica');

const corpo = 'Texto do artigo.\nSegunda linha.';
const hash = R.hashConteudo(corpo);
const aprovado = R.aprovar({ slug: 'x', hash, revisor: 'Dr. Antônio Felipe', data: '2026-11-02T13:00:00.000Z' });

test('sem registro: aviso de revisão pendente e nenhum selo', () => {
  const r = R.textoRevisaoPublica({ registro: null, corpo, atualizadoEm: '2026-11-01T00:00:00Z' });
  assert.equal(r.selo, null);
  assert.match(r.aviso, /Os textos revisados individualmente pelo autor exibem o selo/);
});

test('aprovação com o mesmo hash: selo com a data de Salvador', () => {
  const r = R.textoRevisaoPublica({ registro: aprovado, corpo });
  assert.equal(r.aviso, null);
  assert.equal(r.selo, 'Revisado pelo Dr. Antônio Felipe Garabito em 02/11/2026');
});

test('texto mudou depois da aprovação: aviso, sem selo', () => {
  const r = R.textoRevisaoPublica({ registro: aprovado, corpo: corpo + ' Nova frase.', atualizadoEm: '2026-11-03T00:00:00Z' });
  assert.equal(r.selo, null);
  assert.ok(r.aviso);
});

test('reprovada: nunca mostra selo', () => {
  const reprovado = R.reprovar({ slug: 'x', motivo: 'referência', data: '2026-11-02T13:00:00.000Z' });
  const r = R.textoRevisaoPublica({ registro: reprovado, corpo });
  assert.equal(r.selo, null);
});

test('CRLF não muda o hash (selo continua válido)', () => {
  const r = R.textoRevisaoPublica({ registro: aprovado, corpo: corpo.replace(/\n/g, '\r\n') });
  assert.ok(r.selo);
});
