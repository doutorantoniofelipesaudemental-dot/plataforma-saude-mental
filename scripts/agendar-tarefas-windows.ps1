# Registra as tarefas recorrentes no Agendador de Tarefas do Windows (rodam sem o Claude Code; o computador precisa estar ligado ou dormindo).
# Uso (uma vez):  powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1
# Remover tudo:   powershell -ExecutionPolicy Bypass -File scripts\agendar-tarefas-windows.ps1 -Remover
# Cada tarefa grava o resultado em relatorios\logs-agendador\<tarefa>.log. Nada aqui lê ou imprime o .env (o Node o carrega com --env-file).
# Resistência a interrupções (17/10/2026): SEM janela de console (wscript + rodar-oculto.vbs: não dá para fechar nem apertar Ctrl+C sem querer),
# acorda o computador, roda assim que possível se o horário foi perdido, reinicia a cada 10 min até 3 vezes se falhar, não para ao trocar para
# bateria, só roda com rede e não abre uma 2ª cópia se a anterior ainda estiver rodando. Sem administrador.
# Plantão (19/10/2026): quintas e domingos, narração e YouTube gera-mídia rodam mais cedo (14:00 e 15:30). Trava diária (scripts\travaDiaria.js):
# cada tarefa só roda uma vez por dia com sucesso, mesmo que o PC seja ligado depois do horário (StartWhenAvailable).
# Simular (19/10/2026): só mostra, por tarefa, a ação prevista (criar/atualizar, ativada/desativada); não registra, não altera nem ativa nada.
# Estado (19/10/2026): tarefa que já existe mantém ativa ou desativada (scripts\agendadorEstado.js); só tarefa NOVA pode nascer desativada.
param([switch]$Remover, [switch]$Simular, [string]$So = '')
$raiz = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $raiz 'relatorios\logs-agendador'
if (-not $Simular) { New-Item -ItemType Directory -Force $logs | Out-Null }
$node = (Get-Command node).Source
$vbs = Join-Path $PSScriptRoot 'rodar-oculto.vbs'

# nome, argumentos do node, gatilho(s), limite de execução (horas)
# Tarefas com trava diária (travaDiaria.js) rodam uma vez por dia com sucesso. Blob mensal tem trava própria; LinkedIn tem a sua (agendarDiario.js).
$tarefas = @(
  @{ Nome = 'DrSM-Rotina-Semanal';      Args = 'scripts/travaDiaria.js DrSM-Rotina-Semanal scripts/rotinaSemanal.js'; Gatilho = (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 18:30); Horas = 2 },
  # Narração (correção 25/10/2026): dura ~2 h (4 lotes; medido nos logs de 17/10). Seg a sex 17:35; sábado 20:30 (termina ~22:30). Sem narração no domingo.
  @{ Nome = 'DrSM-Narracao-Noite';      Args = 'scripts/travaDiaria.js DrSM-Narracao-Noite scripts/cicloNarracao.js --lotes=4'; Gatilho = @((New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 17:35), (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Saturday -At 20:30)); Horas = 6 },
  # Gera-mídia (correção 25/10/2026): só depois da narração. Seg a sex 19:45 (narração termina ~19:35); domingo 10:00 (sábado termina ~22:30)
  @{ Nome = 'DrSM-YouTube-Gera-Midia';  Args = 'scripts/travaDiaria.js DrSM-YouTube-Gera-Midia scripts/youtube/montarFila.js --aplicar --gerar --limite=25'; Gatilho = @((New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 19:45), (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 10:00)); Horas = 5 },
  # YouTube publica (ordem 25/10/2026): seg a sex e domingo 20:15; sábado 20:45
  @{ Nome = 'DrSM-YouTube-Publica';     Args = 'scripts/travaDiaria.js DrSM-YouTube-Publica scripts/youtube/publicarYoutube.js'; Gatilho = @((New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday,Sunday -At 20:15), (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Saturday -At 20:45)); Horas = 1 },
  # Conferência diária das redes: SOMENTE LEITURA. Seg a sex 18:15; sábado 21:00; domingo 09:00 (correção 25/10/2026). Grava relatorios\conferencias\AAAA-MM-DD.md e, se falhar, o alerta no topo do ESTADO-GERAL.md
  @{ Nome = 'DrSM-Conferencia-Diaria';  Args = 'scripts/travaDiaria.js DrSM-Conferencia-Diaria scripts/conferencias/conferenciaDiaria.js'; Gatilho = @((New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 18:15), (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Saturday -At 21:00), (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 09:00)); Horas = 1 },
  @{ Nome = 'DrSM-Conferencia-19-10';   Args = 'scripts/travaDiaria.js DrSM-Conferencia-19-10 scripts/conferirPosRenovacao.js'; Gatilho = (New-ScheduledTaskTrigger -Once -At '2026-10-19 19:30'); Horas = 1 },
  # Lembrete MANUAL do LinkedIn DESATIVADO (19/10/2026): o agendamento agora é automático. Mantido como opção comentada.
  # @{ Nome = 'DrSM-LinkedIn-Lembrete';  Args = 'scripts/linkedin/filaManual.js hoje --copiar --abrir'; Gatilho = (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Wednesday,Friday -At 19:25); Horas = 1; Interativa = $true },
  @{ Nome = 'DrSM-Conferencia-26-10';   Args = 'scripts/travaDiaria.js DrSM-Conferencia-26-10 scripts/conferirPrimeiroPost.js'; Gatilho = (New-ScheduledTaskTrigger -Once -At '2026-10-26 19:30'); Horas = 1 },
  # Rotina mensal do Blob (18/10/2026): dia 1 às 03:00; só grupos c/d, com a trava de blob-rotina-mensal.js. Criada DESATIVADA: a ativação é do Dr. Antônio.
  # Agendamento diário do LinkedIn (autorizado em 18/10/2026, CLAUDE.md): 11:00, sessão do usuário (precisa do Chrome com o perfil logado), uma execução por dia (scripts/linkedin/agendarDiario.js). Desligar: npm run linkedin:pausar
  @{ Nome = 'DrSM-LinkedIn-Agendar';    Args = 'scripts/linkedin/agendarDiario.js';                 Gatilho = (New-ScheduledTaskTrigger -Daily -At 11:00); Horas = 1; Interativa = $true; NascerDesativada = $true },
  # PR semanal (19/10/2026): sexta 11:00, SÓ PREPARA (scripts/prSemanal.js: portão + relatorios\PR-SEMANAL.md; sem push, PR ou merge). Criada DESATIVADA.
  @{ Nome = 'DrSM-PR-Semanal';          Args = 'scripts/travaDiaria.js DrSM-PR-Semanal scripts/prSemanal.js'; Gatilho = (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At 11:00); Horas = 1; NascerDesativada = $true },
  @{ Nome = 'DrSM-Blob-Rotina-Mensal';  Args = 'scripts/blob-rotina-mensal.js --aplicar';           Gatilho = $null; Horas = 1; Mensal = $true; NascerDesativada = $true }
)
$usuario = "$env:USERDOMAIN\$env:USERNAME"

