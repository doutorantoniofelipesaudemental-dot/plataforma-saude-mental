# Registra as tarefas recorrentes no Agendador de Tarefas do Windows (rodam sem o Claude Code; o computador precisa estar ligado ou dormindo).
# Uso (uma vez):  powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1
# Remover tudo:   powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1 -Remover
# Cada tarefa grava o resultado em relatorios\logs-agendador\<tarefa>.log. Nada aqui lê ou imprime o .env (o Node o carrega com --env-file).
# Resistência a interrupções (17/10/2026): SEM janela de console (wscript + rodar-oculto.vbs: não dá para fechar nem apertar Ctrl+C sem querer),
# acorda o computador, roda assim que possível se o horário foi perdido, reinicia a cada 10 min até 3 vezes se falhar, não para ao trocar para
# bateria, só roda com rede e não abre uma 2ª cópia se a anterior ainda estiver rodando. Sem administrador.
param([switch]$Remover, [string]$So = '')
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
  # Conferência diária das redes (18/10/2026): SOMENTE LEITURA, 09:30 de Salvador; grava relatorios\conferencias\AAAA-MM-DD.md e, se falhar, o alerta no topo do ESTADO-GERAL.md
  @{ Nome = 'DrSM-Conferencia-Diaria';  Args = 'scripts/conferencias/conferenciaDiaria.js';        Gatilho = (New-ScheduledTaskTrigger -Daily -At 09:30); Horas = 1 },
  @{ Nome = 'DrSM-Conferencia-19-10';   Args = 'scripts/conferirPosRenovacao.js';                   Gatilho = (New-ScheduledTaskTrigger -Once -At '2026-10-19 19:30'); Horas = 1 },
  # Lembrete do LinkedIn (fila MANUAL, perfil pessoal): 19:25 seg/qua/sex; precisa da SUA sessão para abrir o Bloco de Notas (por isso não é S4U)
  @{ Nome = 'DrSM-LinkedIn-Lembrete';  Args = 'scripts/linkedin/filaManual.js hoje --copiar --abrir'; Gatilho = (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Wednesday,Friday -At 19:25); Horas = 1; Interativa = $true },
  @{ Nome = 'DrSM-Conferencia-26-10';   Args = 'scripts/conferirPrimeiroPost.js';                   Gatilho = (New-ScheduledTaskTrigger -Once -At '2026-10-26 19:30'); Horas = 1 },
  # Rotina mensal do Blob (18/10/2026): dia 1 às 03:00; só grupos c/d, com a trava de blob-rotina-mensal.js. Criada DESATIVADA: a ativação é do Dr. Antônio.
  @{ Nome = 'DrSM-Blob-Rotina-Mensal';  Args = 'scripts/blob-rotina-mensal.js --aplicar';           Gatilho = $null; Horas = 1; Mensal = $true }
)
$usuario = "$env:USERDOMAIN\$env:USERNAME"
foreach ($t in $tarefas) {
  if ($So -and $t.Nome -ne $So) { continue }
  if ($Remover) { Unregister-ScheduledTask -TaskName $t.Nome -Confirm:$false -ErrorAction SilentlyContinue; Write-Host "removida: $($t.Nome)"; continue }
  $log = Join-Path $logs "$($t.Nome).log"
  if ($t.Mensal) {
    # gatilho mensal (dia 1, 03:00): o PowerShell não tem -Monthly; registra diário e troca o gatilho por XML. Criada DESATIVADA.
    $acao = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "//B //Nologo `"$vbs`" `"$log`" `"$node`" `"$($t.Args)`""
    $conf = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -RunOnlyIfNetworkAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10) -ExecutionTimeLimit (New-TimeSpan -Hours $t.Horas) -MultipleInstances IgnoreNew -Hidden
    Register-ScheduledTask -TaskName $t.Nome -Action $acao -Trigger (New-ScheduledTaskTrigger -Daily -At 03:00) -Settings $conf -Description 'Portal Dr. Antônio Felipe (sem Claude)' -Force | Out-Null
    $meses = 'January','February','March','April','May','June','July','August','September','October','November','December' | ForEach-Object { "<$_/>" }
    $xml = (Export-ScheduledTask -TaskName $t.Nome) -replace '(?s)<ScheduleByDay>.*?</ScheduleByDay>', "<ScheduleByMonth><DaysOfMonth><Day>1</Day></DaysOfMonth><Months>$($meses -join '')</Months></ScheduleByMonth>"
    $xml = $xml -replace '<StartBoundary>[^<]*</StartBoundary>', '<StartBoundary>2026-11-01T03:00:00</StartBoundary>'
    Register-ScheduledTask -TaskName $t.Nome -Xml $xml -Force | Out-Null
    Disable-ScheduledTask -TaskName $t.Nome | Out-Null
    Write-Host "registrada: $($t.Nome)  ($($t.Args)) · mensal, dia 1 às 03:00 · DESATIVADA (ativar só por ordem do Dr. Antônio)"
    continue
  }
  $acao = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "//B //Nologo `"$vbs`" `"$log`" `"$node`" `"$($t.Args)`""
  $conf = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RunOnlyIfNetworkAvailable `
    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10) -ExecutionTimeLimit (New-TimeSpan -Hours $t.Horas) -MultipleInstances IgnoreNew -Hidden
  $descr = 'Portal Dr. Antônio Felipe (sem Claude)'
  # 1ª tentativa: "executar mesmo sem o usuário conectado" sem guardar senha (S4U); se o Windows recusar sem administrador, usa a sessão do usuário (continua oculta)
  $modo = 'S4U (roda mesmo com o usuário desconectado, sem janela)'
  if ($t.Interativa) {
    # lembrete que abre o Bloco de Notas na sua tela: precisa da sessão do usuário (S4U não tem tela); não exige rede
    $conf = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours $t.Horas) -MultipleInstances IgnoreNew
    Register-ScheduledTask -TaskName $t.Nome -Action $acao -Trigger $t.Gatilho -Settings $conf -Description $descr -Force | Out-Null
    Write-Host "registrada: $($t.Nome)  ($($t.Args)) · limite $($t.Horas) h · sessão do usuário (abre o Bloco de Notas na sua tela)"
    continue
  }
  try {
    $princ = New-ScheduledTaskPrincipal -UserId $usuario -LogonType S4U -RunLevel Limited
    Register-ScheduledTask -TaskName $t.Nome -Action $acao -Trigger $t.Gatilho -Settings $conf -Principal $princ -Description $descr -Force -ErrorAction Stop | Out-Null
  } catch {
    $modo = 'sessão do usuário (oculta; precisa estar conectado)'
    Register-ScheduledTask -TaskName $t.Nome -Action $acao -Trigger $t.Gatilho -Settings $conf -Description $descr -Force | Out-Null
  }
  if ($t.Desativada) { Disable-ScheduledTask -TaskName $t.Nome | Out-Null; $modo += ' · DESATIVADA (ativar só por ordem do Dr. Antônio)' }
  Write-Host "registrada: $($t.Nome)  ($($t.Args)) · limite $($t.Horas) h · $modo"
}
Write-Host "`nPronto. Ver: Agendador de Tarefas > Biblioteca. Logs em $logs"
