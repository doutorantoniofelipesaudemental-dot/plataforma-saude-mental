/**
 * Permissões das rotinas em modo headless (claude -p), ordem de 20/10/2026.
 * Só ACRESCENTA regras necessárias em .claude/settings.json, com backup. Nunca Bash(*), nunca acesso ao .env.
 *   node docs/permissoes-headless/aplicar.js            mostra o que falta (não grava)
 *   node docs/permissoes-headless/aplicar.js --aplicar  grava, depois de copiar o settings.json para .claude/backups/
 * Já cobertas pelas regras atuais: Bash(npm run:*) e Bash(node:*). Por isso, neste momento, nada falta.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '../..');
const SETTINGS = path.join(RAIZ, '.claude', 'settings.json');
const NECESSARIAS = [
  'Bash(npm run:*)',
  'Bash(node:*)',
  'Bash(git status:*)',
  'Bash(git diff:*)',
  'Bash(gh pr create:*)',
];
const PROIBIDAS = ['Bash(*)', 'Read(./.env*)'];

// Função pura: devolve as regras necessárias que faltam, e recusa qualquer regra ampla demais.
function faltando(permitidas, necessarias = NECESSARIAS) {
  const erros = necessarias.filter((r) => PROIBIDAS.includes(r));
  if (erros.length) throw new Error(`regra proibida na lista: ${erros.join(', ')}`);
  return necessarias.filter((r) => !permitidas.includes(r));
}

function principal(aplicar) {
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const permitidas = (s.permissions && s.permissions.allow) || [];
  const falta = faltando(permitidas);
  if (!falta.length) { console.log('Nenhuma regra necessária falta. Nada a fazer.'); return 0; }
  console.log(`Faltam ${falta.length} regra(s):\n${falta.map((r) => `  + ${r}`).join('\n')}`);
  if (!aplicar) { console.log('Modo de checagem: nada foi gravado. Use --aplicar para acrescentar.'); return 0; }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(RAIZ, '.claude', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(SETTINGS, path.join(dir, `settings-${stamp}.json`));
  s.permissions.allow = [...permitidas, ...falta];
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n', 'utf8');
  console.log(`Gravado. Backup em .claude/backups/settings-${stamp}.json`);
  return 0;
}

if (require.main === module) process.exitCode = principal(process.argv.includes('--aplicar'));
module.exports = { faltando, NECESSARIAS, PROIBIDAS };
