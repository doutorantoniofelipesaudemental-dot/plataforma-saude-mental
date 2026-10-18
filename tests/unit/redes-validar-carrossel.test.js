// Validação do carrossel SEM publicar (modo --validar) e publicação segura (containers FINISHED antes do media_publish).
// A rede é simulada: nenhuma chamada real à Meta.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..', '..');
const ler = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');

function simularMeta({ statusDoContainerFinal = 'FINISHED' } = {}) {
  const chamadas = [];
  let n = 0;
  const original = global.fetch;
  global.fetch = async (url, opcoes = {}) => {
    const u = String(url);
    const metodo = (opcoes.method || 'GET').toUpperCase();
    const corpo = opcoes.body ? String(opcoes.body) : '';
    chamadas.push({ metodo, u, corpo });
    const json = (o, status = 200) => ({ ok: status < 400, status, json: async () => o });
    if (metodo === 'POST' && /\/media_publish$/.test(u)) return json({ id: 'midia-publicada-1' });
    if (metodo === 'POST' && /\/media$/.test(u)) { n += 1; return json({ id: /CAROUSEL/.test(corpo) ? 'container-carrossel' : `item-${n}` }); }
    if (/fields=status_code/.test(u)) return json({ status_code: /container-carrossel/.test(u) ? statusDoContainerFinal : 'FINISHED' });
    if (/fields=permalink/.test(u)) return json({ permalink: 'https://www.instagram.com/p/teste/' });
    return json({});
  };
  return { chamadas, restaurar: () => { global.fetch = original; } };
}

