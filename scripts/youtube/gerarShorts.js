/**
 * Short (9:16, 1080x1920, 30 fps, até 59 s) com legenda queimada, assinatura curta e narração Edge-TTS (pt-BR-AntonioNeural, custo zero).
 * Fontes do roteiro: legenda aprovada de um post do Instagram (redes_v2) ou o resumo do texto. Sem trilha: a voz é a única camada
 * (a trilha a -22 dB é opcional e fica fora dos Shorts para não competir com a legenda).
 *   node --env-file=.env scripts/youtube/gerarShorts.js --post=<id-do-post> | --slug=<slug> [--refazer]
 * Saída: carrosseis-instagram/youtube/<slug>/short-<id>/{short.mp4,thumb.png,meta.json} (fora do Git).
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const L = require('./lib');
const { backupAntesDeSobrescrever } = require('../lib/backupPasta');
const { aplicarPronuncia } = require('../../backend/lib/pronunciaTts');
const { checarImagemSemMarcaDagua } = require('../../backend/lib/checagensAprovacao');

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const refazer = process.argv.includes('--refazer');
const FECHO = 'Texto completo no site do Dr. Antônio Felipe, link na descrição. Em crise: CVV 188, SAMU 192.';
const CREDITO_FALA = L.vinheta.TEXTOS.curta; // Shorts até 60 s: só a versão curta, no fim
const MAX_SEG = 58;

const tts = (texto, mp3, dir) => {
  const txt = mp3.replace(/\.mp3$/, '.txt'); fs.writeFileSync(txt, aplicarPronuncia(texto), 'utf8');
  L.run(L.PY, ['-I', '-m', 'edge_tts', '--voice', 'pt-BR-AntonioNeural', '--file', txt, '--write-media', mp3], { timeout: 180000, cwd: dir });
};

function linhasDoPost(p) {
  const ls = String(p.legenda).split('\n').map((x) => x.trim());
  const titulo = ls[0];
  const sub = ls.slice(1).find((x) => x && !x.startsWith('•') && !/^(Texto completo|Referências|Orientação|Em crise|Conteúdo produzido|Dr\.|Especialista|Atuo|#)/.test(x)) || '';
  const bullets = ls.filter((x) => x.startsWith('•')).map((x) => x.replace(/^•\s*/, '').replace(/\s*\([^)]*\d{4}[^)]*\)\s*$/, ''));
  return { titulo, linhas: [titulo, sub, ...bullets.slice(0, 2)].filter(Boolean) };
}

function ass(trechos, W = 1080, H = 1920) {
  const t = (s) => { const cs = Math.round(s * 100), h = Math.floor(cs / 360000), m = Math.floor((cs % 360000) / 6000), x = Math.floor((cs % 6000) / 100), c = cs % 100; return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}.${String(c).padStart(2, '0')}`; };
  const cab = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Cap,Segoe UI,66,&H00FFFFFF,&H000000FF,&H00301A0B,&H80000000,-1,0,0,0,100,100,0,0,1,5,1,2,70,70,470,1\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n`;
  return cab + trechos.map((x) => `Dialogue: 0,${t(x.ini)},${t(x.fim)},Cap,,0,0,0,,${x.txt.replace(/\n/g, '\\N')}`).join('\n') + '\n';
}

