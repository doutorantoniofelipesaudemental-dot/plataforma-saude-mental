/**
 * Vídeo longo (1920x1080, 30 fps) a partir da narração de um texto: capa + título + assinatura curta + áudio, legenda .srt e miniatura 1280x720.
 * Sem custo (FFmpeg + PIL). Só usa o MP3 local cujo selo de hash confere com o texto ATUAL (senão, pula e avisa).
 *   node --env-file=.env scripts/youtube/gerarVideosLongos.js --slugs=a,b [--refazer]
 * Saída: carrosseis-instagram/youtube/<slug>/{longo.mp4,thumb.png,legenda.srt,meta.json} (fora do Git).
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const L = require('./lib');
const { checarImagemSemMarcaDagua } = require('../../backend/lib/checagensAprovacao');
const { backupAntesDeSobrescrever } = require('../lib/backupPasta');
const { exigirCenasMinimas } = require('./cenasMinimas');

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const refazer = process.argv.includes('--refazer');

async function baixar(url) { const r = await fetch(url); if (!r.ok) throw new Error(`capa HTTP ${r.status}`); return Buffer.from(await r.arrayBuffer()); }

async function gerar(a, { dirSaida = '' } = {}) {
  exigirCenasMinimas(1, 'Vídeo longo'); // hoje um único quadro (ffmpeg -loop 1): bloqueado até o padrão com cenas
  let mp3 = await L.obterAudio(a);
  if (mp3) mp3 = L.comVinheta(a, mp3); // abertura + encerramento falados (crédito da marca)
  if (!mp3) return { slug: a.slug, pulou: 'sem áudio válido (hash difere do texto atual ou narração ausente)' };
  const dir = dirSaida || path.join(L.MIDIA, a.slug);
  // Lição de 28/10/2026: o que já existe na pasta vai para backups/ antes de ser regravado
  const copia = backupAntesDeSobrescrever(dir);
  if (copia) console.log(`backup da pasta anterior: ${copia}`);
  fs.mkdirSync(dir, { recursive: true }); // dirSaida: rascunho de regeração
  const saida = path.join(dir, 'longo.mp4');
  if (fs.existsSync(saida) && fs.existsSync(path.join(dir, 'meta.json')) && !refazer) return { slug: a.slug, pulou: 'já gerado' };

  // capa: sem marca d'água (peça com marca é reprovada)
  let capaLocal = '';
  const cp = await L.obterCapa(a);
  if (cp.erro) return { slug: a.slug, pulou: cp.erro };
  if (cp.buf) {
    const buf = cp.buf;
    const wm = await checarImagemSemMarcaDagua(buf);
    if (!wm.ok) return { slug: a.slug, reprovado: `capa com marca d'água/ruído: ${wm.falhas.join('; ')}` };
    capaLocal = path.join(dir, 'capa.jpg'); fs.writeFileSync(capaLocal, buf);
  }
  // na fala, só a assinatura curta (depois do encerramento); as 5 linhas ficam na tela final e na descrição (decisão de 17/10/2026)
  mp3 = L.comAssinaturaFalada(mp3, dir);
  const dur = L.duracao(mp3);
  const finalSeg = Math.min(16, dur / 2); // tela final: cobre o encerramento e a assinatura falada
  L.arte({ tipo: 'longo_final', linhas: L.IDENTIFICACAO_COMPLETA.split('\n'), aviso: L.AVISO_PROTOCOLOS, saida: path.join(dir, 'quadro-final.png') });
  L.arte({ tipo: 'longo', titulo: a.titulo, capa: capaLocal, saida: path.join(dir, 'quadro.png') });
  L.arte({ tipo: 'thumb', titulo: a.titulo, capa: capaLocal, saida: path.join(dir, 'thumb.png') });
  // barra de progresso dourada (movimento sutil) sobre o quadro estático
  // crédito de tela: 0–3 s e tela final com o endereço (legenda ASS com caixa opaca, não é marca d'água)
  fs.writeFileSync(path.join(dir, 'credito.ass'), L.creditoAss(dur), 'utf8');
  fs.copyFileSync('C:/Windows/Fonts/segoeuib.ttf', path.join(dir, 'segoeuib.ttf'));
  L.run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-i', path.join(dir, 'quadro.png'), '-i', mp3,
    '-f', 'lavfi', '-i', 'color=c=0xC9A24B:s=1920x10:r=30', '-loop', '1', '-framerate', '30', '-i', path.join(dir, 'quadro-final.png'),
    '-filter_complex', `[0:v][3:v]overlay=enable='gte(t,${(dur - finalSeg).toFixed(2)})'[q];[q][2:v]overlay=x='-1920+1920*t/${dur.toFixed(2)}':y=1070:shortest=1,subtitles=credito.ass:fontsdir=.,format=yuv420p[v]`,
    '-map', '[v]', '-map', '1:a', '-t', dur.toFixed(2), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-tune', 'stillimage',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-movflags', '+faststart', saida], { cwd: dir });
  fs.rmSync(path.join(dir, 'segoeuib.ttf'), { force: true });
  fs.writeFileSync(path.join(dir, 'legenda.srt'), L.srt(a, dur), 'utf8');
  const meta = {
    tipo: 'longo', creditoMarca: 'v3', slug: a.slug, titulo: a.titulo.length > 100 ? `${a.titulo.slice(0, 97)}...` : a.titulo,
    descricao: L.descricaoLongo(a, dur), tags: L.tagsDe(a), playlist: L.playlistDe(a),
    refsPermitidas: L.referencias(a.conteudo),
    arquivos: { video: 'longo.mp4', capa: 'thumb.png', legenda: 'legenda.srt' },
    midia: L.sondar(saida), hashVideo: L.sha256(saida), duracao: dur, geradoEm: new Date().toISOString(),
  };
  meta.checagemTexto = L.checarTexto(meta);
  const m = meta.midia;
  meta.checagemMidia = [m.largura !== 1920 || m.altura !== 1080 ? `dimensões ${m.largura}x${m.altura} (esperado 1920x1080)` : '', m.fps !== '30/1' ? `fps ${m.fps} (esperado 30/1)` : '', m.temAudio ? '' : 'sem áudio'].filter(Boolean);
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1), 'utf8');
  fs.rmSync(path.join(dir, 'quadro.png'), { force: true });
  return { slug: a.slug, ok: !meta.checagemTexto.length && !meta.checagemMidia.length, falhas: [...meta.checagemTexto, ...meta.checagemMidia], seg: Math.round(dur) };
}

module.exports = { gerar };
if (require.main === module) (async () => {
  const slugs = arg('slugs').split(',').filter(Boolean);
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  for (const s of slugs) {
    const a = await col.findOne({ slug: s });
    if (!a) { console.log(`${s}: não existe`); continue; }
    try { console.log(JSON.stringify(await gerar(a))); } catch (e) { console.log(JSON.stringify({ slug: s, erro: e.message.slice(0, 300) })); }
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
