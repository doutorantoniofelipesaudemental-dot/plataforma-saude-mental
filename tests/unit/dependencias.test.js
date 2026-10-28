const test = require('node:test');
const assert = require('node:assert/strict');
const { planejarInstalacao } = require('../../scripts/lib/dependencias');

test('sem package.json: não faz nada', () => {
  const r = planejarInstalacao([{ dir: 'x', temPackage: false, existe: false, ehLink: false }]);
  assert.equal(r[0].acao, 'sem-package');
});

test('node_modules já existe: ok', () => {
  const r = planejarInstalacao([{ dir: 'x', temPackage: true, existe: true, ehLink: false }]);
  assert.equal(r[0].acao, 'ok');
});

test('node_modules faltando: instala', () => {
  const r = planejarInstalacao([{ dir: 'x', temPackage: true, existe: false, ehLink: false }]);
  assert.equal(r[0].acao, 'instalar');
});

test('node_modules é atalho (junção): não segue, mesmo faltando o destino', () => {
  const r = planejarInstalacao([{ dir: 'x', temPackage: true, existe: true, ehLink: true }]);
  assert.equal(r[0].acao, 'pular-link');
  assert.match(r[0].motivo, /não sigo/);
});
