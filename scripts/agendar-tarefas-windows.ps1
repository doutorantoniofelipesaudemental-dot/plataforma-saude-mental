# Registra as tarefas recorrentes no Agendador de Tarefas do Windows (rodam sem o Claude Code; o computador precisa estar ligado).
# Uso (uma vez):  powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1
# Remover tudo:   powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1 -Remover
# Cada tarefa grava o resultado em relatorios\logs-agendador\<tarefa>.log. Nada aqui lê ou imprime o .env (o Node o carrega com --env-file).
param([switch]$Remover)
$raiz = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $raiz 'relatorios\logs-agendador'
New-Item -ItemType Directory -Force $logs | Out-Null
$node = (Get-Command node).Source

# nome, comando (argumentos do node), gatilho
$tarefas = @(
  @{ Nome = 'DrSM-Rotina-Semanal';      Args = 'scripts/rotinaSemanal.js';                          Gatilho = (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 07:30) },
  @{ Nome = 'DrSM-Narracao-Noite';      Args = 'scripts/cicloNarracao.js --lotes=4';                Gatilho = (New-ScheduledTaskTrigger -Daily -At 22:00) },
  @{ Nome = 'DrSM-YouTube-Gera-Midia';  Args = 'scripts/youtube/montarFila.js --aplicar --gerar --limite=25'; Gatilho = (New-ScheduledTaskTrigger -Daily -At 23:30) },
  @{ Nome = 'DrSM-YouTube-Publica';     Args = 'scripts/youtube/publicarYoutube.js';                Gatilho = (New-ScheduledTaskTrigger -Daily -At 12:30) },
  @{ Nome = 'DrSM-Conferencia-19-10';   Args = 'scripts/conferirPosRenovacao.js';                   Gatilho = (New-ScheduledTaskTrigger -Once -At '2026-10-19 19:30') },
  @{ Nome = 'DrSM-Conferencia-26-10';   Args = 'scripts/conferirPrimeiroPost.js';                   Gatilho = (New-ScheduledTaskTrigger -Once -At '2026-10-26 19:30') }
)
foreach ($t in $tarefas) {
  if ($Remover) { Unregister-ScheduledTask -TaskName $t.Nome -Confirm:$false -ErrorAction SilentlyContinue; Write-Host "removida: $($t.Nome)"; continue }
  $log = Join-Path $logs "$($t.Nome).log"
  $cmd = "/c cd /d `"$raiz`" && `"$node`" --env-file=.env $($t.Args) >> `"$log`" 2>&1"
  $acao = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument $cmd
  $conf = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 5) -AllowStartIfOnBatteries
  Register-ScheduledTask -TaskName $t.Nome -Action $acao -Trigger $t.Gatilho -Settings $conf -Description 'Portal Dr. Antônio Felipe (sem Claude)' -Force | Out-Null
  Write-Host "registrada: $($t.Nome)  ($($t.Args))"
}
Write-Host "`nPronto. Ver: Agendador de Tarefas > Biblioteca. Logs em $logs"
