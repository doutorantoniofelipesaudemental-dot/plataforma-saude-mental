/**
 * ElevenLabs (API REST) para os vídeos do bot — CLAUDE.md, 20-undecies.
 *
 *   sintetizar      texto → MP3 com a voz ELEVENLABS_VOICE_ID (eleven_multilingual_v2)
 *   desenharVoz     Voice Design: descrição → prévias (generated_voice_id + áudio)
 *   salvarVoz       prévia escolhida pelo médico → voice_id permanente
 *   gerarEfeito     efeito/ambiente sonoro (até 30 s, com loop) → MP3
 *   dublagem        criar → consultar → baixar (EN/ES) de um vídeo aprovado
 *
 * Voz SINTÉTICA desenhada por descrição — nunca clonagem da voz real do
 * médico. Todo vídeo narrado abre com "Narração em voz sintética." (Res. CFM
 * 2.454/2026). Uso comercial (Instagram, YouTube) exige plano pago da
 * ElevenLabs: o gratuito não dá licença comercial e pede atribuição.
 * ELEVENLABS_API_KEY só no .env local; nenhuma mensagem de erro inclui a chave.
 */
const fs = require('fs');
const path = require('path');

const API = 'https://api.elevenlabs.io/v1';
const MODELO_TTS = 'eleven_multilingual_v2';
const MODELO_DESIGN = 'eleven_multilingual_ttv_v2';
const LIMITE_EFEITO_S = 30;
const IDIOMAS_DUBLAGEM = ['en', 'es'];

// Descrição padrão do Voice Design (a API entende melhor em inglês), no perfil
// pedido pelo dono em 2026-09-27: masculina, pt-BR, clínica, calma, empática,
// segura, cadência serena de médico de família. Afirmativa ("steady, even") em
// vez de "sem dramatização"; sem "psiquiatra" (Regra 17: especialidade que o
// autor não tem — a descrição fica salva na conta junto com a voz).
const DESCRICAO_VOZ_PADRAO =
  'Brazilian Portuguese male voice in his early forties, clinical yet warm, calm, empathetic and confident, the serene cadence of a family physician explaining with care, clear diction, steady and even delivery with gentle pauses, grounded and reassuring, studio-quality recording.';
const TEXTO_AMOSTRA_PADRAO =
  'Narração em voz sintética. Cuidar da saúde mental na residência não é sinal de fraqueza: é parte da formação. Se você percebe exaustão que não melhora com o descanso, converse com alguém de confiança e procure apoio profissional.';

function chave() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error('ELEVENLABS_API_KEY precisa estar no .env local');
  return k;
}

async function erroDaResposta(resp, contexto) {
  let detalhe = '';
  try {
    const j = await resp.json();
    detalhe = j.detail?.message || j.detail?.status || (typeof j.detail === 'string' ? j.detail : '') || '';
  } catch {
    // corpo sem JSON
  }
  return new Error(`ElevenLabs (${contexto}) respondeu HTTP ${resp.status}${detalhe ? ` (${String(detalhe).slice(0, 200)})` : ''}`);
}

/** POST com repetição em 429/5xx; devolve a Response já ok. */
async function chamar(caminho, { metodo = 'POST', json, form, consulta, contexto }) {
  const url = `${API}${caminho}${consulta ? `?${new URLSearchParams(consulta)}` : ''}`;
  for (let tentativa = 1; ; tentativa++) {
    const resp = await fetch(url, {
      method: metodo,
      headers: { 'xi-api-key': chave(), ...(json ? { 'Content-Type': 'application/json' } : {}) },
      body: json ? JSON.stringify(json) : form,
    });
    if (resp.ok) return resp;
    if ((resp.status === 429 || resp.status >= 500) && tentativa < 4) {
      await new Promise((ok) => setTimeout(ok, tentativa * 10_000));
      continue;
    }
    throw await erroDaResposta(resp, contexto);
  }
}

/** Corpo da síntese — separado para teste sem rede. */
function corpoTts(texto, { modelo = process.env.ELEVENLABS_MODEL || MODELO_TTS } = {}) {
  return {
    text: texto,
    model_id: modelo,
    language_code: 'pt',
    // Empático e profissional: estável o bastante para leitura clínica, com um pouco
    // de estilo para soar acolhedor (sem interpretação dramática).
    voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
  };
}

