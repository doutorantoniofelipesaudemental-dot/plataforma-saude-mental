/**
 * Restaura o backup de backend/scripts/backupImportacao.js. DRY-RUN POR PADRÃO.
 *   node backend/scripts/restaurarBackup.js [--pasta=backups/importacao-completa-...]   (dry-run: só conta e compara)
 *   ... --aplicar                    regrava os documentos do backup (replace por _id, upsert) e recopia os .md/.mdx
 *   ... --aplicar --remover-novos    além disso, apaga do banco os documentos que NÃO existem no backup
 * Sem --pasta usa o backup mais recente.
 */
const fs = require('node:fs');
const path = require('node:path');
const { EJSON } = require('bson');

const RAIZ = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const removerNovos = args.includes('--remover-novos');

function pastaBackup() {
  const dada = args.find((a) => a.startsWith('--pasta='));
  if (dada) return path.resolve(RAIZ, dada.split('=')[1]);
  const base = path.join(RAIZ, 'backups');
  const ultimo = fs.readdirSync(base).filter((n) => n.startsWith('importacao-completa-')).sort().pop();
  if (!ultimo) throw new Error('nenhum backup importacao-completa-* encontrado');
  return path.join(base, ultimo);
}
const listarMd = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listarMd(path.join(dir, e.name)) : /\.mdx?$/.test(e.name) ? [path.join(dir, e.name)] : [])) : []);

(async () => {
  const pasta = pastaBackup();
  const docs = EJSON.parse(fs.readFileSync(path.join(pasta, 'artigos.ejson'), 'utf8'));
  const arquivos = listarMd(path.join(pasta, 'arquivos'));
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · backup: ${pasta}`);
  console.log(`Leria ${docs.length} documento(s) de "artigos" e ${arquivos.length} arquivo(s) .md/.mdx.`);

  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const atuais = new Map((await col.find({}).toArray()).map((d) => [String(d._id), d]));
  const noBackup = new Set(docs.map((d) => String(d._id)));
  const alterados = docs.filter((d) => !atuais.has(String(d._id)) || JSON.stringify(EJSON.serialize(atuais.get(String(d._id)))) !== JSON.stringify(EJSON.serialize(d)));
  const novos = [...atuais.keys()].filter((id) => !noBackup.has(id));
  const mdDiferentes = arquivos.filter((f) => {
    const rel = path.relative(path.join(pasta, 'arquivos'), f);
    const dest = path.join(RAIZ, rel);
    return !fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== fs.readFileSync(f, 'utf8');
  });
  console.log(`Banco hoje: ${atuais.size} documento(s) · a regravar (diferentes/ausentes): ${alterados.length} · criados depois do backup: ${novos.length}${removerNovos ? ' (seriam APAGADOS)' : ' (mantidos; use --remover-novos para apagar)'}`);
  console.log(`Arquivos .md/.mdx diferentes do backup: ${mdDiferentes.length}`);

  if (aplicar) {
    for (const d of alterados) await col.replaceOne({ _id: d._id }, d, { upsert: true });
    if (removerNovos && novos.length) await col.deleteMany({ _id: { $in: [...novos].map((id) => atuais.get(id)._id) } });
    for (const f of mdDiferentes) { const dest = path.join(RAIZ, path.relative(path.join(pasta, 'arquivos'), f)); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(f, dest); }
    console.log(`Restaurado: ${alterados.length} documento(s)${removerNovos ? `, ${novos.length} removido(s)` : ''}, ${mdDiferentes.length} arquivo(s).`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('Falha:', e.message); process.exit(2); });
