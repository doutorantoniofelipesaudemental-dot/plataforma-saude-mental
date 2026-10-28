const test = require('node:test');
const assert = require('node:assert/strict');
const { decidirRemoverWorktree } = require('../../scripts/lib/worktreeLimpo');
const { avaliarProntoParaMerge } = require('../../scripts/lib/prontoMerge');

const aberto = { state: 'OPEN', isDraft: false, mergeable: 'MERGEABLE', headRefOid: 'abc1234' };
const limpo = { ok: true, bloqueios: [] };

test('worktree: sem worktree do branch, nada a remover', () => {
  assert.equal(decidirRemoverWorktree({ caminho: null }).remover, false);
});

test('worktree: árvore suja não é removido', () => {
  const r = decidirRemoverWorktree({ caminho: 'C:/w', arvoreLimpa: false, headLocal: 'a', headRemoto: 'a' });
  assert.equal(r.remover, false);
  assert.match(r.motivo, /alterações não commitadas/);
});

test('worktree: commits que não estão no remoto não são removidos', () => {
  const r = decidirRemoverWorktree({ caminho: 'C:/w', arvoreLimpa: true, headLocal: 'b', headRemoto: 'a' });
  assert.equal(r.remover, false);
  assert.match(r.motivo, /não estão no remoto/);
});

test('worktree: limpo e igual ao remoto é removido', () => {
  const r = decidirRemoverWorktree({ caminho: 'C:/w', arvoreLimpa: true, headLocal: 'a', headRemoto: 'a' });
  assert.equal(r.remover, true);
});

test('pronto: PR aberto, limpo e pasta principal sem bloqueio = PRONTO', () => {
  const r = avaliarProntoParaMerge({ pr: aberto, headRemoto: 'abc1234', pre: limpo, worktree: { ok: true, motivo: '' } });
  assert.equal(r.pronto, true);
  assert.deepEqual(r.motivos, []);
});

test('pronto: rascunho, conflito e mergeabilidade desconhecida bloqueiam', () => {
  assert.equal(avaliarProntoParaMerge({ pr: { ...aberto, isDraft: true }, headRemoto: 'abc1234', pre: limpo }).pronto, false);
  assert.equal(avaliarProntoParaMerge({ pr: { ...aberto, mergeable: 'CONFLICTING' }, headRemoto: 'abc1234', pre: limpo }).pronto, false);
  const u = avaliarProntoParaMerge({ pr: { ...aberto, mergeable: 'UNKNOWN' }, headRemoto: 'abc1234', pre: limpo });
  assert.equal(u.pronto, false);
  assert.match(u.motivos[0], /calcula a mergeabilidade/);
});

test('pronto: commit do PR diferente do remoto bloqueia', () => {
  const r = avaliarProntoParaMerge({ pr: aberto, headRemoto: 'zzz9999', pre: limpo });
  assert.equal(r.pronto, false);
  assert.match(r.motivos[0], /não é o que está no remoto/);
});

test('pronto: bloqueio da pasta principal aparece nos motivos', () => {
  const pre = { ok: false, bloqueios: [{ tipo: 'rastreado-alterado', arquivo: 'relatorios/LICOES.md', motivo: 'x' }] };
  const r = avaliarProntoParaMerge({ pr: aberto, headRemoto: 'abc1234', pre });
  assert.equal(r.pronto, false);
  assert.match(r.motivos[0], /relatorios\/LICOES\.md/);
});

test('pronto: worktree que não pode ser removido bloqueia', () => {
  const r = avaliarProntoParaMerge({ pr: aberto, headRemoto: 'abc1234', pre: limpo, worktree: { ok: false, motivo: 'worktree C:/w tem alterações' } });
  assert.equal(r.pronto, false);
  assert.match(r.motivos[0], /tem alterações/);
});
