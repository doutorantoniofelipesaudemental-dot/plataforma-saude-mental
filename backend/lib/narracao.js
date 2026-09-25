/**
 * Narração em áudio dos artigos: o texto que é lido, o hash que diz se o
 * áudio ainda corresponde ao artigo e o estado de cada narração.
 *
 * O áudio é gerado fora das funções da Vercel (backend/tools/narrar-artigos.js,
 * Edge-TTS, voz pt-BR-AntonioNeural — a mesma das narrações antigas) e enviado
 * por PUT /api/admin/artigos/:slug/narracao, que grava no Blob e em
 * `artigo.narracao` {url, hash, voz, geradaEm, caracteres, bytes}.
 *
 * `narracao.hash` = SHA-256 de (voz + texto narrado). Qualquer mudança no
 * conteúdo (reescrita, correção) muda o hash esperado e a narração passa a
 * "desatualizada" sozinha — sem depender de ninguém lembrar de marcar.
 */
const crypto = require('crypto');

const VOZ_NARRACAO = 'pt-BR-AntonioNeural';
const AVISO_REFERENCIAS = 'As referências estão no fim da página.';
const ABERTURA = 'Narração em voz sintética.';

const ENTIDADES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&mdash;': '—', '&ndash;': '–' };

/**
 * Só o texto do artigo, como deve ser lido: sem ferramentas interativas, sem
 * código, sem marcadores estruturais, sem links; a lista de referências vira
 * uma frase; CVV 188 e SAMU 192 continuam, porque fazem parte do texto.
 */
function textoParaNarracao(artigo) {
  let html = String(artigo.conteudo || '');

  // Ferramenta interativa: do título da seção (ou do bloco) até o próximo H2.
  html = html.replace(/<h2[^>]*>\s*Ferramenta interativa\s*<\/h2>[\s\S]*?(?=<h2[\s>]|$)/gi, ' ');
  html = html.replace(/<div[^>]*class="[^"]*ferramenta[^"]*"[\s\S]*?(?=<h2[\s>]|$)/gi, ' ');
  // Código e controles de formulário.
  html = html.replace(/<(script|style|pre|code|form|button|select|textarea|svg|noscript)\b[\s\S]*?<\/\1>/gi, ' ');
  html = html.replace(/<input\b[^>]*>/gi, ' ');
  // Referências: a lista não é lida, só avisada.
  html = html.replace(/<h2[^>]*>\s*Refer[eê]ncias[^<]*<\/h2>\s*<(ol|ul)\b[\s\S]*?<\/\1>/gi, `<p>${AVISO_REFERENCIAS}</p>`);
  // Chamadas numéricas de referência (¹, ²…).
  html = html.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '');
  // Fim de bloco vira quebra, para cada bloco virar uma frase com pausa.
  html = html.replace(/<\/(h[1-6]|p|li|blockquote|div|tr|th|td|dt|dd)>|<br\s*\/?>/gi, '\n');

  const texto = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTIDADES[e] ?? ' ')
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+|\bdoi:\s*\S+/gi, ' ')
    .replace(/\*\*|\bSlide\s*\d+\s*[-–—:]?|\bItem\s*\d+\s*:|\[[^\]]*\]/gi, ' ')
    // Expressão toda em maiúsculas com alguma palavra longa ("NÃO ESPECIALISTA")
    // soa soletrada: vira caixa normal. Siglas curtas sozinhas (CVV, SAMU, TEA) ficam.
    .replace(/(?<![\p{L}])[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})*(?![\p{L}])/gu, (expr) =>
      expr.split(/\s+/).some((p) => p.length >= 5) ? expr[0] + expr.slice(1).toLowerCase() : expr
    );

  const linhas = texto
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l && /[\p{L}\d]/u.test(l))
    .map((l) => (/[.!?:;…]$/.test(l) ? l : `${l}.`));

  return [`${artigo.titulo}.`, ABERTURA, ...linhas].join('\n');
}

function hashNarracao(texto, voz = VOZ_NARRACAO) {
  return crypto.createHash('sha256').update(`${voz}\n${texto}`).digest('hex');
}

/**
 * - ok:            áudio com hash igual ao do texto atual;
 * - legado:        áudio antigo, sem hash, de artigo que não mudou desde então
 *                  (continua tocando, mas deve ser regenerado);
 * - desatualizada: o texto mudou depois do áudio (não toca — leria o texto velho);
 * - ausente:       sem áudio.
 */
function estadoNarracao(artigo) {
  const esperado = hashNarracao(textoParaNarracao(artigo));
  const n = artigo.narracao || {};
  if (n.url && n.hash) return { estado: n.hash === esperado ? 'ok' : 'desatualizada', esperado };
  if (artigo.audioNarracaoUrl) return { estado: artigo.reescrita?.importadaEm ? 'desatualizada' : 'legado', esperado };
  return { estado: 'ausente', esperado };
}

/** URL que o player pode tocar, ou '' (ausente ou desatualizada). */
function urlNarracaoTocavel(artigo) {
  const { estado } = estadoNarracao(artigo);
  if (estado === 'ok') return artigo.narracao.url;
  if (estado === 'legado') return artigo.audioNarracaoUrl;
  return '';
}

const PENDENCIA = {
  ausente: 'narração ausente',
  desatualizada: 'narração desatualizada (o áudio lê uma versão anterior do texto)',
  legado: 'narração sem hash (gerada antes do controle de versão) — regenerar',
};

module.exports = {
  textoParaNarracao,
  hashNarracao,
  estadoNarracao,
  urlNarracaoTocavel,
  PENDENCIA_NARRACAO: PENDENCIA,
  VOZ_NARRACAO,
  AVISO_REFERENCIAS,
};
