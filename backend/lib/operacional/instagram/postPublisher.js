/**
 * Publicação autônoma no Instagram oficial (Graph API): carrossel, Reel e Story.
 * Reaproveita os fluxos de socialPublisher.js. `simulado: true` não toca a rede.
 * Sem credencial válida, bloqueia (CLAUDE.md §H) em vez de falhar no meio.
 */
const sp = require('../../socialPublisher');
const { rotaDaMidia } = require('../../redesV2/roteamento');

const temCredencial = () => Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID);

/** @param {{tipo:'carrossel'|'reel'|'story', legenda:string, imagensUrls?:string[], videoUrl?:string, arquivo?:string, imagemUrl?:string}} peca */
async function publicar(peca, { simulado = true, carrosselLiberado = false } = {}) {
  // Reel e Story NUNCA vão pela Meta Graph (decisão de 18/10/2026); carrossel só depois do teste supervisionado liberado.
  const rota = rotaDaMidia({ tipo: peca.tipo, imagens: (peca.imagensUrls || []).length }, { carrosselLiberado });
  if (rota.via === 'manual') return { rede: 'instagram', tipo: peca.tipo, filaManual: true, motivo: rota.motivo };
  if (simulado) return { rede: 'instagram', tipo: peca.tipo, simulado: true, id: `sim-ig-${Date.now()}` };
  if (!temCredencial()) return { rede: 'instagram', tipo: peca.tipo, bloqueado: 'sem credencial válida (INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_ACCOUNT_ID)' };
  if (peca.tipo === 'carrossel') return { rede: 'instagram', tipo: peca.tipo, ...(await sp.publicarCarrosselNoInstagram({ imagensUrls: peca.imagensUrls, legenda: peca.legenda })) };
  if (peca.tipo === 'reel') return { rede: 'instagram', tipo: peca.tipo, ...(await sp.publicarReelNoInstagram({ arquivo: peca.arquivo, videoUrl: peca.videoUrl, legenda: peca.legenda })) };
  if (peca.tipo === 'story') return { rede: 'instagram', tipo: peca.tipo, ...(await publicarStory(peca)) };
  throw new Error(`tipo de peça desconhecido: ${peca.tipo}`);
}

/** Story (imagem 9:16): container media_type=STORIES e publicação. */
async function publicarStory({ imagemUrl }) {
  require('../../freioRedes').exigirRedesAtivas('publicação de Story no Instagram');
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const conta = process.env.INSTAGRAM_ACCOUNT_ID;
  const base = `https://graph.${process.env.INSTAGRAM_GRAPH_HOST || 'facebook.com'}/${process.env.INSTAGRAM_GRAPH_VERSAO || 'v21.0'}`;
  const cab = { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${token}` };
  const c = await (await fetch(`${base}/${conta}/media`, { method: 'POST', headers: cab, body: new URLSearchParams({ image_url: imagemUrl, media_type: 'STORIES' }) })).json();
  if (!c.id) throw new Error(`Instagram recusou o container do Story: ${c.error?.message || 'sem id'}`);
  const p = await (await fetch(`${base}/${conta}/media_publish`, { method: 'POST', headers: cab, body: new URLSearchParams({ creation_id: c.id }) })).json();
  if (!p.id) throw new Error(`Instagram recusou a publicação do Story: ${p.error?.message || 'sem id'}`);
  return { id: p.id };
}

module.exports = { publicar, temCredencial };
