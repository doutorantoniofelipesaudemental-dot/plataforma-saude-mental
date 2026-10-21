const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Ordem de 21/10/2026: nenhum fluxo grava o status de aprovação médica (valor feminino) sem registro com hash.
// Sem exceções. O valor masculino "aprovado" aparece em fixtures de teste e não é o status.
const RAIZ = path.resolve(__dirname, '../..');
const RE_STATUS = /revisaoMedica:?\s*['"]?aprovada\b/i;

test('nenhum código do backend ou dos scripts grava o status "aprovada" da revisão médica', () => {
  const achados = [];
  const andar = (dir) => {
    for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, n.name);
      if (n.isDirectory()) {
        if (n.name !== 'node_modules') andar(p);
        continue;
      }
      if (!/\.js$/.test(n.name)) continue;
      if (RE_STATUS.test(fs.readFileSync(p, 'utf8'))) achados.push(path.relative(RAIZ, p).split(path.sep).join('/'));
    }
  };
  andar(path.join(RAIZ, 'backend'));
  andar(path.join(RAIZ, 'scripts'));
  assert.deepEqual(achados, []);
});
