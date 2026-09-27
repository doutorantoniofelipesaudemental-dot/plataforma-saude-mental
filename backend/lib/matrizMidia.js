/**
 * Matriz multimídia obrigatória por artigo (CLAUDE.md, 20-decies): cada pauta
 * aprovada tem de chegar a seis formatos. O estado de cada um é DERIVADO do
 * que já está registrado em `meta.publicacao` (carrossel, vídeos, LinkedIn) —
 * nunca digitado à mão —, exceto o que não tem API: esses são marcados como
 * "executado" pelo `npm run bot:matriz -- --marcar=...`.
 *
 * O artigo só vira `totalmente_concluido` com os seis formatos publicados ou
 * executados. Um formato conta como entregue com UMA peça (ex.: um dos dois
 * Reels); peças extras não são exigidas.
 */
const FORMATOS = [
  { id: 'instagram.carrossel', rede: 'Instagram', rotulo: 'Carrossel (PNG 4:5)', via: 'api' },
  { id: 'instagram.reel', rede: 'Instagram', rotulo: 'Reel (vertical 9:16)', via: 'api' },
  { id: 'instagram.stories', rede: 'Instagram', rotulo: 'Stories (5 quadros com enquete)', via: 'manual' },
  { id: 'youtube.short', rede: 'YouTube', rotulo: 'Short (vertical 9:16)', via: 'api' },
  { id: 'youtube.longo', rede: 'YouTube', rotulo: 'Vídeo longo (16:9, SEO e capítulos)', via: 'api' },
  { id: 'linkedin.post', rede: 'LinkedIn', rotulo: 'Post corporativo', via: 'api' },
];
const IDS = FORMATOS.map((f) => f.id);

/** O que a publicação por API já registrou, formato a formato. */
function entregasPorApi(publicacao = {}) {
  const videos = Object.entries(publicacao.videos || {});
  const video = (filtro) => {
    const achado = videos.find(([peca, v]) => filtro(peca, v));
    return achado ? { peca: achado[0], em: achado[1].em, ref: achado[1].permalink || achado[1].link || achado[1].id } : null;
  };
  const ig = publicacao.instagram;
  const li = (publicacao.linkedin || [])[0];
  return {
    'instagram.carrossel': ig && (ig.id || ig.permalink) ? { peca: 'carrossel', em: ig.em, ref: ig.permalink || ig.id } : null,
    'instagram.reel': video((_, v) => v.rede === 'instagram'),
    'youtube.short': video((peca, v) => v.rede === 'youtube' && peca.startsWith('short')),
    'youtube.longo': video((peca, v) => v.rede === 'youtube' && peca === 'longo'),
    'linkedin.post': li ? { peca: li.titulo, em: li.em, ref: li.id } : null,
  };
}

/**
 * Matriz recalculada a partir do meta. Mantém as marcações manuais
 * (`meta.matriz.manuais`) e a data em que o artigo ficou concluído.
 */
function calcularMatriz(meta = {}, agora = new Date()) {
  const anterior = meta.matriz || {};
  const manuais = anterior.manuais || {};
  const api = entregasPorApi(meta.publicacao);
  const formatos = {};
  for (const id of IDS) {
    if (api[id]) formatos[id] = { status: 'publicado', ...api[id] };
    else if (manuais[id]) formatos[id] = { status: 'executado', em: manuais[id].em, ref: manuais[id].ref || null, nota: manuais[id].nota || null };
    else formatos[id] = { status: 'pendente' };
  }
  const pendentes = IDS.filter((id) => formatos[id].status === 'pendente');
  const totalmenteConcluido = pendentes.length === 0;
  return {
    formatos,
    manuais,
    pendentes,
    totalmente_concluido: totalmenteConcluido,
    concluidoEm: totalmenteConcluido ? anterior.concluidoEm || agora.toISOString() : null,
  };
}

/**
 * Registra um formato entregue fora da API (Stories, ou um formato de API
 * publicado à mão). Exige aprovação médica do pacote: marcar não aprova nada.
 */
function marcarExecutado(meta, id, { ref = null, nota = null, agora = new Date() } = {}) {
  if (!IDS.includes(id)) throw new Error(`formato desconhecido "${id}" — use um de: ${IDS.join(', ')}`);
  if (!meta.aprovacao) throw new Error('pacote sem aprovação médica registrada — rode npm run bot:aprovar antes');
  const matriz = meta.matriz || {};
  matriz.manuais = { ...(matriz.manuais || {}), [id]: { em: agora.toISOString(), ref, nota } };
  meta.matriz = matriz;
  meta.matriz = calcularMatriz(meta, agora);
  return meta.matriz;
}

module.exports = { FORMATOS, IDS, calcularMatriz, marcarExecutado, entregasPorApi };
