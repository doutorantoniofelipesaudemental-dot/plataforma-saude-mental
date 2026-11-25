/**
 * Grava nas páginas estáticas (public/*.html) o link do perfil do LinkedIn definido em config/marca.json (variável única LINKEDIN_PERFIL_URL).
 *   node scripts/aplicarMarca.js           aplica (npm run marca:aplicar)
 *   node scripts/aplicarMarca.js --conferir  só confere (código de saída 1 se alguma página estiver fora do que a variável manda)
 * Marcadores nas páginas:
 *   <a data-linkedin-perfil="indispensavel|opcional" href="...">      o href vira o LINKEDIN_PERFIL_URL
 *   <li|span hidden data-linkedin-perfil-item>...</li|span>            some enquanto o link tiver "undefined" (LINKEDIN_PERFIL_PERSONALIZADO=false) e aparece quando for personalizado
 * "indispensavel" (landing /linkedin e /links) sempre aparece; "opcional" (rodapé, /mentoria) fica dentro de um item oculto até o link ser personalizado.
 * Quando o Dr. Antônio mandar o link novo: troque LINKEDIN_PERFIL_URL e LINKEDIN_PERFIL_PERSONALIZADO em config/marca.json, rode isto e faça o deploy.
 */
const fs = require('node:fs');
const path = require('node:path');
const { marca } = require('../backend/lib/marca');

const PUBLIC = path.join(__dirname, '..', 'public');
const conferir = process.argv.includes('--conferir');

function aplicar(html, m) {
  let out = html.replace(/<a\b[^>]*\bdata-linkedin-perfil="[^"]*"[^>]*>/g, (tag) => tag.replace(/href="[^"]*"/, `href="${m.LINKEDIN_PERFIL_URL}"`));
  // Spotify: <a data-spotify-show>. Sem SPOTIFY_SHOW_URL válida: fica oculto e sem href. Com URL: recebe o href.
  out = out.replace(/<a\b[^>]*\bdata-spotify-show\b[^>]*>/g, (tag) => {
    const semHref = tag.replace(/\shidden(?=[\s>])/, '').replace(/\shref="[^"]*"/, '');
    return m.SPOTIFY_SHOW_URL ? semHref.replace(/^<a/, `<a href="${m.SPOTIFY_SHOW_URL}"`) : semHref.replace(/^<a/, '<a hidden');
  });
  out = out.replace(/<(li|span)\b[^>]*\bdata-linkedin-perfil-item\b[^>]*>/g, (tag) => {
    let t = tag.replace(/\shidden(?=[\s>=])/, '');
    if (!m.LINKEDIN_PERFIL_LIMPO) t = t.replace(/^<(li|span)/, '<$1 hidden');
    return t;
  });
  return out;
}

module.exports = { aplicar };

if (require.main === module) {
  const m = marca();
  let mudou = 0;
  for (const f of fs.readdirSync(PUBLIC).filter((x) => x.endsWith('.html'))) {
    const p = path.join(PUBLIC, f);
    const antes = fs.readFileSync(p, 'utf8');
    const depois = aplicar(antes, m);
    if (antes !== depois) { mudou++; console.log(`${conferir ? 'DIFERE' : 'atualizada'}: public/${f}`); if (!conferir) fs.writeFileSync(p, depois, 'utf8'); }
  }
  // Home do app Next (apps/plataforma-saude-mental/app): mesma URL, gerada a partir de config/marca.json (fonte única)
  const geradoArq = path.join(__dirname, '..', 'apps', 'plataforma-saude-mental', 'app', 'spotifyShow.generated.js');
  const geradoConteudo = `/* Gerado por scripts/aplicarMarca.js a partir de config/marca.json. Não editar à mão. */\nmodule.exports = { SPOTIFY_SHOW_URL: ${JSON.stringify(m.SPOTIFY_SHOW_URL)}, FACEBOOK_URL: ${JSON.stringify(m.FACEBOOK_URL)}, YOUTUBE_CANAL_URL: ${JSON.stringify(m.YOUTUBE_CANAL_URL)}, LINKEDIN_HREF: ${JSON.stringify(m.LINKEDIN_PERFIL_LIMPO ? m.LINKEDIN_PERFIL_URL : m.LINKEDIN_LANDING_URL)} };\n`;
  const geradoAntes = fs.existsSync(geradoArq) ? fs.readFileSync(geradoArq, 'utf8') : '';
  if (geradoAntes !== geradoConteudo) { mudou++; console.log(`${conferir ? 'DIFERE' : 'atualizada'}: apps/plataforma-saude-mental/app/spotifyShow.generated.js`); if (!conferir) fs.writeFileSync(geradoArq, geradoConteudo, 'utf8'); }
  console.log(`LINKEDIN_PERFIL_URL=${m.LINKEDIN_PERFIL_URL} · perfil personalizado: ${m.LINKEDIN_PERFIL_LIMPO ? 'sim (link aparece em todo lugar)' : 'não (só landing e /links)'} · Spotify: ${m.SPOTIFY_SHOW_URL ? 'com URL' : 'oculto (sem URL)'} · páginas ${conferir ? 'fora do padrão' : 'atualizadas'}: ${mudou}`);
  if (conferir && mudou) process.exit(1);
}
