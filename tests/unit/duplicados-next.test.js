const { test } = require('node:test');
const assert = require('node:assert');
const { falhasDuplicados, lerSlugsCanonicos } = require('../../backend/lib/duplicadosNext');

test('texto do Next que existe no domínio principal sem canonical é acusado', () => {
  assert.deepEqual(falhasDuplicados(['a', 'b', 'c'], ['b', 'c', 'd'], new Set(['b'])), ['c']);
  assert.deepEqual(falhasDuplicados(['a'], ['b'], new Set()), []);
});

test('a lista de canonical do app Next é lida do arquivo', () => {
  assert.ok(lerSlugsCanonicos().size > 100);
});
