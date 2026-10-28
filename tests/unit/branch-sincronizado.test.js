const test = require('node:test');
const assert = require('node:assert/strict');
const { decidirSincronia } = require('../../scripts/lib/branchSincronizado');

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);

test('local igual ao remoto: pode rodar o portão', () => {
  assert.equal(decidirSincronia({ local: A, remoto: A }).ok, true);
});

test('local atrás do remoto (o caso do CLS, 23/10): bloqueia e diz como corrigir', () => {
  const r = decidirSincronia({ local: A, remoto: B });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /desatualizada/);
  assert.match(r.motivo, /git branch -f/);
});

test('branch nova sem remoto: não bloqueia', () => {
  assert.equal(decidirSincronia({ local: A, remoto: null }).ok, true);
});

test('sem commit local legível: bloqueia', () => {
  assert.equal(decidirSincronia({ local: '', remoto: B }).ok, false);
});

const { remotoDaMesmaBranch } = require('../../scripts/lib/branchSincronizado');

test('upstream de outra branch (origin/main numa branch nova) não conta como remoto', () => {
  assert.equal(remotoDaMesmaBranch('chore/x', 'origin/main'), null);
});

test('upstream com o mesmo nome conta como remoto', () => {
  assert.equal(remotoDaMesmaBranch('fix/x', 'origin/fix/x'), 'origin/fix/x');
});

test('HEAD destacado não tem remoto', () => {
  assert.equal(remotoDaMesmaBranch('HEAD', 'origin/HEAD'), null);
});
