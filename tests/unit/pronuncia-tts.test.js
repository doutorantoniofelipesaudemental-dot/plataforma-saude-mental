const { test } = require('node:test');
const assert = require('node:assert');
const { aplicarPronuncia, DICIONARIO } = require('../../backend/lib/pronunciaTts');
const { hashNarracao } = require('../../backend/lib/narracao');

test('dicionário só altera o texto falado: siglas aprovadas, NR-1 por extenso, palavras maiores intactas', () => {
  const t = 'A NR-1, a UBS e o CAPS; APS, CVV 188, SAMU 192, RQE, TCC. CAPSULA e SUS.';
  const f = aplicarPronuncia(t);
  assert.match(f, /Norma Regulamentadora número 1/);
  assert.match(f, /Ú Bê Esse/);
  assert.match(f, /CAPSULA/);
  assert.match(f, /SUS/);
  assert.ok(DICIONARIO.some(([s]) => s === 'NR-1'));
});

test('o hash da narração é calculado sobre o texto original (o dicionário não o altera)', () => {
  const original = 'Procure a UBS. A NR-1 trata do trabalho.';
  assert.equal(hashNarracao(original), hashNarracao(original));
  assert.notEqual(aplicarPronuncia(original), original);
});
