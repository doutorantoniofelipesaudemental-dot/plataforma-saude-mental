const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../../scripts/manutencaoSemanal');

test('nome do branch: prefixo chore/manutencao- e data sem traços', () => {
  assert.equal(M.nomeDoBranch('2026-10-26'), 'chore/manutencao-20261026');
});

test('sexta nunca envia a main; segunda não depende do branch atual', () => {
  assert.equal(M.podeSeguir({ branchAtual: 'main', etapa: 'sexta' }).ok, false);
  assert.equal(M.podeSeguir({ branchAtual: 'feat/x', etapa: 'segunda' }).ok, true);
});

test('segunda: árvore suja da pasta principal não bloqueia (roda em worktree própria)', () => {
  assert.equal(M.podeSeguir({ branchAtual: 'feat/x', alteracoes: ['a.js'], etapa: 'segunda' }).ok, true);
});

test('sexta: só envia branch de manutenção', () => {
  assert.equal(M.podeSeguir({ branchAtual: 'feat/outro', etapa: 'sexta' }).ok, false);
  assert.equal(M.podeSeguir({ branchAtual: 'chore/manutencao-20261026', etapa: 'sexta' }).ok, true);
});
