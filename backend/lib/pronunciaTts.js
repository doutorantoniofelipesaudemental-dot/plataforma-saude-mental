/**
 * Dicionário de pronúncia aplicado SÓ ao texto enviado ao TTS (Edge-TTS). O hash da narração (backend/lib/narracao.js) e o texto
 * dos artigos continuam sobre o ORIGINAL: nada aqui altera conteúdo nem invalida áudios.
 * Ativo por padrão no Edge desde 15/10/2026 (aprovado pelo Dr. Antônio para UBS, RQE, SAMU, CAPS, CVV, APS e TCC); --sem-pronuncia desliga.
 * NR-1 entra como "Norma Regulamentadora número 1" (opção B aprovada pelo Dr. Antônio em 15/10/2026, a partir do lote seguinte; áudios já enviados não são regenerados).
 */
const DICIONARIO = [
  ['SAMU', 'Samu'],
  ['CAPS', 'Câps'],
  ['CVV', 'Cê Vê Vê'],
  ['APS', 'Á Pê Esse'],
  ['UBS', 'Ú Bê Esse'],
  ['RQE', 'Érre Quê É'],
  ['TCC', 'Tê Cê Cê'],
  ['NR-1', 'Norma Regulamentadora número 1'],
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
