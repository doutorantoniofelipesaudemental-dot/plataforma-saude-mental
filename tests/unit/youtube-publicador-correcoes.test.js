// Correções do publicador do YouTube (21/11/2026): privacidade esperada com publishAt, espera do processamento antes da legenda.
const test = require('node:test');
const assert = require('node:assert/strict');
const yt = require('../../backend/lib/youtube');

test('com publicarEm a privacidade esperada é private (não public)', () => {
  assert.equal(yt.privacidadeEsperada({ privacidade: 'public', publicarEm: '2026-11-23T08:00:00-03:00' }), 'private');
  assert.equal(yt.privacidadeEsperada({ privacidade: 'public', publicarEm: null }), 'public');
  assert.equal(yt.privacidadeEsperada({ privacidade: 'unlisted' }), 'unlisted');
});

test('interpretarProcessamento: succeeded = pronto; failed = falha; resto = aguardar', () => {
  assert.equal(yt.interpretarProcessamento({ items: [{ processingDetails: { processingStatus: 'succeeded' } }] }), 'pronto');
  assert.equal(yt.interpretarProcessamento({ items: [{ processingDetails: { processingStatus: 'processing' } }] }), 'aguardar');
  assert.equal(yt.interpretarProcessamento({ items: [{ processingDetails: { processingStatus: 'failed' } }] }), 'falha');
  assert.equal(yt.interpretarProcessamento({ items: [{ status: { uploadStatus: 'rejected' } }] }), 'falha');
  assert.equal(yt.interpretarProcessamento({ items: [] }), 'aguardar');
  assert.equal(yt.interpretarProcessamento({}), 'aguardar');
});

test('aguardarProcessamento espera até succeeded e devolve pronto', async () => {
  const respostas = [
    { items: [{ processingDetails: { processingStatus: 'processing' } }] },
    { items: [{ processingDetails: { processingStatus: 'succeeded' } }] },
  ];
  const chamadas = [];
  const fetchOriginal = global.fetch;
  global.fetch = async (url) => { chamadas.push(url); const j = respostas.shift(); return { json: async () => j }; };
  try {
    const r = await yt.aguardarProcessamento({ videoId: 'abc', token: 't', intervaloMs: 0, sleep: async () => {} });
    assert.equal(r, 'pronto');
    assert.equal(chamadas.length, 2);
    assert.match(chamadas[0], /videos\?part=status,processingDetails&id=abc/);
  } finally { global.fetch = fetchOriginal; }
});

test('aguardarProcessamento para com tempo esgotado sem enviar legenda', async () => {
  const fetchOriginal = global.fetch;
  global.fetch = async () => ({ json: async () => ({ items: [{ processingDetails: { processingStatus: 'processing' } }] }) });
  let agora = 0;
  const relogio = Date.now;
  Date.now = () => agora;
  try {
    const r = await yt.aguardarProcessamento({ videoId: 'abc', token: 't', limiteMs: 1000, intervaloMs: 600, sleep: async (ms) => { agora += ms; } });
    assert.equal(r, 'tempo esgotado');
  } finally { global.fetch = fetchOriginal; Date.now = relogio; }
});

test('aguardarProcessamento lança erro quando o processamento falha', async () => {
  const fetchOriginal = global.fetch;
  global.fetch = async () => ({ json: async () => ({ items: [{ processingDetails: { processingStatus: 'failed' } }] }) });
  try {
    await assert.rejects(() => yt.aguardarProcessamento({ videoId: 'abc', token: 't', intervaloMs: 0, sleep: async () => {} }), (e) => e.codigo === 'YOUTUBE_PROCESSAMENTO_FALHOU');
  } finally { global.fetch = fetchOriginal; }
});
