/**
 * Permissões das rotinas em modo headless (claude -p), ordem de 20/10/2026.
 *  - Acrescenta regras necessárias em allow, nunca Bash(*), nunca acesso ao .env.
 *  - Troca as regras de negação Write(...) por Edit(...), porque a ferramenta só reconhece Edit(...) (ordem de 20/10, noite).
 *   node docs/permissoes-headless/aplicar.js            mostra o que faltaria e o diff das negações (não grava)
 *   node docs/permissoes-headless/aplicar.js --aplicar  mostra o diff e pede confirmação; grava com backup em .claude/backups/
 */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

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

// Função pura: troca Write(X) por Edit(X) nas negações. Não duplica: se Edit(X) já existe, só remove Write(X).
function trocarWritePorEdit(negacoes) {
  const out = [];
  for (const r of negacoes) {
    const m = /^Write\((.*)\)$/.exec(r);
    if (!m) { if (!out.includes(r)) out.push(r); continue; }
    const edit = `Edit(${m[1]})`;
    if (!out.includes(edit) && !negacoes.includes(edit)) out.push(edit);
  }
  return out;
}

// Diff simples (linhas removidas e acrescentadas), para mostrar na tela antes de gravar.
function diff(antes, depois) {
  const sai = antes.filter((r) => !depois.includes(r)).map((r) => `  - ${r}`);
  const entra = depois.filter((r) => !antes.includes(r)).map((r) => `  + ${r}`);
  return [...sai, ...entra];
}

function perguntar(texto) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(texto, (r) => { rl.close(); resolve(/^s(im)?$/i.test(r.trim())); });
  });
}

async function principal(aplicar) {
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const permitidas = (s.permissions && s.permissions.allow) || [];
  const negacoesAntes = (s.permissions && s.permissions.deny) || [];
  const falta = faltando(permitidas);
  const negacoesDepois = trocarWritePorEdit(negacoesAntes);
  const linhas = diff(negacoesAntes, negacoesDepois);
  console.log(falta.length ? `Faltam ${falta.length} regra(s) de permissão:\n${falta.map((r) => `  + ${r}`).join('\n')}` : 'Nenhuma regra de permissão falta.');
  console.log(linhas.length ? `Negações (deny) a trocar:\n${linhas.join('\n')}` : 'Negações já estão com Edit(...) (nada a trocar).');
  if (!falta.length && !linhas.length) return 0;
  if (!aplicar) { console.log('Modo de checagem: nada foi gravado. Use --aplicar para ver o diff e confirmar.'); return 0; }
  if (!(await perguntar('Confirmar a gravação? (sim/não) '))) { console.log('Cancelado. Nada foi gravado.'); return 0; }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(RAIZ, '.claude', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const backup = path.join(dir, `settings-${stamp}.json`);
  fs.copyFileSync(SETTINGS, backup);
  s.permissions.allow = [...permitidas, ...falta];
  s.permissions.deny = negacoesDepois;
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2) + '\n', 'utf8');
  console.log(`Gravado. Backup: .claude/backups/settings-${stamp}.json`);
  return 0;
}

if (require.main === module) principal(process.argv.includes('--aplicar')).then((c) => { process.exitCode = c; });
module.exports = { faltando, trocarWritePorEdit, diff, NECESSARIAS, PROIBIDAS };
