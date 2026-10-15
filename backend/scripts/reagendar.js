/**
 * Reagenda a fila do site. 1) audita cada item agendado (backend/lib/auditoriaTexto.js): quem falhar sai do
 * calendário (agendamento.agendado=false + motivo) e vai para relatorios/publicacao-falhas.md; 2) recompõe os
 * slots dos demais (8 por dia útil, backend/lib/calendarioSite.js) e regrava relatorios/calendario-publicacao-site.md.
 *   node --env-file=.env backend/scripts/reagendar.js [--aplicar]      (sem --aplicar: só mostra)
 */
const fs = require('node:fs');
const path = require('node:path');
const { checarTexto } = require('../lib/auditoriaTexto');
const { montarCalendario } = require('../lib/calendarioSite');

const RAIZ = path.resolve(__dirname, '../..');
const aplicar = process.argv.includes('--aplicar');

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const fila = await col.find({ publicado: false, 'agendamento.agendado': true }).sort({ 'agendamento.slot': 1 }).toArray();
  const falhas = [], ok = [];
  for (const d of fila) {
    const f = checarTexto({ origem: 'mongo', slug: d.slug, titulo: d.titulo, resumo: d.resumo, tempoLeitura: d.tempoLeitura, corpo: d.conteudo });
    (f.length ? falhas : ok).push({ d, f });
  }
  const tipoDe = (d) => d.importacao?.tipo || (d.categoria === 'Relatos da Prática' ? 'relato' : 'artigo');
  const slugsOk = new Set(ok.map((x) => x.d.slug));
  const itens = ok.map(({ d }, i) => ({
    slug: d.slug, titulo: d.titulo, tipo: tipoDe(d), categoria: d.categoria, semana: d.importacao?.semanaPublicacao ?? undefined,
    numeroSerie: d.importacao?.serie?.numero, serie: Boolean(d.importacao?.serie), ordem: i,
    par: [...(d.vinculos?.relatos || []), ...(d.vinculos?.artigos || [])].find((s) => slugsOk.has(s)),
  }));
  const { agenda, avisos } = montarCalendario(itens);
  console.log(`Agendados: ${fila.length} · aprovados na auditoria: ${ok.length} · fora do calendário: ${falhas.length} · dias: ${new Set(agenda.map((a) => a.data)).size} (${agenda[0]?.data} a ${agenda.at(-1)?.data}) · avisos: ${avisos.length}`);
  for (const { d, f } of falhas) console.log(`  FORA: ${d.slug} — ${f.map((x) => x.msg).join(' | ')}`);

  const dir = path.join(RAIZ, 'relatorios');
  fs.mkdirSync(dir, { recursive: true });
  const cal = ['# Calendário de publicação do site', '', `${agenda.length} itens · ${new Set(agenda.map((a) => a.data)).size} dias úteis · de ${agenda[0]?.data} a ${agenda.at(-1)?.data} · 8 por dia útil (08:00, 09:30, 11:00, 12:30, 14:00, 15:30, 17:00, 19:00, America/Bahia)`, '',
    ...(falhas.length ? ['## Fora do calendário (aguardam decisão do Dr. Antônio)', '', ...falhas.map(({ d, f }) => `- **${d.slug}**: ${f.map((x) => x.msg).join(' | ')}`), ''] : []),
    '| Data | Hora | Slug | Título | Tipo | Público |', '|---|---|---|---|---|---|', ...agenda.map((a) => `| ${a.data} | ${a.hora} | ${a.slug} | ${a.titulo.replace(/\|/g, '/')} | ${a.tipo} | ${a.publico} |`)].join('\n');
  fs.writeFileSync(path.join(dir, 'calendario-publicacao-site.md'), `${cal}\n`, 'utf8');

  if (aplicar) {
    for (const { d, f } of falhas) await col.updateOne({ _id: d._id }, { $set: { 'agendamento.agendado': false, 'agendamento.falha': `auditoria: ${f.map((x) => x.msg).join(' | ')}` } });
    for (const a of agenda) await col.updateOne({ slug: a.slug }, { $set: { publicadoEm: new Date(a.slot), 'agendamento.slot': new Date(a.slot), 'agendamento.agendado': true, 'agendamento.falha': '' } });
    if (falhas.length) {
      const arq = path.join(dir, 'publicacao-falhas.md');
      const linhas = falhas.map(({ d, f }) => `- ${new Date().toISOString()} · **${d.slug}** · ${f.map((x) => x.msg).join(' | ')}`);
      fs.appendFileSync(arq, `${fs.existsSync(arq) ? '' : '# Itens barrados na auditoria antes de publicar\n'}\n${linhas.join('\n')}\n`, 'utf8');
    }
    console.log('Gravado.');
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
