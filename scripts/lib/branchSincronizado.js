/**
 * Checagem de sincronia antes do portão (lição de 23/10/2026): a branch local precisa apontar para o mesmo commit
 * do remoto. Sem isso, o portão roda código velho e aprova (ou reprova) o que não é o que vai para o PR.
 */
const { spawnSync } = require('node:child_process');

// Função pura: decide pela duas referências. Remoto ausente (branch nova) não bloqueia.
function decidirSincronia({ local, remoto }) {
  if (!remoto) return { ok: true, motivo: 'branch ainda sem remoto' };
  if (!local) return { ok: false, motivo: 'não consegui ler o commit local' };
  if (local === remoto) return { ok: true, motivo: 'local e remoto no mesmo commit' };
  return { ok: false, motivo: `branch local ${local.slice(0, 7)} ≠ remoto ${remoto.slice(0, 7)}: a branch local está desatualizada. Use git branch -f <branch> origin/<branch> (se o remoto for o correto) e rode de novo.` };
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
  return decidirSincronia({ local, remoto });
}

module.exports = { decidirSincronia, lerSincronia, remotoDaMesmaBranch };
