/**
 * Citação aprovada pelo Dr. Antônio (18/10/2026) para "emergência" e "cuidados intensivos" na catatonia maligna:
 * Apetauerova et al., Neurol Clin 2021 (PMID 33896535): malignant catatonia entre emergências com risco de vida; "many of these conditions require admission to the neurologic intensive care unit".
 *   node --env-file=.env backend/scripts/corrigirCatatoniaCitacao.js             dry-run
 *   node --env-file=.env backend/scripts/corrigirCatatoniaCitacao.js --aplicar   grava (backup antes em backups/importacao-completa-AAAAMMDD-HHMM/)
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { checarTexto } = require('../lib/auditoriaTexto');

const aplicar = process.argv.includes('--aplicar');
const ANTES = 'podem exigir cuidados intensivos, conforme o protocolo do serviço. Os sinais são:</p>';
const DEPOIS = 'podem exigir cuidados intensivos, conforme o protocolo do serviço (Apetauerova et al., 2021, PMID 33896535). Os sinais são:</p>';
const REF = '<li>Apetauerova D, Patel PA, Burns JD et al.. Movement Disorder Emergencies. Neurol Clin. 2021;39(2):615-630. PMID 33896535. doi:10.1016/j.ncl.2021.01.005 — Revisão (emergências, inclusive catatonia maligna)</li>';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const d = await col.findOne({ slug: { $regex: '^catatonia-na-emergencia' } });
  if (!d) throw new Error('texto não encontrado');
  let c = d.conteudo;
  const n = c.split(ANTES).length - 1;
  if (n === 0 && c.includes('PMID 33896535')) { console.log('já aplicada'); return; }
  if (n !== 1) throw new Error(`trecho aparece ${n}x`);
  c = c.replace(ANTES, () => DEPOIS);
  const i = c.indexOf('PMID 37236789'); if (i < 0) throw new Error('referência âncora não achada');
  const fim = c.indexOf('</li>', i) + 5;
  c = c.slice(0, fim) + '\n' + REF + c.slice(fim);
  const falhas = checarTexto({ origem: 'mongo', slug: d.slug, titulo: d.titulo, resumo: d.resumo, tempoLeitura: d.tempoLeitura, corpo: c }).map((f) => f.msg);
  console.log(`${d.slug}: auditoria do texto novo: ${falhas.length ? falhas.join(' | ') : 'sem falhas'}`);
  if (!aplicar) { console.log('(dry-run)'); return; }
  const a = new Date(), ts = `${a.toISOString().slice(0, 10).replace(/-/g, '')}-${a.toISOString().slice(11, 16).replace(':', '')}`;
  const dir = path.join(path.resolve(__dirname, '../..'), 'backups', `importacao-completa-${ts}`);
  fs.mkdirSync(dir, { recursive: true });
  const todos = await col.find({}).toArray();
  fs.writeFileSync(path.join(dir, 'artigos.json'), JSON.stringify(todos), 'utf8');
  if (JSON.parse(fs.readFileSync(path.join(dir, 'artigos.json'), 'utf8')).length !== todos.length) throw new Error('backup não confere');
  await col.updateOne({ _id: d._id }, { $set: { conteudo: c, atualizadoEm: new Date() } });
  console.log(`backup ${dir} (${todos.length}); gravado.`);
})().catch((e) => { console.error('ERRO:', e.message); process.exitCode = 2; }).finally(() => mongoose.disconnect());
