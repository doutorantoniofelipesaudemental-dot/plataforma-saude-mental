/**
 * Publica no site os itens agendados cujo horário chegou (publicado:false → true).
 * ANTES de cada publicação roda a auditoria do item (backend/lib/auditoriaTexto.js). Se falhar: NÃO publica,
 * tira o item do calendário (agendamento.falha), registra em relatorios/publicacao-falhas.md (quando o disco
 * permite) e puxa o próximo da fila para ocupar o horário — o ritmo de 8 por dia útil se mantém.
 * Usado pela rota /api/cron/publicar-agendados (Vercel Cron, a cada 30 min) e por backend/scripts/publicarAgendados.js.
 */
const fs = require('node:fs');
const path = require('node:path');
const Artigo = require('../models/Artigo');
const { checarTexto } = require('./auditoriaTexto');

const auditar = (d) => checarTexto({ origem: 'mongo', slug: d.slug, titulo: d.titulo, resumo: d.resumo, tempoLeitura: d.tempoLeitura, corpo: d.conteudo });

function registrarFalha(d, falhas) {
  const linha = `- ${new Date().toISOString()} · **${d.slug}** · ${falhas.map((f) => f.msg).join(' | ')}`;
  try {
    const arq = path.resolve(__dirname, '../../relatorios/publicacao-falhas.md');
    fs.mkdirSync(path.dirname(arq), { recursive: true });
    fs.appendFileSync(arq, `${fs.existsSync(arq) ? '' : '# Itens barrados na auditoria antes de publicar\n'}\n${linha}\n`, 'utf8');
  } catch { /* disco somente leitura (Vercel): o motivo fica em agendamento.falha */ }
  return linha;
}

async function publicarVencidos({ agora = new Date(), simular = false } = {}) {
  const col = Artigo.collection;
  const resultado = { publicados: [], barrados: [], substituicoes: [], pendentes: 0, simulado: simular };
  const vencidos = await col.find({ publicado: false, 'agendamento.agendado': true, 'agendamento.slot': { $lte: agora } }).sort({ 'agendamento.slot': 1 }).limit(16).toArray();
  const tentados = new Set(vencidos.map((d) => String(d._id)));

  async function publicar(d, slot) {
    if (!simular) await col.updateOne({ _id: d._id }, { $set: { publicado: true, publicadoEm: slot, 'agendamento.agendado': false, 'agendamento.falha': '', atualizadoEm: new Date() } });
    resultado.publicados.push({ slug: d.slug, slot: slot.toISOString() });
  }

  for (const d of vencidos) {
    const slot = d.agendamento.slot;
    const falhas = auditar(d);
    if (!falhas.length) { await publicar(d, slot); continue; }
    registrarFalha(d, falhas);
    if (!simular) await col.updateOne({ _id: d._id }, { $set: { 'agendamento.agendado': false, 'agendamento.falha': `auditoria: ${falhas.map((f) => f.msg).join(' | ')}` } });
    resultado.barrados.push({ slug: d.slug, falhas: falhas.map((f) => f.msg) });
    // puxa o próximo da fila (primeiro que passe na auditoria) para ocupar este horário
    const proximos = await col.find({ publicado: false, 'agendamento.agendado': true, 'agendamento.slot': { $gt: agora } }).sort({ 'agendamento.slot': 1 }).limit(10).toArray();
    for (const p of proximos) {
      if (tentados.has(String(p._id))) continue;
      tentados.add(String(p._id));
      const f2 = auditar(p);
      if (f2.length) { registrarFalha(p, f2); if (!simular) await col.updateOne({ _id: p._id }, { $set: { 'agendamento.agendado': false, 'agendamento.falha': `auditoria: ${f2.map((f) => f.msg).join(' | ')}` } }); resultado.barrados.push({ slug: p.slug, falhas: f2.map((f) => f.msg) }); continue; }
      await publicar(p, slot);
      resultado.substituicoes.push({ no: d.slug, entrou: p.slug });
      break;
    }
  }
  resultado.pendentes = await col.countDocuments({ publicado: false, 'agendamento.agendado': true });
  return resultado;
}

module.exports = { publicarVencidos };
