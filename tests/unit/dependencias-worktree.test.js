const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { planejarInstalacao, prepararDependencias, pastasDoProjeto } = require('../../scripts/lib/dependencias');

test('planejar: pasta com package.json e node_modules completo fica ok; sem node_modules instala; sem package.json ignora', () => {
  const plano = planejarInstalacao([
    { dir: 'a', temPackage: true, existe: true, ehLink: false },
    { dir: 'b', temPackage: true, existe: false, ehLink: false },
    { dir: 'c', temPackage: false, existe: false, ehLink: false },
  ]);
  assert.deepEqual(plano.map((p) => p.acao), ['ok', 'instalar', 'sem-package']);
});

test('planejar: node_modules que é atalho nunca é seguido', () => {
  const [p] = planejarInstalacao([{ dir: 'x', temPackage: true, existe: true, ehLink: true }]);
  assert.equal(p.acao, 'pular-link');
});

test('prepararDependencias: instalação interrompida (pasta sem .package-lock.json) é reinstalada com npm ci', () => {
  fs.mkdirSync(path.join(__dirname, '../../.tmp'), { recursive: true });
  const raiz = fs.mkdtempSync(path.join(__dirname, '../../.tmp/deps-teste-'));
  for (const dir of pastasDoProjeto(raiz)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');
  }
  const app = pastasDoProjeto(raiz)[1];
  fs.mkdirSync(path.join(app, 'node_modules', 'next'), { recursive: true }); // pasta parcial, sem o lock final
  const chamadas = [];
  const executar = (cmd, args, opts) => { chamadas.push({ args: args.join(' '), dir: opts.cwd }); return { status: 0 }; };
  const plano = prepararDependencias(raiz, executar);
  assert.equal(chamadas.length, 2, 'raiz e app instaladas');
  assert.ok(chamadas.every((c) => c.args === 'ci --no-audit --no-fund'));
  assert.equal(plano[1].acao, 'instalado');
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('prepararDependencias: instalação completa não roda npm ci de novo', () => {
  fs.mkdirSync(path.join(__dirname, '../../.tmp'), { recursive: true });
  const raiz = fs.mkdtempSync(path.join(__dirname, '../../.tmp/deps-teste-'));
  for (const dir of pastasDoProjeto(raiz)) {
    fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');
    fs.writeFileSync(path.join(dir, 'node_modules', '.package-lock.json'), '{}');
  }
  let chamadas = 0;
  prepararDependencias(raiz, () => { chamadas++; return { status: 0 }; });
  assert.equal(chamadas, 0);
  fs.rmSync(raiz, { recursive: true, force: true });
});
