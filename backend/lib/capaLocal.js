// Capa do site: usa public/artigos/<slug>/capa.jpg quando o arquivo existe no deploy;
// senão, mantém a URL salva em imagemCapa (Vercel Blob). Não altera o banco.
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', 'public');

function capaPublica(artigo) {
  if (!artigo || !artigo.slug) return artigo?.imagemCapa || '';
  const local = path.join(RAIZ, 'artigos', artigo.slug, 'capa.jpg');
  try {
    if (fs.existsSync(local)) return '/artigos/' + artigo.slug + '/capa.jpg';
  } catch { /* cai na URL atual */ }
  return artigo.imagemCapa || '';
}

module.exports = { capaPublica };
