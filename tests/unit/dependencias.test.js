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

test('node_modules é junção: erro claro, não segue, mesmo faltando o destino', () => {
  const r = planejarInstalacao([{ dir: 'x', temPackage: true, existe: true, ehLink: true }]);
  assert.equal(r[0].acao, 'erro-link');
  assert.match(r[0].motivo, /junção ou link/);
  assert.match(r[0].motivo, /npm ci/);
});

// Regressão (ordem de 31/10/2026): junção de node_modules não pode passar em silêncio nem ser seguida.
test('prepararDependencias: junção de node_modules lança erro e não executa npm ci', () => {
  const os = require('node:os');
  const path = require('node:path');
  const fs = require('node:fs');
  const { prepararDependencias } = require('../../scripts/lib/dependencias');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-link-'));
  const raiz = path.join(base, 'raiz');
  const alvo = path.join(base, 'alvo');
  fs.mkdirSync(raiz);
  fs.mkdirSync(alvo);
  fs.writeFileSync(path.join(raiz, 'package.json'), '{}');
  fs.symlinkSync(alvo, path.join(raiz, 'node_modules'), 'junction');
  let chamadas = 0;
  try {
    assert.throws(() => prepararDependencias(raiz, () => { chamadas++; return { status: 0 }; }), /junção ou link/);
    assert.equal(chamadas, 0);
  } finally {
    fs.rmdirSync(path.join(raiz, 'node_modules'));
    fs.rmSync(base, { recursive: true, force: true });
  }
});
