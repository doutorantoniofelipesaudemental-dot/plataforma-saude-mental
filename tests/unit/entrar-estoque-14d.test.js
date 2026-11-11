// Regra de entrada do estoque de 14 dias (backend/scripts/redes/entrarEstoque14d.js): planejarEntrada() não grava nada.
const { test } = require('node:test');
const assert = require('node:assert');
const { planejarEntrada } = require('../../backend/scripts/redes/entrarEstoque14d.js');

const peca = (id, dataISO, extra = {}) => ({ id, dataISO, status: 'aprovado-checagem', erros: [], ...extra });
const HOJE = '2026-11-11';

test('entrada limpa, sem peças na fila no período, fica ok', () => {
  const r = planejarEntrada({ novas: [peca('2026-11-19-a', '2026-11-19')], existentes: [], hoje: HOJE });
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.entram, ['2026-11-19-a']);
});

test('dia que já tem peça APROVADA na fila bloqueia a entrada', () => {
  const r = planejarEntrada({
    novas: [peca('2026-11-19-a', '2026-11-19')],
    existentes: [peca('2026-11-19-x', '2026-11-19')],
    hoje: HOJE,
  });
  assert.strictEqual(r.ok, false);
  assert.match(r.problemas[0], /já tem peça aprovada/);
});

test('peça PENDENTE na fila não bloqueia o dia', () => {
  const r = planejarEntrada({
    novas: [peca('2026-11-19-a', '2026-11-19')],
    existentes: [peca('2026-11-19-x', '2026-11-19', { status: 'pendente-rechecagem' })],
    hoje: HOJE,
  });
  assert.strictEqual(r.ok, true);
});

test('peça com falha de rechecagem, status errado ou data passada não entra', () => {
  const r = planejarEntrada({
    novas: [
      peca('2026-11-19-a', '2026-11-19', { erros: ['eixo'] }),
      peca('2026-11-20-b', '2026-11-20', { status: 'revisar' }),
      peca('2026-11-10-c', '2026-11-10'),
    ],
    existentes: [],
    hoje: HOJE,
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.problemas.length, 3);
});

test('duas peças novas no mesmo dia são recusadas', () => {
  const r = planejarEntrada({
    novas: [peca('2026-11-19-a', '2026-11-19'), peca('2026-11-19-b', '2026-11-19')],
    existentes: [],
    hoje: HOJE,
  });
  assert.strictEqual(r.ok, false);
  assert.ok(r.problemas.some((p) => /com 2 peças novas/.test(p)));
});

test('peça já existente na fila (mesmo id) é recusada', () => {
  const r = planejarEntrada({
    novas: [peca('2026-11-19-a', '2026-11-19')],
    existentes: [peca('2026-11-19-a', '2026-11-19', { status: 'pendente-rechecagem' })],
    hoje: HOJE,
  });
  assert.strictEqual(r.ok, false);
  assert.match(r.problemas[0], /já existe na fila/);
});
