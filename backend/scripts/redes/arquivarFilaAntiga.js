/**
 * 3.1 do PROMPT-MESTRE: arquiva o fluxo antigo de redes SEM APAGAR nada.
 *  - copia o que é leve (CONTEUDO_INSTAGRAM/, legendas/JSON/checagens de carrosseis-instagram/, backups/fila-redes/) para
 *    conteudo/redes-arquivo-AAAAMMDD/ e grava manifesto.json (post, legenda, datas, caminho das artes pesadas);
 *  - as artes/vídeos pesados (6 GB) ficam onde estão, referenciados no manifesto;
 *  - no banco marca os artigos do fluxo antigo como status 'arquivado' (guarda o status anterior em redesLegado).
 *    NÃO toca em posts já publicados no Instagram.
 *   node --env-file=.env backend/scripts/redes/arquivarFilaAntiga.js [--aplicar]   (dry-run por padrão)
 */
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../../..');
const aplicar = process.argv.includes('--aplicar');
const p2 = (n) => String(n).padStart(2, '0'); const d = new Date();
const dest = path.join(RAIZ, 'conteudo', `redes-arquivo-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`);
const LEVE = /\.(txt|md|json|csv|html|yaml|yml)$/i;

function copiarLeve(origem, destino, contador) {
  if (!fs.existsSync(origem)) return;
  for (const e of fs.readdirSync(origem, { withFileTypes: true })) {
    const o = path.join(origem, e.name), t = path.join(destino, e.name);
    if (e.isDirectory()) copiarLeve(o, t, contador);
    else if (LEVE.test(e.name) && fs.statSync(o).size < 5 * 1024 * 1024) { if (aplicar) { fs.mkdirSync(destino, { recursive: true }); fs.copyFileSync(o, t); } contador.n += 1; }
  }
}

(async () => {
  const c1 = { n: 0 }, c2 = { n: 0 }, c3 = { n: 0 };
  copiarLeve(path.join(RAIZ, 'CONTEUDO_INSTAGRAM'), path.join(dest, 'CONTEUDO_INSTAGRAM'), c1);
  copiarLeve(path.join(RAIZ, 'carrosseis-instagram'), path.join(dest, 'carrosseis-instagram'), c2);
  copiarLeve(path.join(RAIZ, 'backups/fila-redes'), path.join(dest, 'backups-fila-redes'), c3);

  const posts = [];
  const base = path.join(RAIZ, 'carrosseis-instagram');
  for (const e of fs.existsSync(base) ? fs.readdirSync(base, { withFileTypes: true }) : []) {
    if (!e.isDirectory() || e.name.startsWith('_')) continue;
    const dir = path.join(base, e.name);
    const arqs = fs.readdirSync(dir);
    posts.push({ post: e.name, caminho: dir, legenda: arqs.includes('legenda.txt'), checagem: arqs.includes('checagem-tripla.md'), arquivos: arqs.length, criadoEm: fs.statSync(dir).birthtime.toISOString() });
  }

  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const legado = await col.find({ status: { $in: ['aprovado', 'publicado'] } }, { projection: { slug: 1, status: 1, publicadoRedesEm: 1, capaRedes: 1 } }).toArray();
  const noInstagram = legado.filter((x) => x.publicadoRedesEm).length;
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · destino ${dest}`);
  console.log(`Arquivos leves a copiar: CONTEUDO_INSTAGRAM ${c1.n} · carrosseis-instagram ${c2.n} · backups/fila-redes ${c3.n} · pastas de posts no manifesto: ${posts.length}`);
  console.log(`Artigos do fluxo antigo no banco a marcar 'arquivado': ${legado.length} (${noInstagram} já foram postados no Instagram — posts NÃO são tocados)`);
  if (aplicar) {
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, 'manifesto.json'), JSON.stringify({ arquivadoEm: d.toISOString(), motivo: 'Reinício do fluxo de redes (PROMPT-MESTRE Parte 3)', observacao: 'Artes e vídeos pesados permanecem em carrosseis-instagram/ (fora do git). Nada foi apagado. Posts já publicados no Instagram não foram alterados.', posts, artigosNoBanco: legado.map((x) => ({ slug: x.slug, statusAnterior: x.status, publicadoRedesEm: x.publicadoRedesEm || null })) }, null, 2));
    for (const x of legado) await col.updateOne({ _id: x._id }, { $set: { status: 'arquivado', redesLegado: { statusAnterior: x.status, publicadoRedesEm: x.publicadoRedesEm || null, arquivadoEm: d } } });
    console.log('Arquivado.');
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(2); });
