const test = require('node:test');
const assert = require('node:assert/strict');
const { checarSlot } = require('../../scripts/youtube/travaSlot');

// Regra de 24/11/2026: checa o DIA DO UPLOAD (seg, ter, qua, sex em BRT); a ESTREIA (publishAt) é livre.
// Datas de referência (BRT = UTC-3): 2026-11-24 terça; 25 quarta; 26 quinta; 27 sexta; 28 sábado; 29 domingo; 30 segunda.

test('upload na terça é permitido, com estreia em qualquer dia', () => {
  const r = checarSlot('2026-11-28T23:15:00.000Z', '2026-11-24T12:00:00.000Z'); // upload ter 09:00 BRT; estreia sábado
  assert.equal(r.bloqueio, null);
  assert.deepEqual(r.avisos, []);
});

test('upload em seg, qua e sex é permitido', () => {
  assert.equal(checarSlot(undefined, '2026-11-30T12:00:00.000Z').bloqueio, null); // segunda
  assert.equal(checarSlot(undefined, '2026-11-25T12:00:00.000Z').bloqueio, null); // quarta
  assert.equal(checarSlot(undefined, '2026-11-27T12:00:00.000Z').bloqueio, null); // sexta
});

test('upload na quinta é recusado', () => {
  const r = checarSlot(undefined, '2026-11-26T12:00:00.000Z'); // quinta 09:00 BRT
  assert.match(r.bloqueio, /quinta-feira/);
});

test('upload no domingo e no sábado é recusado', () => {
  assert.match(checarSlot(undefined, '2026-11-29T12:00:00.000Z').bloqueio, /domingo/);
  assert.match(checarSlot(undefined, '2026-11-28T14:00:00.000Z').bloqueio, /sábado/); // sábado 11:00 BRT
});

test('fuso: sexta 22:00 BRT (sábado em UTC) ainda é sexta para o upload', () => {
  assert.equal(checarSlot(undefined, '2026-11-28T01:00:00.000Z').bloqueio, null);
});

test('fuso: quinta 22:00 BRT (sexta em UTC) é quinta para o upload', () => {
  assert.match(checarSlot(undefined, '2026-11-27T01:00:00.000Z').bloqueio, /quinta-feira/);
});

test('estreia em sábado ou domingo não é bloqueada', () => {
  assert.equal(checarSlot('2026-11-29T12:00:00.000Z', '2026-11-24T12:00:00.000Z').bloqueio, null);
});

test('data de upload inválida é bloqueada', () => {
  assert.match(checarSlot(undefined, 'nao-e-data').bloqueio, /inválido/);
});

test('data de estreia inválida é bloqueada', () => {
  assert.match(checarSlot('nao-e-data', '2026-11-24T12:00:00.000Z').bloqueio, /inválida/);
});
