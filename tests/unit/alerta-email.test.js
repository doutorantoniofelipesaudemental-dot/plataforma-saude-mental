const test = require('node:test');
const assert = require('node:assert/strict');
const { enviarAlerta, textoSeguro, DESTINO } = require('../../scripts/alertas/enviarAlerta');

const fetchOk = (chamadas) => async (url, opts) => { chamadas.push({ url, opts }); return { ok: true, status: 200 }; };

test('desligado sem RESEND_API_KEY: não chama a rede', async () => {
  const chamadas = [];
  const r = await enviarAlerta({ assunto: 'teste', texto: 'x' }, { env: {}, fetchFn: fetchOk(chamadas) });
  assert.equal(r.enviado, false);
  assert.match(r.motivo, /desligado/);
  assert.equal(chamadas.length, 0);
});

test('com a chave: envia para o destino do Dr. Antônio, com assunto marcado', async () => {
  const chamadas = [];
  const r = await enviarAlerta({ assunto: 'falha na conferência', texto: 'token vence em 3 dias' }, { env: { RESEND_API_KEY: 'chave-fake' }, fetchFn: fetchOk(chamadas) });
  assert.equal(r.enviado, true);
  const corpo = JSON.parse(chamadas[0].opts.body);
  assert.deepEqual(corpo.to, [DESTINO]);
  assert.equal(corpo.subject, '[DrSM] falha na conferência');
  assert.equal(chamadas[0].opts.headers.Authorization, 'Bearer chave-fake');
});

test('recusa texto com CPF ou CID (dado pessoal de saúde)', async () => {
  assert.equal(textoSeguro('paciente 123.456.789-09'), false);
  assert.equal(textoSeguro('CID F32 no alerta'), false);
  const chamadas = [];
  const r = await enviarAlerta({ assunto: 'x', texto: 'CID10 F32' }, { env: { RESEND_API_KEY: 'k' }, fetchFn: fetchOk(chamadas) });
  assert.equal(r.enviado, false);
  assert.equal(chamadas.length, 0);
});

test('falha da API não derruba o processo', async () => {
  const r = await enviarAlerta({ assunto: 'x', texto: 'y' }, { env: { RESEND_API_KEY: 'k' }, fetchFn: async () => ({ ok: false, status: 403 }) });
  assert.deepEqual(r, { enviado: false, motivo: 'API respondeu HTTP 403' });
});

test('assunto ou texto vazio não envia', async () => {
  const r = await enviarAlerta({ assunto: '', texto: 'y' }, { env: { RESEND_API_KEY: 'k' }, fetchFn: fetchOk([]) });
  assert.equal(r.enviado, false);
});
