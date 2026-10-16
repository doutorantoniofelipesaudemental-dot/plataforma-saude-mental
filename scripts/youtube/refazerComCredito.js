/**
 * Regera, com o crédito de marca (fala + tela + descrição + .srt), as mídias do YouTube já geradas e ainda não publicadas.
 *   node --env-file=.env scripts/youtube/refazerComCredito.js [--limite=N]
 * Depois: node --env-file=.env scripts/youtube/montarFila.js --aplicar (refaz fila.json e a pasta semanal de upload manual).
 */
process.argv.push('--refazer'); // gerarVideosLongos/gerarShorts leem esta bandeira
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const L = require('./lib');
const longos = require('./gerarVideosLongos');
const shorts = require('./gerarShorts');

const limite = Number((process.argv.find((a) => a.startsWith('--limite=')) || '--limite=9999').split('=')[1]);
(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const fila = JSON.parse(fs.readFileSync(path.join(L.REL, 'fila.json'), 'utf8')).itens;
  let n = 0;
  for (const it of fila) {
    if (n >= limite || it.status === 'publicado') continue;
    const meta = path.join(L.RAIZ, it.pasta, 'meta.json');
    if (!fs.existsSync(meta) || JSON.parse(fs.readFileSync(meta, 'utf8')).creditoMarca === 'v1') continue;
    const a = await db.collection('artigos').findOne({ slug: it.slug });
    try {
      if (it.tipo === 'longo') console.log(JSON.stringify(await longos.gerar(a)));
      else if (it.postId) { const p = await db.collection('redes_v2').findOne({ _id: it.postId }); const r = shorts.linhasDoPost(p); console.log(JSON.stringify(await shorts.gerar({ a, id: it.postId, tituloTela: r.titulo, linhas: r.linhas }))); }
      else console.log(JSON.stringify(await shorts.gerar({ a, id: 'resumo', tituloTela: a.titulo, linhas: [a.titulo, L.semTags(a.resumo || '')].filter(Boolean) })));
      n++;
    } catch (e) { console.log(JSON.stringify({ slug: it.slug, erro: e.message.slice(0, 200) })); }
  }
  console.log(`refeitos: ${n}`);
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
