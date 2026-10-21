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

test('negações: Write(X) vira Edit(X) sem duplicar; o resto fica como está', () => {
  const P = require('../../docs/permissoes-headless/aplicar');
  assert.deepEqual(P.trocarWritePorEdit(['Write(./a*)', 'Bash(x)']), ['Edit(./a*)', 'Bash(x)']);
  assert.deepEqual(P.trocarWritePorEdit(['Edit(./a*)', 'Write(./a*)']), ['Edit(./a*)']);
  assert.deepEqual(P.trocarWritePorEdit(['Read(./.env*)']), ['Read(./.env*)']);
});

test('diff: mostra o que sai e o que entra nas negações', () => {
  const P = require('../../docs/permissoes-headless/aplicar');
  assert.deepEqual(P.diff(['Write(./a*)'], ['Edit(./a*)']), ['  - Write(./a*)', '  + Edit(./a*)']);
});
