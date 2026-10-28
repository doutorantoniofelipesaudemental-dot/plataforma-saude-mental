/**
 * Checagem de sincronia antes do portão (lição de 23/10/2026): o portão precisa rodar sobre o código que vai para o PR.
 * Regra (ordem de 28/10/2026): bloqueia só se a branch local está ATRÁS do remoto ou DIVERGIU dele.
 * Estar À FRENTE (commits novos ainda não enviados) é o estado normal antes de um push, e passa.
 */
const { spawnSync } = require('node:child_process');

// Função pura: decide pela relação entre o commit local e o remoto.
// relacao: 'igual' | 'a-frente' | 'atras' | 'divergente'. Remoto ausente (branch nova) não bloqueia.
function decidirSincronia({ local, remoto, relacao = local === remoto ? 'igual' : 'atras' }) {
  if (!remoto) return { ok: true, motivo: 'branch ainda sem remoto' };
  if (!local) return { ok: false, motivo: 'não consegui ler o commit local' };
  if (relacao === 'igual') return { ok: true, motivo: 'local e remoto no mesmo commit' };
  if (relacao === 'a-frente') return { ok: true, motivo: `local ${local.slice(0, 7)} está à frente do remoto ${remoto.slice(0, 7)} (commits novos ainda não enviados)` };
  if (relacao === 'atras') return { ok: false, motivo: `branch local ${local.slice(0, 7)} está desatualizada: atrás do remoto ${remoto.slice(0, 7)}. Rode git pull --ff-only e depois o portão. Se o remoto for o correto: git branch -f <branch> origin/<branch>.` };
  return { ok: false, motivo: `branch local ${local.slice(0, 7)} DIVERGIU do remoto ${remoto.slice(0, 7)}: resolva antes (git pull ou rebase) e rode o portão de novo.` };
}

// Função pura: a relação a partir de "o remoto é antepassado do local" e "o local é antepassado do remoto".
function relacaoEntre({ local, remoto, remotoEhAntepassadoDoLocal, localEhAntepassadoDoRemoto }) {
  if (local === remoto) return 'igual';
  if (remotoEhAntepassadoDoLocal) return 'a-frente';
  if (localEhAntepassadoDoRemoto) return 'atras';
  return 'divergente';
}

// Só compara com origin/<mesmo nome>. Upstream de outra branch (ex.: origin/main, em worktree criada a partir dela) não conta.
function remotoDaMesmaBranch(nome, upstream) {
  return nome && nome !== 'HEAD' && upstream === 'origin/' + nome ? upstream : null;
}

function lerSincronia(raiz) {
  const git = (...a) => spawnSync('git', a, { cwd: raiz, encoding: 'utf8' });
  const local = (git('rev-parse', 'HEAD').stdout || '').trim();
  const nome = (git('rev-parse', '--abbrev-ref', 'HEAD').stdout || '').trim();
  const up = git('rev-parse', '--abbrev-ref', '@{u}');
  const ref = remotoDaMesmaBranch(nome, up.status === 0 ? (up.stdout || '').trim() : null);
  const remoto = ref ? (git('rev-parse', ref).stdout || '').trim() || null : null;
  if (!remoto || !local) return decidirSincronia({ local, remoto, relacao: 'divergente' });
  const antepassado = (a, b) => git('merge-base', '--is-ancestor', a, b).status === 0;
  const relacao = relacaoEntre({
    local,
    remoto,
    remotoEhAntepassadoDoLocal: antepassado(remoto, local),
    localEhAntepassadoDoRemoto: antepassado(local, remoto),
  });
  return decidirSincronia({ local, remoto, relacao });
}

module.exports = { decidirSincronia, relacaoEntre, lerSincronia, remotoDaMesmaBranch };
