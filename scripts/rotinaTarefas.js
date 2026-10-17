/**
 * Estado das tarefas DrSM-* do Agendador do Windows: última execução, resultado, próxima, execuções perdidas e se o computador estava ligado.
 *   node scripts/rotinaTarefas.js        grava relatorios/tarefas-estado.md e o bloco "Tarefas do Windows" do ESTADO-GERAL.md (só leitura do sistema)
 * Roda dentro da rotina semanal (segunda 07:30) e pode ser rodado à mão. Não precisa de administrador.
 * "PC ligado": o Windows não guarda isso por tarefa, então se deduz de (a) quanto a última execução atrasou em relação ao horário
 * marcado (atraso grande = o computador estava desligado/dormindo e a tarefa rodou "assim que possível") e (b) boot, reinícios e suspensões dos últimos 7 dias.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
// horário marcado de cada tarefa (hora local; dow = dia da semana 1=segunda; "uma vez" tem data) — o mesmo de scripts/agendar-tarefas-windows.ps1
const HORARIOS = {
  'DrSM-Rotina-Semanal': { h: 7, m: 30, dow: 1 },
  'DrSM-Narracao-Noite': { h: 22, m: 0 },
  'DrSM-YouTube-Gera-Midia': { h: 23, m: 30 },
  'DrSM-YouTube-Publica': { h: 12, m: 30 },
  'DrSM-Conferencia-19-10': { uma: '2026-10-19T19:30:00' },
  'DrSM-Conferencia-26-10': { uma: '2026-10-26T19:30:00' },
};
const CODIGOS = {
  0: 'OK', 267009: 'rodando agora', 267011: 'ainda não rodou', 267014: 'interrompida pelo Agendador/usuário', 267012: 'sem horário a executar',
  3221225786: 'INTERROMPIDA (Ctrl+C / janela fechada)', 2147750687: 'já estava rodando (2ª cópia ignorada)', 2147942402: 'arquivo não encontrado', 1: 'terminou com erro (código 1)', 2: 'terminou com erro (código 2)',
};
const ps = (cmd) => spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', timeout: 90000 });
const fmt = (d) => (d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Bahia', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

function lerTarefas() {
  const r = ps(`Get-ScheduledTask -TaskName 'DrSM-*' | ForEach-Object { $i = $_ | Get-ScheduledTaskInfo; [pscustomobject]@{ nome = $_.TaskName; estado = [string]$_.State; ultima = $(if ($i.LastRunTime.Year -gt 2000) { $i.LastRunTime.ToUniversalTime().ToString('o') } else { $null }); resultado = [int64]$i.LastTaskResult; proxima = $(if ($i.NextRunTime) { $i.NextRunTime.ToUniversalTime().ToString('o') } else { $null }); perdidas = [int]$i.NumberOfMissedRuns } } | ConvertTo-Json -Compress`);
  try { const j = JSON.parse(r.stdout.trim()); return Array.isArray(j) ? j : [j]; } catch { return []; }
}

function lerEnergia() {
  const r = ps(`$ini = (Get-Date).AddDays(-7); $so = Get-CimInstance Win32_OperatingSystem; $ev = Get-WinEvent -FilterHashtable @{LogName='System'; StartTime=$ini} -ErrorAction SilentlyContinue | Where-Object { $_.Id -in 6005,6006,6008,41,1074,42,107 -or ($_.ProviderName -match 'Power-Troubleshooter' -and $_.Id -eq 1) }; [pscustomobject]@{ boot = $so.LastBootUpTime.ToUniversalTime().ToString('o'); partidas = @($ev | Where-Object Id -eq 6005).Count; desligamentos = @($ev | Where-Object { $_.Id -in 6006,6008,41,1074 }).Count; suspensoes = @($ev | Where-Object { $_.Id -in 42,107 }).Count; retomadas = @($ev | Where-Object { $_.Id -eq 1 -and $_.ProviderName -match 'Power-Troubleshooter' }).Count } | ConvertTo-Json -Compress`);
  try { return JSON.parse(r.stdout.trim()); } catch { return null; }
}

/** Último horário marcado até `ate` (hora local). */
function horarioEsperado(nome, ate) {
  const c = HORARIOS[nome]; if (!c) return null;
  if (c.uma) return new Date(c.uma);
  const d = new Date(ate); d.setHours(c.h, c.m, 0, 0);
  if (d > ate) d.setDate(d.getDate() - 1);
  if (c.dow != null) while (d.getDay() !== c.dow) d.setDate(d.getDate() - 1);
  return d;
}

