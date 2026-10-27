const test = require('node:test');
const assert = require('node:assert/strict');
const { carimbo } = require('../../scripts/guardarEstado');

test('carimbo da pasta de estado: AAAAMMDD-HHMM', () => {
  assert.equal(carimbo(new Date(2026, 9, 27, 19, 5)), '20261027-1905');
});

test('a LISTA de backup inclui os arquivos de estado que sumiram em 27/10', () => {
  const { LISTA } = require('../../scripts/backupEstado');
  for (const f of ['relatorios/ESTADO-GERAL.md', 'relatorios/PROMPT-ATUAL.md', 'relatorios/PENDENTES.md', 'relatorios/DECIDIDO.md', 'relatorios/LICOES.md']) {
    assert.ok(LISTA.includes(f), f);
  }
});
