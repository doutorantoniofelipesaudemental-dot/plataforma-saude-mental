/**
 * Variáveis únicas da marca (fonte: config/marca.json; LINKEDIN_PERFIL_URL também pode vir do ambiente, que tem prioridade).
 * Usadas pelos scripts (fila manual do LinkedIn, descrições do YouTube) e pelo `scripts/aplicarMarca.js`, que grava o link nas páginas estáticas.
 */
const fs = require('node:fs');
const path = require('node:path');

const ARQ = path.join(__dirname, '..', '..', 'config', 'marca.json');
function ler() { try { return JSON.parse(fs.readFileSync(ARQ, 'utf8')); } catch { return {}; } }

function spotifyValida(url) {
  return /^https:\/\/open\.spotify\.com\/[^\s"<>]+$/.test(url) ? url : '';
}

// Facebook: só ponte para o perfil/página (sem publicação automática). Vazio por padrão.
function facebookValida(url) {
  return /^https:\/\/(www\.)?facebook\.com\/[^\s"<>]+$/.test(url) ? url : '';
}

function marca(env = process.env) {
  const j = ler();
  const url = String(env.LINKEDIN_PERFIL_URL || j.LINKEDIN_PERFIL_URL || '').trim();
  const personalizado = env.LINKEDIN_PERFIL_PERSONALIZADO != null ? /^(true|1|sim)$/i.test(String(env.LINKEDIN_PERFIL_PERSONALIZADO)) : j.LINKEDIN_PERFIL_PERSONALIZADO === true;
  return {
    LINKEDIN_PERFIL_URL: url,
    // o endereço ainda traz "undefined" (gerado pelo LinkedIn): só vale onde for indispensável
    LINKEDIN_PERFIL_LIMPO: personalizado && !/undefined/i.test(url),
    LINKEDIN_LANDING_URL: j.LINKEDIN_LANDING_URL || 'https://www.drantoniofelipemedico.com.br/linkedin',
    YOUTUBE_CANAL_URL: j.YOUTUBE_CANAL_URL || '',
    YOUTUBE_LANDING_URL: j.YOUTUBE_LANDING_URL || 'https://www.drantoniofelipemedico.com.br/youtube',
    INSTAGRAM_LANDING_URL: j.INSTAGRAM_LANDING_URL || 'https://www.drantoniofelipemedico.com.br/instagram',
    // vazio por padrão: sem URL válida (open.spotify.com), o botão do Spotify não aparece (nada de link quebrado)
    SPOTIFY_SHOW_URL: spotifyValida(String(env.SPOTIFY_SHOW_URL || j.SPOTIFY_SHOW_URL || '').trim()),
    FACEBOOK_URL: facebookValida(String(env.FACEBOOK_URL || j.FACEBOOK_URL || '').trim()),
  };
}

module.exports = { marca, ARQ };