function ambiente() {
  const ant = { t: process.env.INSTAGRAM_ACCESS_TOKEN, c: process.env.INSTAGRAM_ACCOUNT_ID, r: process.env.REDES_PUBLICACAO_ATIVA, m: process.env.MONGODB_URI };
  process.env.INSTAGRAM_ACCESS_TOKEN = 'IGAAteste'; process.env.INSTAGRAM_ACCOUNT_ID = '123'; process.env.REDES_PUBLICACAO_ATIVA = 'true'; delete process.env.MONGODB_URI;
  return () => { for (const [k, v] of [['INSTAGRAM_ACCESS_TOKEN', ant.t], ['INSTAGRAM_ACCOUNT_ID', ant.c], ['REDES_PUBLICACAO_ATIVA', ant.r], ['MONGODB_URI', ant.m]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } };
}

const URLS = Array.from({ length: 5 }, (_, i) => `https://www.drantoniofelipemedico.com.br/api/redes-v2/img/post/${i + 1}.png`);

test('--validar: cria 5 itens + o container do carrossel, espera FINISHED e NUNCA chama media_publish', async () => {
  const volta = ambiente(); const meta = simularMeta();
  try {
    const { validarCarrosselNoInstagram } = require('../../backend/lib/socialPublisher');
    const r = await validarCarrosselNoInstagram({ imagensUrls: URLS, legenda: 'legenda', alts: [] });
    assert.equal(r.itens, 5); assert.equal(r.status, 'FINISHED'); assert.equal(r.publicado, false);
    assert.equal(meta.chamadas.filter((c) => /media_publish/.test(c.u)).length, 0, 'media_publish nunca é chamado');
    assert.equal(meta.chamadas.filter((c) => c.metodo === 'POST' && /\/media$/.test(c.u)).length, 6, '5 itens + 1 container do carrossel');
    assert.match(meta.chamadas.find((c) => /CAROUSEL/.test(c.corpo)).corpo, /children=item-1%2Citem-2%2Citem-3%2Citem-4%2Citem-5/, 'itens na ordem');
  } finally { meta.restaurar(); volta(); }
});

test('--validar funciona mesmo com o freio desligado (não publica); a publicação continua bloqueada pelo freio', async () => {
  const volta = ambiente(); process.env.REDES_PUBLICACAO_ATIVA = 'false'; const meta = simularMeta();
  try {
    const sp = require('../../backend/lib/socialPublisher');
    const r = await sp.validarCarrosselNoInstagram({ imagensUrls: URLS, legenda: 'l' });
    assert.equal(r.publicado, false);
    await assert.rejects(() => sp.publicarCarrosselNoInstagram({ imagensUrls: URLS, legenda: 'l' }), /freio|REDES_PUBLICACAO_ATIVA/i);
    assert.equal(meta.chamadas.filter((c) => /media_publish/.test(c.u)).length, 0);
  } finally { meta.restaurar(); volta(); }
});

test('publicação: só chama media_publish DEPOIS de todos os containers FINISHED', async () => {
  const volta = ambiente(); const meta = simularMeta();
  try {
    const sp = require('../../backend/lib/socialPublisher');
    const r = await sp.publicarCarrosselNoInstagram({ imagensUrls: URLS, legenda: 'l' });
    assert.equal(r.id, 'midia-publicada-1'); assert.equal(r.itens, 5);
    const iPub = meta.chamadas.findIndex((c) => /media_publish/.test(c.u));
    const iUltimoStatus = meta.chamadas.map((c, i) => (/fields=status_code/.test(c.u) ? i : -1)).filter((i) => i >= 0).pop();
    assert.ok(iPub > iUltimoStatus, 'a publicação vem depois da última checagem de status');
    assert.equal(meta.chamadas.filter((c) => /media_publish/.test(c.u)).length, 1, 'uma única publicação');
  } finally { meta.restaurar(); volta(); }
});

test('publicação: container do carrossel com ERROR → nada é publicado (nunca pela metade)', async () => {
  const volta = ambiente(); const meta = simularMeta({ statusDoContainerFinal: 'ERROR' });
  try {
    const sp = require('../../backend/lib/socialPublisher');
    await assert.rejects(() => sp.publicarCarrosselNoInstagram({ imagensUrls: URLS, legenda: 'l' }), /falhou ao processar|CONTAINER/i);
    assert.equal(meta.chamadas.filter((c) => /media_publish/.test(c.u)).length, 0);
  } finally { meta.restaurar(); volta(); }
});

test('código: o modo --validar não referencia media_publish; liberar exige validação aprovada; o publicador tem trava e adia em falha', () => {
  const t = ler('backend/scripts/redes/testeCarrossel.js');
  const trechoValidar = t.slice(t.indexOf('async function validarPost'), t.indexOf('async function preparar'));
  assert.ok(trechoValidar.length > 500);
  assert.doesNotMatch(trechoValidar, /media_publish|publicarCarrosselNoInstagram/);
  assert.match(t, /sem validação aprovada em todos os posts/);
  assert.match(t, /publicouAlgo: false/);
  const sp = ler('backend/lib/socialPublisher.js');
  const corpoValidar = sp.slice(sp.indexOf('async function validarCarrosselNoInstagram'), sp.indexOf('/** Só leitura'));
  assert.doesNotMatch(corpoValidar, /media_publish/);
  const fila = ler('backend/lib/redesV2/fila.js');
  assert.match(fila, /status: 'publicando'/);
  assert.match(fila, /adiadoAte/);
  assert.match(fila, /conferirPublicacaoInstagram/);
});

test('trava do publicador: só a primeira execução consegue; a segunda (ou um post já publicado) não publica de novo', async () => {
  const { travarPost } = require('../../backend/lib/redesV2/fila');
  const docs = new Map([['a', { _id: 'a', status: 'aprovado-checagem', instagramId: null }], ['b', { _id: 'b', status: 'publicado', instagramId: 'x1' }]]);
  const colecao = { async findOneAndUpdate(filtro, upd) { const d = docs.get(filtro._id); if (!d || d.status !== filtro.status || (d.instagramId ?? null) !== filtro.instagramId) return null; Object.assign(d, upd.$set); return { ...d }; } };
  assert.equal(await travarPost(colecao, 'a'), true);
  assert.equal(await travarPost(colecao, 'a'), false, 'segunda tentativa não passa');
  assert.equal(await travarPost(colecao, 'b'), false, 'já publicado não passa');
  assert.equal(await travarPost({ async findOneAndUpdate() { return { value: null }; } }, 'a'), false, 'formato antigo do driver, sem documento');
  assert.equal(await travarPost({ async findOneAndUpdate() { return { value: { _id: 'a' } }; } }, 'a'), true, 'formato antigo do driver, com documento');
});
