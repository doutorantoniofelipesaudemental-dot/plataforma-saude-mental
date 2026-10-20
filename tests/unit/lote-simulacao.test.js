const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nomesLote } = require('../../scripts/linkedin/nomesLote');

test('execução real grava o lote rastreado', () => {
  assert.deepEqual(nomesLote(), { json: 'agendamento-lote.json', md: 'agendamento-lote.md' });
  assert.deepEqual(nomesLote({ simulacao: false }), { json: 'agendamento-lote.json', md: 'agendamento-lote.md' });
});

test('simulação nunca usa os nomes rastreados', () => {
  const s = nomesLote({ simulacao: true });
  assert.deepEqual(s, { json: 'agendamento-lote.simulacao.json', md: 'agendamento-lote.simulacao.md' });
  assert.notEqual(s.json, 'agendamento-lote.json');
  assert.notEqual(s.md, 'agendamento-lote.md');
});

test('os arquivos de simulação estão no .gitignore', () => {
  const gi = fs.readFileSync(path.resolve(__dirname, '../../.gitignore'), 'utf8');
  for (const n of ['relatorios/linkedin/agendamento-lote.simulacao.json', 'relatorios/linkedin/agendamento-lote.simulacao.md', 'relatorios/youtube/reprovados/estado-regeracao.json']) {
    assert.ok(gi.split('\n').includes(n), `falta no .gitignore: ${n}`);
  }
});
