// Simulação da renovação semanal do token do Instagram Login (sem rede e sem banco reais):
// renova ANTES de vencer, grava renovadoEm/expiraEm e guarda o novo token cifrado; token recusado pausa a fila.
const { test } = require('node:test');
const assert = require('node:assert');

const db = require('../../backend/lib/db');
const Credencial = require('../../backend/models/Credencial');
const token = require('../../backend/lib/tokenInstagram');

const DIA = 86400e3;

function preparar({ doc = null, respostaMeta }) {
  const original = { connect: db.connect, isConfigured: db.isConfigured, findOne: Credencial.findOne, updateOne: Credencial.updateOne, findOneAndUpdate: Credencial.findOneAndUpdate, fetch: global.fetch, env: { ...process.env } };
  const gravado = [];
  const chamadas = [];
  db.connect = async () => {};
  db.isConfigured = () => true;
  Credencial.findOne = () => ({ lean: async () => doc });
  Credencial.updateOne = async (filtro, update) => { gravado.push(update.$set); };
  Credencial.findOneAndUpdate = () => ({ lean: async () => null });
  process.env.INSTAGRAM_ACCESS_TOKEN = 'IGAA_token_atual_de_teste_1234567890'; // segredos:permitir (valor fictício de teste)
  process.env.CRON_SECRET = 'segredo-de-teste-apenas'; // segredos:permitir (valor fictício de teste)
  global.fetch = async (url, opcoes) => { chamadas.push({ url: String(url), auth: opcoes?.headers?.Authorization ? 'Bearer ***' : null }); return respostaMeta; };
  const restaurar = () => { Object.assign(db, { connect: original.connect, isConfigured: original.isConfigured }); Credencial.findOne = original.findOne; Credencial.updateOne = original.updateOne; Credencial.findOneAndUpdate = original.findOneAndUpdate; global.fetch = original.fetch; process.env = original.env; };
  return { gravado, chamadas, restaurar };
}

const resposta = (status, corpo) => ({ ok: status < 400, status, json: async () => corpo });

test('renova o token de longa duração (60 dias), grava renovadoEm/expiraEm e guarda o novo token CIFRADO', async () => {
  const t = preparar({ respostaMeta: resposta(200, { access_token: 'IGAA_token_novo_de_teste_abcdefghij', token_type: 'bearer', expires_in: 5184000 }) }); // segredos:permitir (valor fictício de teste)
  try {
    const r = await token.renovarTokenInstagram();
    assert.equal(r.renovado, true);
    assert.match(t.chamadas[0].url, /graph\.instagram\.com\/refresh_access_token\?grant_type=ig_refresh_token&access_token=/);
    assert.equal(t.chamadas[0].auth, null, 'a Meta exige access_token na QUERY neste endpoint (sem ele: código 100)');
    const g = t.gravado.at(-1);
    assert.ok(g.renovadoEm instanceof Date, 'grava renovadoEm');
    const dias = Math.round((g.expiraEm - g.renovadoEm) / DIA);
    assert.equal(dias, 60, 'validade de 60 dias');
    assert.ok(g.cifrado && !g.cifrado.includes('IGAA_token_novo'), 'token novo guardado cifrado, nunca em texto puro'); // segredos:permitir (valor fictício de teste)
  } finally { t.restaurar(); }
});

test('token recusado pela Meta (190) pausa a fila em vez de insistir', async () => {
  const t = preparar({ respostaMeta: resposta(400, { error: { code: 190, message: 'Invalid OAuth access token' } }) });
  try {
    const r = await token.renovarTokenInstagram();
    assert.equal(r.renovado, false);
    assert.ok(t.gravado.some((g) => g.pausadoEm), 'registra a pausa');
  } finally { t.restaurar(); }
});

test('token que não é do Instagram Login (EAA) não é renovado por ig_refresh_token', async () => {
  const t = preparar({ respostaMeta: resposta(200, {}) });
  process.env.INSTAGRAM_ACCESS_TOKEN = 'EAAtokendepaginadefacebook12345'; // segredos:permitir (valor fictício de teste)
  try {
    const r = await token.renovarTokenInstagram();
    assert.equal(r.renovado, false);
    assert.equal(t.chamadas.length, 0, 'não chama a Meta');
  } finally { t.restaurar(); }
});
