// Envio único da demo como não listado: só o id fixo, só unlisted, com --confirmar, uma vez.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { podeEnviar, ID, TITULO } = require('../../scripts/youtube/enviarDemoNaoListada.js');
const ARQ = path.join('C:/x', 'carrosseis-instagram', 'youtube', 'demo-auditoria', 'demo.mp4');
const base = { id: ID, arquivo: ARQ, privacidade: 'unlisted', titulo: TITULO, confirmar: true, jaEnviado: false };

test('permite o envio único com os parâmetros aprovados', () => {
  assert.equal(podeEnviar(base).ok, true);
});
test('recusa public', () => {
  assert.equal(podeEnviar({ ...base, privacidade: 'public' }).ok, false);
});
test('recusa sem --confirmar e sem id explícito', () => {
  assert.equal(podeEnviar({ ...base, confirmar: false }).ok, false);
  assert.equal(podeEnviar({ ...base, id: '' }).ok, false);
});
test('recusa segundo envio e outro arquivo', () => {
  assert.equal(podeEnviar({ ...base, jaEnviado: true }).ok, false);
  assert.equal(podeEnviar({ ...base, arquivo: 'C:/x/outro.mp4' }).ok, false);
});
