const Artigo = require('../models/Artigo');
const { BASE_URL } = require('./renderizarArtigo');

/** Escapa os 5 caracteres reservados de XML — defensivo, mesmo com slugs já restritos a [a-z0-9-]. */
function escapeXml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[c]);
}

/**
 * Sitemap com um <url> por artigo publicado — direto do MongoDB, sempre
 * atual, sem precisar de rebuild quando um artigo novo é criado.
 */
async function gerarSitemapArtigosXml() {
  const artigos = await Artigo.find({ publicado: true })
    .select('slug publicadoEm atualizadoEm')
    .sort({ publicadoEm: -1 })
    .lean();

  const urls = artigos
    .map((artigo) => {
      const lastmod = new Date(artigo.atualizadoEm || artigo.publicadoEm).toISOString();
      return `  <url>
    <loc>${escapeXml(`${BASE_URL}/artigo/${artigo.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/** Índice referenciando os sitemaps do site — hoje só o de artigos. */
async function gerarSitemapIndexXml() {
  const maisRecente = await Artigo.findOne({ publicado: true })
    .select('publicadoEm atualizadoEm')
    .sort({ atualizadoEm: -1 })
    .lean();
  const lastmod = new Date(maisRecente?.atualizadoEm || maisRecente?.publicadoEm || Date.now()).toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-artigos.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>
`;
}

module.exports = { gerarSitemapArtigosXml, gerarSitemapIndexXml };
