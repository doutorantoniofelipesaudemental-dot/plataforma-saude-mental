/**
 * Aplica a vinheta de crédito (backend/lib/vinheta.js) aos MP3 de narracoes-geradas/, em lotes. Só local, sem rede e sem
 * gravar no banco; o envio ao Blob segue pelos scripts de envio (hoje bloqueado pela cota Hobby).
 *   node --env-file=.env backend/tools/vinheta-narracoes.js --status                 contagens (feitos / faltam)
 *   node --env-file=.env backend/tools/vinheta-narracoes.js --publicados --limite=50           dry-run
 *   node --env-file=.env backend/tools/vinheta-narracoes.js --publicados --limite=50 --aplicar
 *   ... --agendados em vez de --publicados para os pré-gerados dos textos agendados
 * O original vira <slug>.base.mp3 (backup) e a conferência por amostra (5 áudios) roda ao fim de cada lote.
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const vinheta = require('../lib/vinheta');

const RAIZ = path.resolve(__dirname, '../..');
const PASTA = path.join(RAIZ, 'narracoes-geradas');
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const tem = (k) => process.argv.includes(`--${k}`);
const limite = Number(arg('limite')) || 50;

const temVinheta = (slug) => { try { return fs.readFileSync(path.join(PASTA, `${slug}.vinheta`), 'utf8').trim() === String(vinheta.VINHETA_VERSAO); } catch { return false; } };
const temMp3 = (slug) => fs.existsSync(path.join(PASTA, `${slug}.mp3`));

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const pub = await col.find({ publicado: true }).toArray();
  const agen = await col.find({ publicado: { $ne: true }, 'agendamento.agendado': true }).toArray();
  const conta = (docs) => ({ total: docs.length, comMp3: docs.filter((d) => temMp3(d.slug)).length, feitos: docs.filter((d) => temVinheta(d.slug)).length });
  const resumo = { publicados: conta(pub), agendados: conta(agen) };
  console.log(JSON.stringify(resumo));
  if (tem('status')) return mongoose.disconnect();

  const docs = tem('agendados') ? agen : pub;
  const alvo = docs.filter((d) => temMp3(d.slug) && !temVinheta(d.slug)).slice(0, limite);
  console.log(`${tem('aplicar') ? 'APLICAR' : 'DRY-RUN'} · ${alvo.length} áudio(s) neste lote`);
  if (!tem('aplicar')) { console.log('  ' + alvo.map((d) => d.slug).join(', ')); return mongoose.disconnect(); }

  const vinhetas = vinheta.garantirVinhetas();
  const feitos = [];
  const falhas = [];
  for (const d of alvo) {
    try { feitos.push({ ...vinheta.aplicarAoMp3(d, PASTA, vinhetas), d }); } catch (e) { falhas.push(`${d.slug}: ${e.message}`); }
  }
  // Conferência por amostra: duração bate, decodifica sem erro/corte, vinheta presente (duração >= base + vinhetas).
  const { spawnSync } = require('node:child_process');
  const amostra = feitos.filter((f) => f.estado === 'aplicada').sort(() => Math.random() - 0.5).slice(0, 5);
  const conf = amostra.map((f) => {
    const dec = spawnSync('ffmpeg', ['-v', 'error', '-i', path.join(PASTA, `${f.slug}.mp3`), '-f', 'null', '-'], { encoding: 'utf8' });
    const ok = dec.status === 0 && !String(dec.stderr).trim() && Math.abs(f.segundos - f.esperada) < 8;
    return `${f.slug}: ${f.segundos.toFixed(0)} s (esperado ~${f.esperada.toFixed(0)}) ${f.sensivel ? '[sensível] ' : ''}${ok ? 'OK' : 'FALHA'}`;
  });
  console.log(`aplicadas: ${feitos.filter((f) => f.estado === 'aplicada').length} · falhas: ${falhas.length}`);
  conf.forEach((l) => console.log('  amostra ' + l));
  falhas.forEach((l) => console.log('  FALHA ' + l));
  await mongoose.disconnect();
  if (falhas.length || conf.some((l) => l.endsWith('FALHA'))) process.exit(1);
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
