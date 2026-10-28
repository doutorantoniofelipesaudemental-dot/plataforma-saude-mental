// Trava da validação de carrosséis (backend/lib/redesV2/travaValidacao.js): sem lote antes de 08:00 e 20:00, até 01/11, máximo 7.
const { test } = require('node:test');
const assert = require('node:assert');
const t = require('../../backend/lib/redesV2/travaValidacao');

const bahia = (hhmm, dia = '2026-10-25') => new Date(`${dia}T${hhmm}:00-03:00`);

test('bloqueia na hora anterior a 08:00 e 20:00 e libera fora dela', () => {
  assert.strictEqual(t.janelaProibida(bahia('07:00')), true);
  assert.strictEqual(t.janelaProibida(bahia('07:59')), true);
  assert.strictEqual(t.janelaProibida(bahia('08:00')), true);
  assert.strictEqual(t.janelaProibida(bahia('19:30')), true);
  assert.strictEqual(t.janelaProibida(bahia('20:00')), true);
  assert.strictEqual(t.janelaProibida(bahia('18:15')), false);
  assert.strictEqual(t.janelaProibida(bahia('08:01')), false);
  assert.strictEqual(t.janelaProibida(bahia('20:01')), false);
});

test('seleciona só não validados, até 01/11, no máximo 7, em ordem de data', () => {
  const posts = [
    { _id: 'a', dataSugerida: '2026-10-26T11:00:00Z' },
    { _id: 'b', dataSugerida: '2026-10-27T11:00:00Z' },
    { _id: 'c', dataSugerida: '2026-11-02T11:00:00Z' },
    { _id: 'd', dataSugerida: '2026-10-28T11:00:00Z' },
  ];
  const escolhidos = t.selecionarParaValidar({ posts, jaValidados: ['b'], agora: bahia('18:15') });
  assert.deepStrictEqual(escolhidos.map((p) => p._id), ['a', 'd']);
});

test('nunca passa de 7 posts por execução', () => {
  const posts = Array.from({ length: 20 }, (_, i) => ({ _id: `p${i}`, dataSugerida: `2026-10-${String(26 + (i % 5)).padStart(2, '0')}T11:00:00Z` }));
  assert.strictEqual(t.selecionarParaValidar({ posts, agora: bahia('18:15'), limite: 99 }).length, 7);
});

test('detecta o limite de chamadas da Meta (código 4)', () => {
  assert.strictEqual(t.ehLimiteMeta('Falha ao consultar o container do Instagram — código 4/1349210: Application request limit reached'), true);
  assert.strictEqual(t.ehLimiteMeta('código 190: token inválido'), false);
  assert.strictEqual(t.PAUSA_MS >= 60000, true);
});
