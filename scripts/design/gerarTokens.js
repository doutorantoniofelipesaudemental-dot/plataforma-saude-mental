/**
 * Gera docs/tokens.json a partir do bloco JSON da seção "## 9" de docs/DESIGN.md (fonte única).
 *   node scripts/design/gerarTokens.js            -> grava docs/tokens.json
 *   node scripts/design/gerarTokens.js --verificar -> sai com 1 se o arquivo gerado estiver desatualizado
 */
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.resolve(__dirname, '../..');
const DESIGN = path.join(RAIZ, 'docs', 'DESIGN.md');
const SAIDA = path.join(RAIZ, 'docs', 'tokens.json');

function extrair(texto) {
  const secao = texto.slice(texto.indexOf('## 9. Bloco de tokens'));
  const m = secao.match(/```json\n([\s\S]*?)\n```/);
  if (!m) throw new Error('bloco JSON de tokens não encontrado em DESIGN.md (seção 9)');
  return JSON.parse(m[1]);
}

if (require.main === module) {
  const tokens = extrair(fs.readFileSync(DESIGN, 'utf8'));
  const novo = JSON.stringify(tokens, null, 2) + '\n';
  if (process.argv.includes('--verificar')) {
    const atual = fs.existsSync(SAIDA) ? fs.readFileSync(SAIDA, 'utf8') : '';
    if (atual !== novo) { console.error('docs/tokens.json desatualizado: rode node scripts/design/gerarTokens.js'); process.exitCode = 1; }
    else console.log('tokens.json em dia');
  } else {
    fs.writeFileSync(SAIDA, novo, 'utf8');
    console.log('tokens.json gravado');
  }
}
module.exports = { extrair };
