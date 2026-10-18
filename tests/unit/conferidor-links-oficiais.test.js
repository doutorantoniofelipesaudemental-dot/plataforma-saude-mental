const test = require('node:test');
const assert = require('node:assert');
const { linkOficialMarca } = require('../../scripts/youtube/lib');

test('conferidor YouTube: link oficial do LinkedIn (com e sem "ô" codificado) é aceito', () => {
  assert.ok(linkOficialMarca('https://www.linkedin.com/in/doutor-ant%C3%B4nio-felipe-70990b438'));
  assert.ok(linkOficialMarca('https://www.linkedin.com/in/doutor-antônio-felipe-70990b438'));
});

test('conferidor YouTube: link externo qualquer continua reprovado', () => {
  assert.equal(linkOficialMarca('https://exemplo.com'), false);
});

test('conferidor YouTube: link parecido mas falso continua reprovado', () => {
  assert.equal(linkOficialMarca('https://www.linkedin.com/in/outra-pessoa'), false);
  assert.equal(linkOficialMarca('https://www.linkedin.com/in/doutor-ant%C3%B4nio-felipe-70990b438-falso'), false);
});
