// Uso: node parseGerar.js <log> ok|falhou  -> imprime slugs separados por vírgula
const fs = require('node:fs');
const [, , arq, modo] = process.argv;
const linhas = fs.readFileSync(arq, 'utf8').split('\n').filter((l) => /^\s*\[\d+\/\d+\]/.test(l));
const slug = (l) => (l.match(/^\s*\[\d+\/\d+\]\s+(\S+)/) || [])[1];
const falhou = linhas.filter((l) => /FALHOU/.test(l)).map(slug);
const ok = linhas.filter((l) => !/FALHOU/.test(l)).map(slug);
console.log((modo === 'ok' ? ok : falhou).join(','));
