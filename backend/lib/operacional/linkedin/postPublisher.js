/**
 * Publicação autônoma no LinkedIn (UGC Posts API): artigos B2B (saúde mental
 * corporativa, medicina do trabalho, consultoria) e postagens autorais de texto.
 */
const sp = require('../../socialPublisher');

const temCredencial = () => Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN);

/** @param {{tipo:'artigo'|'texto', legenda:string, url?:string, titulo?:string}} peca */
async function publicar(peca, { simulado = true } = {}) {
  if (simulado) return { rede: 'linkedin', tipo: peca.tipo, simulado: true, id: `sim-li-${Date.now()}` };
  if (!temCredencial()) return { rede: 'linkedin', tipo: peca.tipo, bloqueado: 'sem credencial válida (LINKEDIN_ACCESS_TOKEN/LINKEDIN_AUTHOR_URN)' };
  if (peca.tipo === 'artigo') return { rede: 'linkedin', tipo: 'artigo', ...(await sp.publicarNoLinkedIn({ url: peca.url, titulo: peca.titulo, legenda: peca.legenda })) };
  const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`, 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify({
      author: process.env.LINKEDIN_AUTHOR_URN,
      lifecycleState: 'PUBLISHED',
      specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text: peca.legenda }, shareMediaCategory: 'NONE' } },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });
  if (!resp.ok) throw new Error(`LinkedIn ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  return { rede: 'linkedin', tipo: 'texto', id: resp.headers.get('x-restli-id') || null };
}

module.exports = { publicar, temCredencial };
