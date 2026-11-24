const test = require('node:test');
const assert = require('node:assert/strict');
const { checarSlot } = require('../../scripts/youtube/travaSlot');

// Datas de referência (BRT = UTC-3)
// 2026-11-24 é terça; 2026-11-25 quarta; 2026-11-26 quinta; 2026-11-27 sexta; 2026-11-28 sábado; 2026-11-29 domingo; 2026-11-30 segunda.

test('terça 09:00 BRT é permitida', () => {
  const r = checarSlot('2026-11-24T12:00:00.000Z');
  assert.equal(r.bloqueio, null);
  assert.deepEqual(r.avisos, []);
});

test('segunda, quarta e sexta são permitidas', () => {
  assert.equal(checarSlot('2026-11-30T23:15:00.000Z').bloqueio, null); // segunda 20:15 BRT
  assert.equal(checarSlot('2026-11-25T23:15:00.000Z').bloqueio, null); // quarta 20:15 BRT
  assert.equal(checarSlot('2026-11-27T23:15:00.000Z').bloqueio, null); // sexta 20:15 BRT
});

test('quinta é recusada', () => {
  const r = checarSlot('2026-11-26T23:15:00.000Z'); // quinta 20:15 BRT
  assert.match(r.bloqueio, /quinta-feira/);
});

test('domingo é recusado', () => {
  const r = checarSlot('2026-11-29T23:15:00.000Z'); // domingo 20:15 BRT
  assert.match(r.bloqueio, /domingo/);
});

test('sábado é recusado (mesmo às 20:45 BRT)', () => {
  const r = checarSlot('2026-11-28T23:45:00.000Z'); // sábado 20:45 BRT
  assert.match(r.bloqueio, /sábado/);
});

test('sábado de manhã também é recusado', () => {
  const r = checarSlot('2026-11-28T14:00:00.000Z'); // sábado 11:00 BRT
  assert.match(r.bloqueio, /sábado/);
});

test('quinta de madrugada em UTC ainda é quinta em BRT (cuidado com fuso)', () => {
  // 2026-11-27T01:00Z = quinta 22:00 BRT (26/11)
  const r = checarSlot('2026-11-27T01:00:00.000Z');
  assert.match(r.bloqueio, /quinta-feira/);
});

test('data inválida é bloqueada', () => {
  const r = checarSlot('nao-e-data');
  assert.match(r.bloqueio, /inválido/);
});
