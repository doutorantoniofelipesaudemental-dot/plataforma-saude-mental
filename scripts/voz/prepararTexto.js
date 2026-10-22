/**
 * Prepara o texto da amostra de voz (ordem de 21/10/2026). Só leitura: não altera nenhum texto do Portal.
 *   node scripts/voz/prepararTexto.js <arquivo.txt> <saida.json>
 * Aplica o dicionário de pronúncia atual (backend/lib/pronunciaTts.js), escreve os números por extenso
 * (188 = cento e oitenta e oito; 192 = cento e noventa e dois) e separa parágrafos e frases para
 * a síntese, com pausas maiores entre parágrafos.
 */
const fs = require('node:fs');
const { aplicarPronuncia } = require('../../backend/lib/pronunciaTts');

const NUMEROS = [
  ['188', 'cento e oitenta e oito'],
  ['192', 'cento e noventa e dois'],
];

// Função pura: números de linha de crise por extenso, depois o dicionário de siglas.
function prepararTrecho(texto) {
  let t = String(texto).replace(/[·—]/g, ',');
  for (const [numero, por_extenso] of NUMEROS) t = t.split(numero).join(por_extenso);
  t = aplicarPronuncia(t);
  return t
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((paragrafo) => ({
      frases: paragrafo.split(/(?<=[.!?])\s+/).map((f) => f.trim()).filter(Boolean),
    }));
}

module.exports = { prepararTrecho, NUMEROS };

if (require.main === module) {
  const [entrada, saida] = process.argv.slice(2);
  if (!entrada || !saida) { console.error('uso: node scripts/voz/prepararTexto.js <entrada.txt> <saida.json>'); process.exit(1); }
  const blocos = prepararTrecho(fs.readFileSync(entrada, 'utf8'));
  fs.writeFileSync(saida, JSON.stringify(blocos, null, 2), 'utf8');
  const palavras = blocos.flatMap((b) => b.frases).join(' ').split(/\s+/).length;
  console.log(`paragrafos: ${blocos.length} · palavras: ${palavras}`);
}
