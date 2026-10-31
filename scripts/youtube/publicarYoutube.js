/**
 * Publicador do YouTube (rodar 1x por dia pelo Agendador do Windows; ver scripts/agendar-tarefas-windows.ps1).
 * Os vídeos ficam no computador do consultório, por isso o agendador é local (a Vercel não enxerga esses arquivos).
 * Publica só itens "aprovado-checagem" cujo horário chegou, e só se:
 *   - YOUTUBE_PUBLICACAO_ATIVA=true no .env (freio próprio; qualquer outro valor ou ausência = NADA é publicado);
 *   - REDES_PUBLICACAO_ATIVA não está em false (freio geral, checado por backend/lib/youtube.js);
 *   - o arquivo de vídeo tem o mesmo hash registrado na checagem e a checagem de texto passa de novo agora.
 * Cota: cada upload custa ~1 600 unidades da API (padrão 10 000/dia): no máximo 2 por execução (--max até 4). Cota esgotada = para sem marcar.
 *   node --env-file=.env scripts/youtube/publicarYoutube.js [--simular] [--max=2]
 */
require('../carregarEnv').carregarEnv(); // .env carregado aqui (sem --env-file na linha de comando)
const fs = require('node:fs');
const path = require('node:path');
const L = require('./lib');
const mongoose = require('mongoose');
const yt = require('../../backend/lib/youtube');
const { redesAtivas } = require('../../backend/lib/freioRedes');
const { itemPublicavel } = require('./itemPublicavel');

const simular = process.argv.includes('--simular');
const max = Math.min(4, Number((process.argv.find((a) => a.startsWith('--max=')) || '--max=2').split('=')[1]));
const idArg = (process.argv.find((a) => a.startsWith('--id=')) || '').split('=')[1]; // publicar-seguro: só este item (ignora o horário)
const TRAVA = require('./travaDuplicidadeYoutube');
const FILA = path.join(L.REL, 'fila.json'), LOG = path.join(L.REL, 'publicacao-log.md'), PLAYLISTS = path.join(L.REL, 'playlists.json');
const log = (t) => { fs.mkdirSync(L.REL, { recursive: true }); fs.appendFileSync(LOG, `${fs.existsSync(LOG) ? '' : '# Log de publicação do YouTube\n'}\n- ${new Date().toISOString()} · ${t}\n`, 'utf8'); console.log(t); };

async function extras(token, id, item, meta, dir) {
  const notas = [];
  if (item.tipo === 'longo') {
    try {
      const r = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' }, body: fs.readFileSync(path.join(dir, meta.arquivos.capa)) });
      notas.push(r.ok ? 'miniatura ok' : `miniatura não aplicada (HTTP ${r.status}: ative a verificação do canal / reautorize com o escopo novo)`);
    } catch (e) { notas.push('miniatura falhou'); }
  }
  try {
    const mapa = JSON.parse(fs.readFileSync(PLAYLISTS, 'utf8'))[item.playlist];
    if (mapa) {
      const r = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ snippet: { playlistId: mapa, resourceId: { kind: 'youtube#video', videoId: id } } }) });
      notas.push(r.ok ? `playlist "${item.playlist}" ok` : `playlist não aplicada (HTTP ${r.status})`);
    } else notas.push(`playlist "${item.playlist}" sem ID (rode criarPlaylists.js ou adicione à mão)`);
  } catch { notas.push('playlist: sem playlists.json'); }
  return notas;
}

