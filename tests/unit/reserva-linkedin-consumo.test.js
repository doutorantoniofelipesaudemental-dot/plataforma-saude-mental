const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../../scripts/consumoClaude');

// 20/10/2026 às 12:00 em Salvador
const AGORA = new Date('2026-10-20T15:00:00Z');
const hoje = (n) => Array.from({ length: n }, () => ({ dia: '2026-10-20', semana: '2026-10-19', quando: '2026-10-20T14:00:00Z' }));

test('reserva: com 2 chamadas no dia, as outras rotinas param (a última é do LinkedIn)', () => {
  const r = C.avaliar(hoje(2), AGORA, C.TETO, 'outra-rotina');
  assert.equal(r.pode, false);
  assert.match(r.motivo, /reservada ao LinkedIn/);
});

test('reserva: o LinkedIn pode usar a última chamada do dia', () => {
  const r = C.avaliar(hoje(2), AGORA, C.TETO, C.ORIGEM_LINKEDIN);
  assert.equal(r.pode, true);
});

test('teto: com 3 chamadas, nem o LinkedIn pode', () => {
  const r = C.avaliar(hoje(3), AGORA, C.TETO, C.ORIGEM_LINKEDIN);
  assert.equal(r.pode, false);
  assert.match(r.motivo, /teto diário/);
});

test('sem origem informada, a reserva também vale (regra conservadora)', () => {
  assert.equal(C.avaliar(hoje(2), AGORA, C.TETO).pode, false);
  assert.equal(C.avaliar(hoje(1), AGORA, C.TETO).pode, true);
});
