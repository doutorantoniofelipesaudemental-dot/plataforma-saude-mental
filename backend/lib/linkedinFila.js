/**
 * Fila do LinkedIn (coleção `linkedin_fila`, criada por scripts/linkedin/gerarConteudo.js). Chamada pelo cron /api/cron/publicar-linkedin
 * (seg, qua e sex, 22:30 UTC = 19:30 de Salvador). Publica no máximo 1 texto por execução, e só se:
 *   - LINKEDIN_PUBLICACAO_ATIVA=true (freio próprio; ausente ou outro valor = nada é publicado) e REDES_PUBLICACAO_ATIVA não está em false;
 *   - há credencial (LINKEDIN_ACCESS_TOKEN, LINKEDIN_AUTHOR_URN) e o token não venceu (LINKEDIN_TOKEN_VENCE_EM, AAAA-MM-DD);
 *   - o item está "aprovado-checagem", o horário chegou (atraso máximo de 3 dias) e passa de novo pela checagem agora;
 *   - o texto do site ao qual o post se refere já está publicado (senão espera, e o link não aponta para uma página inexistente).
 * Carrosséis em PDF e newsletters são manuais (status "manual"): ficam em relatorios/linkedin/fila-manual/.
 */
const { redesAtivas } = require('./freioRedes');
const { checarPost } = require('./linkedinChecagem');
const { log } = require('./log');

const ATRASO_MAX_MS = 3 * 864e5;

async function publicarDevidos({ db, simular = false, agora = new Date(), publicar } = {}) {
  const r = { publicado: false, motivo: '', id: null };
  if (String(process.env.LINKEDIN_PUBLICACAO_ATIVA || '').trim().toLowerCase() !== 'true') return { ...r, motivo: 'LINKEDIN_PUBLICACAO_ATIVA não está "true" (freio)' };
  if (!redesAtivas()) return { ...r, motivo: 'REDES_PUBLICACAO_ATIVA=false (freio geral)' };
  if (!simular) {
    if (!process.env.LINKEDIN_ACCESS_TOKEN || !process.env.LINKEDIN_AUTHOR_URN) return { ...r, motivo: 'sem credencial do LinkedIn (ver relatorios/linkedin/PASSO-A-PASSO-LINKEDIN.md)' };
    const vence = process.env.LINKEDIN_TOKEN_VENCE_EM;
    if (vence && new Date(`${vence}T23:59:59-03:00`) < agora) return { ...r, motivo: `token vencido em ${vence}: gerar de novo (npm run linkedin:autorizar)` };
  }
  const col = db.collection('linkedin_fila');
  const iso = agora.toISOString();
  const devidos = await col.find({ status: 'aprovado-checagem', tipo: 'texto', slot: { $lte: iso } }).sort({ slot: 1 }).limit(5).toArray();
  for (const it of devidos) {
    if (agora - new Date(it.slot) > ATRASO_MAX_MS) { if (!simular) await col.updateOne({ _id: it._id }, { $set: { status: 'expirado', motivo: 'atraso maior que 3 dias' } }); continue; }
    const falhas = checarPost(it);
    if (falhas.length) { if (!simular) await col.updateOne({ _id: it._id }, { $set: { status: 'bloqueado', motivo: falhas.join(' | ') } }); log.erro('[linkedin] bloqueado', it._id, falhas.join(' | ')); continue; }
    if (it.slug) {
      const a = await db.collection('artigos').findOne({ slug: it.slug }, { projection: { publicado: 1 } });
      if (!a || a.publicado !== true) { r.motivo = `aguardando a publicação do texto ${it.slug}`; continue; }
    }
    if (simular) return { publicado: false, simulado: true, motivo: 'simulação: publicaria', id: it._id };
    try {
      const out = await (publicar || require('./operacional/linkedin/postPublisher').publicar)({ tipo: it.url ? 'artigo' : 'texto', legenda: it.texto, url: it.url, titulo: it.titulo }, { simulado: false });
      if (out.bloqueado) return { ...r, motivo: out.bloqueado };
      await col.updateOne({ _id: it._id }, { $set: { status: 'publicado', publicadoEm: new Date(), linkedinId: out.id || null } });
      log.info('[linkedin] publicado', it._id);
      return { publicado: true, motivo: '', id: it._id };
    } catch (e) {
      log.erro('[linkedin] falha ao publicar', it._id, e.message.slice(0, 200));
      return { ...r, motivo: `erro: ${e.message.slice(0, 120)}`, id: it._id };
    }
  }
  return { ...r, motivo: r.motivo || 'nada devido agora' };
}

module.exports = { publicarDevidos };
