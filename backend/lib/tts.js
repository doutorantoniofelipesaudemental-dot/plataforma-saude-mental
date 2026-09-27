/**
 * Síntese de voz dos vídeos do bot (scripts/bot-video-carrossel.js), com três
 * provedores escolhidos por --provedor:
 *
 *   azure  (padrão) pt-BR-AntonioNeural, a voz do site. AZURE_SPEECH_KEY /
 *          AZURE_SPEECH_REGION; trava da cota gratuita mensal (azureTts.js).
 *   edge   mesma voz, pelo Edge-TTS (sem chave, sem contrato de serviço).
 *   elevenlabs voz desenhada (Voice Design) em ELEVENLABS_VOICE_ID, modelo
 *          eleven_multilingual_v2 (backend/lib/elevenlabs.js). Plano pago para uso comercial.
 *   openai onyx ou echo, via OPENAI_API_KEY (cobrança por caractere). As vozes
 *          da OpenAI são multilíngues: o português sai fluente, mas não é uma
 *          voz nativa pt-BR como a AntonioNeural — ouvir antes de aprovar.
 *
 * Todos devolvem MP3. A transparência ("Narração em voz sintética.", Res. CFM
 * 2.454/2026 e política de uso da OpenAI) é responsabilidade de quem chama.
 * Chaves só no .env local; nenhuma mensagem de erro inclui a chave.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const azure = require('./azureTts');
const elevenlabs = require('./elevenlabs');
const { VOZ_NARRACAO } = require('./narracao');

const PROVEDORES = ['azure', 'edge', 'openai', 'elevenlabs'];
const VOZES_OPENAI = ['onyx', 'echo'];
const LIMITE_OPENAI = 4096; // caracteres por requisição (/v1/audio/speech)
const MODELO_OPENAI_PADRAO = 'gpt-4o-mini-tts';
// Só os modelos gpt-4o-*-tts aceitam `instructions`.
const INSTRUCOES_OPENAI =
  'Fale em português do Brasil, com pronúncia brasileira. Tom calmo, acolhedor e claro, de médico explicando com cuidado; ritmo pausado, sem dramatizar.';

const RAIZ = path.join(__dirname, '..', '..');
const EDGE_TTS =
  process.env.EDGE_TTS_BIN ||
  path.join(RAIZ, 'reels_automation', '.venv', process.platform === 'win32' ? 'Scripts/edge-tts.exe' : 'bin/edge-tts');

function validarProvedor(provedor, voz) {
  if (!PROVEDORES.includes(provedor)) throw new Error(`provedor "${provedor}" desconhecido — use ${PROVEDORES.join(', ')}`);
  if (provedor === 'openai' && !VOZES_OPENAI.includes(voz)) throw new Error(`voz "${voz}" não liberada para a OpenAI — use ${VOZES_OPENAI.join(' ou ')}`);
  if (provedor === 'elevenlabs' && !voz) throw new Error('ELEVENLABS_VOICE_ID ausente — desenhe e salve a voz antes (npm run bot:elevenlabs -- --desenhar-voz)');
}

/** Voz efetiva de cada provedor (a da OpenAI vem de --voz, padrão onyx). */
function vozPadrao(provedor) {
  if (provedor === 'openai') return process.env.OPENAI_TTS_VOZ || 'onyx';
  if (provedor === 'elevenlabs') return process.env.ELEVENLABS_VOICE_ID || '';
  return VOZ_NARRACAO;
}

/** Corpo da requisição à OpenAI — separado para ser testado sem rede. */
function corpoOpenAI(texto, { voz, modelo = process.env.OPENAI_TTS_MODEL || MODELO_OPENAI_PADRAO } = {}) {
  if ([...texto].length > LIMITE_OPENAI) throw new Error(`trecho com ${[...texto].length} caracteres (a OpenAI aceita até ${LIMITE_OPENAI} por requisição)`);
  const corpo = { model: modelo, voice: voz, input: texto, response_format: 'mp3' };
  if (/^gpt-4o.*tts/.test(modelo)) corpo.instructions = INSTRUCOES_OPENAI;
  return corpo;
}

/**
 * O que fazer com uma resposta de erro da OpenAI:
 *   'sem-creditos' — 429 de saldo (`insufficient_quota` / "no credits remaining"):
 *                    esperar não resolve, aborta na hora;
 *   'repetir'      — 429 de limite de taxa ou 5xx: espera e tenta de novo;
 *   'falha'        — qualquer outro erro.
 * A OpenAI usa o MESMO 429 para as duas situações — só o corpo distingue.
 */
function classificarErroOpenAI(status, erro = {}) {
  const semCreditos = erro.code === 'insufficient_quota' || erro.type === 'insufficient_quota' || /no credits remaining|exceeded your current quota/i.test(erro.message || '');
  if (status === 429 && semCreditos) return 'sem-creditos';
  if (status === 429 || status >= 500) return 'repetir';
  return 'falha';
}

async function sintetizarOpenAI(texto, voz, { esperaMs = 10_000 } = {}) {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) throw new Error('OPENAI_API_KEY precisa estar no .env local');
  const corpo = corpoOpenAI(texto, { voz });
  for (let tentativa = 1; ; tentativa++) {
    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    if (resp.ok) return Buffer.from(await resp.arrayBuffer());
    let erro = {};
    try {
      erro = (await resp.json()).error || {};
    } catch {
      // corpo sem JSON
    }
    const acao = classificarErroOpenAI(resp.status, erro);
    if (acao === 'sem-creditos') {
      throw new Error('OpenAI sem créditos na conta (HTTP 429, insufficient_quota) — adicione saldo em platform.openai.com/settings/organization/billing ou use --provedor=edge');
    }
    if (acao === 'repetir' && tentativa < 4) {
      await new Promise((ok) => setTimeout(ok, tentativa * esperaMs));
      continue;
    }
    throw new Error(`OpenAI respondeu HTTP ${resp.status}${erro.message ? ` (${String(erro.message).slice(0, 200)})` : ''}`);
  }
}

function sintetizarEdge(texto, voz) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-tts-'));
  try {
    const entrada = path.join(tmp, 'texto.txt');
    const saida = path.join(tmp, 'audio.mp3');
    fs.writeFileSync(entrada, texto);
    const r = spawnSync(EDGE_TTS, ['--voice', voz, '--file', entrada, '--write-media', saida], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`edge-tts falhou: ${(r.stderr || r.error?.message || '').slice(0, 300)}`);
    return fs.readFileSync(saida);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** MP3 de um trecho curto (um slide) no provedor escolhido. */
async function sintetizar(texto, { provedor = 'azure', voz = vozPadrao(provedor) } = {}) {
  validarProvedor(provedor, voz);
  if (provedor === 'openai') return sintetizarOpenAI(texto, voz);
  if (provedor === 'elevenlabs') return elevenlabs.sintetizar(texto, { vozId: voz });
  if (provedor === 'edge') return sintetizarEdge(texto, voz);
  return azure.sintetizar(texto, { voz });
}

module.exports = { sintetizar, sintetizarOpenAI, classificarErroOpenAI, validarProvedor, vozPadrao, corpoOpenAI, PROVEDORES, VOZES_OPENAI, LIMITE_OPENAI };
