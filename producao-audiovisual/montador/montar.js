// Montador cinematográfico (PADRAO-CINEMATOGRAFICO-v1). Lê roteiros/<slug>.json, monta MP4 9:16 e corte 16:9.
// Funções puras (validação, tempos, filtros) são testadas em tests/unit/montador-cinematografico.test.js.
// A CLI chama o ffmpeg. Não gera imagem nem voz: recebe clipes e áudio já prontos.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const DUR_MAX_TEXTO_TELA = 200;
const PMID_RE = /^[0-9]+$/;
const FORMATOS = { 'animacao-9x16': { w: 1080, h: 1920 }, 'infografico-16x9': { w: 1920, h: 1080 }, 'carrossel-4x5': { w: 1080, h: 1350 } };
const TIPOS = ['animacao', 'infografico', 'cartela'];

// Validação mínima do roteiro, espelhando roteiro.schema.json (sem dependência externa).
function validarRoteiro(r) {
  const erros = [];
  if (!r || typeof r !== 'object') return { ok: false, erros: ['roteiro não é objeto'] };
  for (const k of ['slug', 'fonteArtigo', 'formato', 'titulo', 'cenas', 'avisos', 'identificacao'])
    if (r[k] === undefined) erros.push(`campo obrigatório ausente: ${k}`);
  if (r.slug && !/^[a-z0-9-]+$/.test(r.slug)) erros.push('slug fora do padrão [a-z0-9-]');
  if (r.formato && !FORMATOS[r.formato]) erros.push(`formato inválido: ${r.formato}`);
  if (r.titulo && r.titulo.length > 100) erros.push('título acima de 100 caracteres');
  if (r.identificacao !== true) erros.push('identificacao deve ser true (bloco de 5 linhas)');
  const av = r.avisos || {};
  if (av.ia !== true) erros.push('aviso de IA ausente');
  if (av.cvvSamu !== true) erros.push('CVV 188 · SAMU 192 ausente');
  if (av.orientacaoGeral !== true) erros.push('orientação geral / protocolos locais ausente');
  if (!Array.isArray(r.cenas) || r.cenas.length === 0) erros.push('cenas vazias');
  else r.cenas.forEach((c, i) => {
    const p = `cena ${i + 1} (${c.cena_id || '?'})`;
    for (const k of ['cena_id', 'tipo', 'duracao_s', 'fala', 'texto_tela', 'fonte_pmid'])
      if (c[k] === undefined) erros.push(`${p}: campo ausente ${k}`);
    if (c.tipo && !TIPOS.includes(c.tipo)) erros.push(`${p}: tipo inválido`);
    if (typeof c.duracao_s === 'number' && c.duracao_s < 0.5) erros.push(`${p}: duração abaixo de 0,5 s`);
    if (c.fonte_pmid !== null && c.fonte_pmid !== undefined && !PMID_RE.test(String(c.fonte_pmid))) erros.push(`${p}: PMID inválido`);
    if (typeof c.texto_tela === 'string' && c.texto_tela.length > DUR_MAX_TEXTO_TELA) erros.push(`${p}: texto_tela acima de 200`);
  });
  return { ok: erros.length === 0, erros };
}

// Início e fim de cada cena na linha do tempo.
function planoTempos(cenas) {
  let t = 0;
  return cenas.map((c) => { const ini = t; t += c.duracao_s; return { cena_id: c.cena_id, ini, fim: t }; });
}

function duracaoTotal(cenas) { return cenas.reduce((s, c) => s + c.duracao_s, 0); }

// Cadeia de vídeo: cada clipe normalizado (formato, 30 fps, duração da cena) e concatenado.
function filtroVideo(cenas, formato) {
  const { w, h } = FORMATOS[formato];
  const partes = cenas.map((c, i) =>
    `[${i}:v]fps=30,scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,trim=0:${c.duracao_s},setpts=PTS-STARTPTS[v${i}]`);
  const labels = cenas.map((_, i) => `[v${i}]`).join('');
  partes.push(`${labels}concat=n=${cenas.length}:v=1:a=0[vid]`);
  return partes.join(';');
}

// Áudio: narração à frente, trilha −9 dB de base com sidechain (≈ −12 dB sob a voz, mais presente nas pausas).
function filtroAudio(indiceNarr, indiceTril, dur) {
  return `[${indiceNarr}:a]aformat=sample_fmts=fltp:channel_layouts=stereo:sample_rates=48000,apad,atrim=0:${dur},asplit=2[v][v2];` +
    `[${indiceTril}:a]atrim=0:${dur},volume=-9dB[t];` +
    `[t][v]sidechaincompress=threshold=0.03:ratio=2.5:attack=20:release=400[duck];` +
    `[v2][duck]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]`;
}

