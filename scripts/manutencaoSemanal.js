/**
 * Manutenção semanal (ordem de 20/10/2026). Duas etapas, em tarefas separadas do Agendador do Windows:
 *   segunda 11:00:  node scripts/manutencaoSemanal.js --segunda   → cria o branch chore/manutencao-AAAAMMDD e roda o portão
 *   sexta 11:00:    node scripts/manutencaoSemanal.js --sexta     → faz push do branch (nunca da main) e abre o PR
 * O merge é sempre do Dr. Antônio (merge-seguro). Nunca usa force, nunca apaga branch remota, nunca mescla.
 */
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const PREFIXO = 'chore/manutencao-';
// estado que a automação reescreve a todo momento e que continua versionado (decisão de 20/10): não bloqueia nem entra no commit
const ESTADO_ROTINEIRO = ['relatorios/linkedin/fila.json'];

// Função pura: nome do branch da semana (AAAAMMDD da segunda).
function nomeDoBranch(dataISO) {
  return `${PREFIXO}${String(dataISO).replace(/-/g, '')}`;
}

// Função pura: decide se a etapa pode rodar. Recusa a main, branch fora do padrão e árvore suja (exceto estados ignorados pelo Git).
function podeSeguir({ branchAtual, alteracoes = [], etapa }) {
  if (etapa === 'sexta' && (branchAtual === 'main' || branchAtual === 'master')) return { ok: false, motivo: 'estou na main: a sexta nunca envia a main' };
  if (etapa === 'sexta' && !String(branchAtual).startsWith(PREFIXO)) return { ok: false, motivo: `o branch atual não é de manutenção (${branchAtual})` };
  if (etapa === 'segunda' && alteracoes.length) return { ok: false, motivo: `árvore com alterações não commitadas: ${alteracoes.slice(0, 3).join(', ')}` };
  return { ok: true };
}

function git(args) { return spawnSync('git', args, { cwd: RAIZ, encoding: 'utf8' }); }
function branchAtual() { return git(['branch', '--show-current']).stdout.trim(); }
function alteracoes() { return git(['status', '--porcelain']).stdout.split(/\r?\n/).filter(Boolean).map((l) => l.slice(3)).filter((f) => !ESTADO_ROTINEIRO.includes(f)); }

if (require.main === module) {
  const diaSemana = new Date(Date.now() - 3 * 3600e3).getUTCDay(); // dia em Salvador
  const porDia = diaSemana === 1 ? 'segunda' : diaSemana === 5 ? 'sexta' : null;
  const etapa = process.argv.includes('--sexta') ? 'sexta' : process.argv.includes('--segunda') ? 'segunda' : process.argv.includes('--auto') ? porDia : null;
  if (!etapa) { console.log('use --segunda, --sexta ou --auto (segunda e sexta)'); process.exitCode = process.argv.includes('--auto') ? 0 : 2; }
  else {
    const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    const b = nomeDoBranch(hoje);
    const atual = branchAtual();
    const p = podeSeguir({ branchAtual: atual, alteracoes: alteracoes(), etapa });
    if (!p.ok) { console.log(`PARADO: ${p.motivo}`); process.exitCode = 1; }
    else if (etapa === 'segunda') {
      const cria = git(['checkout', '-b', b, 'origin/main']);
      if (cria.status !== 0) { console.log(`falha ao criar ${b}: ${cria.stderr.trim()}`); process.exitCode = 1; }
      else {
        // manutenção pela skill (uma chamada do claude -p, dentro do teto), depois o portão. Sem push e sem merge.
        const cons = require('./consumoClaude');
        const teto = cons.podeChamarClaude({ agora: new Date() });
        if (!teto.pode) { console.log(`manutenção não rodou: ${teto.motivo}`); process.exitCode = 1; }
        else {
          const prompt = 'Rode a skill manutencao (auditoria, rotina semanal e checagens). Não faça push, não abra PR e não faça merge. Grave o resultado em relatorios/manutencao-semanal.md. Termine com a linha STATUS: OK ou STATUS: PARAR <motivo>.';
          const r = spawnSync('claude', ['-p'], { cwd: RAIZ, input: prompt, encoding: 'utf8', shell: true, timeout: 900000 });
          cons.registrarChamada({ agora: new Date(), origem: 'manutencaoSemanal' });
          const portao = spawnSync('npm', ['run', 'portao'], { cwd: RAIZ, encoding: 'utf8', shell: true, timeout: 900000 });
          const passou = portao.status === 0;
          if (passou && alteracoes().length) { git(['add', '-A', '--', '.', ...ESTADO_ROTINEIRO.map((f) => ':!' + f)]); git(['commit', '-m', `chore: manutenção semanal ${hoje}`]); }
          console.log(`branch ${b}: manutenção ${(r.stdout || '').includes('STATUS: OK') ? 'OK' : 'SEM STATUS OK'}; portão ${passou ? 'APROVADO' : 'REPROVADO'}. Nada foi enviado.`);
          process.exitCode = passou ? 0 : 1;
        }
      }
    } else {
      const envia = git(['push', '-u', 'origin', atual]); // nunca main: a checagem acima já recusa a main
      console.log(envia.status === 0 ? `branch ${atual} enviado` : `falha no push: ${envia.stderr.trim()}`);
      process.exitCode = envia.status === 0 ? 0 : 1;
    }
  }
}

module.exports = { nomeDoBranch, podeSeguir, PREFIXO };