(async () => {
  if (!require('../../backend/lib/freioYoutube').youtubeLigado()) return log('freio YOUTUBE_PUBLICACAO_ATIVA não está "true": nada publicado.');
  if (!redesAtivas()) return log('freio geral REDES_PUBLICACAO_ATIVA=false: nada publicado.');
  if (!yt.credenciaisYoutube() && !simular) return log('sem credenciais do YouTube (.env): nada publicado. Siga relatorios/youtube/PASSO-A-PASSO-YOUTUBE.md; enquanto isso use relatorios/youtube/fila-manual/.');
  const fila = JSON.parse(fs.readFileSync(FILA, 'utf8'));
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const artigos = mongoose.connection.db.collection('artigos');
  const aArg = (process.argv.find((a) => a.startsWith('--agora=')) || '').split('=')[1]; // só para simular (testes)
  const agora = aArg ? new Date(aArg).getTime() : Date.now();
  const devidos = fila.itens.filter((i) => itemPublicavel(i) && (idArg ? i.id === idArg : new Date(i.slot).getTime() <= agora)).sort((a, b) => new Date(a.slot) - new Date(b.slot)).slice(0, max);
  if (!devidos.length) return log('nada devido agora.');
  const token = simular ? null : await yt.obterAccessToken();
  const registrados = mongoose.connection.db.collection(TRAVA.COLECAO);
  for (const it of devidos) {
    const dir = path.join(L.RAIZ, it.pasta);
    try {
      if (await TRAVA.jaRegistrado(registrados, it.id)) { Object.assign(it, { status: 'publicado' }); log(`JÁ PUBLICADO (banco) ${it.id}: não sobe de novo`); continue; }
      const texto = await artigos.findOne({ slug: it.slug }, { projection: { publicado: 1 } });
      if (!texto || texto.publicado !== true) { log(`AGUARDANDO ${it.id}: o texto ${it.slug} ainda não está publicado no site`); continue; }
      const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
      const arq = path.join(dir, meta.arquivos.video);
      const bloqueios = [];
      if (!fs.existsSync(arq) || L.sha256(arq) !== it.hashVideo) bloqueios.push('hash do vídeo difere do checado (ou arquivo ausente)');
      bloqueios.push(...L.checarTexto(meta), ...yt.validarMetadados({ titulo: meta.titulo, descricao: meta.descricao, tags: meta.tags }));
      if (bloqueios.length) { it.status = 'bloqueado'; it.motivo = bloqueios.join(' | '); log(`BLOQUEADO ${it.id}: ${it.motivo}`); continue; }
      if (simular) { log(`SIMULAÇÃO: publicaria ${it.id} (${it.tipo}) agendado para ${it.slot}`); continue; }
      const r = await yt.enviarVideo({ arquivo: arq, titulo: meta.titulo, descricao: meta.descricao, tags: meta.tags, privacidade: 'public', short: it.tipo === 'short' });
      // registra no banco ANTES de qualquer outra coisa: se falhar, o vídeo já está no ar e o lote para aqui
      try { await TRAVA.registrar(registrados, { id: it.id, youtubeId: r.id, publicadoEm: new Date().toISOString() }); }
      catch (e) { log(`ATENÇÃO: ${it.id} foi enviado (${r.id}) mas NÃO registrado no banco: ${e.message.slice(0, 80)}. Parado.`); break; }
      const notas = await extras(token, r.id, it, meta, dir);
      Object.assign(it, { status: 'publicado', youtubeId: r.id, publicadoEm: new Date().toISOString(), privacidadeAplicada: r.privacidade });
      log(`PUBLICADO ${it.id} → ${r.link} · privacidade aplicada: ${r.privacidade} · ${notas.join('; ')}${r.privacidade !== 'public' ? ' · ATENÇÃO: projeto do Google Cloud não verificado deixa o vídeo privado (ver PASSO-A-PASSO)' : ''}`);
    } catch (e) {
      const cota = /quota/i.test(e.message);
      log(`${cota ? 'COTA DA API ESGOTADA' : 'ERRO'} em ${it.id}: ${e.message.slice(0, 200)}`);
      if (cota || e.codigo === 'REDES_PAUSADAS' || e.codigo === 'YOUTUBE_TOKEN_INVALIDO') break;
    }
  }
  if (!simular) fs.writeFileSync(FILA, JSON.stringify(fila, null, 1), 'utf8');
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
