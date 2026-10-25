// Narração: padrão Edge-TTS (gratuito) e Azure só com ordem escrita registrada (ordem de 22/10/2026).
// Sem rede: o guarda recusa antes de qualquer chamada.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ordem = require('../../backend/lib/ordemAzure');
const tts = require('../../backend/lib/tts');

const arquivoComOrdens = (conteudo) => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'ordem-azure-'));
  const arq = path.join(pasta, 'ordens-azure.json');
  fs.writeFileSync(arq, conteudo, 'utf8');
  return arq;
};
const ORDEM_OK = { id: 'azure-2026-10-22', data: '2026-10-22', autorizadoPor: 'Dr. Antônio Felipe Garabito', escopo: 'teste' };

test('sem ordem registrada, o Azure é recusado', () => {
  const vazio = arquivoComOrdens('{"ordens": []}');
  assert.throws(() => ordem.exigirAzureAutorizado({ ordem: 'azure-2026-10-22', arquivo: vazio }), /Azure Speech bloqueado/);
  assert.throws(() => ordem.exigirAzureAutorizado({ arquivo: vazio }), /Azure Speech bloqueado/);
});

test('com ordem completa registrada, o Azure é liberado para aquele id', () => {
  const arq = arquivoComOrdens(JSON.stringify({ ordens: [ORDEM_OK] }));
  assert.doesNotThrow(() => ordem.exigirAzureAutorizado({ ordem: 'azure-2026-10-22', arquivo: arq }));
  assert.throws(() => ordem.exigirAzureAutorizado({ ordem: 'outra-ordem', arquivo: arq }), /bloqueado/);
});

test('ordem sem data ou sem autor não vale', () => {
  assert.equal(ordem.ordemValida([{ id: 'x', autorizadoPor: 'Dr.' }], 'x'), false);
  assert.equal(ordem.ordemValida([{ id: 'x', data: '2026-10-22' }], 'x'), false);
  assert.equal(ordem.ordemValida([ORDEM_OK], undefined), false);
});

test('arquivo de ordens ilegível dá erro (nunca "autorizado")', () => {
  const ruim = arquivoComOrdens('{ "ordens": [ ');
  assert.throws(() => ordem.ordensRegistradas(ruim));
  assert.throws(() => ordem.exigirAzureAutorizado({ ordem: 'x', arquivo: ruim }));
});

test('o padrão de síntese é o Edge; o Azure falha antes da rede sem ordem', async () => {
  assert.equal(tts.PROVEDOR_PADRAO, 'edge');
  await assert.rejects(() => tts.sintetizar('texto de teste', { provedor: 'azure' }), /Azure Speech bloqueado/);
});

test('scripts de narração não voltam a usar o Azure como padrão', () => {
  const raiz = path.join(__dirname, '..', '..');
  const narrar = fs.readFileSync(path.join(raiz, 'backend/tools/narrar-artigos.js'), 'utf8');
  const video = fs.readFileSync(path.join(raiz, 'scripts/bot-video-carrossel.js'), 'utf8');
  assert.match(narrar, /args\.provedor === 'azure' \? 'azure' : 'edge'/);
  assert.doesNotMatch(narrar, /=== 'edge' \? 'edge' : 'azure'/);
  assert.doesNotMatch(video, /'azure'\)\)/, 'bot-video-carrossel sem Azure como padrão');
  assert.doesNotMatch(video, /provedor = 'azure'/);
});
