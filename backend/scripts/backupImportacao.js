/**
 * Backup único antes de qualquer gravação (PROMPT-MESTRE, regra 2).
 * Exporta a coleção `artigos` (EJSON, sem mongodump) + copia os .md/.mdx do app e do plano-180.
 * Só LÊ o banco. Confere o backup reabrindo os arquivos e comparando contagens.
 *   node backend/scripts/backupImportacao.js
 */
const fs = require('node:fs');
const path = require('node:path');
const { EJSON } = require('bson');

const RAIZ = path.resolve(__dirname, '../..');
const FONTES = ['apps/plataforma-saude-mental/src/content', 'apps/plataforma-saude-mental/content', 'conteudo/plano-180'];

function copiarMd(origem, destino) {
  let n = 0;
  for (const e of fs.readdirSync(origem, { withFileTypes: true })) {
    const o = path.join(origem, e.name), d = path.join(destino, e.name);
    if (e.isDirectory()) n += copiarMd(o, d);
    else if (/\.mdx?$/.test(e.name)) { fs.mkdirSync(destino, { recursive: true }); fs.copyFileSync(o, d); n += 1; }
  }
  return n;
}
const contarMd = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? contarMd(path.join(dir, e.name)) : /\.mdx?$/.test(e.name) ? 1 : 0), 0) : 0);

(async () => {
  const p = (n) => String(n).padStart(2, '0'); const d = new Date();
  const dir = path.join(RAIZ, 'backups', `${(process.argv.find((x) => x.startsWith('--prefixo=')) || '--prefixo=importacao-completa').split('=')[1]}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`);
  fs.mkdirSync(dir, { recursive: true });
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const total = await col.countDocuments();
  const docs = await col.find({}).toArray();
  fs.writeFileSync(path.join(dir, 'artigos.ejson'), EJSON.stringify(docs, { relaxed: false }), 'utf8');
  await mongoose.disconnect();

  const relatorio = { banco: process.env.MONGODB_DB || 'drsaudemental', colecao: 'artigos', documentosNoBanco: total, arquivos: {} };
  for (const f of FONTES) {
    const o = path.join(RAIZ, f);
    if (!fs.existsSync(o)) { relatorio.arquivos[f] = 'inexistente'; continue; }
    relatorio.arquivos[f] = { origem: contarMd(o), copiados: copiarMd(o, path.join(dir, 'arquivos', f)) };
  }
  // Verificação: reabre o backup.
  const lido = EJSON.parse(fs.readFileSync(path.join(dir, 'artigos.ejson'), 'utf8'));
  relatorio.documentosNoBackup = lido.length;
  relatorio.ok = lido.length === total && Object.values(relatorio.arquivos).every((a) => a === 'inexistente' || a.origem === a.copiados && contarMd(path.join(dir, 'arquivos', FONTES.find((x) => relatorio.arquivos[x] === a))) === a.origem);
  fs.writeFileSync(path.join(dir, 'LEIA-ME.json'), JSON.stringify(relatorio, null, 2));
  console.log(JSON.stringify({ pasta: dir, ...relatorio }, null, 2));
  if (!relatorio.ok) process.exit(1);
})().catch((e) => { console.error('Falha no backup:', e.message); process.exit(2); });
