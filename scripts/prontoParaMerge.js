/**
 * PRONTO PARA MERGE (ordem de 28/10/2026): npm run pronto-para-merge -- <número do PR>
 * 1) PR aberto, sem rascunho, sem conflito e com o commit igual ao remoto;
 * 2) pasta principal sem alteração que o checkout sobrescreveria (rastreados alterados ou não rastreados que o PR adiciona);
 * 3) worktree do branch: remove automaticamente se estiver limpo e igual ao remoto; se não, aponta o motivo.
 * Imprime PRONTO na última linha só quando tudo passa. Nunca usa --force, nunca faz merge.
 */
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { verificarAntesDaTroca } = require('./lib/colisoes');
const { worktreeDoBranch } = require('./lib/trocaBranch');
const { decidirRemoverWorktree } = require('./lib/worktreeLimpo');
const { avaliarProntoParaMerge } = require('./lib/prontoMerge');

const RAIZ = path.resolve(__dirname, '..');
const run = (cmd, a, cwd = RAIZ) => spawnSync(cmd, a, { cwd, encoding: 'utf8' });
const git = (...a) => run('git', a);
const linhas = (texto) => (texto || '').split('\n').map((l) => l.trim()).filter(Boolean);

function verificarPronto(pr, pastaPrincipal = RAIZ) {
  const v = run('gh', ['pr', 'view', pr, '--json', 'state,isDraft,mergeable,headRefName,headRefOid,files,title']);
  if (v.status !== 0) return { pronto: false, motivos: [`não consegui ler o PR #${pr}: ${(v.stderr || '').trim()}`] };
  const info = JSON.parse(v.stdout);
  git('fetch', '-q', 'origin', info.headRefName);
  const headRemoto = (git('rev-parse', `origin/${info.headRefName}`).stdout || '').trim();

  const porcelain = git('worktree', 'list', '--porcelain').stdout;
  const caminho = worktreeDoBranch(porcelain, info.headRefName, RAIZ);
  let worktree = { ok: true, motivo: '' };
  if (caminho) {
    const sujo = (run('git', ['status', '--porcelain'], caminho).stdout || '').trim() !== '';
    const headLocal = (run('git', ['rev-parse', 'HEAD'], caminho).stdout || '').trim();
    const dec = decidirRemoverWorktree({ caminho, arvoreLimpa: !sujo, headLocal, headRemoto });
    if (dec.remover) {
      const rm = git('worktree', 'remove', caminho);
      worktree = rm.status === 0 ? { ok: true, motivo: dec.motivo } : { ok: false, motivo: `não consegui remover ${caminho}: ${(rm.stderr || '').trim()}` };
      if (rm.status === 0) console.log(dec.motivo);
    } else {
      worktree = { ok: false, motivo: dec.motivo };
    }
  }

  const pre = verificarAntesDaTroca({
    rastreadosAlterados: linhas(run('git', ['diff', '--name-only'], pastaPrincipal).stdout),
    naoRastreadosLocais: linhas(run('git', ['ls-files', '--others', '--exclude-standard'], pastaPrincipal).stdout),
    arquivosDoPr: (info.files || []).map((f) => f.path),
  });
  return avaliarProntoParaMerge({ pr: info, headRemoto, pre, worktree });
}

if (require.main === module) {
  const pr = process.argv.slice(2).find((a) => /^\d+$/.test(a));
  if (!pr) { console.error('Uso: npm run pronto-para-merge -- <número do PR> [--pasta=<caminho da pasta principal>]'); process.exit(2); }
  const pasta = (process.argv.find((a) => a.startsWith('--pasta=')) || '').slice('--pasta='.length) || RAIZ;
  const r = verificarPronto(pr, pasta);
  if (r.pronto) {
    console.log(`PR #${pr}: checagens OK.`);
    console.log('PRONTO');
    process.exit(0);
  }
  console.log(`PR #${pr}: NÃO PRONTO`);
  for (const m of r.motivos) console.log(`- ${m}`);
  process.exit(1);
}

module.exports = { verificarPronto };
