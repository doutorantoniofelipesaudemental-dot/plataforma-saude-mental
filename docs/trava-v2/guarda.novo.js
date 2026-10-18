#!/usr/bin/env node
/**
 * PreToolUse — SEGUNDA TRAVA (a primeira são as regras deny do settings.json). Lê o JSON do evento no stdin;
 * saída 2 + mensagem em stderr = chamada bloqueada. Só inspeciona o TEXTO da chamada (não enxerga o que um script faz por dentro).
 * v2 (17/10/2026): a análise é por COMANDO (o texto é dividido em segmentos por && || ; | e quebra de linha, respeitando aspas),
 * então menções a "main", ".env" ou ao merge dentro de aspas, de outro comando ou de um texto não bloqueiam.
 *   - merge de PR pelo gh: bloqueado só quando um comando COMEÇA com o subcomando de merge (o merge-seguro roda o gh por dentro do script);
 *   - .env / client_secret: bloqueado só quando um comando de leitura (cat, type, Get-Content, grep, sed, cp...) recebe o arquivo como ARGUMENTO;
 *   - push: bloqueado só quando o DESTINO é main/master (ou push sem destino estando na main); o --base do gh pr create passa.
 * Também bloqueia: vercel env pull/rm/add/update, listar o ambiente, mudar os freios, DELETE nas redes, ScheduledTask fora de DrSM-*,
 * e edição desta trava / do settings / dos arquivos de segredo.
 */
const { execFileSync } = require('node:child_process');

/** Divide o comando em segmentos de tokens: [{ palavra, quoted }]. Operadores fora de aspas encerram o segmento. */
function segmentos(cmd) {
  const segs = []; let tokens = []; let atual = ''; let temAtual = false; let aspa = null; let quoted = false;
  const fimToken = () => { if (temAtual) tokens.push({ palavra: atual, quoted }); atual = ''; temAtual = false; quoted = false; };
  const fimSeg = () => { fimToken(); if (tokens.length) segs.push(tokens); tokens = []; };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (aspa) { if (c === aspa) aspa = null; else if (c === '\\' && aspa === '"' && i + 1 < cmd.length) { atual += cmd[++i]; } else atual += c; continue; }
    if (c === '"' || c === "'") { aspa = c; quoted = true; temAtual = true; continue; }
    if (c === ';' || c === '|' || c === '&' || c === '\n' || c === '\r' || c === '(' || c === ')') { fimSeg(); continue; }
    if (/\s/.test(c)) { fimToken(); continue; }
    atual += c; temAtual = true;
  }
  fimSeg();
  return segs;
}
const ehAtribuicao = (t) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(t.palavra) && !t.quoted;
/** Remove prefixos VAR=valor, `env`, `sudo`, `command`, `call`, `time`, `nohup` e devolve [comando, ...argumentos] como strings. */
function comandoDe(seg) {
  let i = 0;
  while (i < seg.length && (ehAtribuicao(seg[i]) || /^(env|sudo|command|call|time|nohup)$/i.test(seg[i].palavra))) i++;
  return seg.slice(i).map((t) => t.palavra);
}

const LEITORES = /^(cat|type|more|less|head|tail|bat|sed|awk|grep|egrep|fgrep|rg|get-content|gc|select-string|sls|xxd|od|strings|cp|copy|copy-item|mv|move|source|\.|iex|import-csv|out-string)$/i;
const ALVO_SEGREDO = /^(?:.*[\\/])?(\.env(?:\.(?!example$|sample$)[A-Za-z0-9_-]+)?|client_secret[\w.-]*\.json)$/i;
const ARQ_SEGREDO = /(^|[\\/])(\.env(\.(?!example$|sample$)[^\\/]*)?|client_secret[^\\/]*\.json|upload_r2\.py)$/i;
const ARQ_TRAVA = /(^|[\\/])\.claude[\\/](settings(\.local)?\.json|hooks[\\/].*)$/i;

