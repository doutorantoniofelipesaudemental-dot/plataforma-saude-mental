const test = require('node:test');
const assert = require('node:assert/strict');
const { horarioEsperado } = require('../../scripts/rotinaTarefas');

// Horários em Salvador (UTC-3, sem horário de verão). 19/10/2026 é segunda-feira.
const quando = (iso) => new Date(`${iso}-03:00`);
const esperado = (nome, ate) => horarioEsperado(nome, quando(ate)).toISOString();
const salvador = (iso) => new Date(`${iso}-03:00`).toISOString();

test('(a) narração: seg a sex 17:45; sábado 20:30; domingo 10:00 (ordem 25/10/2026)', () => {
  assert.equal(esperado('DrSM-Narracao-Noite', '2026-10-20T20:00'), salvador('2026-10-20T17:45'));
  assert.equal(esperado('DrSM-Narracao-Noite', '2026-10-24T22:00'), salvador('2026-10-24T20:30'));
  assert.equal(esperado('DrSM-Narracao-Noite', '2026-10-25T12:00'), salvador('2026-10-25T10:00'));
  assert.equal(esperado('DrSM-Narracao-Noite', '2026-10-25T08:00'), salvador('2026-10-24T20:30'));
});

test('(b) gera-mídia: seg a sex 18:45, após a narração', () => {
  assert.equal(esperado('DrSM-YouTube-Gera-Midia', '2026-10-20T19:00'), salvador('2026-10-20T18:45'));
  assert.equal(esperado('DrSM-YouTube-Gera-Midia', '2026-10-20T18:00'), salvador('2026-10-19T18:45'));
});

test('(c) YouTube publica: seg a sex e domingo 20:15; sábado 20:45', () => {
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-20T21:00'), salvador('2026-10-20T20:15'));
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-22T18:00'), salvador('2026-10-21T20:15'));
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-24T21:00'), salvador('2026-10-24T20:45'));
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-25T21:00'), salvador('2026-10-25T20:15'));
});

test('(d) virada de semana: segunda cedo cai no domingo 20:15', () => {
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-19T10:00'), salvador('2026-10-18T20:15'));
});

test('(d) meia-noite: 00:00 de terça cai na segunda 20:15; 00:05 de segunda cai no domingo 20:15', () => {
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-20T00:00'), salvador('2026-10-19T20:15'));
  assert.equal(esperado('DrSM-YouTube-Publica', '2026-10-19T00:05'), salvador('2026-10-18T20:15'));
});

test('conferências pontuais mantêm a data e o horário de Salvador', () => {
  assert.equal(horarioEsperado('DrSM-Conferencia-19-10', quando('2026-10-30T10:00')).toISOString(), salvador('2026-10-19T19:30'));
});
