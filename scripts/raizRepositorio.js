/**
 * Pasta principal do repositório, mesmo quando o comando roda numa worktree (ordem de 23/10/2026).
 * Arquivos ignorados pelo Git (.env, trava do portão) ficam só na pasta principal, então as worktrees apontam para ela.
 */
const { execFileSync } = require('node:child_process');
const path = require('node:path');

function raizPrincipal(cwd = __dirname) {
  try {
    const comum = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return path.dirname(comum);
  } catch {
    return path.resolve(cwd, '..');
  }
}

module.exports = { raizPrincipal };
