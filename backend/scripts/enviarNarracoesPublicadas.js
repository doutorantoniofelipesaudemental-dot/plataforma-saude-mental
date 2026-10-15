/**
 * Envia as narrações PRÉ-GERADAS (narracoes-geradas/<slug>.mp3) dos textos que acabaram de ser publicados.
 * O MP3 de um texto agendado é gerado antes (narrar-artigos.js --incluir-agendados) e fica guardado com o selo <slug>.hash;
 * no dia da publicação este script confere o selo contra o texto ATUAL e, se bater, passa pela conferência e envia.
 *   node --env-file=.env backend/scripts/enviarNarracoesPublicadas.js            só lista o que enviaria (dry-run)
 *   node --env-file=.env backend/scripts/enviarNarracoesPublicadas.js --enviar   confere e envia
 * Texto cujo selo não bate (foi editado depois de narrado) NÃO é enviado: precisa ser narrado de novo.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const mongoose = require('mongoose');
const { textoParaNarracao, hashNarracao, estadoNarracao } = require('../lib/narracao');

const RAIZ = path.resolve(__dirname, '../..');
const PASTA = path.join(RAIZ, 'narracoes-geradas');
const enviar = process.argv.includes('--enviar');
const agendados = process.argv.includes('--agendados');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const docs = await mongoose.connection.db.collection('artigos').find(agendados ? { $or: [{ publicado: true }, { 'agendamento.agendado': true }] } : { publicado: true }).toArray();
  const prontos = [], desatualizados = [], semMp3 = [];
  for (const d of docs) {
    if (estadoNarracao(d).estado === 'ok') continue;
    const mp3 = path.join(PASTA, `${d.slug}.mp3`), selo = path.join(PASTA, `${d.slug}.hash`);
    if (!fs.existsSync(mp3) || !fs.existsSync(selo)) { semMp3.push(d.slug); continue; }
    (fs.readFileSync(selo, 'utf8').trim() === hashNarracao(textoParaNarracao(d)) ? prontos : desatualizados).push(d.slug);
  }
  console.log(`${enviar ? 'ENVIAR' : 'DRY-RUN'} · ${agendados ? 'publicados + agendados' : 'publicados'} sem áudio "ok": ${prontos.length + desatualizados.length + semMp3.length} · com MP3 pronto e selo válido: ${prontos.length} · MP3 de texto editado depois (regerar): ${desatualizados.length} · sem MP3 pré-gerado: ${semMp3.length}`);
  if (desatualizados.length) console.log('  regerar:', desatualizados.join(', '));
  if (semMp3.length) console.log('  sem MP3:', semMp3.slice(0, 20).join(', ') + (semMp3.length > 20 ? ', …' : ''));
  await mongoose.disconnect();
  if (!prontos.length || !enviar) { if (prontos.length) console.log('  enviaria:', prontos.join(', ')); return; }
  const r = spawnSync(process.execPath, ['--env-file=.env', 'backend/scripts/verificarEEnviarNarracoes.js', `--slugs=${prontos.join(',')}`, '--enviar'], { cwd: RAIZ, encoding: 'utf8' });
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '');
  process.exit(r.status || 0);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
