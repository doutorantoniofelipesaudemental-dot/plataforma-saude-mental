# Registra as tarefas recorrentes no Agendador de Tarefas do Windows (rodam sem o Claude Code; o computador precisa estar ligado ou dormindo).
# Uso (uma vez):  powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1
# Remover tudo:   powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1 -Remover
# Cada tarefa grava o resultado em relatorios\logs-agendador\<tarefa>.log. Nada aqui lê ou imprime o .env (o Node o carrega com --env-file).
# Resistência a interrupções (17/10/2026): SEM janela de console (wscript + rodar-oculto.vbs: não dá para fechar nem apertar Ctrl+C sem querer),
# acorda o computador, roda assim que possível se o horário foi perdido, reinicia a cada 10 min até 3 vezes se falhar, não para ao trocar para
# bateria, só roda com rede e não abre uma 2ª cópia se a anterior ainda estiver rodando. Sem administrador.
param([switch]$Remover)
$raiz = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $raiz 'relatorios\logs-agendador'
New-Item -ItemType Directory -Force $logs | Out-Null
$node = (Get-Command node).Source
$vbs = Join-Path $PSScriptRoot 'rodar-oculto.vbs'

# nome, argumentos do node, gatilho, limite de execução (horas)
$tarefas = @(
  @{ Nome = 'DrSM-Rotina-Semanal';      Args = 'scripts/rotinaSemanal.js';                          Gatilho = (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 07:30); Horas = 2 },
  @{ Nome = 'DrSM-Narracao-Noite';      Args = 'scripts/cicloNarracao.js --lotes=4';                Gatilho = (New-ScheduledTaskTrigger -Daily -At 22:00); Horas = 6 },
  @{ Nome = 'DrSM-YouTube-Gera-Midia';  Args = 'scripts/youtube/montarFila.js --aplicar --gerar --limite=25'; Gatilho = (New-ScheduledTaskTrigger -Daily -At 23:30); Horas = 5 },
  @{ Nome = 'DrSM-YouTube-Publica';     Args = 'scripts/youtube/publicarYoutube.js';                Gatilho = (New-ScheduledTaskTrigger -Daily -At 12:30); Horas = 1 },
  @{ Nome = 'DrSM-Conferencia-19-10';   Args = 'scripts/conferirPosRenovacao.js';                   Gatilho = (New-ScheduledTaskTrigger -Once -At '2026-10-19 19:30'); Horas = 1 },
  @{ Nome = 'DrSM-Conferencia-26-10';   Args = 'scripts/conferirPrimeiroPost.js';                   Gatilho = (New-ScheduledTaskTrigger -Once -At '2026-10-26 19:30'); Horas = 1 }
)
$usuario = "$env:USERDOMAIN\$env:USERNAME"
foreach ($t in $tarefas) {
  if ($Remover) { Unregister-ScheduledTask -TaskName $t.Nome -Confirm:$false -ErrorAction SilentlyContinue; Write-Host "removida: $($t.Nome)"; continue }
  $log = Join-Path $logs "$($t.Nome).log"
  $acao = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "//B //Nologo `"$vbs`" `"$log`" `"$node`" `"$($t.Args)`""
  $conf = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RunOnlyIfNetworkAvailable `
    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10) -ExecutionTimeLimit (New-TimeSpan -Hours $t.Horas) -MultipleInstances IgnoreNew -Hidden
  $descr = 'Portal Dr. Antônio Felipe (sem Claude)'
  # 1ª tentativa: "executar mesmo sem o usuário conectado" sem guardar senha (S4U); se o Windows recusar sem administrador, usa a sessão do usuário (continua oculta)
  $modo = 'S4U (roda mesmo com o usuário desconectado, sem janela)'
  try {
    $princ = New-ScheduledTaskPrincipal -UserId $usuario -LogonType S4U -RunLevel Limited
    Register-ScheduledTask -TaskName $t.Nome -Action $acao -Trigger $t.Gatilho -Settings $conf -Principal $princ -Description $descr -Force -ErrorAction Stop | Out-Null
  } catch {
    $modo = 'sessão do usuário (oculta; precisa estar conectado)'
    Register-ScheduledTask -TaskName $t.Nome -Action $acao -Trigger $t.Gatilho -Settings $conf -Description $descr -Force | Out-Null
  }
  Write-Host "registrada: $($t.Nome)  ($($t.Args)) · limite $($t.Horas) h · $modo"
}
Write-Host "`nPronto. Ver: Agendador de Tarefas > Biblioteca. Logs em $logs"
