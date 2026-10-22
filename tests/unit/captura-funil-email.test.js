const { test } = require('node:test');
const assert = require('node:assert/strict');
const f = require('../../backend/lib/funilEmail.js');

const COM_CHAVES = { POCKETSFLOW_API_KEY: 'k', POCKETSFLOW_WEBHOOK_URL: 'https://funil.exemplo/hook' };
const OK = { email: 'Pessoa@Exemplo.com', consentimento: true };

test('sem chaves: 503 com a mensagem explicativa, sem exceção', () => {
  const d = f.decidirCaptura({ corpo: OK, config: f.lerConfigFunil({}) });
  assert.equal(d.status, 503);
  assert.equal(d.corpo.erro, f.MENSAGEM_DESATIVADO);
  assert.equal(d.encaminhar, undefined);
});

test('chave sem URL do funil continua desativado', () => {
  assert.equal(f.lerConfigFunil({ POCKETSFLOW_API_KEY: 'k' }).ativo, false);
});

test('com chaves: encaminha e-mail normalizado, consentimento e produto, nada além disso', () => {
  const d = f.decidirCaptura({ corpo: OK, config: f.lerConfigFunil(COM_CHAVES) });
  assert.equal(d.status, 202);
  assert.deepEqual(Object.keys(d.encaminhar).sort(), ['consentimentoEm', 'email', 'origem', 'produto']);
  assert.equal(d.encaminhar.email, 'pessoa@exemplo.com');
  assert.equal(d.encaminhar.origem, 'miniaplicativo');
});

test('recusa e-mail inválido e falta de consentimento LGPD (400)', () => {
  const cfg = f.lerConfigFunil(COM_CHAVES);
  assert.equal(f.decidirCaptura({ corpo: { email: 'x', consentimento: true }, config: cfg }).status, 400);
  assert.equal(f.decidirCaptura({ corpo: { email: 'a@b.com', consentimento: false }, config: cfg }).status, 400);
  assert.equal(f.decidirCaptura({ corpo: { email: 'a@b.com' }, config: cfg }).status, 400);
});

test('honeypot preenchido: finge sucesso e não encaminha', () => {
  const d = f.decidirCaptura({ corpo: { ...OK, website: 'spam' }, config: f.lerConfigFunil(COM_CHAVES) });
  assert.equal(d.status, 202);
  assert.equal(d.encaminhar, undefined);
});

test('o payload nunca carrega respostas de humor, diário ou escalas', () => {
  const corpo = { ...OK, humor: 2, notas: 'diário', phq9: [1, 2], gad7: [3] };
  const d = f.decidirCaptura({ corpo, config: f.lerConfigFunil(COM_CHAVES) });
  const texto = JSON.stringify(d.encaminhar);
  assert.doesNotMatch(texto, /humor|diário|phq9|gad7|notas/);
});
