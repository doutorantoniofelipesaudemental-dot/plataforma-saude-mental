const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MINIMO_CENAS, exigirCenasMinimas } = require('../../scripts/youtube/cenasMinimas');

test('vídeo com 1 cena é reprovado (imagem parada)', () => {
  assert.throws(() => exigirCenasMinimas(1, 'Short'), /reprovado: 1 cena\(s\), mínimo 2/);
});

test('zero, negativo, decimal e não numérico são reprovados', () => {
  for (const v of [0, -1, 1.5, NaN, undefined, '2']) assert.throws(() => exigirCenasMinimas(v));
});

test('vídeo com cenas suficientes passa e devolve o número', () => {
  assert.equal(exigirCenasMinimas(MINIMO_CENAS), MINIMO_CENAS);
  assert.equal(exigirCenasMinimas(5), 5);
});

test('os dois geradores de YouTube chamam a checagem antes de gerar', () => {
  for (const arq of ['gerarShorts.js', 'gerarVideosLongos.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'youtube', arq), 'utf8');
    assert.match(src, /require\('\.\/cenasMinimas'\)/, `${arq} importa a checagem`);
    assert.match(src, /exigirCenasMinimas\(1,/, `${arq} bloqueia com 1 cena`);
  }
});
