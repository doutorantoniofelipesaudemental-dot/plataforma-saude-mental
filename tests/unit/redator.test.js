// Redator de logs (backend/lib/log.js) e verificador de segredos
// (scripts/verificar-segredos.js). Tokens falsos são montados por
// concatenação para que este arquivo não dispare o próprio verificador.
const { test } = require('node:test');
const assert = require('node:assert');

const TOKEN_IG = 'IG' + 'AA' + 'Falso' + 'x'.repeat(60);
const TOKEN_FB = 'EA' + 'A' + 'Bfalso' + 'y'.repeat(60);
const URI_MONGO = 'mongodb+srv://' + 'appuser:S3nhaF4lsa' + '@cluster0.exemplo.mongodb.net/db';

const { mascarar, log } = require('../../backend/lib/log');
const { varrerTexto } = require('../../scripts/verificar-segredos');

test('mascara tokens da Meta (IGAA e EAA)', () => {
  const s = mascarar(`token ${TOKEN_IG} e ${TOKEN_FB}`);
  assert.ok(!s.includes(TOKEN_IG) && !s.includes(TOKEN_FB));
  assert.match(s, /IGAA\*\*\*/);
  assert.match(s, /EAA\*\*\*/);
});

test('mascara cabeçalho Bearer, access_token em URL e string do MongoDB', () => {
  const s = mascarar(
    `Authorization: Bearer ${TOKEN_IG} | https://graph.instagram.com/me?fields=id&access_token=${TOKEN_IG}&x=1 | ${URI_MONGO}`
  );
  assert.ok(!s.includes(TOKEN_IG));
  assert.ok(!s.includes('S3nhaF4lsa'));
  assert.match(s, /Bearer \*\*\*/);
  assert.match(s, /access_token=\*\*\*&x=1/);
  assert.match(s, /mongodb\+srv:\/\/\*\*\*@cluster0/);
});

test('mascara o valor exato de variáveis de ambiente sensíveis, mesmo sem prefixo conhecido', () => {
  const antes = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'segredo-sem-prefixo-' + '9f8e7d'; // segredos:permitir (valor falso de teste)
  try {
    const s = mascarar(`chamada com ${process.env.CRON_SECRET} no meio`);
    assert.ok(!s.includes(process.env.CRON_SECRET));
    assert.match(s, /\*\*\*CRON_SECRET\*\*\*/);
  } finally {
    if (antes === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = antes;
  }
});

test('log.erro mascara objetos e stack de Error antes de chegar ao console', () => {
  const saidas = [];
  const original = console.error;
  console.error = (...args) => saidas.push(args.join(' '));
  try {
    log.erro('[teste]', { resposta: { url: `https://x/?access_token=${TOKEN_IG}` } }, new Error(`falhou com ${TOKEN_FB}`));
  } finally {
    console.error = original;
  }
  const texto = saidas.join('\n');
  assert.ok(!texto.includes(TOKEN_IG) && !texto.includes(TOKEN_FB));
  assert.match(texto, /\[teste\]/);
});

test('verificador de segredos detecta tokens reais e ignora placeholders e nomes de chave', () => {
  assert.equal(varrerTexto(`const t = "${TOKEN_IG}";`).length, 1);
  assert.equal(varrerTexto(`x=${TOKEN_FB}`).length, 1);
  assert.equal(varrerTexto(`MONGODB_URI=${URI_MONGO}`).length, 1);
  assert.equal(varrerTexto('CRON_SECRET=' + 'a8F3kd92LmQ0zx7P').length, 1);
  assert.equal(varrerTexto('MONGODB_URI="mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net"').length, 0);
  assert.equal(varrerTexto("const CHAVE_TOKEN = 'dsm_admin_token';").length, 0);
  assert.equal(varrerTexto('if (/^INSTAGRAM_ACCESS_TOKEN=.*$/m.test(x))').length, 0);
  assert.equal(varrerTexto(`exemplo ${TOKEN_IG} // segredos:permitir`).length, 0);
});