async function gerar({ a, id, tituloTela, linhas, extraDescricao = '', dirSaida = '' }) {
  const dir = dirSaida || path.join(L.MIDIA, a.slug, `short-${id}`); // dirSaida: rascunho de regeração (pasta original intocada)
  if (fs.existsSync(path.join(dir, 'meta.json')) && !refazer) return { slug: a.slug, id, pulou: 'já gerado' };
  // capa ANTES de apagar a pasta: se falhar, o que já existe fica intacto
  const cp = await L.obterCapa(a);
  if (cp.erro) return { slug: a.slug, id, pulou: cp.erro };
  if (cp.buf) { const wm = await checarImagemSemMarcaDagua(cp.buf); if (!wm.ok) return { slug: a.slug, id, reprovado: `capa com marca d'água/ruído: ${wm.falhas.join('; ')}` }; }
  // Lição de 28/10/2026: a pasta existente vai para backups/ antes de ser apagada (a short-resumo de 16/10 se perdeu assim)
  const copia = backupAntesDeSobrescrever(dir);
  if (copia) console.log(`backup da pasta anterior: ${copia}`);
  fs.mkdirSync(dir, { recursive: true }); for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f), { recursive: true, force: true });
  let capa = '';
  if (cp.buf) { capa = path.join(dir, 'capa.jpg'); fs.writeFileSync(capa, cp.buf); }
  // escolhe as linhas que cabem em ~MAX_SEG (14 caracteres de fala por segundo, +0,3 s entre linhas)
  let uso = [...linhas, FECHO, CREDITO_FALA];
  const estima = (xs) => xs.reduce((s, x) => s + x.length / 14 + 0.3, 0);
  while (uso.length > 4 && estima(uso) > MAX_SEG - 3) uso.splice(uso.length - 3, 1);
  // 1 TTS por linha: tempo exato para a legenda
  const partes = [];
  uso.forEach((txt, i) => { const mp3 = path.join(dir, `l${i}.mp3`); tts(txt, mp3, dir); partes.push({ txt, mp3, dur: L.duracao(mp3) }); });
  let total = partes.reduce((s, p) => s + p.dur + 0.3, 0);
  if (total > MAX_SEG + 1) return { slug: a.slug, id, reprovado: `duração ${total.toFixed(0)} s > ${MAX_SEG + 1} s` };
  const lista = partes.map((p, i) => { const w = path.join(dir, `l${i}.wav`); L.run('ffmpeg', ['-y', '-v', 'error', '-i', p.mp3, '-af', 'apad=pad_dur=0.3', '-ar', '44100', '-ac', '1', w]); return `file '${path.basename(w)}'`; }).join('\n');
  fs.writeFileSync(path.join(dir, 'lista.txt'), lista);
  L.run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-c:a', 'pcm_s16le', 'voz.wav'], { cwd: dir });
  total = L.duracao(path.join(dir, 'voz.wav'));
  // legenda (caixa mista), grupos de até 6 palavras, tempo proporcional dentro de cada linha
  let t0 = 0; const trechos = [];
  for (const p of partes) {
    const ps = p.txt.split(/\s+/), grupos = [];
    for (let i = 0; i < ps.length;) { let n = 6; if (/^Dr.$/.test(ps[i + n - 1] || '')) n += 1; grupos.push(ps.slice(i, i + n).join(' ')); i += n; }
    const soma = grupos.reduce((s, g) => s + g.length, 0); let t = t0;
    grupos.forEach((g) => { const d = (g.length / soma) * p.dur; const meio = g.length > 24 ? g.indexOf(' ', Math.floor(g.length / 2) - 3) : -1; trechos.push({ ini: t, fim: t + d, txt: meio > 0 ? `${g.slice(0, meio)}\n${g.slice(meio + 1)}` : g }); t += d; });
    t0 += p.dur + 0.3;
  }
  fs.writeFileSync(path.join(dir, 'cap.ass'), ass(trechos), 'utf8');
  fs.writeFileSync(path.join(dir, 'credito.ass'), L.creditoAss(total, { W: 1080, H: 1920 }), 'utf8'); // crédito de tela: 0–3 s e tela final
  fs.copyFileSync('C:/Windows/Fonts/segoeuib.ttf', path.join(dir, 'segoeuib.ttf'));
  L.arte({ tipo: 'short', titulo: tituloTela, capa, saida: path.join(dir, 'fundo.png') });
  L.arte({ tipo: 'thumb', titulo: a.titulo, capa, saida: path.join(dir, 'thumb.png') });
  // deriva lenta (movimento) + barra de progresso dourada + legenda queimada + voz
  L.run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-i', 'fundo.png', '-i', 'voz.wav', '-f', 'lavfi', '-i', 'color=c=0xC9A24B:s=1080x12:r=30',
    '-filter_complex', `[0:v]scale=1134:2016,crop=1080:1920:x='27+20*sin(t/3)':y='48+30*sin(t/5)',subtitles=cap.ass:fontsdir=.,subtitles=credito.ass:fontsdir=.[b];[b][2:v]overlay=x='-1080+1080*t/${total.toFixed(2)}':y=0:shortest=1,format=yuv420p[v]`,
    '-map', '[v]', '-map', '1:a', '-t', total.toFixed(2), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-movflags', '+faststart', 'short.mp4'], { cwd: dir });
  for (const f of fs.readdirSync(dir)) if (/^l\d+\.(mp3|wav|txt)$|^(lista\.txt|voz\.wav|segoeuib\.ttf|fundo\.png)$/.test(f)) fs.rmSync(path.join(dir, f), { force: true });
  const video = path.join(dir, 'short.mp4');
  const meta = {
    tipo: 'short', creditoMarca: 'v2', slug: a.slug, id, titulo: `${tituloTela.length > 88 ? tituloTela.slice(0, 85) + '...' : tituloTela} #Shorts`,
    descricao: L.descricaoShort(a, extraDescricao), tags: L.tagsDe(a), playlist: L.playlistDe(a), refsPermitidas: [],
    roteiro: uso, arquivos: { video: 'short.mp4', capa: 'thumb.png' }, midia: L.sondar(video), hashVideo: L.sha256(video), duracao: total, geradoEm: new Date().toISOString(),
  };
  meta.checagemTexto = L.checarTexto(meta);
  const m = meta.midia;
  meta.checagemMidia = [m.largura !== 1080 || m.altura !== 1920 ? `dimensões ${m.largura}x${m.altura}` : '', m.fps !== '30/1' ? `fps ${m.fps}` : '', total > 60 ? `duração ${total.toFixed(1)} s > 60` : '', m.temAudio ? '' : 'sem áudio'].filter(Boolean);
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1), 'utf8');
  return { slug: a.slug, id, ok: !meta.checagemTexto.length && !meta.checagemMidia.length, falhas: [...meta.checagemTexto, ...meta.checagemMidia], seg: Math.round(total) };
}

module.exports = { gerar, linhasDoPost };
if (require.main === module) (async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  let a, id, tituloTela, linhas;
  if (arg('post')) {
    const p = await db.collection('redes_v2').findOne({ _id: arg('post') });
    a = await db.collection('artigos').findOne({ slug: p.slug }); const r = linhasDoPost(p); id = p._id; tituloTela = r.titulo; linhas = r.linhas;
  } else {
    a = await db.collection('artigos').findOne({ slug: arg('slug') }); id = 'resumo'; tituloTela = a.titulo; linhas = [a.titulo, L.semTags(a.resumo || '')].filter(Boolean);
  }
  try { console.log(JSON.stringify(await gerar({ a, id, tituloTela, linhas }))); } catch (e) { console.log(JSON.stringify({ erro: e.message.slice(0, 400) })); }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
