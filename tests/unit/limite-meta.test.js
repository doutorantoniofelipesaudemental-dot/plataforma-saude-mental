// Contador de chamadas à Meta (backend/lib/limiteMeta.js): lê X-App-Usage e respeita o teto por hora.
const { test } = require('node:test');
const assert = require('node:assert');
const m = require('../../backend/lib/limiteMeta');

test('lê o maior percentual do X-App-Usage e aceita cabeçalho ausente ou inválido', () => {
  assert.strictEqual(m.usoDoCabecalho('{"call_count":80,"total_time":10,"total_cputime":5}'), 80);
  assert.strictEqual(m.usoDoCabecalho(null), null);
  assert.strictEqual(m.usoDoCabecalho('não é json'), null);
});

test('para quando o uso da Meta passa de 75%', () => {
  const r = m.podeChamar({ agora: new Date('2026-10-25T18:00:00-03:00'), usoPercent: 76 });
  assert.strictEqual(r.pode, false);
  assert.match(r.motivo, /76%/);
});

test('conta por hora: no teto para, na hora seguinte recomeça do zero', () => {
  const a = new Date('2026-10-25T18:10:00-03:00');
  let estado = {};
  for (let i = 0; i < 3; i += 1) estado = m.registrarChamada(estado, a);
  assert.strictEqual(m.podeChamar({ agora: a, estado, teto: 3 }).pode, false);
  assert.strictEqual(m.podeChamar({ agora: new Date('2026-10-25T19:05:00-03:00'), estado, teto: 3 }).pode, true);
});

test('registrar não altera o estado anterior', () => {
  const e0 = { hora: '2026-10-25T18', contagem: 2 };
  const e1 = m.registrarChamada(e0, new Date('2026-10-25T18:30:00-03:00'));
  assert.strictEqual(e0.contagem, 2);
  assert.strictEqual(e1.contagem, 3);
});
