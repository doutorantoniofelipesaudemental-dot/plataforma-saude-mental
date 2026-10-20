/**
 * Regra única do host da API do Instagram. Todos os pontos (publicador, validação de containers, verificador, renovação) usam este módulo.
 *  - Token IGAA (Instagram Login): graph.instagram.com, permissão instagram_business_content_publish.
 *  - Qualquer outro (Login via Página do Facebook, EAA): graph.facebook.com, permissão instagram_content_publish.
 * INSTAGRAM_GRAPH_HOST, se existir, só vale quando for coerente com o token; se não for, avisa e usa o host do token.
 */
const VERSAO_PADRAO = 'v21.0';

function hostDoToken(token = '') {
  return String(token).startsWith('IGAA') ? 'graph.instagram.com' : 'graph.facebook.com';
}

function permissaoDePublicacao(token = '') {
  return hostDoToken(token) === 'graph.instagram.com' ? 'instagram_business_content_publish' : 'instagram_content_publish';
}

// Normaliza o valor declarado ("graph.instagram.com", "https://instagram.com/", "facebook.com") para o domínio.
function normalizarDeclarado(valor) {
  return String(valor || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^graph\./, '').toLowerCase();
}

// Devolve { host, aviso }. aviso é null quando não há conflito.
function resolverHost(token = '', declarado = '') {
  const esperado = hostDoToken(token);
  const decl = normalizarDeclarado(declarado);
  if (!decl) return { host: esperado, aviso: null };
  const coerente = (esperado === 'graph.instagram.com' && decl === 'instagram.com') || (esperado === 'graph.facebook.com' && decl === 'facebook.com');
  if (coerente) return { host: esperado, aviso: null };
  return { host: esperado, aviso: `INSTAGRAM_GRAPH_HOST (${decl}) não combina com o tipo do token; usando ${esperado}.` };
}

// Base da API já com versão. Recebe o token e lê as variáveis só quando for chamado.
let avisado = false;
function baseGraph(token = '', env = process.env) {
  const { host, aviso } = resolverHost(token, env.INSTAGRAM_GRAPH_HOST);
  if (aviso && !avisado) { avisado = true; console.warn(`[instagram-host] ${aviso}`); }
  return `https://${host}/${env.INSTAGRAM_GRAPH_VERSAO || VERSAO_PADRAO}`;
}

module.exports = { hostDoToken, permissaoDePublicacao, resolverHost, baseGraph, normalizarDeclarado, VERSAO_PADRAO };
