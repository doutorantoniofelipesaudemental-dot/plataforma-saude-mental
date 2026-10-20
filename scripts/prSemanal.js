/**
 * PR semanal (sexta 11:00; tarefa DrSM-PR-Semanal, criada DESATIVADA). SÓ PREPARA: não faz push, não abre PR, não faz merge.
 * Reúne os commits do branch atual em relação à main, roda o portão completo e grava relatorios/PR-SEMANAL.md
 * com os comandos "!" de uma linha (push, gh pr create, merge-seguro).
 *   node scripts/prSemanal.js            roda o portão e grava o relatório
 *   node scripts/prSemanal.js --simular  só mostra os commits e os comandos (não roda o portão, não grava)
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const SAIDA = path.join(RAIZ, 'relatorios/PR-SEMANAL.md');
const LIMITE_LINHAS = 30;

// Função pura: uma linha de "git log --oneline" por commit.
const parseCommits = (texto) => String(texto).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

// Função pura: comandos "!" de uma linha cada, com barras normais.
function comandos(branch) {
  return [
    `! git push -u origin ${branch}`,
    `! gh pr create --base main --head ${branch} --title "PR semanal: ${branch}" --body "Portão completo aprovado. Ver relatorios/. 🤖 Generated with [Claude Code](https://claude.com/claude-code)"`,
    '! npm run merge-seguro -- NÚMERO_DO_PR',
  ];
}

// Função pura: relatório com no máximo LIMITE_LINHAS linhas.
function montarRelatorio({ branch, commits, portao, simular }) {
  const linhas = [
    `# PR semanal — ${branch}`,
    `Modo: ${simular ? 'SIMULAÇÃO (portão não rodado)' : 'portão completo'} · commits: ${commits.length}`,
    '',
    '## Commits (em relação à main)',
    ...(commits.length ? commits.slice(0, 10).map((c) => `- ${c}`) : ['- nenhum commit novo']),
    ...(commits.length > 10 ? [`- … e mais ${commits.length - 10}`] : []),
    '',
    `## Portão: ${portao}`,
    '',
    '## Comandos para o Dr. Antônio',
    ...comandos(branch),
  ];
  return `${linhas.slice(0, LIMITE_LINHAS).join('\n')}\n`;
}

function listarCommits(branch) {
  const r = spawnSync('git', ['log', '--oneline', `main..${branch}`], { cwd: RAIZ, encoding: 'utf8' });
  return r.status === 0 ? parseCommits(r.stdout) : [];
}

function branchAtual() {
  const r = spawnSync('git', ['branch', '--show-current'], { cwd: RAIZ, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}

module.exports = { parseCommits, comandos, montarRelatorio, LIMITE_LINHAS };

if (require.main === module) {
  const simular = process.argv.includes('--simular');
  const branch = branchAtual() || 'desconhecido';
  const commits = listarCommits(branch);
  let portao = 'não rodado (simulação)';
  if (!simular) {
    const r = spawnSync('npm', ['run', 'portao'], { cwd: RAIZ, encoding: 'utf8', shell: true, timeout: 2400000 });
    portao = r.status === 0 ? 'APROVADO' : `REPROVADO (código ${r.status})`;
    fs.writeFileSync(SAIDA, montarRelatorio({ branch, commits, portao, simular }), 'utf8');
  }
  console.log(montarRelatorio({ branch, commits, portao, simular }));
}
