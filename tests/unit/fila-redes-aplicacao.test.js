// Regra de aplicação da fila de redes (backend/scripts/redes/aplicarFilaCompleta.js): planejar() não grava nada.
const { test } = require('node:test');
const assert = require('node:assert');
const { planejar, PENDENTE } = require('../../backend/scripts/redes/aplicarFilaCompleta.js');

const item = (id, dataISO, erros = [], status = 'aprovado-checagem') => ({ id, dataISO, status, erros });

test('peça aprovada, sem erros e com data única fica aprovada', () => {
  const [p] = planejar({ itens: [item('2026-11-18-a', '2026-11-18')] });
  assert.strictEqual(p.statusNovo, 'aprovado-checagem');
  assert.strictEqual(p.statusAtual, 'aprovado-checagem');
});

test('peça com falha de checagem vai para pendente-rechecagem com os motivos', () => {
  const [p] = planejar({ itens: [item('2026-11-19-b', '2026-11-19', ['eixo fora do dia'])] });
  assert.strictEqual(p.statusNovo, PENDENTE);
  assert.deepStrictEqual(p.motivos, ['eixo fora do dia']);
});

test('segunda peça no mesmo dia é pendente; a primeira na ordem da fila fica', () => {
  const plano = planejar({
    itens: [item('2026-11-20-a', '2026-11-20'), item('2026-11-20-b', '2026-11-20')],
  });
  assert.strictEqual(plano[0].statusNovo, 'aprovado-checagem');
  assert.strictEqual(plano[1].statusNovo, PENDENTE);
});

test('o erro "mais de 1 peça no dia" sozinho não derruba a peça antes da decisão de duplicata', () => {
  const plano = planejar({
    itens: [item('2026-11-21-a', '2026-11-21', ['mais de 1 peça no dia 2026-11-21 (x, y)']), item('2026-11-21-b', '2026-11-21', ['mais de 1 peça no dia 2026-11-21 (x, y)'])],
  });
  assert.strictEqual(plano[0].statusNovo, 'aprovado-checagem');
  assert.strictEqual(plano[1].statusNovo, PENDENTE);
  assert.deepStrictEqual(plano[1].motivos, []);
});

test('peça já pendente com erro continua pendente e não ocupa o dia', () => {
  const plano = planejar({
    itens: [item('2026-11-22-a', '2026-11-22', ['falha']), item('2026-11-22-b', '2026-11-22')],
  });
  assert.strictEqual(plano[0].statusNovo, PENDENTE);
  assert.strictEqual(plano[1].statusNovo, 'aprovado-checagem');
});
