const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../../scripts/trava-portao');

const agora = Date.parse('2026-10-23T22:00:00Z');

test('sem trava: adquire', () => {
  assert.equal(T.decidirTrava({ existente: null, pidVivo: false, agoraMs: agora }).acao, 'adquirir');
});

test('trava de processo vivo e recente: bloqueia (um portão por vez)', () => {
  const r = T.decidirTrava({ existente: { pid: 123, inicio: '2026-10-23T21:30:00Z' }, pidVivo: true, agoraMs: agora });
  assert.equal(r.acao, 'bloquear');
});

test('trava de processo morto: libera (job que morreu não trava a fila)', () => {
  const r = T.decidirTrava({ existente: { pid: 123, inicio: '2026-10-23T21:30:00Z' }, pidVivo: false, agoraMs: agora });
  assert.equal(r.acao, 'liberar-antiga');
});

test('trava de mais de 90 min libera mesmo com processo vivo', () => {
  const r = T.decidirTrava({ existente: { pid: 123, inicio: '2026-10-23T19:00:00Z' }, pidVivo: true, agoraMs: agora });
  assert.equal(r.acao, 'liberar-antiga');
});
