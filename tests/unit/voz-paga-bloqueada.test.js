// Vozes pagas (ElevenLabs e OpenAI TTS) bloqueadas sem ordem escrita registrada (ordem de 22/10/2026).
// Sem rede: o guarda recusa antes de qualquer chamada.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const paga = require('../../backend/lib/ordemPaga');
const tts = require('../../backend/lib/tts');

const arquivoComOrdens = (conteudo) => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'ordem-paga-'));
  const arq = path.join(pasta, 'ordens-pagas.json');
  fs.writeFileSync(arq, conteudo, 'utf8');
  return arq;
};
const ORDEM_OK = { id: 'paga-2026-10-22', data: '2026-10-22', autorizadoPor: 'Dr. Antônio Felipe Garabito', escopo: 'teste' };

test('sem ordem registrada, voz paga é recusada', () => {
  const vazio = arquivoComOrdens('{"ordens": []}');
  assert.throws(() => paga.exigirPagoAutorizado({ provedor: 'elevenlabs', ordem: 'paga-2026-10-22', arquivo: vazio }), /Voz paga bloqueada \(elevenlabs\)/);
  assert.throws(() => paga.exigirPagoAutorizado({ provedor: 'openai', arquivo: vazio }), /Voz paga bloqueada \(openai\)/);
});

test('com ordem completa registrada, liberada só para aquele id', () => {
  const arq = arquivoComOrdens(JSON.stringify({ ordens: [ORDEM_OK] }));
  assert.doesNotThrow(() => paga.exigirPagoAutorizado({ provedor: 'elevenlabs', ordem: 'paga-2026-10-22', arquivo: arq }));
  assert.throws(() => paga.exigirPagoAutorizado({ provedor: 'elevenlabs', ordem: 'outra', arquivo: arq }), /bloqueada/);
});

test('ordem sem data ou sem autor não vale', () => {
  assert.equal(paga.ordemValida([{ id: 'x', autorizadoPor: 'Dr.' }], 'x'), false);
  assert.equal(paga.ordemValida([{ id: 'x', data: '2026-10-22' }], 'x'), false);
});

test('arquivo de ordens pagas ilegível dá erro', () => {
  const ruim = arquivoComOrdens('{ "ordens": [ ');
  assert.throws(() => paga.exigirPagoAutorizado({ provedor: 'elevenlabs', ordem: 'x', arquivo: ruim }));
});

test('síntese com ElevenLabs e OpenAI falha antes da rede sem ordem', async () => {
  await assert.rejects(() => tts.sintetizar('texto de teste', { provedor: 'elevenlabs', voz: 'voz-teste' }), /Voz paga bloqueada \(elevenlabs\)/);
  await assert.rejects(() => tts.sintetizar('texto de teste', { provedor: 'openai', voz: 'onyx' }), /Voz paga bloqueada \(openai\)/);
});

test('registro de ordens pagas existe, vazio, com a lista de ordens', () => {
  const j = JSON.parse(fs.readFileSync(paga.ARQUIVO, 'utf8'));
  assert.ok(Array.isArray(j.ordens));
});

test('pontos de entrada de voz paga exigem a ordem (bot-elevenlabs e bot-video-carrossel)', () => {
  const raiz = path.join(__dirname, '..', '..');
  const el = fs.readFileSync(path.join(raiz, 'scripts/bot-elevenlabs.js'), 'utf8');
  const video = fs.readFileSync(path.join(raiz, 'scripts/bot-video-carrossel.js'), 'utf8');
  assert.match(el, /exigirPagoAutorizado\(\{ provedor: 'elevenlabs'/);
  assert.match(video, /\['elevenlabs', 'openai'\]\.includes\(provedor\)/);
});
