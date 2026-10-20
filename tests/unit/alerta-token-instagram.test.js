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

const { alertaDiagnostico } = require('../../scripts/conferencias/alertaToken');

test('diagnóstico da Vercel: nunca rodou = alerta com ação', () => {
  assert.equal(alertaDiagnostico({ agora: new Date(), diag: null }).acao, true);
});

test('diagnóstico da Vercel: OK e recente = sem alerta', () => {
  const agora = new Date('2026-10-25T23:05:00Z');
  assert.equal(alertaDiagnostico({ agora, diag: { ok: true, executadoEm: new Date('2026-10-25T23:00:00Z') } }), null);
});

test('diagnóstico da Vercel: falhou = alerta com o motivo, sem token', () => {
  const agora = new Date('2026-10-25T23:05:00Z');
  const a = alertaDiagnostico({ agora, diag: { ok: false, postId: '2026-10-26-saude-mental-cuidador', executadoEm: new Date('2026-10-25T23:00:00Z'), falhas: ['código 190'] } });
  assert.match(a.texto, /reprovou/);
  assert.match(a.texto, /código 190/);
});

test('diagnóstico da Vercel: resultado com mais de 30 h = alerta', () => {
  const agora = new Date('2026-10-27T12:00:00Z');
  assert.match(alertaDiagnostico({ agora, diag: { ok: true, executadoEm: new Date('2026-10-25T23:00:00Z') } }).texto, /sem resultado há/);
});
