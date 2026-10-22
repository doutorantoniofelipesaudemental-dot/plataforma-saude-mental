// Troca de branch do merge-seguro (scripts/lib/trocaBranch.js): decide sem executar git.
// Cobre: branch existente igual ao remoto, branch inexistente, local atrasado, commits exclusivos e árvore com conflito.
const { test } = require('node:test');
const assert = require('node:assert');
const { planejarTrocaBranch } = require('../../scripts/lib/trocaBranch');

const base = { branchAtual: 'feat/outro', destino: 'feat/podcast-feed-20261020' };

test('branch local já existe e está igual ao remoto: troca (não tenta criar de novo)', () => {
  const p = planejarTrocaBranch({ ...base, existeLocal: true });
  assert.equal(p.acao, 'trocar');
});

test('branch local não existe: cria a partir do remoto', () => {
  const p = planejarTrocaBranch({ ...base, existeLocal: false });
  assert.equal(p.acao, 'criar');
});

test('branch local atrasado e sem commits exclusivos: alinha com fast-forward', () => {
  const p = planejarTrocaBranch({ ...base, existeLocal: true, localAtrasadoDoRemoto: true });
  assert.equal(p.acao, 'alinhar');
});

test('commits exclusivos no local: para com mensagem clara, sem tocar no branch', () => {
  const p = planejarTrocaBranch({ ...base, existeLocal: true, localAdiantadoDoRemoto: true });
  assert.equal(p.acao, 'parar');
  assert.match(p.motivo, /commits que não estão no remoto/);
});

test('alteração não commitada em arquivo que o destino muda: para e lista o arquivo', () => {
  const p = planejarTrocaBranch({
    ...base,
    existeLocal: true,
    arquivosSujos: ['relatorios/ESTADO-GERAL.md', 'outro.md'],
    arquivosDoDestino: ['relatorios/ESTADO-GERAL.md', 'x.js'],
  });
  assert.equal(p.acao, 'parar');
  assert.match(p.motivo, /relatorios\/ESTADO-GERAL\.md/);
  assert.doesNotMatch(p.motivo, /outro\.md/);
});

test('alteração não commitada em arquivo que o destino não muda: troca normal', () => {
  const p = planejarTrocaBranch({ ...base, existeLocal: true, arquivosSujos: ['outro.md'], arquivosDoDestino: ['x.js'] });
  assert.equal(p.acao, 'trocar');
});

test('sem destino: erro de uso', () => {
  assert.throws(() => planejarTrocaBranch({ branchAtual: 'x' }), /exige o branch de destino/);
});
