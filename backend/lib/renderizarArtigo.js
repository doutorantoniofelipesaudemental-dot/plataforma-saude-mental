const fs = require('fs');
const path = require('path');
const { escapeHtml, formatarData } = require('./texto');

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

const SKELETON_CABECALHO = `<div class="container artigo-topo__interno" id="artigo-cabecalho">
        <div class="esqueleto" style="height:1.2rem;width:8rem;margin-bottom:1rem;"></div>
        <div class="esqueleto" style="height:3rem;margin-bottom:0.8rem;"></div>
        <div class="esqueleto" style="height:1rem;width:60%;"></div>
      </div>`;

const SKELETON_CONTEUDO = `<div class="conteudo-artigo" id="artigo-conteudo" aria-busy="true">
          <div class="esqueleto" style="height:1rem;margin-bottom:0.8rem;"></div>
          <div class="esqueleto" style="height:1rem;margin-bottom:0.8rem;width:92%;"></div>
          <div class="esqueleto" style="height:1rem;margin-bottom:0.8rem;width:96%;"></div>
          <div class="esqueleto" style="height:1rem;width:70%;"></div>
        </div>`;

/** Monta o HTML da capa (com width/height fixos, mesma proporção 1200x630 do CSS) e do player de narração. */
function montarCapaENarracao(artigo) {
  const capaHtml = artigo.imagemCapa
    ? `<div class="artigo-capa">
             <img src="${escapeHtml(artigo.imagemCapa)}" alt="Capa do artigo: ${escapeHtml(artigo.titulo)}" width="1200" height="630" loading="eager">
           </div>`
    : '';

  const narracaoHtml = artigo.audioNarracaoUrl
    ? `<div class="artigo-narracao">
             <p class="artigo-narracao__rotulo">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M16 8.2a4.2 4.2 0 0 1 0 7.6"/><path d="M18.6 5.6a7.8 7.8 0 0 1 0 12.8"/></svg>
               Ouvir o artigo completo
             </p>
             <audio controls preload="none" src="${escapeHtml(artigo.audioNarracaoUrl)}">
               Seu navegador não suporta áudio incorporado.
               <a href="${escapeHtml(artigo.audioNarracaoUrl)}">Baixar o áudio da narração</a>.
             </audio>
           </div>`
    : `<div class="artigo-narracao artigo-narracao--indisponivel">
             <p class="artigo-narracao__rotulo">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>
               Narração em áudio indisponível para este artigo.
             </p>
             <button type="button" class="botao botao--vazado botao--pequeno" data-solicitar-narracao="${escapeHtml(artigo.slug)}">
               Solicitar narração em áudio
             </button>
           </div>`;

  return { capaHtml, narracaoHtml };
}

/** Monta o mesmo markup que assets/js/artigo.js gera no client-side, para o cabeçalho do artigo. */
function montarCabecalhoHtml(artigo) {
  const { capaHtml, narracaoHtml } = montarCapaENarracao(artigo);
  return `<div class="container artigo-topo__interno" id="artigo-cabecalho">
        <a href="/blog" style="display:inline-flex;align-items:center;gap:.4rem;font-size:.9rem;text-decoration:none;color:var(--tinta-fraca);margin-bottom:.5rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
          Todos os artigos
        </a>
        <div><span class="selo">${escapeHtml(artigo.categoria)}</span></div>
        <h1>${escapeHtml(artigo.titulo)}</h1>
        <p class="texto-apoio" style="font-size:1.12rem;">${escapeHtml(artigo.resumo)}</p>
        <div class="artigo-meta" style="margin-top:1.25rem;">
          <span>${escapeHtml(artigo.autor || 'Dr. Antônio Felipe')}</span>
          <span aria-hidden="true">•</span>
          <time datetime="${escapeHtml(new Date(artigo.publicadoEm).toISOString())}">${escapeHtml(formatarData(artigo.publicadoEm))}</time>
          <span aria-hidden="true">•</span>
          <span>${escapeHtml(artigo.tempoLeitura || 4)} min de leitura</span>
        </div>
        ${capaHtml}
        ${narracaoHtml}
      </div>`;
}

/**
 * Injeta meta tags OpenGraph/canonical/JSON-LD no <head>, e o cabeçalho +
 * corpo visível do artigo no <body>, no shell estático de `public/artigo.html`.
 *
 * O `<article>` ganha `data-ssr="1"`: é o sinal que `assets/js/artigo.js` usa
 * para não substituir esse HTML nem exibir o skeleton — só busca os
 * relacionados e aplica o hardening de links externos. `artigo.conteudo` é
 * HTML escrito pela clínica pelas rotas administrativas autenticadas (não é
 * entrada de usuário anônimo), por isso não passa por escapeHtml aqui — mesmo
 * modelo de confiança já usado no client-side.
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

  // Corpo: só marca o <article> como pré-renderizado (data-ssr) se AMBOS os
  // blocos de skeleton baterem — se o template mudar e um deles não bater
  // mais, deixamos os dois intactos e sem a marca, para o client-side JS
  // assumir a renderização normalmente em vez de ficar com skeleton preso.
  const templateCompativel = html.includes(SKELETON_CABECALHO) && html.includes(SKELETON_CONTEUDO);
  if (templateCompativel) {
    html = html.replace('<article>', '<article data-ssr="1">');
    html = html.replace(SKELETON_CABECALHO, montarCabecalhoHtml(artigo));
    html = html.replace(
      SKELETON_CONTEUDO,
      `<div class="conteudo-artigo" id="artigo-conteudo" aria-busy="false">${artigo.conteudo}</div>`
    );
  } else {
    console.warn('[renderizarArtigo] skeleton do template mudou — pulando SSR do corpo, so o <head> foi pre-renderizado.');
  }

  return html;
}

module.exports = { renderizarArtigoHtml, BASE_URL };
