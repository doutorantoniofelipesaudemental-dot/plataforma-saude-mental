const test = require('node:test');
const assert = require('node:assert/strict');
const { planejarTrocaBranch, worktreeDoBranch } = require('../../scripts/lib/trocaBranch');

const porcelain = [
  'worktree C:/DRSAUDEMENTAL', 'HEAD 1', 'branch refs/heads/main', '',
  'worktree C:/DRS-portao', 'HEAD 2', 'branch refs/heads/fix/portao-e2e-env-trava-20261023', '',
].join('\n');

test('worktree: encontra o outro worktree que tem o branch do PR', () => {
  assert.equal(worktreeDoBranch(porcelain, 'fix/portao-e2e-env-trava-20261023', 'C:/DRSAUDEMENTAL'), 'C:/DRS-portao');
});

test('worktree: branch sem outro worktree devolve null', () => {
  assert.equal(worktreeDoBranch(porcelain, 'docs/outro', 'C:/DRSAUDEMENTAL'), null);
});

test('worktree: o próprio worktree atual não conta como ocupado', () => {
  assert.equal(worktreeDoBranch(porcelain, 'main', 'C:/DRSAUDEMENTAL'), null);
});

test('planejador: branch em outro worktree para com mensagem que diz como liberar', () => {
  const p = planejarTrocaBranch({ branchAtual: 'main', destino: 'fix/x', worktreeDoDestino: 'C:/DRS-portao', existeLocal: true });
  assert.equal(p.acao, 'parar');
  assert.match(p.motivo, /git worktree remove "C:\/DRS-portao"/);
  assert.match(p.motivo, /não é apagado/);
});
