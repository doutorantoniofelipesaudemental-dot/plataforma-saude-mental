/**
 * Troca o título de UM texto (decisão do Dr. Antônio, 16/10/2026), mantendo o slug/URL.
 *   node --env-file=.env backend/scripts/trocarTitulo.js --slug=X --de="título atual" --para="título novo"            dry-run
 *   node --env-file=.env backend/scripts/trocarTitulo.js --slug=X --de="..." --para="..." --aplicar                    grava
 * Backup (JSON do documento + .mdx) em backups/titulo-AAAAMMDD-HHMM/ antes de gravar. Guarda o título antigo em historicoTitulos.
 * O título entra no hash da narração (backend/lib/narracao.js): o áudio fica "desatualizada" sozinho e o player some até o novo áudio (§D liberado).
 * Não apaga o áudio antigo.
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const slug = arg('slug'), de = arg('de'), para = arg('para'), aplicar = process.argv.includes('--aplicar');
if (!slug || !de || !para) { console.error('uso: --slug= --de= --para= [--aplicar]'); process.exit(2); }
const RAIZ = path.resolve(__dirname, '../..');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const doc = await col.findOne({ slug });
  if (!doc) throw new Error(`slug não encontrado: ${slug}`);
  if (doc.titulo !== de) throw new Error(`título atual diferente do esperado: "${doc.titulo}"`);
  const mdx = path.join(RAIZ, 'apps/plataforma-saude-mental/src/content/artigos', `${slug}.mdx`);
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · ${slug}\n  de:   ${de}\n  para: ${para}\n  mdx: ${fs.existsSync(mdx) ? 'sim' : 'não'} · narração: ${doc.narracao?.hash ? 'ficará desatualizada (player oculto até regerar)' : 'sem áudio'}`);
  if (!aplicar) return;

  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12).replace(/^(\d{8})(\d{4})$/, '$1-$2');
  const dir = path.join(RAIZ, 'backups', `titulo-${ts}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(doc, null, 1));
  if (fs.existsSync(mdx)) fs.copyFileSync(mdx, path.join(dir, `${slug}.mdx`));
  const conferido = JSON.parse(fs.readFileSync(path.join(dir, `${slug}.json`), 'utf8'));
  if (conferido.slug !== slug) throw new Error('backup não abre');
  console.log(`  backup ok: ${dir} (1 documento)`);

  await col.updateOne({ slug }, { $set: { titulo: para, atualizadoEm: new Date() }, $push: { historicoTitulos: { titulo: de, em: new Date() } } });
  if (fs.existsSync(mdx)) fs.writeFileSync(mdx, fs.readFileSync(mdx, 'utf8').replace(de, para));
  console.log('  gravado (banco + mdx).');
})().catch((e) => { console.error('ERRO:', e.message); process.exitCode = 2; }).finally(() => mongoose.disconnect());
