/**
 * Relatório semanal das redes (toda segunda-feira): o que foi publicado, alcance/salvamentos/compartilhamentos
 * (se a API do Instagram fornecer), o que funcionou melhor e ajustes propostos. Falha de API não quebra o relatório.
 */
const mongoose = require('mongoose');

const col = (n) => mongoose.connection.db.collection(n);

function semanaIso(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dia = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dia);
  const ano = t.getUTCFullYear();
  return { ano, semana: Math.ceil(((t - Date.UTC(ano, 0, 1)) / 86400e3 + 1) / 7) };
}

async function insights(instagramId) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!instagramId || !token) return null;
  try {
    const host = `https://graph.${process.env.INSTAGRAM_GRAPH_HOST || 'facebook.com'}/${process.env.INSTAGRAM_GRAPH_VERSAO || 'v21.0'}`;
    const r = await fetch(`${host}/${instagramId}/insights?metric=reach,saved,shares,total_interactions`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const j = await r.json();
    return Object.fromEntries((j.data || []).map((m) => [m.name, m.values?.[0]?.value ?? null]));
  } catch { return null; }
}

/** Semana anterior (segunda a domingo) à data `agora`. */
async function gerarRelatorio({ agora = new Date() } = {}) {
  const fim = new Date(agora); fim.setUTCHours(0, 0, 0, 0);
  const dow = fim.getUTCDay() || 7;
  fim.setUTCDate(fim.getUTCDate() - (dow - 1)); // segunda desta semana 00:00 UTC
  const inicio = new Date(fim.getTime() - 7 * 86400e3);
  const { ano, semana } = semanaIso(inicio);
  const publicados = await col('redes_v2').find({ status: 'publicado', publicadoEm: { $gte: inicio, $lt: fim } }).sort({ publicadoEm: 1 }).toArray();
  const bloqueios = await col('redes_v2_log').find({ nivel: { $in: ['bloqueado', 'erro'] }, em: { $gte: inicio, $lt: fim } }).toArray();
  const linhas = [];
  for (const p of publicados) {
    const m = await insights(p.instagramId);
    linhas.push({ id: p._id, titulo: p.titulo, publico: p.publico, alcance: m?.reach ?? null, salvamentos: m?.saved ?? null, compartilhamentos: m?.shares ?? null, interacoes: m?.total_interactions ?? null });
  }
  const comDados = linhas.filter((l) => l.interacoes !== null);
  const melhor = [...comDados].sort((a, b) => (b.interacoes || 0) - (a.interacoes || 0))[0];
  const porPublico = {};
  for (const l of comDados) porPublico[l.publico] = (porPublico[l.publico] || 0) + (l.interacoes || 0);
  const md = [
    `# Relatório das redes — semana ${ano}-W${String(semana).padStart(2, '0')} (${inicio.toISOString().slice(0, 10)} a ${new Date(fim - 1).toISOString().slice(0, 10)})`, '',
    `- Publicados: ${publicados.length} · bloqueados/erros na conferência: ${bloqueios.length}`,
    `- Métricas: ${comDados.length ? 'obtidas pela API do Instagram' : 'indisponíveis (a API não devolveu dados ou ainda não há posts publicados)'}`, '',
    '## O que foi publicado', '', ...(linhas.length ? linhas.map((l) => `- ${l.titulo} (${l.publico}) — alcance ${l.alcance ?? 'n/d'}, salvamentos ${l.salvamentos ?? 'n/d'}, compartilhamentos ${l.compartilhamentos ?? 'n/d'}`) : ['- nada nesta semana']), '',
    '## O que funcionou melhor', '', melhor ? `- ${melhor.titulo}: ${melhor.interacoes} interações.` : '- sem dados suficientes.',
    ...Object.entries(porPublico).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- público "${k}": ${v} interações no total`), '',
    '## Bloqueios', '', ...(bloqueios.length ? bloqueios.map((b) => `- ${b.postId}: ${b.mensagem}`) : ['- nenhum']), '',
    '## Ajustes propostos para a semana seguinte', '',
    ...(melhor ? [`- priorizar temas parecidos com "${melhor.titulo}" e o público "${Object.entries(porPublico).sort((a, b) => b[1] - a[1])[0][0]}".`] : ['- manter o calendário; reavaliar quando houver métricas.']),
    ...(bloqueios.length ? ['- revisar os posts bloqueados (veja o log) antes da próxima publicação.'] : []),
  ].join('\n');
  return { ano, semana, md, publicados: publicados.length };
}

module.exports = { gerarRelatorio, semanaIso };
