const test = require('node:test');
const assert = require('node:assert/strict');
const { eixoDoDia } = require('../../backend/lib/redesV2/zeroGenerico');

// Ordem de 24/11/2026: seg E4, ter E5, qua E1, qui E3, sex E6, sáb E7; domingo alterna Relato e E2 por semana.
// Âncora: domingo 29/11/2026 = Relato.

test('dias úteis e sábado seguem o calendário fixo', () => {
  assert.equal(eixoDoDia('2026-11-30'), 'E4'); // segunda
  assert.equal(eixoDoDia('2026-12-01'), 'E5'); // terça
  assert.equal(eixoDoDia('2026-12-02'), 'E1'); // quarta
  assert.equal(eixoDoDia('2026-12-03'), 'E3'); // quinta
  assert.equal(eixoDoDia('2026-12-04'), 'E6'); // sexta
  assert.equal(eixoDoDia('2026-12-05'), 'E7'); // sábado
});

test('domingos alternam Relato e E2 a cada semana', () => {
  assert.equal(eixoDoDia('2026-11-29'), 'Relato'); // âncora
  assert.equal(eixoDoDia('2026-12-06'), 'E2');
  assert.equal(eixoDoDia('2026-12-13'), 'Relato');
  assert.equal(eixoDoDia('2026-12-20'), 'E2');
});

test('domingo anterior à âncora mantém a alternância', () => {
  assert.equal(eixoDoDia('2026-11-22'), 'E2'); // semana -1 (ímpar)
  assert.equal(eixoDoDia('2026-11-15'), 'Relato'); // semana -2 (par)
});
