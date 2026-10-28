const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Regressão (27/10/2026): o pedido de autorização usa só o escopo mínimo que cobre os métodos usados.
test('script de autorização pede youtube.force-ssl e não pede os escopos amplos antigos', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../scripts/youtube-autorizar.js'), 'utf8');
  assert.match(src, /scope: 'https:\/\/www\.googleapis\.com\/auth\/youtube\.force-ssl'/);
  assert.doesNotMatch(src, /auth\/youtube\.upload/);
  assert.doesNotMatch(src, /auth\/youtube'/);
});