let entrada = '';
process.stdin.on('data', (d) => (entrada += d));
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(entrada); } catch { process.exit(0); }
  const ferramenta = ev.tool_name || '';
  const inp = ev.tool_input || {};
  const bloquear = (motivo) => { process.stderr.write(`BLOQUEADO pela trava de segurança: ${motivo}\n`); process.exit(2); };

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

  let atual = null;
  const branchAtual = () => { if (atual === null) { try { atual = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(); } catch { atual = ''; } } return atual; };

  for (const seg of segmentos(cmd)) {
    const [prog = '', ...args] = comandoDe(seg);
    const p = prog.toLowerCase();
    const resto = args.join(' ');
    const linha = seg.map((t) => t.palavra).join(' ');

    // 1) merge de PR: só quando o comando COMEÇA com o subcomando de merge do gh (ou a API/cmdlet equivalente)
    if (p === 'gh' && /^pr\s+merge\b/i.test(resto)) bloquear('merge de PR só por `npm run merge-seguro -- <PR>`.');
    if (p === 'gh' && /^api\b/i.test(resto) && /\/pulls\/\S+\/merge/i.test(resto)) bloquear('merge de PR pela API só por `npm run merge-seguro`.');
    if (p === 'merge-pullrequest') bloquear('merge de PR só por `npm run merge-seguro`.');

    // 2) push: só o DESTINO conta
    const iPush = p === 'git' ? args.findIndex((x) => /^push$/i.test(x)) : -1;
    if (iPush >= 0) {
      const a = args.slice(iPush + 1).filter((x) => x !== '--');
      const refspecs = a.filter((x) => !x.startsWith('-')).slice(1);   // [remote, refspec...] -> só os refspecs
      const destinos = refspecs.map((r) => r.replace(/^\+/, '').split(':').pop().replace(/^refs\/heads\//, ''));
      if (destinos.some((d) => /^(main|master)$/.test(d))) bloquear('push com destino main/master: a main só recebe código pelo merge-seguro.');
      if (!refspecs.length && /^(main|master)$/.test(branchAtual())) bloquear('push estando na main: a main só recebe código pelo merge-seguro.');
      if (a.some((x) => /^--(force|force-with-lease|delete|mirror)$/.test(x) || x === '-f')) bloquear('push forçado/delete/mirror é proibido.');
    }

    // 3) leitura do .env / client_secret: comando de leitura com o arquivo como ARGUMENTO
    if (LEITORES.test(prog) && args.some((x) => ALVO_SEGREDO.test(x))) bloquear('leitura de .env / client_secret.json.');
    if (p === 'vercel' && /^env\s+(pull|rm|add|update)\b/i.test(resto)) bloquear('`vercel env pull/rm/add/update` expõe ou muda segredos e freios.');
    if (/^(printenv|env|set)$/i.test(prog) && !args.length) bloquear('listagem do ambiente imprime segredos.');
    if (/^(get-childitem|dir|ls|gci)$/i.test(prog) && args.some((x) => /^env:/i.test(x))) bloquear('listagem do ambiente imprime segredos.');
    if (/^(echo|printf|write-output|write-host)$/i.test(prog) && /(\$env:|\$\{?)\w*(KEY|TOKEN|SECRET|PASSWORD|URI)/i.test(resto)) bloquear('impressão de variável secreta.');

    // 4) freios de publicação
    if (/(REDES|YOUTUBE|LINKEDIN)_PUBLICACAO_ATIVA/.test(linha)
      && (p === 'setx' || p === 'export' || p === 'set-item' || (p === 'vercel' && /^env\b/i.test(resto)) || seg.some(ehAtribuicao) || /^\$env:\w+\s*=/.test(linha) || /^\$env:\w+$/i.test(prog))) {
      bloquear('mudar freios de publicação só por ordem escrita do Dr. Antônio.');
    }

    // 5) DELETE em API de rede social
    if (/^(curl|curl\.exe|invoke-restmethod|irm|invoke-webrequest|iwr|http|wget)$/i.test(prog)
      && /(-X\s*DELETE|--request[\s=]+DELETE|-Method\s+Delete)/i.test(resto) && /(graph\.facebook|graph\.instagram|googleapis\.com|youtube|linkedin)/i.test(resto)) {
      bloquear('apagar posts/vídeos nas redes é proibido.');
    }
    if (/^(apagar|excluir|deletar|delete|remover)[-_]?(post|video|publicacao|publicação|youtube|linkedin|instagram)/i.test(prog)) bloquear('apagar posts/vídeos nas redes é proibido.');

    // 6) tarefas agendadas
    if (/^(enable|disable|start|stop)-scheduledtask$/i.test(prog) && !/DrSM-/.test(resto)) bloquear('só as tarefas DrSM-* podem ser alteradas.');
    if (/^(unregister|register|set)-scheduledtask$/i.test(prog) || (p === 'schtasks' && /\/(delete|create|change)/i.test(resto))) bloquear('criar/remover/alterar tarefas agendadas só com aprovação (use Enable/Disable/Start).');
  }
  process.exit(0);
});
