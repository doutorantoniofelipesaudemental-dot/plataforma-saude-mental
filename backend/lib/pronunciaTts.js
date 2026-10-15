/**
 * Dicionário de pronúncia aplicado SÓ ao texto enviado ao TTS (Edge-TTS). O hash da narração (backend/lib/narracao.js) e o texto
 * dos artigos continuam sobre o ORIGINAL: nada aqui altera conteúdo nem invalida áudios.
 * Uso: narrar-artigos.js --pronuncia (desligado por padrão; ligar só depois da aprovação do Dr. Antônio, a partir dos próximos lotes).
 */
const DICIONARIO = [
  ['SAMU', 'Samu'],
  ['CAPS', 'Câps'],
  ['CVV', 'Cê Vê Vê'],
  ['APS', 'Á Pê Esse'],
  ['UBS', 'Ú Bê Esse'],
  ['RQE', 'Érre Quê É'],
  ['NR-1', 'ene érre um'],
  ['TCC', 'Tê Cê Cê'],
];

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function aplicarPronuncia(texto, dicionario = DICIONARIO) {
  let t = String(texto);
  for (const [sigla, fala] of dicionario) {
    t = t.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapar(sigla)}(?![\\p{L}\\p{N}])`, 'gu'), fala);
  }
  return t;
}

module.exports = { DICIONARIO, aplicarPronuncia };