function conferir() {
  const tarefas = lerTarefas(), energia = lerEnergia(), problemas = [], linhas = [];
  for (const t of tarefas.sort((a, b) => a.nome.localeCompare(b.nome))) {
    const cod = CODIGOS[t.resultado] || `código ${t.resultado}`;
    let atraso = '—', pc = '—';
    if (t.ultima) {
      const esp = horarioEsperado(t.nome, new Date(t.ultima));
      if (esp) {
        const min = Math.round((new Date(t.ultima) - esp) / 60000);
        if (Math.abs(min) > 180) { atraso = '—'; pc = 'execução manual/de teste (fora do horário marcado)'; }
        else { atraso = `${min} min`; pc = min > 10 ? `rodou ${min} min depois do horário (computador desligado/dormindo na hora, ou execução manual)` : 'ligado no horário'; }
      }
    }
    linhas.push(`| ${t.nome} | ${t.estado} | ${fmt(t.ultima)} | ${cod} | ${atraso} | ${pc} | ${fmt(t.proxima)} | ${t.perdidas} |`);
    if (t.ultima && ![0, 267009, 267011, 267012, 2147750687].includes(t.resultado)) problemas.push(`tarefa ${t.nome}: última execução ${fmt(t.ultima)} terminou como "${cod}"`);
    if (t.estado === 'Disabled') problemas.push(`tarefa ${t.nome} está DESATIVADA`);
    if (t.perdidas > 0) problemas.push(`tarefa ${t.nome}: ${t.perdidas} execução(ões) perdida(s) (computador desligado no horário)`);
  }
  if (!tarefas.length) problemas.push('não consegui ler as tarefas DrSM-* do Agendador');
  const en = energia ? `PC ligado desde ${fmt(energia.boot)} · nos últimos 7 dias: ${energia.partidas} partida(s), ${energia.desligamentos} desligamento(s)/queda(s), ${energia.suspensoes} suspensão(ões), ${energia.retomadas} retomada(s)` : 'estado de energia não lido';
  const md = `### Tarefas do Windows (conferidas em ${fmt(new Date())})\n- ${en}\n\n| Tarefa | Estado | Última execução | Resultado | Atraso | O PC estava ligado? | Próxima | Perdidas |\n|---|---|---|---|---|---|---|---|\n${linhas.join('\n')}\n`;
  return { md, problemas, tarefas, energia };
}

/** Grava relatorios/tarefas-estado.md e o bloco no ESTADO-GERAL.md (criado antes da tabela de freios). */
function gravar(r = conferir()) {
  fs.writeFileSync(path.join(RAIZ, 'relatorios', 'tarefas-estado.md'), `# Estado das tarefas do Windows\n\n${r.md}\nLegenda: "INTERROMPIDA" = a execução foi cortada (Ctrl+C, janela fechada); "perdidas" = horários em que o computador estava desligado e a tarefa não conseguiu nem recuperar. Para recuperar horários perdidos a tarefa roda sozinha assim que o computador volta.\n`, 'utf8');
  const eg = path.join(RAIZ, 'relatorios', 'ESTADO-GERAL.md');
  if (fs.existsSync(eg)) {
    let t = fs.readFileSync(eg, 'utf8');
    const bloco = `<!-- TAREFAS:INICIO -->\n${r.md}<!-- TAREFAS:FIM -->\n`;
    if (/<!-- TAREFAS:INICIO -->[\s\S]*?<!-- TAREFAS:FIM -->\n?/.test(t)) t = t.replace(/<!-- TAREFAS:INICIO -->[\s\S]*?<!-- TAREFAS:FIM -->\n?/, bloco);
    else if (t.includes('## Freios das publicações automáticas')) t = t.replace('## Freios das publicações automáticas', `${bloco}\n## Freios das publicações automáticas`);
    else t = `${t.trimEnd()}\n\n${bloco}`;
    fs.writeFileSync(eg, t, 'utf8');
  }
  return r;
}

module.exports = { conferir, gravar, HORARIOS, CODIGOS };

if (require.main === module) { const r = gravar(); console.log(r.md); if (r.problemas.length) console.log('PROBLEMAS:\n - ' + r.problemas.join('\n - ')); }
