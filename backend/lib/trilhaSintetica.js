/**
 * Trilha de fundo SINTETIZADA pelo próprio código (ffmpeg `aevalsrc`), para o
 * vídeo do carrossel não depender de MP3 em assets/audio/ (CLAUDE.md, 20-decies).
 *
 * Um "pad" ambiente: 5 senoides graves de um acorde calmo, levemente
 * desafinadas, cada uma com ondulação lenta de volume (0,03–0,05 Hz), passa-
 * baixa em 900 Hz e eco curto para dar espaço. Sem melodia nem batida — fica
 * por baixo da voz sem competir com ela.
 *
 * Por que sintetizar em vez de baixar/gerar música:
 *   - licença: o som é gerado aqui, não é obra de terceiros — nada a licenciar;
 *   - custo zero, offline, sem chave (a ElevenLabs exige plano pago para uso comercial);
 *   - determinístico: o mesmo slug gera sempre o mesmo acorde e o mesmo arquivo,
 *     então regerar o vídeo não muda o áudio (a aprovação é por hash).
 * Nível de saída ≈ −18 dB médio, como uma faixa comercial: a mixagem sob a voz
 * (bot-video-carrossel.js, volume 0,12) trata as duas do mesmo jeito.
 */
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const exec = promisify(execFile);
const FFMPEG = process.env.FFMPEG_BIN || 'ffmpeg';

// Vozes de acordes abertos (sem terça marcada = sem "alegre" nem "triste"),
// graves, com leve desafinação para soar orgânico.
const PRESETS = {
  'la-suspenso': [110, 164.81, 220.6, 246.94, 329.63], // A2 E3 A3 B3 E4 (Asus2)
  're-aberto': [73.42, 110.3, 146.83, 220, 293.66], // D2 A2 D3 A3 D4 (D5 aberto)
  'fa-maj7': [87.31, 130.81, 174.9, 261.63, 329.63], // F2 C3 F3 C4 E4 (Fmaj7 sem terça no grave)
};
const AMPLITUDES = [0.1, 0.08, 0.07, 0.05, 0.04];
const ONDULACAO_HZ = [0.05, 0.037, 0.043, 0.031, 0.027];

/** Preset fixo por slug (hash), para o mesmo artigo soar sempre igual. */
function presetDoSlug(slug) {
  const nomes = Object.keys(PRESETS);
  return nomes[crypto.createHash('sha256').update(String(slug)).digest().readUInt32BE(0) % nomes.length];
}

/** Expressão do aevalsrc: soma das senoides, cada uma com seu volume ondulando devagar. */
function expressaoPad(preset) {
  const freqs = PRESETS[preset];
  if (!freqs) throw new Error(`preset de trilha desconhecido: "${preset}" (use ${Object.keys(PRESETS).join(', ')})`);
  return freqs
    .map((f, i) => `${AMPLITUDES[i]}*sin(2*PI*${f}*t)*(${i < 3 ? '0.7+0.3' : '0.6+0.4'}*sin(2*PI*${ONDULACAO_HZ[i]}*t+${i}))`)
    .join('+');
}

/** Argumentos do ffmpeg para gerar `duracao` segundos de trilha em MP3. */
function argsTrilhaSintetica({ preset, duracao, destino }) {
  const d = Number(duracao);
  if (!(d >= 1 && d <= 900)) throw new Error(`duração da trilha fora do intervalo (1–900 s): ${duracao}`);
  const fade = Math.min(3, d / 4);
  const filtro = [
    `aevalsrc='${expressaoPad(preset)}':s=44100:d=${d.toFixed(2)}`,
    'lowpass=f=900',
    'aecho=0.8:0.6:120|240:0.25|0.15',
    'volume=12dB',
    'alimiter=limit=0.9',
    `afade=t=in:d=${fade.toFixed(2)}`,
    `afade=t=out:st=${(d - fade).toFixed(2)}:d=${fade.toFixed(2)}`,
    `atrim=0:${d.toFixed(2)}`,
  ].join(',');
  return ['-v', 'error', '-y', '-f', 'lavfi', '-i', filtro, '-c:a', 'libmp3lame', '-b:a', '128k', destino];
}

/** Gera a trilha em `destino` e devolve { arquivo, preset }. */
async function gerarTrilhaSintetica({ slug, duracao, destino, preset = presetDoSlug(slug) }) {
  await exec(FFMPEG, argsTrilhaSintetica({ preset, duracao, destino }), { maxBuffer: 16 * 1024 * 1024 });
  return { arquivo: destino, preset };
}

module.exports = { gerarTrilhaSintetica, argsTrilhaSintetica, expressaoPad, presetDoSlug, PRESETS };
