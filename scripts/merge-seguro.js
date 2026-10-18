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
  if (origem !== info.headRefName) {
    const sw = git('switch', info.headRefName);
    if (sw.status !== 0) {
      const co = git('switch', '-c', info.headRefName, '--track', `origin/${info.headRefName}`);
      if (co.status !== 0) sair(`não consegui trocar para ${info.headRefName} (árvore de trabalho com alterações em conflito?): ${(co.stderr || sw.stderr).trim()}`);
    }
  }
  git('merge', '--ff-only', `origin/${info.headRefName}`);

  console.log(`\nRodando o portão sobre ${info.headRefName} (base origin/${info.baseRefName})...`);
  const p = spawnSync('npm', ['run', 'portao', '--', `--base=origin/${info.baseRefName}`], { cwd: RAIZ, stdio: 'inherit', shell: process.platform === 'win32' });
  if (p.status !== 0) sair('o portão reprovou (ver relatorios/portao-*.md mais recente).');

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
