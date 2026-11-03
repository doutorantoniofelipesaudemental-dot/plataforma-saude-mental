/**
 * Registro de revisão médica no banco (ordem de 02/11/2026, item 4).
 * Coleção: revisoes_medicas — uma linha por artigo (chave: slug).
 * Funções recebem a coleção (driver MongoDB ou fake de teste); não abrem conexão.
 * O JSON relatorios/revisoes/registro.json continua sendo cópia (espelho) gravada pelo revisao:aprovar.
 */
const COLECAO = 'revisoes_medicas';

// Grava (ou atualiza) a aprovação/reprovação de um artigo. Nunca grava "aprovada" sem hash.
async function gravarRevisao(col, reg) {
  if (!reg || !reg.slug) throw new Error('gravarRevisao exige slug');
  if (reg.status === 'aprovada' && !reg.hash) throw new Error('aprovação sem hash não é gravada');
  await col.updateOne({ slug: reg.slug }, { $set: { ...reg } }, { upsert: true });
  return reg;
}

// Lê o registro de um artigo; null se não houver.
async function lerRevisao(col, slug) {
  if (!slug) return null;
  return col.findOne({ slug }, { projection: { _id: 0 } });
}

// Entradas do registro.json. Chaves que começam com "_" são metadados e não são artigos.
function entradasDoJson(json) {
  return Object.entries(json || {})
    .filter(([k]) => !k.startsWith('_'))
    .map(([slug, v]) => ({ slug, ...v }));
}

// Migração: não apaga nada. Com aplicar=false só descreve o que faria.
async function migrarJson(col, json, { aplicar = false } = {}) {
  const entradas = entradasDoJson(json);
  const ignorados = Object.keys(json || {}).filter((k) => k.startsWith('_'));
  const invalidas = entradas.filter((e) => e.status === 'aprovada' && !e.hash).map((e) => e.slug);
  const validas = entradas.filter((e) => !invalidas.includes(e.slug));
  if (aplicar) for (const e of validas) await gravarRevisao(col, e);
  return { aplicado: aplicar, total: entradas.length, gravaveis: validas.length, invalidas, ignorados };
}

module.exports = { COLECAO, gravarRevisao, lerRevisao, entradasDoJson, migrarJson };
