const test = require('node:test');
const assert = require('node:assert/strict');
const { horarioEsperado } = require('../../scripts/rotinaTarefas');

// Horários em Salvador (UTC-3, sem horário de verão). 19/10/2026 é segunda-feira.
const quando = (iso) => new Date(`${iso}-03:00`);
const esperado = (nome, ate) => horarioEsperado(nome, quando(ate)).toISOString();
const salvador = (iso) => new Date(`${iso}-03:00`).toISOString();

test('(a) tarefa antiga com um horário: narração das 22:00 segue igual', () => {
  assert.equal(esperado('DrSM-Narracao-Noite', '2026-10-20T23:00'), salvador('2026-10-20T22:00'));
  assert.equal(esperado('DrSM-Narracao-Noite', '2026-10-20T21:00'), salvador('2026-10-19T22:00'));
});

test('(b) YouTube publica em dia normal: 20:15 (terça)', () => {
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-20T21:00'), salvador('2026-10-20T20:15'));
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-20T19:00'), salvador('2026-10-19T20:15'));
});

test('(c) YouTube publica em quinta e domingo: 17:15', () => {
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-22T18:00'), salvador('2026-10-22T17:15'));
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-22T16:00'), salvador('2026-10-21T20:15'));
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-25T18:00'), salvador('2026-10-25T17:15'));
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-25T10:00'), salvador('2026-10-24T20:15'));
});

test('(d) virada de semana: segunda cedo cai no domingo 17:15', () => {
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-19T10:00'), salvador('2026-10-18T17:15'));
});

test('(d) meia-noite: 00:00 de terça cai na segunda 20:15; 00:05 de segunda cai no domingo 17:15', () => {
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-20T00:00'), salvador('2026-10-19T20:15'));
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-19T00:05'), salvador('2026-10-18T17:15'));
});

test('conferências pontuais mantêm a data e o horário de Salvador', () => {
  assert.equal(horarioEsperado('DrSM-Conferencia-19-10', quando('2026-10-30T10:00')).toISOString(), salvador('2026-10-19T19:30'));
});
