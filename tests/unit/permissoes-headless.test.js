const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../../docs/permissoes-headless/aplicar');

test('faltando: devolve só as regras necessárias ausentes', () => {
  assert.deepEqual(P.faltando(['Bash(npm run:*)', 'Bash(node:*)', 'Bash(git status:*)', 'Bash(git diff:*)', 'Bash(gh pr create:*)']), []);
  assert.deepEqual(P.faltando(['Bash(npm run:*)']), ['Bash(node:*)', 'Bash(git status:*)', 'Bash(git diff:*)', 'Bash(gh pr create:*)']);
});

test('nunca aceita Bash(*) nem acesso ao .env na lista de regras necessárias', () => {
  assert.throws(() => P.faltando([], ['Bash(*)']), /proibida/);
  assert.throws(() => P.faltando([], ['Read(./.env*)']), /proibida/);
});

test('a lista atual não tem regra proibida', () => {
  assert.equal(P.NECESSARIAS.some((r) => P.PROIBIDAS.includes(r)), false);
});
