const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..');
const ler = (p) => fs.readFileSync(path.join(RAIZ, p), 'utf8');

test('arquivos escritos pela automação estão no .gitignore (fora do Git)', () => {
  const gitignore = ler('.gitignore');
  for (const f of ['relatorios/PENDENTES.md', 'relatorios/AUTORIZACOES.md', 'relatorios/linkedin/FILA-MANUAL.md', 'relatorios/tarefas-estado.md', 'relatorios/linkedin/fila.json']) {
    assert.ok(gitignore.split('\n').includes(f), `falta no .gitignore: ${f}`);
  }
});

test('fixture versionada da fila do LinkedIn existe e é JSON válido', () => {
  const j = JSON.parse(ler('tests/fixtures/linkedin-fila.json'));
  assert.ok(Array.isArray(j) || Array.isArray(j.itens));
});

test('o portão lê a fixture, não a fila real', () => {
  const portao = ler('scripts/portao.js');
  assert.match(portao, /tests\/fixtures\/linkedin-fila\.json/);
  assert.doesNotMatch(portao, /readFileSync\(path\.join\(RAIZ, 'relatorios\/linkedin\/fila\.json'\)/);
});
