const test = require('node:test');
const assert = require('node:assert/strict');
const { arquivosQueColidem } = require('../../scripts/lib/colisoes');

test('sem colisão: nenhum arquivo do PR existe como não rastreado', () => {
  assert.deepEqual(arquivosQueColidem({ arquivosDoPr: ['a.js'], naoRastreados: ['b.json'] }), []);
});

test('colisão: arquivo do PR que está não rastreado na pasta principal', () => {
  assert.deepEqual(arquivosQueColidem({ arquivosDoPr: ['relatorios/vercel-credito.json', 'x.js'], naoRastreados: ['relatorios/vercel-credito.json'] }), ['relatorios/vercel-credito.json']);
});

test('barras invertidas do Windows e repetições não contam duas vezes', () => {
  assert.deepEqual(arquivosQueColidem({ arquivosDoPr: ['r/a.json', 'r/a.json'], naoRastreados: ['r\\a.json'] }), ['r/a.json']);
});
