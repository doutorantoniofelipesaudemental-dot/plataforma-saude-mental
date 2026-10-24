/**
 * MERGE SEGURO (CLAUDE.md): único caminho para mesclar PR na main.
 *   npm run merge-seguro -- <número do PR>
 * 1) confere o PR (aberto, sem conflito); 2) roda o portão (npm run portao) sobre a branch do PR;
 * 3) SÓ se tudo passar: gh pr merge --merge; 4) confere o deploy de produção (GitHub Deployments + site HTTP 200);
 * 5) grava relatorios/rollback-pr<N>-AAAAMMDD-HHMM.md com o comando exato de reversão.
 * Reprovou: não mescla, mostra o motivo e volta à branch de origem.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { planejarTrocaBranch, worktreeDoBranch } = require('./lib/trocaBranch');

const RAIZ = path.resolve(__dirname, '..');
const SITE = 'https://www.drantoniofelipemedico.com.br/';
const pr = process.argv.slice(2).find((a) => /^\d+$/.test(a));
if (!pr) { console.error('Uso: npm run merge-seguro -- <número do PR>'); process.exit(2); }

const run = (cmd, a) => spawnSync(cmd, a, { cwd: RAIZ, encoding: 'utf8' });
const git = (...a) => run('git', a);
const gh = (...a) => run('gh', a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const p2 = (n) => String(n).padStart(2, '0');

let origem = '';
function sair(msg, cod = 1) {
  console.error(`\nMERGE NÃO REALIZADO: ${msg}`);
  if (origem && git('branch', '--show-current').stdout.trim() !== origem) git('switch', origem);
  process.exit(cod);
}

(async () => {
  const v = gh('pr', 'view', pr, '--json', 'state,headRefName,baseRefName,mergeable,title,isDraft');
  if (v.status !== 0) sair(`não consegui ler o PR #${pr}: ${v.stderr.trim()}`);
  const info = JSON.parse(v.stdout);
  if (info.state !== 'OPEN') sair(`PR #${pr} está ${info.state}.`);
  if (info.isDraft) sair(`PR #${pr} é rascunho.`);
  if (info.mergeable === 'CONFLICTING') sair(`PR #${pr} tem conflitos.`);
  console.log(`PR #${pr}: ${info.title} (${info.headRefName} → ${info.baseRefName})`);

  origem = git('branch', '--show-current').stdout.trim();
  git('fetch', 'origin', info.baseRefName, info.headRefName);
  // Decide antes de trocar: nunca força, nunca apaga commit (ver scripts/lib/trocaBranch.js).
  const destino = info.headRefName;
  const lista = (texto) => texto.split('\n').map((l) => l.trim()).filter(Boolean);
  const existeLocal = git('show-ref', '--verify', '--quiet', `refs/heads/${destino}`).status === 0;
  let localAdiantado = false;
  let localAtrasado = false;
  if (existeLocal) {
    const [soLocal, soRemoto] = git('rev-list', '--left-right', '--count', `${destino}...origin/${destino}`).stdout.trim().split(/\s+/).map(Number);
    localAdiantado = soLocal > 0;
    localAtrasado = soRemoto > 0;
  }
  const plano = planejarTrocaBranch({
    branchAtual: origem,
    worktreeDoDestino: worktreeDoBranch(git('worktree', 'list', '--porcelain').stdout, destino, RAIZ),
    destino,
    existeLocal,
    localAtrasadoDoRemoto: localAtrasado,
    localAdiantadoDoRemoto: localAdiantado,
    arquivosSujos: lista(git('status', '--porcelain', '--untracked-files=no').stdout).map((l) => l.slice(3)),
    arquivosDoDestino: lista(git('diff', '--name-only', 'HEAD', `origin/${destino}`).stdout),
  });
  if (plano.acao === 'parar') sair(plano.motivo);
  console.log(`Troca de branch: ${plano.motivo}`);
  if (origem !== destino) {
    const sw = plano.acao === 'criar'
      ? git('switch', '-c', destino, '--track', `origin/${destino}`)
      : git('switch', destino);
    if (sw.status !== 0) sair(`não consegui trocar para ${destino}: ${sw.stderr.trim()}`);
  }
  const ff = git('merge', '--ff-only', `origin/${destino}`);
  if (ff.status !== 0) sair(`não consegui alinhar ${destino} com origin/${destino}: ${ff.stderr.trim()}`);

  console.log(`\nRodando o portão sobre ${info.headRefName} (base origin/${info.baseRefName})...`);
  const p = spawnSync('npm', ['run', 'portao', '--', `--base=origin/${info.baseRefName}`], { cwd: RAIZ, encoding: 'utf8', shell: process.platform === 'win32' });
  // Log completo do portão (ordem do Dr. Antônio): mesmo conteúdo que aparece na tela, gravado em relatorios/logs/.
  const saida = `${p.stdout || ''}${p.stderr || ''}`;
  const dLog = new Date();
  const arqLog = path.join(RAIZ, 'relatorios', 'logs', `merge-seguro-pr${pr}-${dLog.getFullYear()}${p2(dLog.getMonth() + 1)}${p2(dLog.getDate())}-${p2(dLog.getHours())}${p2(dLog.getMinutes())}.log`);
  fs.mkdirSync(path.dirname(arqLog), { recursive: true });
  fs.writeFileSync(arqLog, saida, 'utf8');
  process.stdout.write(saida);
  console.log(`Log completo do portão: ${path.relative(RAIZ, arqLog)}`);
  if (p.status !== 0) sair(`o portão reprovou (ver relatorios/portao-*.md mais recente e ${path.relative(RAIZ, arqLog)}).`);

  const antes = gh('api', `repos/{owner}/{repo}/commits/${info.baseRefName}`, '--jq', '.sha').stdout.trim();
  const m = gh('pr', 'merge', pr, '--merge');
  if (m.status !== 0) sair(`gh pr merge falhou: ${(m.stderr || m.stdout).trim()}`);
  console.log(m.stdout.trim());
  const depois = gh('api', `repos/{owner}/{repo}/commits/${info.baseRefName}`, '--jq', '.sha').stdout.trim();

  // deploy de produção: espera até 8 min pelo status "success" do commit mesclado
  let deploy = 'não confirmado';
  for (let i = 0; i < 16; i += 1) {
    await sleep(30000);
    const d = gh('api', `repos/{owner}/{repo}/deployments?sha=${depois}&environment=Production`, '--jq', '.[0].id').stdout.trim();
    if (!d) continue;
    const s = gh('api', `repos/{owner}/{repo}/deployments/${d}/statuses`, '--jq', '.[0].state').stdout.trim();
    if (s === 'success') { deploy = 'success'; break; }
    if (s === 'failure' || s === 'error') { deploy = s; break; }
  }
  let http = 'sem resposta';
  try { http = String((await fetch(SITE, { redirect: 'follow' })).status); } catch (e) { http = e.message; }

  const d = new Date();
  const arq = path.join(RAIZ, 'relatorios', `rollback-pr${pr}-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.md`);
  fs.writeFileSync(arq, [
    `# Rollback do PR #${pr} — ${info.title}`, '',
    `- Mesclado em: ${d.toLocaleString('pt-BR')} · commit da main antes: \`${antes}\` · depois: \`${depois}\``,
    `- Deploy de produção: **${deploy}** · ${SITE} → HTTP ${http}`, '',
    '## Para desfazer', '',
    '1. Imediato (sem código): Vercel → Deployments → deploy anterior → "Promote to Production" (ou `request_rollback` pelo conector da Vercel).',
    `2. Em código: \`git switch -c reverter-pr${pr} origin/main && git revert -m 1 ${depois}\`, abrir PR e passar por \`npm run merge-seguro\`.`,
    '',
  ].join('\n'), 'utf8');
  console.log(`\nMERGE OK · deploy: ${deploy} · site HTTP ${http} · rollback gravado em ${path.relative(RAIZ, arq)}`);
  if (origem && origem !== info.headRefName) git('switch', origem);
  process.exit(deploy === 'success' && http === '200' ? 0 : 3);
})();
