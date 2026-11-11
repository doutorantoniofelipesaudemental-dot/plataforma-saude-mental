/**
 * Tokens de design (ordem de 10/11/2026, item A2). Fonte: docs/tokens.json, gerado de docs/DESIGN.md
 * por scripts/design/gerarTokens.js. Quem lê: arteEditorial.js, checagemArte.js e o teste de design-tokens.
 */
const fs = require('node:fs');
const path = require('node:path');
const CAMINHO = path.resolve(__dirname, '../../../docs/tokens.json');
const TOKENS = JSON.parse(fs.readFileSync(CAMINHO, 'utf8'));
module.exports = { TOKENS, CAMINHO };
