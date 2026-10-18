#!/usr/bin/env node
/**
 * PreToolUse — SEGUNDA TRAVA (a primeira são as regras deny do settings.json). Lê o JSON do evento no stdin;
 * saída 2 + mensagem em stderr = chamada bloqueada. Só inspeciona o TEXTO da chamada (não enxerga o que um script faz por dentro).
 * Bloqueia: merge de PR fora do merge-seguro, push a partir da main, leitura/impressão do .env e de segredos,
 * alteração dos freios de publicação, DELETE em APIs de redes sociais, ScheduledTask que não seja DrSM-*,
 * e edição desta trava / do settings / dos arquivos de segredo.
 */
const { execFileSync } = require('node:child_process');

let entrada = '';
process.stdin.on('data', (d) => (entrada += d));
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(entrada); } catch { process.exit(0); }
  const ferramenta = ev.tool_name || '';
  const inp = ev.tool_input || {};
  const bloquear = (motivo) => { process.stderr.write(`BLOQUEADO pela trava de segurança: ${motivo}\n`); process.exit(2); };

  const ARQ_SEGREDO = /(^|[\\/])(\.env(\.(?!example$|sample$)[^\\/]*)?|client_secret[^\\/]*\.json|upload_r2\.py)$/i;
  const ARQ_TRAVA = /(^|[\\/])\.claude[\\/](settings(\.local)?\.json|hooks[\\/].*)$/i;

  if (/^(Read|Grep|Glob)$/.test(ferramenta)) {
    const alvo = String(inp.file_path || inp.path || inp.pattern || '');
    if (ARQ_SEGREDO.test(alvo)) bloquear(`leitura de arquivo de segredo (${alvo}).`);
    return process.exit(0);
  }

  if (/^(Write|Edit|NotebookEdit)$/.test(ferramenta)) {
    const alvo = String(inp.file_path || '');
    if (ARQ_SEGREDO.test(alvo)) bloquear(`gravação em arquivo de segredo/freio (${alvo}); alterar .env e freios só por ordem escrita do Dr. Antônio.`);
    if (ARQ_TRAVA.test(alvo)) bloquear(`a trava e o settings só mudam com aprovação do Dr. Antônio (${alvo}).`);
    const texto = String(inp.content || inp.new_string || '');
    if (/\.(js|mjs|cjs|ps1|sh|cmd|bat|py)$/i.test(alvo) && !/scripts[\\/]merge-seguro\.js$/.test(alvo)
      && (/gh\s+pr\s+merge|['"]pr['"]\s*,\s*['"]merge['"]|\/pulls\/\$?\{?\w+\}?\/merge/.test(texto))) bloquear('código que mescla PR fora de scripts/merge-seguro.js.');
    return process.exit(0);
  }

  if (!/^(Bash|PowerShell)$/.test(ferramenta)) process.exit(0);
  const cmd = String(inp.command || '');

  if (/gh\s+pr\s+merge|gh\s+api\b[^\n|;]*\/pulls\/\S+\/merge|['"]pr['"]\s*,\s*['"]merge['"]|Merge-PullRequest/i.test(cmd)) bloquear('merge de PR só por `npm run merge-seguro -- <PR>`.');

  if (/\bgit\s+push\b/i.test(cmd)) {
    let atual = '';
    try { atual = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(); } catch { /* sem git */ }
    if (/\b(main|master)\b/.test(cmd) || /^(main|master)$/.test(atual)) bloquear('push para/da main: a main só recebe código pelo merge-seguro.');
  }

  const LE = /\b(cat|type|more|less|head|tail|bat|sed|awk|grep|egrep|rg|Get-Content|gc|Select-String|sls|xxd|od|strings|cp|copy|Copy-Item|mv|move|source|iex|Import-Csv|Out-String)\b/i;
  if (LE.test(cmd) && /(^|[\s"'\\/])(\.env(\.(?!example\b|sample\b)[A-Za-z]+)?|client_secret[\w.-]*\.json)(?=$|[\s"';|&)])/.test(cmd)) bloquear('leitura de .env / client_secret.json.');
  if (/\bvercel\s+env\s+(pull|rm|add|update)\b/i.test(cmd)) bloquear('`vercel env pull/rm/add/update` expõe ou muda segredos e freios.');
  if (/(^|[;&|]\s*)(printenv|env|set)\s*($|[|;&])|Get-ChildItem\s+(env:|Env:)|\b(dir|ls|gci)\s+env:/i.test(cmd)) bloquear('listagem do ambiente imprime segredos.');
  if (/\b(echo|printf|Write-Output|Write-Host)\b[^\n|;]*(\$env:|\$\{?)\w*(KEY|TOKEN|SECRET|PASSWORD|URI)/i.test(cmd)) bloquear('impressão de variável secreta.');

  if (/(REDES|YOUTUBE|LINKEDIN)_PUBLICACAO_ATIVA/.test(cmd) && /(vercel\s+env|setx\b|\$env:\w+\s*=|\bexport\b|Set-Item|=\s*(true|false|0|1)\b|>>?\s|sed\s+-i)/i.test(cmd)) bloquear('mudar freios de publicação só por ordem escrita do Dr. Antônio.');

  if ((/-X\s*DELETE|--request\s+DELETE|-Method\s+Delete/i.test(cmd) && /(graph\.facebook|graph\.instagram|googleapis\.com|youtube|linkedin)/i.test(cmd))
    || /\b(apagar|excluir|deletar|delete|remover)[-_]?(post|video|publicacao|publicação|youtube|linkedin|instagram)/i.test(cmd)) bloquear('apagar posts/vídeos nas redes é proibido.');

  if (/\b(Enable|Disable|Start|Stop|Unregister|Register|Set)-ScheduledTask\b/i.test(cmd) && !/DrSM-/.test(cmd)) bloquear('só as tarefas DrSM-* podem ser alteradas.');
  if (/\b(Unregister|Register|Set)-ScheduledTask\b|\bschtasks\b[^\n]*\/(delete|create|change)/i.test(cmd)) bloquear('criar/remover/alterar tarefas agendadas só com aprovação (use Enable/Disable/Start).');

  process.exit(0);
});
