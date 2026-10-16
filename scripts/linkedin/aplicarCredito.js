/**
 * Acrescenta o crédito do Portal ("Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito.") aos itens já gerados da fila do LinkedIn
 * (coleção linkedin_fila + relatorios/linkedin/fila-manual/…/texto.txt). Não altera o sentido: só 1 linha antes do aviso "Conteúdo educativo".
 *   node --env-file=.env scripts/linkedin/aplicarCredito.js            dry-run (mostra quantos mudam e quais passam de 2000 caracteres)
 *   node --env-file=.env scripts/linkedin/aplicarCredito.js --aplicar  grava (backup em backups/linkedin-credito-AAAAMMDD-HHMM/)
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { checarPost } = require('../../backend/lib/linkedinChecagem');
const RAIZ = path.resolve(__dirname, '../..');
const LINHA = 'Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito.';
const aplicar = process.argv.includes('--aplicar');
const ins = (t) => (!t || t.includes('Antônio Felipe Garabito') ? t : t.replace('Conteúdo educativo, não substitui consulta.', `${LINHA}\nConteúdo educativo, não substitui consulta.`));
function* txts(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yield* txts(p); else if (e.name === 'texto.txt') yield p; } }
(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('linkedin_fila');
  const itens = await col.find({}).toArray();
  const mudam = itens.filter((i) => ins(i.texto) !== i.texto);
  const longos = mudam.filter((i) => i.tipo === 'texto' && ins(i.texto).length > 2000).map((i) => `${i._id} (${ins(i.texto).length})`);
  const falhas = mudam.filter((i) => i.tipo === 'texto').map((i) => [i._id, checarPost({ ...i, texto: ins(i.texto) })]).filter(([, f]) => f.length);
  const arqs = [...txts(path.join(RAIZ, 'relatorios/linkedin/fila-manual'))].filter((f) => ins(fs.readFileSync(f, 'utf8')) !== fs.readFileSync(f, 'utf8'));
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · banco: ${mudam.length}/${itens.length} itens · arquivos texto.txt: ${arqs.length} · acima de 2000 caracteres: ${longos.length ? longos.join(', ') : 'nenhum'} · reprovam na checagem: ${falhas.length ? JSON.stringify(falhas) : 'nenhum'}`);
  if (aplicar) {
    if (longos.length || falhas.length) throw new Error('há itens que reprovam; resolver antes de gravar');
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12).replace(/^(\d{8})(\d{4})$/, '$1-$2');
    const dir = path.join(RAIZ, 'backups', `linkedin-credito-${ts}`); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'linkedin_fila.json'), JSON.stringify(itens));
    if (JSON.parse(fs.readFileSync(path.join(dir, 'linkedin_fila.json'), 'utf8')).length !== itens.length) throw new Error('backup não confere');
    for (const i of mudam) await col.updateOne({ _id: i._id }, { $set: { texto: ins(i.texto) } });
    for (const f of arqs) fs.writeFileSync(f, ins(fs.readFileSync(f, 'utf8')), 'utf8');
    console.log(`  gravado. backup: ${dir} (${itens.length} documentos)`);
  }
})().catch((e) => { console.error('ERRO:', e.message); process.exitCode = 2; }).finally(() => mongoose.disconnect());
