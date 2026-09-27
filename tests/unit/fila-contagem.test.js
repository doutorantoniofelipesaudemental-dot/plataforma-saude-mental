// Contagem unificada da conta (backend/lib/filaRedes.js#motivoParaAguardar):
// posts da fila (Artigo.publicadoRedesEm) + carrosséis do bot de mídias
// (RegistroPublicacao origem "bot"), sem banco — os dois modelos são injetados.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../../backend');
const HORA = 60 * 60 * 1000;
const AGORA = new Date('2026-09-26T18:00:00Z');

function injetar(modulo, exportado) {
  const arquivo = require.resolve(path.join(RAIZ, modulo));
  require.cache[arquivo] = { id: arquivo, filename: arquivo, loaded: true, exports: exportado };
}

// Estado em memória: horários de posts da fila e do bot.
let postsFila = [];
let postsBot = [];
// Para listarFila: registros de publicação e artigos aprovados em memória.
let registros = [];
let aprovados = [];
const consulta = (lista) => ({ sort: () => ({ select: () => ({ lean: async () => lista[0] || null }) }) });

injetar('models/Artigo.js', {
  countDocuments: async (f) => postsFila.filter((d) => d >= f.publicadoRedesEm.$gte).length,
  findOne: () => consulta([...postsFila].sort((a, b) => b - a).map((d) => ({ publicadoRedesEm: d }))),
  // Só o $match importa aqui: aplica o $nin de id/slug sobre os aprovados.
  aggregate: async (pipeline) => {
    const { _id, slug } = pipeline[0].$match;
    return aprovados.filter((a) => !_id.$nin.includes(a._id) && !slug.$nin.includes(a.slug));
  },
});
injetar('models/RegistroPublicacao.js', {
  countDocuments: async (f) => {
    assert.equal(f.origem, 'bot');
    assert.equal(f.resultado, 'publicado');
    return postsBot.filter((d) => d >= f.data.$gte).length;
  },
  findOne: () => consulta([...postsBot].sort((a, b) => b - a).map((d) => ({ data: d }))),
  distinct: async (campo, f) =>
    registros.filter((r) => r.origem === f.origem && r.resultado === f.resultado).map((r) => r[campo]),
});
injetar('lib/socialPublisher.js', { publicarArtigoNasRedes: async () => ({}), ErroPublicacao: class extends Error {} });
injetar('lib/tokenInstagram.js', { estadoPausa: async () => null });

const { motivoParaAguardar, listarFila } = require(path.join(RAIZ, 'lib/filaRedes.js'));
const haHoras = (h) => new Date(AGORA - h * HORA);

beforeEach(() => {
  postsFila = [];
  postsBot = [];
  registros = [];
  aprovados = [];
  delete process.env.REDES_POSTS_POR_DIA;
  delete process.env.REDES_INTERVALO_MIN_HORAS;
});

test('teto de 2 por dia conta fila + bot juntos', async () => {
  postsFila = [haHoras(10)];
  postsBot = [haHoras(6)];
  assert.match(await motivoParaAguardar(AGORA), /teto diário atingido \(2\/2 nas últimas 24h: fila 1, bot 1\)/);
});

test('post do bot há 1 h segura a fila pelo intervalo mínimo', async () => {
  postsBot = [haHoras(1)];
  assert.match(await motivoParaAguardar(AGORA), /intervalo mínimo não cumprido \(último post há 1\.0h/);
});

test('post da fila há 2 h segura o bot pelo mesmo intervalo', async () => {
  postsFila = [haHoras(2)];
  assert.match(await motivoParaAguardar(AGORA), /intervalo mínimo não cumprido \(último post há 2\.0h/);
});

test('livre quando os dois estão fora da janela', async () => {
  postsFila = [haHoras(30)];
  postsBot = [haHoras(5)];
  assert.equal(await motivoParaAguardar(AGORA), null);
});

test('fila ignora artigo que o bot já publicou (por slug ou por id)', async () => {
  aprovados = [
    { _id: 'a1', slug: 'saude-mental-residencia' },
    { _id: 'a2', slug: 'burnout-aps' },
    { _id: 'a3', slug: 'compulsao-alimentar-compras-compulsivas' },
    { _id: 'a4', slug: 'tmc-aps' },
  ];
  registros = [
    { origem: 'bot', resultado: 'publicado', artigo: 'a2', slug: 'burnout-aps' },
    { origem: 'bot', resultado: 'publicado', artigo: 'a4', slug: 'slug-antigo-do-tmc' }, // slug mudou depois: o id ainda barra
  ];
  assert.deepEqual((await listarFila()).map((a) => a.slug), ['saude-mental-residencia', 'compulsao-alimentar-compras-compulsivas']);
});

test('registro do bot sem publicação concluída (ou de outra origem) não tira o artigo da fila', async () => {
  aprovados = [{ _id: 'a1', slug: 'saude-mental-residencia' }, { _id: 'a2', slug: 'burnout-aps' }];
  registros = [
    { origem: 'bot', resultado: 'falha-rede', artigo: 'a1', slug: 'saude-mental-residencia' },
    { origem: 'previa', resultado: 'previa', artigo: 'a2', slug: 'burnout-aps' },
  ];
  assert.deepEqual((await listarFila()).map((a) => a.slug), ['saude-mental-residencia', 'burnout-aps']);
});
