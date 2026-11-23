const test = require('node:test');
const assert = require('node:assert/strict');
const { checarSlot } = require('../../scripts/youtube/travaSlot');

// Datas de referência (BRT = UTC-3)
// 2026-11-24 é terça; 2026-11-26 quinta; 2026-11-27 sexta; 2026-11-28 sábado; 2026-11-29 domingo.

test('terça 09:00 BRT é permitida', () => {
  const r = checarSlot('2026-11-24T12:00:00.000Z');
  assert.equal(r.bloqueio, null);
  assert.deepEqual(r.avisos, []);
});

test('quinta é recusada', () => {
  const r = checarSlot('2026-11-26T23:15:00.000Z'); // quinta 20:15 BRT
  assert.match(r.bloqueio, /quinta-feira/);
});

test('domingo é recusado', () => {
  const r = checarSlot('2026-11-29T23:15:00.000Z'); // domingo 20:15 BRT
  assert.match(r.bloqueio, /domingo/);
});

test('quinta de madrugada em UTC ainda é quinta em BRT (cuidado com fuso)', () => {
  // 2026-11-27T01:00Z = quinta 22:00 BRT (26/11)
  const r = checarSlot('2026-11-27T01:00:00.000Z');
  assert.match(r.bloqueio, /quinta-feira/);
});

test('sexta 20:15 BRT é permitida', () => {
  const r = checarSlot('2026-11-27T23:15:00.000Z');
  assert.equal(r.bloqueio, null);
});

test('sábado 20:45 BRT é permitido e sem aviso', () => {
  const r = checarSlot('2026-11-28T23:45:00.000Z');
  assert.equal(r.bloqueio, null);
  assert.deepEqual(r.avisos, []);
});

test('sábado antes das 20:45 BRT gera aviso (não bloqueia)', () => {
  const r = checarSlot('2026-11-28T14:00:00.000Z'); // sábado 11:00 BRT
  assert.equal(r.bloqueio, null);
  assert.equal(r.avisos.length, 1);
  assert.match(r.avisos[0], /antes das 20:45/);
});

test('data inválida é bloqueada', () => {
  const r = checarSlot('nao-e-data');
  assert.match(r.bloqueio, /inválido/);
});
