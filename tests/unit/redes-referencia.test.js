// Referência resumida dos carrosséis (backend/lib/redesV2/conteudo.js): sem espaço antes de vírgula/ponto, sem espaços duplos.
const { test } = require('node:test');
const assert = require('node:assert');
const { refResumida } = require('../../backend/lib/redesV2/conteudo');

test('revista com espaço antes do ponto não vira "Aging ,"', () => {
  const r = refResumida('Pinquart M, Sörensen S. Psychol Aging . 2003;18(2):250-67. doi:10.1037/0882-7974.18.2.250');
  assert.ok(!/\s[,.;:]/.test(r), r);
  assert.strictEqual(r, 'Pinquart M et al., Psychol Aging, 2003');
});

test('revista sem espaço extra continua igual', () => {
  const r = refResumida('Pinquart M, Sörensen S. Psychol Aging. 2003;18(2):250-67.');
  assert.strictEqual(r, 'Pinquart M et al., Psychol Aging, 2003');
});

test('espaços duplos são normalizados', () => {
  const r = refResumida('Silva  A,  Lopes B.  Rev  Saude  Publica .  2020;1:2');
  assert.ok(!/\s{2,}/.test(r), r);
  assert.ok(!/\s[,.;:]/.test(r), r);
});
