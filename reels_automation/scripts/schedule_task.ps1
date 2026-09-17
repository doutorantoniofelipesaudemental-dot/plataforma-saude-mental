<#
.SYNOPSIS
    Registra (ou remove) uma Tarefa Agendada do Windows para rodar o pipeline
    automaticamente, similar ao Publish-Instagram.ps1 ja usado na raiz do repo.

.EXAMPLE
    .\scripts\schedule_task.ps1 -Numero 1 -Publicar -Metodo graph -Hora "09:00"
.EXAMPLE
    .\scripts\schedule_task.ps1 -Remover
#>

param(
    [string]$Tema,
    [int]$Numero,
    [switch]$Publicar,
    [ValidateSet("graph", "composio")]
    [string]$Metodo = "graph",
    [string]$Hora = "09:00",
    [string]$NomeTarefa = "ReelsAutomation-DrSaudeMental",
    [switch]$Remover
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

if ($Remover) {
    Unregister-ScheduledTask -TaskName $NomeTarefa -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Tarefa '$NomeTarefa' removida (se existia)." -ForegroundColor Green
    exit 0
}

if (-not $Tema -and -not $Numero) {
    Write-Error "Informe -Tema '<texto>' ou -Numero <N>, ou use -Remover para desativar a tarefa."
    exit 1
}

$runScript = Join-Path $ProjectRoot "scripts\run_pipeline.ps1"
$scriptArgs = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $runScript)
if ($Tema) { $scriptArgs += @("-Tema", $Tema) }
if ($Numero) { $scriptArgs += @("-Numero", $Numero) }
if ($Publicar) { $scriptArgs += "-Publicar" }
if ($Metodo) { $scriptArgs += @("-Metodo", $Metodo) }

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument ($scriptArgs -join " ") -WorkingDirectory $ProjectRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $Hora
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $NomeTarefa -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host "Tarefa '$NomeTarefa' registrada: roda todo dia as $Hora." -ForegroundColor Green
Write-Host "Ver detalhes:  Get-ScheduledTask -TaskName '$NomeTarefa' | Get-ScheduledTaskInfo"
Write-Host "Remover:       .\scripts\schedule_task.ps1 -Remover"
