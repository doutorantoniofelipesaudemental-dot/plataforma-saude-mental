const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../../scripts/conferencias/usoBlob');

test('uso do Blob: abaixo de 80% do PRO não alerta', () => {
  const r = U.avaliarUsoBlob({ totalMB: 1334.9 });
  assert.equal(r.alerta, false);
  assert.equal(r.percentual, 26.1);
});

test('uso do Blob: acima de 80% alerta e diz o que fazer', () => {
  const r = U.avaliarUsoBlob({ totalMB: 4200 });
  assert.equal(r.alerta, true);
  assert.match(r.texto, /acima de 80%/);
});

test('uso do Blob: exatamente 80% não alerta (limite estrito)', () => {
  assert.equal(U.avaliarUsoBlob({ totalMB: 4096 }).alerta, false);
});

test('leitura: resposta sem totalMB lança erro (não alerta em silêncio)', async () => {
  await assert.rejects(U.lerTotalMBBlob({ base: 'x', token: 't', fetchFn: async () => ({ json: async () => ({}) }) }), /sem totalMB/);
});
