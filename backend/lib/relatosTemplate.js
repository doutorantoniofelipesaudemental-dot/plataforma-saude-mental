/**
 * Blocos do template dos "Relatos da Prática" (ordem de 09/11/2026, 20:45). Gerados pelo template,
 * sem alterar `conteudo` (hash de narração e selo "Revisado" preservados):
 *  - nota de ficção no início (texto exato aprovado);
 *  - caixa "Para entender" no fim, com link para o tema e para o Blog do tema;
 *  - bloco de apoio CVV 188 · SAMU 192 quando o relato toca em suicídio.
 * Usado pelo SSR (renderizarArtigo) e pelo detalhe da API (cliente).
 */
const { NOTA_FICCAO, RE_SUICIDIO } = require('./relatos');
const { TEMAS, RELATOS, temaEfetivo } = require('./temas');
const { escapeHtml } = require('./texto');

const APOIO_TEXTO = 'Se você está passando por isso, procure ajuda: CVV 188 (24 h, gratuito) · SAMU 192';

const textoPuro = (html) => String(html || '').replace(/<[^>]+>/g, ' ');

/** Relato que toca em suicídio ou autolesão (mesmo padrão da checagem de relatos). */
function tocaSuicidio(artigo) {
  return RE_SUICIDIO.test(textoPuro(artigo.conteudo));
}

/**
 * HTML dos blocos de relato, ou null se o artigo não for um Relato da Prática.
 * `nota` vai antes do corpo; `paraEntender` e `apoio` vão depois do corpo.
 */
function htmlRelato(artigo) {
  if (!artigo || artigo.categoria !== RELATOS) return null;

  const nota = `<aside class="relato-nota" data-nota-ficcao style="margin:0 0 1.5rem;padding:.75rem 1rem;border-left:3px solid currentColor;font-size:.92rem;"><p style="margin:0">${escapeHtml(NOTA_FICCAO)}</p></aside>`;

  // Tema relacionado: campo tema do artigo. Relatos ainda não têm tema no banco; sem ele, o quadro aponta para o Blog.
  const slug = temaEfetivo(artigo);
  const tema = TEMAS.find((t) => t.slug === slug);
  const itens = tema
    ? [
        `<li><a href="/pilares/eixo-${TEMAS.indexOf(tema) + 1}.html">Página do tema: ${escapeHtml(tema.nome)}</a></li>`,
        `<li><a href="/blog?tema=${encodeURIComponent(tema.slug)}">Artigos deste tema no Blog</a></li>`,
      ]
    : ['<li><a href="/blog">Artigos no Blog</a></li>'];
  const paraEntender = `<aside class="relato-para-entender" data-para-entender style="margin-top:2rem;padding:1rem 1.25rem;border:1px solid currentColor;border-radius:.5rem;"><h2 style="font-size:1.1rem;margin:0 0 .5rem;">Para entender</h2><p style="margin:0 0 .5rem;">Quem quiser conhecer o assunto deste relato encontra os textos do tema:</p><ul>${itens.join('')}</ul></aside>`;

  const apoio = tocaSuicidio(artigo)
    ? `<aside class="relato-apoio" data-apoio-cvv style="margin-top:2rem;padding:1rem 1.25rem;border-left:3px solid currentColor;"><p style="margin:0">${escapeHtml(APOIO_TEXTO)}</p></aside>`
    : '';

  return { nota, paraEntender, apoio };
}

module.exports = { htmlRelato, tocaSuicidio, APOIO_TEXTO };
