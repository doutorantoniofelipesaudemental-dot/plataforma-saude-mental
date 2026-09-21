const fs = require('fs');
const path = require('path');
const { escapeHtml } = require('./texto');

const BASE_URL = 'https://drsaudemental.vercel.app';
const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'public', 'artigo.html');

// Lido uma vez por instância serverless — o template estático não muda em runtime.
let templateCache = null;
function lerTemplate() {
  if (!templateCache || process.env.NODE_ENV !== 'production') {
    templateCache = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  }
  return templateCache;
}

/**
 * Injeta meta tags OpenGraph, canonical e JSON-LD (MedicalWebPage/Article) no
 * shell estático de `public/artigo.html`, com os dados reais do artigo.
 *
 * O restante da página (corpo, capa, narração) continua sendo montado no
 * client-side por `assets/js/artigo.js` a partir de `/api/artigos/:slug` —
 * isto aqui só resolve o que os leitores de metadados (crawlers, bots de
 * preview de link) veem antes de qualquer JavaScript rodar.
 */
function renderizarArtigoHtml(artigo) {
  const url = `${BASE_URL}/artigo/${encodeURIComponent(artigo.slug)}`;
  const titulo = escapeHtml(artigo.titulo);
  const resumo = escapeHtml(artigo.resumo);
  const tituloCompleto = `${titulo} — Doutor Saúde Mental`;

  let html = lerTemplate();

  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${tituloCompleto}</title>`
  );
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${resumo}$2`
  );
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*("\s+id="link-canonical")/,
    `$1${url}$2`
  );
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*("\s+id="meta-og-title")/,
    `$1${titulo}$2`
  );
  html = html.replace(
    /(<meta property="og:description" content=")[^"]*("\s+id="meta-og-description")/,
    `$1${resumo}$2`
  );
  html = html.replace(
    /(<meta property="og:url" content=")[^"]*("\s+id="meta-og-url")/,
    `$1${url}$2`
  );

  const tagsExtras = [];
  if (artigo.imagemCapa) {
    tagsExtras.push(`<meta property="og:image" content="${escapeHtml(artigo.imagemCapa)}">`);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['MedicalWebPage', 'Article'],
    headline: artigo.titulo,
    description: artigo.resumo,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    inLanguage: 'pt-BR',
    datePublished: artigo.publicadoEm,
    dateModified: artigo.atualizadoEm || artigo.publicadoEm,
    ...(artigo.imagemCapa ? { image: artigo.imagemCapa } : {}),
    author: {
      '@type': 'Person',
      name: artigo.autor || 'Dr. Antônio Felipe',
      jobTitle: 'Médico — Especialista em Medicina de Família e Comunidade',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Doutor Saúde Mental',
      url: BASE_URL,
    },
  };
  // JSON.stringify não fecha tags HTML sozinho — escapamos "</" para não
  // permitir que o conteúdo do artigo feche a tag <script> prematuramente.
  tagsExtras.push(
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/<\//g, '<\\/')}</script>`
  );

  html = html.replace('</head>', `${tagsExtras.join('\n')}\n</head>`);

  return html;
}

module.exports = { renderizarArtigoHtml, BASE_URL };