# O lembrete manual (versão antiga) pode continuar registrado no Windows: desativa para não disparar.
if (-not $Remover -and -not $So -and -not $Simular) {
  Disable-ScheduledTask -TaskName 'DrSM-LinkedIn-Lembrete' -ErrorAction SilentlyContinue | Out-Null
  Write-Host 'desativada (se existia): DrSM-LinkedIn-Lembrete (substituído pelo agendamento automático)'
}

# Estado atual da tarefa (só leitura) + decisão do agendadorEstado.js. Vazio = falha: a tarefa não é mexida.
function Decidir($t) {
  $atual = Get-ScheduledTask -TaskName $t.Nome -ErrorAction SilentlyContinue
  $existe = [int]([bool]$atual)
  $ativa = [int]([bool]$atual -and $atual.State -ne 'Disabled')
  $nascer = [int]([bool]$t.NascerDesativada)
  $saida = (& $node (Join-Path $PSScriptRoot 'agendadorEstado.js') $existe $ativa $nascer | Out-String).Trim()
  $validas = 'criar-ativada', 'criar-desativada', 'atualizar-mantendo-ativada', 'atualizar-mantendo-desativada'
  if ($LASTEXITCODE -eq 0 -and $saida -in $validas) { return $saida } else { return '' }
}

# Aplica o estado decidido (o Register -Force pode reativar uma tarefa desativada, por isso o ajuste vem depois).
function AplicarEstado($nome, $acao) {
  if ($acao -match 'desativada$') { Disable-ScheduledTask -TaskName $nome | Out-Null } else { Enable-ScheduledTask -TaskName $nome | Out-Null }
}

foreach ($t in $tarefas) {
  if ($So -and $t.Nome -ne $So) { continue }
  if ($Remover) { Unregister-ScheduledTask -TaskName $t.Nome -Confirm:$false -ErrorAction SilentlyContinue; Write-Host "removida: $($t.Nome)"; continue }
  $decisao = Decidir $t
  if (-not $decisao) { Write-Host "ERRO (não alterado): $($t.Nome) sem decisão válida do agendadorEstado.js"; continue }
  if ($Simular) { Write-Host "[simular] $($t.Nome): $decisao"; continue }
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
    AplicarEstado $t.Nome $decisao
    Write-Host "registrada: $($t.Nome)  ($($t.Args)) · mensal, dia 1 às 03:00 · $decisao"
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
    AplicarEstado $t.Nome $decisao
    Write-Host "registrada: $($t.Nome)  ($($t.Args)) · limite $($t.Horas) h · $decisao"
    continue
  }
  try {
    $princ = New-ScheduledTaskPrincipal -UserId $usuario -LogonType S4U -RunLevel Limited
    Register-ScheduledTask -TaskName $t.Nome -Action $acao -Trigger $t.Gatilho -Settings $conf -Principal $princ -Description $descr -Force -ErrorAction Stop | Out-Null
  } catch {
    $modo = 'sessão do usuário (oculta; precisa estar conectado)'
    Register-ScheduledTask -TaskName $t.Nome -Action $acao -Trigger $t.Gatilho -Settings $conf -Description $descr -Force | Out-Null
  }
  AplicarEstado $t.Nome $decisao
  Write-Host "registrada: $($t.Nome)  ($($t.Args)) · limite $($t.Horas) h · $modo · $decisao"
}
Write-Host "`nPronto. Ver: Agendador de Tarefas > Biblioteca. Logs em $logs"
