/** Itens de lista da legenda terminam em ponto, nunca em ";" (ordem de 13/11/2026). */
const test = require('node:test');
const assert = require('node:assert/strict');
const { falhasDeListaLegenda } = require('../../backend/lib/redesV2/checagem');

test('lista com ponto em todos os itens não gera falha', () => {
  const l = 'Intro.\n\n• lembranças repetidas.\n• medo de voltar ao local.\n\nFim.';
  assert.deepEqual(falhasDeListaLegenda(l), []);
});

test('item de lista terminando em ";" é reprovado', () => {
  const l = '• lembranças repetidas;\n• medo de voltar.';
  const f = falhasDeListaLegenda(l);
  assert.equal(f.length, 1);
  assert.match(f[0], /terminando em ";"/);
});

test('item de lista sem ponto final é reprovado', () => {
  assert.equal(falhasDeListaLegenda('- insônia, irritabilidade').length, 1);
});

test('texto que não é lista não é avaliado', () => {
  assert.deepEqual(falhasDeListaLegenda('Frase com ponto e vírgula; sem lista.'), []);
});
