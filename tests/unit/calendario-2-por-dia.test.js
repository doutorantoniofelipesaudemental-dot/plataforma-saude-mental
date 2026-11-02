// Ritmo novo (ordem de 01/11/2026): 2 por dia, 08:00 e 14:00 (Bahia), todos os dias da semana.
const test = require('node:test');
const assert = require('node:assert/strict');
const cal = require('../../backend/lib/calendarioSite');

test('horários: 08:00 e 14:00, 2 por dia', () => {
  assert.deepEqual(cal.HORARIOS, ['08:00', '14:00']);
  assert.equal(cal.POR_DIA, 2);
});

test('dias: todos os dias da semana (inclui sábado e domingo)', () => {
  const dias = cal.diasUteis(7, { todosOsDias: true });
  const dows = dias.map((d) => new Date(`${d}T12:00:00Z`).getUTCDay());
  assert.ok(dows.includes(0) && dows.includes(6), 'precisa incluir domingo e sábado');
  assert.equal(new Set(dias).size, 7);
});

test('montarCalendario: 2 itens por dia nos dois horários', () => {
  const itens = [0, 1, 2, 3, 4, 5].map((i) => ({ slug: `a${i}`, titulo: `t${i}`, tipo: 'artigo', categoria: ['Pais & Famílias', 'Médicos & Enfermeiros', 'Empresas & RH'][i % 3], ordem: i, semana: 1 }));
  const { agenda } = cal.montarCalendario(itens, {});
  assert.equal(agenda.length, 6);
  const porDia = {};
  for (const a of agenda) (porDia[a.data] = porDia[a.data] || []).push(a.hora);
  for (const horas of Object.values(porDia)) assert.deepEqual(horas.sort(), ['08:00', '14:00']);
});
