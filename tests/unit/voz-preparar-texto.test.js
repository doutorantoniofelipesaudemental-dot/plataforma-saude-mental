const test = require('node:test');
const assert = require('node:assert/strict');
const { prepararTrecho } = require('../../scripts/voz/prepararTexto');

test('CVV 188 e SAMU 192 saem por extenso, com a sigla pronunciada (ordem de 21/10/2026)', () => {
  const [bloco] = prepararTrecho('CVV 188: ligação gratuita. SAMU 192 em emergências.');
  const texto = bloco.frases.join(' ');
  assert.match(texto, /Cê Vê Vê cento e oitenta e oito/);
  assert.match(texto, /Samu cento e noventa e dois/);
  assert.doesNotMatch(texto, /188|192/);
});

test('parágrafos viram blocos separados, para a pausa maior entre eles', () => {
  const blocos = prepararTrecho('Primeiro parágrafo. Com duas frases.\n\nSegundo parágrafo.');
  assert.equal(blocos.length, 2);
  assert.deepEqual(blocos[0].frases, ['Primeiro parágrafo.', 'Com duas frases.']);
});

test('o preparo não altera o texto fora das siglas e números', () => {
  const [bloco] = prepararTrecho('Cuidar de si é a condição para continuar.');
  assert.equal(bloco.frases.join(' '), 'Cuidar de si é a condição para continuar.');
});