// Argumentos do ffmpeg para um formato. Não executa nada.
function argsFfmpeg({ cenas, clipes, narracao, trilha, formato, saida }) {
  const dur = duracaoTotal(cenas).toFixed(3);
  const entradas = [];
  cenas.forEach((c, i) => entradas.push('-i', clipes[i]));
  const iNarr = cenas.length;
  entradas.push('-i', narracao, '-i', trilha);
  const fc = `${filtroVideo(cenas, formato)};${filtroAudio(iNarr, iNarr + 1, dur)}`;
  return ['-y', '-hide_banner', '-loglevel', 'error', ...entradas, '-filter_complex', fc,
    '-map', '[vid]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', dur, saida];
}

// Loudness: mede (loudnorm JSON) e aplica dois passes, com limitador de pico. Alvo −14 LUFS ±1, TP ≤ −2.
function loudnormArgs(entrada, saida, medido, alvo = -14, tp = -2) {
  const ln = medido
    ? `loudnorm=I=${alvo}:TP=${tp}:LRA=11:measured_I=${medido.input_i}:measured_TP=${medido.input_tp}:measured_LRA=${medido.input_lra}:measured_thresh=${medido.input_thresh}:offset=${medido.target_offset}:linear=true,alimiter=limit=0.75:attack=5:release=50:level=disabled`
    : `loudnorm=I=${alvo}:TP=${tp}:LRA=11:print_format=json`;
  return ['-y', '-hide_banner', '-loglevel', 'error', '-i', entrada, '-af', ln, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', saida];
}

// Corte 16:9 a partir do 9:16: quadro centralizado sobre fundo desfocado (sem cortar o personagem).
function argsCorte16x9(entrada, saida) {
  return ['-y', '-hide_banner', '-loglevel', 'error', '-i', entrada, '-filter_complex',
    '[0:v]split=2[a][b];' +
    '[a]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=20:2[bg];' +
    '[b]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0[vid]', '-map', '[vid]', '-map', '0:a',
    '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', saida];
}

function executarFfmpeg(args) { execFileSync('ffmpeg', args, { stdio: 'inherit' }); }

// O loudnorm imprime o JSON no stderr do ffmpeg.
function medirLoudness(arq) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', arq, '-af', 'loudnorm=I=-14:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'],
    { encoding: 'utf8' });
  const err = r.stderr || '';
  const json = err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1);
  if (!json) throw new Error('loudnorm sem medição no stderr do ffmpeg');
  return JSON.parse(json);
}

// CLI: node montar.js <roteiro.json> <pasta-clipes> <narracao> <trilha> <pasta-saida>
// Os clipes são <pasta-clipes>/<cena_id>.mp4, na ordem das cenas.
function main(argv) {
  const [roteiroArq, pastaClipes, narracao, trilha, pastaSaida] = argv;
  if (!roteiroArq || !pastaSaida) { console.log('uso: montar.js <roteiro.json> <pasta-clipes> <narracao> <trilha> <pasta-saida>'); return 2; }
  const r = JSON.parse(fs.readFileSync(roteiroArq, 'utf8'));
  const v = validarRoteiro(r);
  if (!v.ok) { console.log('BLOQUEADO:\n- ' + v.erros.join('\n- ')); return 1; }
  const clipes = r.cenas.map((c) => path.join(pastaClipes, `${c.cena_id}.mp4`));
  const faltam = clipes.filter((c) => !fs.existsSync(c));
  if (faltam.length) { console.log('BLOQUEADO: clipes ausentes:\n- ' + faltam.join('\n- ')); return 1; }
  fs.mkdirSync(path.join(pastaSaida, 'trab'), { recursive: true });
  fs.mkdirSync(path.join(pastaSaida, 'out'), { recursive: true });
  const bruto = path.join(pastaSaida, 'trab', 'bruto-9x16.mp4');
  executarFfmpeg(argsFfmpeg({ cenas: r.cenas, clipes, narracao, trilha, formato: 'animacao-9x16', saida: bruto }));
  const med = medirLoudness(bruto);
  const final916 = path.join(pastaSaida, 'out', `${r.slug}-9x16.mp4`);
  executarFfmpeg(loudnormArgs(bruto, final916, med));
  const final169 = path.join(pastaSaida, 'out', `${r.slug}-16x9.mp4`);
  executarFfmpeg(argsCorte16x9(final916, final169));
  console.log('ok', final916, final169);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { validarRoteiro, planoTempos, duracaoTotal, filtroVideo, filtroAudio, argsFfmpeg, loudnormArgs, argsCorte16x9, FORMATOS };
