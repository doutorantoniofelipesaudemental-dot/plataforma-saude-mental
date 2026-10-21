const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../../scripts/youtube/proximosHorarios');

const ULTIMO = '2027-01-29T22:30:00.000Z'; // sexta 19:30 em Salvador
const dia = (s) => s.slice(0, 10);
const bahia = (s) => new Date(new Date(s).getTime() - 3 * 3600e3).toISOString();

test('um por dia, sempre depois do último horário programado', () => {
  const r = H.proximosHorarios({ ultimoSlot: ULTIMO, tipos: ['short', 'longo', 'short', 'longo', 'short'], feriados: new Set() });
  assert.equal(r.length, 5);
  assert.equal(new Set(r.map((x) => dia(bahia(x.slot)))).size, 5, 'um por dia');
  assert.ok(r.every((x) => x.slot > ULTIMO));
});

test('horários: Shorts 12h e longos 18h, em Salvador; dias permitidos', () => {
  const r = H.proximosHorarios({ ultimoSlot: ULTIMO, tipos: ['short', 'longo', 'short', 'longo'], feriados: new Set() });
  for (const x of r) {
    const local = new Date(new Date(x.slot).getTime() - 3 * 3600e3);
    const dow = local.getUTCDay();
    const hora = local.getUTCHours();
    if (x.tipo === 'short') { assert.equal(hora, 12); assert.ok(H.DIAS_SHORT.has(dow), 'short em dia permitido'); }
    else { assert.equal(hora, 18); assert.ok(H.DIAS_LONGO.has(dow), 'longo em dia permitido'); }
  }
});

test('alterna Shorts e longos quando os dois cabem no dia', () => {
  const r = H.proximosHorarios({ ultimoSlot: ULTIMO, tipos: ['short', 'short', 'longo', 'longo'], feriados: new Set() });
  const seq = r.map((x) => x.tipo);
  assert.ok(seq.some((t, i) => i > 0 && t !== seq[i - 1]), 'há alternância');
});

test('pula feriados do calendário', () => {
  const feriados = new Set(['2027-02-01', '2027-02-02', '2027-02-03']);
  const r = H.proximosHorarios({ ultimoSlot: ULTIMO, tipos: ['short', 'short', 'short', 'short'], feriados });
  assert.ok(r.every((x) => !feriados.has(dia(bahia(x.slot)))));
});

test('lista vazia: nenhum horário', () => {
  assert.deepEqual(H.proximosHorarios({ ultimoSlot: ULTIMO, tipos: [], feriados: new Set() }), []);
});
