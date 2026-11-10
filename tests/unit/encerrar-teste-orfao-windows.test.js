// Ordem de 10/11/2026, 00:05 (item 1): a listagem de processos no Windows precisa ser lida mesmo com caractere de controle.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { interpretarSaidaProcessos, candidatosAEncerrar } = require('../../scripts/lib/encerrarTesteOrfao');

test('saída vazia = nenhum processo (não quebra)', () => {
  assert.deepEqual(interpretarSaidaProcessos(''), { escuta: [], processos: [] });
  assert.deepEqual(interpretarSaidaProcessos('   \r\n'), { escuta: [], processos: [] });
});

test('JSON com caractere de controle dentro de linha de comando é lido (o bug de 09/11)', () => {
  const bruto = '{"escuta":[],"processos":[{"pid":12,"paiPid":4,"cmd":"node\u0001 index.js C:\\\\DRS-x","exe":""}]}';
  const r = interpretarSaidaProcessos(bruto);
  assert.equal(r.processos.length, 1);
  assert.equal(r.processos[0].pid, 12);
});

test('objeto único (não array) é aceito', () => {
  const r = interpretarSaidaProcessos('{"escuta":[3000],"processos":{"pid":3000,"paiPid":1,"cmd":"node index.js","exe":""}}');
  assert.deepEqual(r.escuta, [3000]);
  assert.equal(r.processos.length, 1);
});

test('BOM UTF-8 no início é tolerado', () => {
  const r = interpretarSaidaProcessos('\uFEFF{"escuta":[],"processos":[]}');
  assert.deepEqual(r, { escuta: [], processos: [] });
});

test('saída irrecuperável falha fechada (lança erro, não finge limpeza)', () => {
  assert.throws(() => interpretarSaidaProcessos('{"escuta":[ quebrado'), /não é JSON válido/);
});

test('a seleção do que encerrar não mudou (regra preservada)', () => {
  const pids = candidatosAEncerrar({
    escuta: [3000],
    processos: [
      { pid: 3000, paiPid: 1, cmd: 'node C:\DRSAUDEMENTAL\backend\index.js', exe: '' },
      { pid: 4000, paiPid: 1, cmd: 'node C:\Outro\index.js', exe: '' },
    ],
  });
  assert.deepEqual(pids, [3000]);
});
