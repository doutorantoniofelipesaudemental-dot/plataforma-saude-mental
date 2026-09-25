// Pausa automática da fila quando a Meta recusa o token (backend/lib/
// tokenInstagram.js + filaRedes.js + socialPublisher.js), sem banco nem rede
// reais: Artigo, Credencial, db e fetch são substituídos por versões em memória.
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const RAIZ = path.resolve(__dirname, '../../backend');
const TOKEN_REVOGADO = 'IG' + 'AA' + 'Revogado' + 'r'.repeat(60);
const TOKEN_NOVO = 'IG' + 'AA' + 'Novo' + 'n'.repeat(60);

function injetar(modulo, exportado) {
  const arquivo = require.resolve(path.join(RAIZ, modulo));
  require.cache[arquivo] = { id: arquivo, filename: arquivo, loaded: true, exports: exportado };
}

// Credencial em memória.
const docs = {};
injetar('models/Credencial.js', {
  findOne: ({ chave }) => ({ lean: async () => docs[chave] || null }),
  updateOne: async ({ chave }, { $set }) => { docs[chave] = { ...(docs[chave] || {}), chave, ...$set }; },
  findOneAndUpdate: ({ chave }, { $set }) => ({ lean: async () => { docs[chave] = { ...(docs[chave] || {}), chave, ...$set }; return docs[chave]; } }),
});

// Artigo em memória: um artigo aprovado no topo da fila.
const ARTIGO = {
  _id: 'a1', slug: 'tmc-aps', titulo: 'Título', resumo: 'Resumo', status: 'aprovado', publicado: true,
  conteudo: 'x'.repeat(200), imagemCapa: 'https://blob.exemplo/capa.png', categoria: 'Geral',
};
injetar('models/Artigo.js', {
  aggregate: async () => [{ _id: 'a1', slug: 'tmc-aps', engajamento: 95 }],
  countDocuments: async () => 0,
  findOne: () => ({ sort: () => ({ select: () => ({ lean: async () => null }) }) }),
  findById: () => ({ lean: async () => ARTIGO }),
  findByIdAndUpdate: async () => { throw new Error('não deveria marcar como publicado'); },
});

// A tripla checagem editorial e a capa 4:5 têm teste próprio
// (tripla-checagem.test.js); aqui só importa a pausa por token: o post é
// aprovado e a capa "já existe", para a execução chegar até a Meta.
injetar('lib/checagemRedes.js', {
  executarTriplaChecagem: async () => ({
    aprovado: true, motivo: null,
    conteudo: { ok: true, falhas: [] }, visual: { ok: true, falhas: [], hash: 'h' }, seguranca: { ok: true, falhas: [] },
  }),
});
injetar('lib/capaRedes.js', {
  garantirCapaRedes: async () => ({ url: 'https://blob.exemplo/instagram-4x5.png', hash: 'h' }),
  renderizarCapaRedes: async () => ({ buffer: Buffer.alloc(0), hash: 'h', modelo: 'capa-4x5-v1', titulo: 'Título' }),
});
const registros = [];
injetar('models/RegistroPublicacao.js', { create: async (doc) => registros.push(doc) });

const db = require(path.join(RAIZ, 'lib/db.js'));
db.connect = async () => {};
db.isConfigured = () => true;

// Meta falsa: recusa qualquer token com código 190 (sessão invalidada).
const chamadasMeta = [];
global.fetch = async (url, opcoes = {}) => {
  const u = String(url);
  if (u.includes('graph.instagram.com')) {
    chamadasMeta.push({ url: u, auth: (opcoes.headers || {}).Authorization || '', corpo: String(opcoes.body || '') });
    return { ok: false, status: 400, json: async () => ({ error: { code: 190, error_subcode: 460, message: 'Session has been invalidated' } }) };
  }
  return { ok: true, status: 200, text: async () => '', json: async () => ({}) }; // URL do artigo e capa
};

process.env.CRON_SECRET = 'segredo-de-teste-' + '123456'; // segredos:permitir (valor falso de teste)
process.env.INSTAGRAM_ACCOUNT_ID = '17841400000000000';
process.env.INSTAGRAM_ACCESS_TOKEN = TOKEN_REVOGADO;

const { publicarProximoDaFila } = require(path.join(RAIZ, 'lib/filaRedes.js'));
const { estadoPausa } = require(path.join(RAIZ, 'lib/tokenInstagram.js'));

function capturarLogs(fn) {
  const linhas = [];
  const orig = { log: console.log, error: console.error, warn: console.warn };
  console.log = console.error = console.warn = (...a) => linhas.push(a.join(' '));
  return fn().then((r) => ({ r, linhas }), (e) => ({ e, linhas })).finally(() => Object.assign(console, orig));
}

test('token recusado: alerta, fila pausada, e a próxima execução não tenta de novo', async () => {
  const { r, linhas } = await capturarLogs(() => publicarProximoDaFila());
  assert.equal(r.publicado, false);
  assert.ok(chamadasMeta.length >= 1, 'chegou a chamar a Meta uma vez');

  // Token só no cabeçalho — nunca na URL nem no corpo.
  for (const c of chamadasMeta) {
    assert.ok(!c.url.includes('access_token'), 'token não vai na URL');
    assert.ok(!c.corpo.includes(TOKEN_REVOGADO), 'token não vai no corpo');
    assert.equal(c.auth, `Bearer ${TOKEN_REVOGADO}`);
  }

  const log = linhas.join('\n');
  assert.match(log, /\[token-instagram\] ALERTA/);
  assert.match(log, /PAUSADA/);
  assert.ok(!log.includes(TOKEN_REVOGADO), 'nenhum log contém o token');

  const pausa = await estadoPausa();
  assert.ok(pausa, 'pausa registrada');

  const antes = chamadasMeta.length;
  const { r: r2 } = await capturarLogs(() => publicarProximoDaFila());
  assert.equal(r2.publicado, false);
  assert.match(r2.motivo, /pausada por token inválido/);
  assert.equal(chamadasMeta.length, antes, 'nenhuma nova chamada à Meta com o token revogado');
});

test('token novo configurado: a pausa cai sozinha e a fila volta a tentar', async () => {
  process.env.INSTAGRAM_ACCESS_TOKEN = TOKEN_NOVO;
  const { r } = await capturarLogs(() => estadoPausa());
  assert.equal(r, null, 'pausa removida ao detectar token novo');

  const antes = chamadasMeta.length;
  await capturarLogs(() => publicarProximoDaFila());
  assert.ok(chamadasMeta.length > antes, 'voltou a chamar a Meta');
  assert.equal(chamadasMeta.at(-1).auth, `Bearer ${TOKEN_NOVO}`);
});

test('o banco guarda só a impressão digital da pausa, nunca o token', () => {
  const doc = JSON.stringify(docs);
  assert.ok(!doc.includes(TOKEN_REVOGADO) && !doc.includes(TOKEN_NOVO));
  assert.match(docs.instagram_access_token.impressaoPausada || '', /^[0-9a-f]{16}$|^$/);
});
