const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCommits, comandos, montarRelatorio, LIMITE_LINHAS } = require('../../scripts/prSemanal');

test('parseCommits: uma entrada por linha, ignora vazias', () => {
  assert.deepEqual(parseCommits('abc1 feat: x\n\ndef2 fix: y\n'), ['abc1 feat: x', 'def2 fix: y']);
});

test('comandos: cada um em uma linha, com o branch e sem push/merge automático', () => {
  const c = comandos('feat/x');
  assert.equal(c.length, 3);
  assert.ok(c.every((l) => l.startsWith('! ') && !l.includes('\n')));
  assert.ok(c[0].includes('git push -u origin feat/x'));
  assert.ok(c[1].includes('--head feat/x'));
  assert.ok(c[2].includes('merge-seguro -- NÚMERO_DO_PR'));
});

test('montarRelatorio: até 30 linhas, mesmo com muitos commits', () => {
  const commits = Array.from({ length: 80 }, (_, i) => `c${i} commit`);
  const texto = montarRelatorio({ branch: 'feat/x', commits, portao: 'APROVADO', simular: false });
  assert.ok(texto.trimEnd().split('\n').length <= LIMITE_LINHAS);
  assert.match(texto, /APROVADO/);
});

test('montarRelatorio: simulação diz que o portão não rodou', () => {
  const texto = montarRelatorio({ branch: 'feat/x', commits: [], portao: 'não rodado (simulação)', simular: true });
  assert.match(texto, /SIMULAÇÃO/);
  assert.match(texto, /nenhum commit novo/);
});

test('montarRelatorio: portão reprovado aparece no relatório', () => {
  const texto = montarRelatorio({ branch: 'feat/x', commits: ['a1 x'], portao: 'REPROVADO (código 1)', simular: false });
  assert.match(texto, /REPROVADO \(código 1\)/);
});