async function sintetizar(texto, { vozId = process.env.ELEVENLABS_VOICE_ID } = {}) {
  if (!vozId) throw new Error('ELEVENLABS_VOICE_ID ausente — desenhe e salve a voz antes (npm run bot:elevenlabs -- --desenhar-voz)');
  const resp = await chamar(`/text-to-speech/${encodeURIComponent(vozId)}`, {
    json: corpoTts(texto),
    consulta: { output_format: 'mp3_44100_128' },
    contexto: 'síntese',
  });
  return Buffer.from(await resp.arrayBuffer());
}

/** Voice Design: prévias para o médico ouvir e escolher. Nada é salvo na conta ainda. */
async function desenharVoz({ descricao = DESCRICAO_VOZ_PADRAO, texto = TEXTO_AMOSTRA_PADRAO } = {}) {
  const tamanho = [...texto].length;
  if (tamanho < 100 || tamanho > 1000) throw new Error(`texto de amostra com ${tamanho} caracteres (o Voice Design pede de 100 a 1000)`);
  const resp = await chamar('/text-to-voice/design', {
    json: { voice_description: descricao, text: texto, model_id: MODELO_DESIGN },
    consulta: { output_format: 'mp3_44100_128' },
    contexto: 'Voice Design',
  });
  const j = await resp.json();
  return (j.previews || []).map((p) => ({ id: p.generated_voice_id, audio: Buffer.from(p.audio_base_64, 'base64') }));
}

async function salvarVoz({ generatedVoiceId, nome = 'Narração sintética — Saúde Mental', descricao = DESCRICAO_VOZ_PADRAO }) {
  const resp = await chamar('/text-to-voice', {
    json: { voice_name: nome, voice_description: descricao, generated_voice_id: generatedVoiceId, labels: { uso: 'narracao-sintetica', idioma: 'pt-BR' } },
    contexto: 'salvar voz',
  });
  return (await resp.json()).voice_id;
}

/** Corpo do efeito sonoro — separado para teste sem rede. */
function corpoEfeito(texto, { duracao = LIMITE_EFEITO_S, loop = false } = {}) {
  const d = Number(duracao);
  if (!(d >= 0.5 && d <= LIMITE_EFEITO_S)) throw new Error(`duração de ${duracao} s fora do intervalo 0,5–${LIMITE_EFEITO_S} s`);
  return { text: texto, duration_seconds: d, prompt_influence: 0.3, loop: Boolean(loop), model_id: 'eleven_text_to_sound_v2' };
}

async function gerarEfeito(texto, opcoes = {}) {
  const resp = await chamar('/sound-generation', { json: corpoEfeito(texto, opcoes), consulta: { output_format: 'mp3_44100_128' }, contexto: 'efeito sonoro' });
  return Buffer.from(await resp.arrayBuffer());
}

/* ----------------------------- Dublagem (EN/ES) ----------------------------- */

function validarIdioma(idioma) {
  if (!IDIOMAS_DUBLAGEM.includes(idioma)) throw new Error(`idioma "${idioma}" não liberado para dublagem — use ${IDIOMAS_DUBLAGEM.join(' ou ')}`);
}

async function criarDublagem({ arquivo, idiomaDestino, idiomaOrigem = 'pt', nome }) {
  validarIdioma(idiomaDestino);
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(arquivo)], { type: 'video/mp4' }), path.basename(arquivo));
  form.append('source_lang', idiomaOrigem);
  form.append('target_lang', idiomaDestino);
  form.append('num_speakers', '1');
  form.append('name', nome || path.basename(arquivo));
  const resp = await chamar('/dubbing', { form, contexto: 'criar dublagem' });
  const j = await resp.json();
  return { id: j.dubbing_id, duracaoEsperada: j.expected_duration_sec };
}

async function statusDublagem(id) {
  const resp = await chamar(`/dubbing/${encodeURIComponent(id)}`, { metodo: 'GET', contexto: 'status da dublagem' });
  const j = await resp.json();
  return { status: j.status, idiomas: j.target_languages || [], erro: j.error || null };
}

async function baixarDublagem(id, idioma) {
  validarIdioma(idioma);
  const resp = await chamar(`/dubbing/${encodeURIComponent(id)}/audio/${idioma}`, { metodo: 'GET', contexto: 'baixar dublagem' });
  return Buffer.from(await resp.arrayBuffer());
}

module.exports = {
  sintetizar,
  desenharVoz,
  salvarVoz,
  gerarEfeito,
  criarDublagem,
  statusDublagem,
  baixarDublagem,
  corpoTts,
  corpoEfeito,
  validarIdioma,
  IDIOMAS_DUBLAGEM,
  DESCRICAO_VOZ_PADRAO,
  TEXTO_AMOSTRA_PADRAO,
};
