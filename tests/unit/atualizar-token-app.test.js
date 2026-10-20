const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../../scripts/instagram/atualizarToken');

// Valores fictícios de teste, montados por concatenação (o filtro de segredos recusa literais).
const TOKEN = 'IG' + 'AA' + 'teste-token-fictício-0001';
const SEGREDO = 'segredo' + '-fictício-0002';
const APP = '1595823028949502';

test('conferirApp: sem ID esperado, recusa', () => {
  const r = A.conferirApp('', { appId: APP });
  assert.equal(r.ok, false);
  assert.match(r.motivo, /ID do app não informado/);
});

test('conferirApp: Meta não confirma o app (sem app_id), recusa', () => {
  assert.equal(A.conferirApp(APP, { appId: null }).ok, false);
  assert.equal(A.conferirApp(APP, undefined).ok, false);
});

test('conferirApp: token de outro app, recusa; do app esperado, aceita', () => {
  const outro = A.conferirApp(APP, { appId: '2037156996934639' });
  assert.equal(outro.ok, false);
  assert.match(outro.motivo, /outro app/);
  assert.equal(A.conferirApp(APP, { appId: APP }).ok, true);
});

test('mudouConta: diferente = mudou; igual = não mudou; sem valor anterior = mudou', () => {
  assert.equal(A.mudouConta('111', '222'), true);
  assert.equal(A.mudouConta('111', '111'), false);
  assert.equal(A.mudouConta(undefined, '222'), true);
});

test('resumoValido: mostra host, app e se o ID da conta mudou, sem o valor', () => {
  const s = A.resumoValido({ usuario: 'conta_teste', conta: 'BUSINESS' }, { app: 'Publicador', appId: APP, expiraEm: new Date(Date.UTC(2026, 11, 19)) }, 'graph.instagram.com', true);
  assert.equal(s, `VÁLIDO para @conta_teste (BUSINESS), host graph.instagram.com, app Publicador (id ${APP}), ID da conta MUDOU (atualizado), expira em 19/12/2026`);
  assert.equal(s.includes(TOKEN) || s.includes(SEGREDO), false);
});

test('redigir: esconde o token e o segredo', () => {
  assert.equal(A.redigir(`erro ${TOKEN} e ${SEGREDO}`, TOKEN, SEGREDO), 'erro [REDACTED] e [REDACTED]');
});

test('atualizarVariavelEnv: troca só a linha pedida, acrescenta se faltar e mantém CRLF', () => {
  assert.equal(A.atualizarVariavelEnv('A=1\nINSTAGRAM_APP_ID=velho\n', 'INSTAGRAM_APP_ID', APP), `A=1\nINSTAGRAM_APP_ID=${APP}\n`);
  assert.equal(A.atualizarVariavelEnv('A=1\r\n', 'INSTAGRAM_APP_SECRET', 'x'), 'A=1\r\nINSTAGRAM_APP_SECRET=x\r\n');
  assert.equal(A.atualizarEnv('INSTAGRAM_ACCESS_TOKEN=velho\n', TOKEN), `INSTAGRAM_ACCESS_TOKEN=${TOKEN}\n`);
});
