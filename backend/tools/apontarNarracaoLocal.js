/**
 * Aponta `artigo.narracao` para o MP3 local em public/audio/narracao/ (rota local, sem Blob).
 * Padrão = DRY-RUN: só confere e mostra o que mudaria. Não grava nada.
 *
 *   node --env-file-if-exists=.env backend/tools/apontarNarracaoLocal.js --slugs=a,b          -> dry-run
 *   ... --slugs=a,b --aplicar                                                                -> grava (faz backup antes)
 *
 * Conferências antes de qualquer gravação: o MP3 existe; o hash do texto atual do artigo bate com o hash
 * da narração (hashNarracao(textoParaNarracao(artigo))); o artigo está publicado.
 * Backup: cópia da coleção `artigos` em backups/narracao-local-AAAAMMDD-HHMM/ (contagem conferida).
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const db = require('../lib/db');
const { textoParaNarracao, hashNarracao, VOZ_NARRACAO } = require('../lib/narracao');

const RAIZ = path.join(__dirname, '..', '..');
const PASTA_AUDIO = path.join(RAIZ, 'public', 'audio', 'narracao');
const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const slugs = (args.find((a) => a.startsWith('--slugs=')) || '').slice(8).split(',').map((s) => s.trim()).filter(Boolean);

function carimbo() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

(async () => {
  if (!slugs.length) { console.log('ABORTADO: informe --slugs=a,b'); process.exit(1); }
  await db.connect();
  const col = mongoose.connection.db.collection('artigos');
  const planos = [];
  let problemas = 0;
  for (const slug of slugs) {
    const a = await col.findOne({ slug });
    const arq = path.join(PASTA_AUDIO, `${slug}.mp3`);
    if (!a) { console.log(`RECUSADO  ${slug} | artigo não encontrado`); problemas += 1; continue; }
    if (!fs.existsSync(arq)) { console.log(`RECUSADO  ${slug} | MP3 ausente em public/audio/narracao/`); problemas += 1; continue; }
    const texto = textoParaNarracao(a);
    const hash = hashNarracao(texto, VOZ_NARRACAO);
    const atual = (a.narracao && a.narracao.hash) || '(sem)';
    const bytes = fs.statSync(arq).size;
    const url = `/audio/narracao/${slug}.mp3`;
    console.log(`PLANO     ${slug} | url ${url} | hash ${hash.slice(0, 12)} | antes ${String(atual).slice(0, 12)} | ${bytes} bytes | caracteres ${texto.length}`);
    planos.push({ slug, url, hash, bytes, caracteres: texto.length });
  }
  if (problemas) { console.log(`ABORTADO: ${problemas} item(ns) recusado(s); nada gravado.`); await mongoose.disconnect(); process.exit(1); }
  if (!aplicar) { console.log('DRY-RUN: nada foi gravado. Para gravar: --aplicar.'); await mongoose.disconnect(); process.exit(0); }

  const dirBackup = path.join(RAIZ, 'backups', `narracao-local-${carimbo()}`);
  fs.mkdirSync(dirBackup, { recursive: true });
  const docs = await col.find({ slug: { $in: slugs } }).toArray();
  fs.writeFileSync(path.join(dirBackup, 'artigos-alterados.json'), JSON.stringify(docs, null, 2));
  if (JSON.parse(fs.readFileSync(path.join(dirBackup, 'artigos-alterados.json'), 'utf8')).length !== slugs.length) {
    console.log('ABORTADO: backup não confere; nada gravado.'); await mongoose.disconnect(); process.exit(1);
  }
  console.log(`backup: ${dirBackup} (${docs.length} artigo(s))`);
  for (const p of planos) {
    await col.updateOne({ slug: p.slug }, { $set: { narracao: { url: p.url, hash: p.hash, voz: VOZ_NARRACAO, geradaEm: new Date(), caracteres: p.caracteres, bytes: p.bytes } } });
    console.log(`GRAVADO   ${p.slug}`);
  }
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
