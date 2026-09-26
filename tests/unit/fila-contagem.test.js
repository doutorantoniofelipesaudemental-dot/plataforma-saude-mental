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
const consulta = (lista) => ({ sort: () => ({ select: () => ({ lean: async () => lista[0] || null }) }) });

injetar('models/Artigo.js', {
  countDocuments: async (f) => postsFila.filter((d) => d >= f.publicadoRedesEm.$gte).length,
  findOne: () => consulta([...postsFila].sort((a, b) => b - a).map((d) => ({ publicadoRedesEm: d }))),
});
injetar('models/RegistroPublicacao.js', {
  countDocuments: async (f) => {
    assert.equal(f.origem, 'bot');
    assert.equal(f.resultado, 'publicado');
    return postsBot.filter((d) => d >= f.data.$gte).length;
  },
  findOne: () => consulta([...postsBot].sort((a, b) => b - a).map((d) => ({ data: d }))),
});
injetar('lib/socialPublisher.js', { publicarArtigoNasRedes: async () => ({}), ErroPublicacao: class extends Error {} });
injetar('lib/tokenInstagram.js', { estadoPausa: async () => null });

const { motivoParaAguardar } = require(path.join(RAIZ, 'lib/filaRedes.js'));
const haHoras = (h) => new Date(AGORA - h * HORA);

beforeEach(() => {
  postsFila = [];
  postsBot = [];
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
