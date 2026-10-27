/**
 * Manutenção semanal (ordem de 20/10/2026). Duas etapas, em tarefas separadas do Agendador do Windows:
 *   segunda 11:00:  node scripts/manutencaoSemanal.js --segunda   → cria o branch chore/manutencao-AAAAMMDD numa worktree própria (a partir de origin/main) e roda o portão
 *   sexta 11:00:    node scripts/manutencaoSemanal.js --sexta     → faz push do branch (nunca da main) e abre o PR
 * O merge é sempre do Dr. Antônio (merge-seguro). Nunca usa force, nunca apaga branch remota, nunca mescla.
 * A worktree isola a segunda das alterações da pasta principal (árvore suja não bloqueia mais a tarefa).
 */
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const PREFIXO = 'chore/manutencao-';
// estado que a automação reescreve a todo momento e que continua versionado (decisão de 20/10): não entra no commit
const ESTADO_ROTINEIRO = ['relatorios/linkedin/fila.json'];

// Função pura: nome do branch da semana (AAAAMMDD da segunda).
function nomeDoBranch(dataISO) {
  return `${PREFIXO}${String(dataISO).replace(/-/g, '')}`;
}

// Função pura: decide se a etapa pode rodar. Recusa a main e branch fora do padrão na sexta.
// Na segunda não olha a árvore: a etapa roda numa worktree própria, a partir de origin/main.
function podeSeguir({ branchAtual, etapa }) {
  if (etapa === 'sexta' && (branchAtual === 'main' || branchAtual === 'master')) return { ok: false, motivo: 'estou na main: a sexta nunca envia a main' };
  if (etapa === 'sexta' && !String(branchAtual).startsWith(PREFIXO)) return { ok: false, motivo: `o branch atual não é de manutenção (${branchAtual})` };
  return { ok: true };
}

function git(args, cwd = RAIZ) { return spawnSync('git', args, { cwd, encoding: 'utf8' }); }
function alteracoes(cwd = RAIZ) { return git(['status', '--porcelain'], cwd).stdout.split(/\r?\n/).filter(Boolean).map((l) => l.slice(3)).filter((f) => !ESTADO_ROTINEIRO.includes(f)); }
function ultimoBranchDeManutencao() {
  const lista = git(['branch', '--list', `${PREFIXO}*`, '--format=%(refname:short)']).stdout.split(/\r?\n/).filter(Boolean).sort();
  return lista[lista.length - 1] || '';
}

if (require.main === module) {
  const diaSemana = new Date(Date.now() - 3 * 3600e3).getUTCDay(); // dia em Salvador
  const porDia = diaSemana === 1 ? 'segunda' : diaSemana === 5 ? 'sexta' : null;
  const etapa = process.argv.includes('--sexta') ? 'sexta' : process.argv.includes('--segunda') ? 'segunda' : process.argv.includes('--auto') ? porDia : null;
  if (!etapa) { console.log('use --segunda, --sexta ou --auto (segunda e sexta)'); process.exitCode = process.argv.includes('--auto') ? 0 : 2; }
  else if (etapa === 'segunda') {
    const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    const b = nomeDoBranch(hoje);
    const dir = path.resolve(RAIZ, '..', `DRS-manut-${hoje.replace(/-/g, '')}`);
    const cria = git(['worktree', 'add', '-b', b, dir, 'origin/main']);
    if (cria.status !== 0) { console.log(`PARADO: falha ao criar a worktree ${dir}: ${cria.stderr.trim()}`); process.exitCode = 1; }
    else {
      // manutenção pela skill (uma chamada do claude -p, dentro do teto), depois o portão. Sem push e sem merge.
      const cons = require('./consumoClaude');
      const teto = cons.podeChamarClaude({ agora: new Date() });
      if (!teto.pode) { console.log(`manutenção não rodou: ${teto.motivo}`); process.exitCode = 1; }
      else {
        // worktree nova não tem node_modules: instala antes do portão (raiz e app)
        spawnSync('npm', ['ci'], { cwd: dir, encoding: 'utf8', shell: true, timeout: 900000 });
        spawnSync('npm', ['ci', '--prefix', 'apps/plataforma-saude-mental'], { cwd: dir, encoding: 'utf8', shell: true, timeout: 900000 });
        const prompt = 'Rode a skill manutencao (auditoria, rotina semanal e checagens). Não faça push, não abra PR e não faça merge. Grave o resultado em relatorios/manutencao-semanal.md. Termine com a linha STATUS: OK ou STATUS: PARAR <motivo>.';
        const r = spawnSync('claude', ['-p'], { cwd: dir, input: prompt, encoding: 'utf8', shell: true, timeout: 900000 });
        cons.registrarChamada({ agora: new Date(), origem: 'manutencaoSemanal' });
        const portao = spawnSync('npm', ['run', 'portao'], { cwd: dir, encoding: 'utf8', shell: true, timeout: 900000 });
        const passou = portao.status === 0;
        if (passou && alteracoes(dir).length) { git(['add', '-A', '--', '.', ...ESTADO_ROTINEIRO.map((f) => ':!' + f)], dir); git(['commit', '-m', `chore: manutenção semanal ${hoje}`], dir); }
        console.log(`branch ${b} (${dir}): manutenção ${(r.stdout || '').includes('STATUS: OK') ? 'OK' : 'SEM STATUS OK'}; portão ${passou ? 'APROVADO' : 'REPROVADO'}. Nada foi enviado.`);
        process.exitCode = passou ? 0 : 1;
      }
    }
  } else {
    // sexta: envia o branch de manutenção mais recente pelo nome; não depende do que está checado na pasta principal
    const atual = ultimoBranchDeManutencao();
    const p = podeSeguir({ branchAtual: atual, etapa });
    if (!p.ok) { console.log(`PARADO: ${p.motivo}`); process.exitCode = 1; }
    else {
      const envia = git(['push', '-u', 'origin', atual]); // nunca main: o prefixo já recusa a main
      console.log(envia.status === 0 ? `branch ${atual} enviado` : `falha no push: ${envia.stderr.trim()}`);
      process.exitCode = envia.status === 0 ? 0 : 1;
    }
  }
}

module.exports = { nomeDoBranch, podeSeguir, PREFIXO };
