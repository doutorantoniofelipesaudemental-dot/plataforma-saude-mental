const test = require('node:test');
const assert = require('node:assert/strict');
const { arquivosQueColidem, verificarAntesDaTroca } = require('../../scripts/lib/colisoes');

test('sem colisão: nenhum arquivo do PR existe como não rastreado', () => {
  assert.deepEqual(arquivosQueColidem({ arquivosDoPr: ['a.js'], naoRastreados: ['b.json'] }), []);
});

test('colisão: arquivo do PR que está não rastreado na pasta principal', () => {
  assert.deepEqual(arquivosQueColidem({ arquivosDoPr: ['relatorios/vercel-credito.json', 'x.js'], naoRastreados: ['relatorios/vercel-credito.json'] }), ['relatorios/vercel-credito.json']);
});

test('barras invertidas do Windows e repetições não contam duas vezes', () => {
  assert.deepEqual(arquivosQueColidem({ arquivosDoPr: ['r/a.json', 'r/a.json'], naoRastreados: ['r\\a.json'] }), ['r/a.json']);
});

test('pré-troca: sem alteração e sem colisão, pode seguir', () => {
  const r = verificarAntesDaTroca({ rastreadosAlterados: [], naoRastreadosLocais: ['outro.md'], arquivosDoPr: ['a.js'] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.bloqueios, []);
});

test('pré-troca: rastreado alterado na pasta principal bloqueia', () => {
  const r = verificarAntesDaTroca({ rastreadosAlterados: ['relatorios/LICOES.md'], naoRastreadosLocais: [], arquivosDoPr: ['a.js'] });
  assert.equal(r.ok, false);
  assert.equal(r.bloqueios[0].tipo, 'rastreado-alterado');
  assert.equal(r.bloqueios[0].arquivo, 'relatorios/LICOES.md');
});

test('pré-troca: não rastreado que o PR adiciona bloqueia', () => {
  const r = verificarAntesDaTroca({ rastreadosAlterados: [], naoRastreadosLocais: ['relatorios/vercel-promocao-20261025.md'], arquivosDoPr: ['relatorios/vercel-promocao-20261025.md'] });
  assert.equal(r.ok, false);
  assert.equal(r.bloqueios[0].tipo, 'nao-rastreado-colide');
});
