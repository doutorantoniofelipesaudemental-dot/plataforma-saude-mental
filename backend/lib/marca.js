/**
 * Variáveis únicas da marca (fonte: config/marca.json; LINKEDIN_PERFIL_URL também pode vir do ambiente, que tem prioridade).
 * Usadas pelos scripts (fila manual do LinkedIn, descrições do YouTube) e pelo `scripts/aplicarMarca.js`, que grava o link nas páginas estáticas.
 */
const fs = require('node:fs');
const path = require('node:path');

const ARQ = path.join(__dirname, '..', '..', 'config', 'marca.json');
function ler() { try { return JSON.parse(fs.readFileSync(ARQ, 'utf8')); } catch { return {}; } }

function marca(env = process.env) {
  const j = ler();
  const url = String(env.LINKEDIN_PERFIL_URL || j.LINKEDIN_PERFIL_URL || '').trim();
  const personalizado = env.LINKEDIN_PERFIL_PERSONALIZADO != null ? /^(true|1|sim)$/i.test(String(env.LINKEDIN_PERFIL_PERSONALIZADO)) : j.LINKEDIN_PERFIL_PERSONALIZADO === true;
  return {
    LINKEDIN_PERFIL_URL: url,
    // o endereço ainda traz "undefined" (gerado pelo LinkedIn): só vale onde for indispensável
    LINKEDIN_PERFIL_LIMPO: personalizado && !/undefined/i.test(url),
    LINKEDIN_LANDING_URL: j.LINKEDIN_LANDING_URL || 'https://www.drantoniofelipemedico.com.br/linkedin',
  };
}

module.exports = { marca, ARQ };
