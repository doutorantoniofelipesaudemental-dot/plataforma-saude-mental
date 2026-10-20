const test = require('node:test');
const assert = require('node:assert/strict');
const { alertaTokenInstagram } = require('../../scripts/conferencias/alertaToken');

test('sem data conhecida não gera alerta', () => {
  assert.equal(alertaTokenInstagram({ hoje: '2026-10-20', expiraEm: null }), null);
});

test('mais de 15 dias para vencer: sem alerta', () => {
  assert.equal(alertaTokenInstagram({ hoje: '2026-10-20', expiraEm: new Date('2026-12-14T12:00:00Z') }), null);
});

test('15 dias ou menos: alerta com ação na primeira linha', () => {
  const a = alertaTokenInstagram({ hoje: '2026-11-29', expiraEm: new Date('2026-12-14T12:00:00Z') });
  assert.equal(a.acao, true);
  assert.equal(a.primeira, true);
  assert.match(a.texto, /vence em 15 dia/);
});

test('vencido: alerta com ação', () => {
  const a = alertaTokenInstagram({ hoje: '2026-12-20', expiraEm: new Date('2026-12-14T12:00:00Z') });
  assert.match(a.texto, /VENCIDO/);
});
