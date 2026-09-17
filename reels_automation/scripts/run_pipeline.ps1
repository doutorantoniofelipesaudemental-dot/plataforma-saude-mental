<#
.SYNOPSIS
    Roda o pipeline completo de geracao (e opcionalmente publicacao) de um Reel.

.EXAMPLE
    .\scripts\run_pipeline.ps1 -Tema "ansiedade no trabalho"
.EXAMPLE
    .\scripts\run_pipeline.ps1 -Numero 3 -Publicar -Metodo graph
.EXAMPLE
    .\scripts\run_pipeline.ps1 -Tema "burnout" -Publicar -DryRun
#>

param(
    [string]$Tema,
    [int]$Numero,
    [switch]$Publicar,
    [ValidateSet("graph", "composio")]
    [string]$Metodo,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$venvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Error "Virtualenv nao encontrado. Rode .\scripts\install.ps1 primeiro."
    exit 1
}

if (-not $Tema -and -not $Numero) {
    Write-Error "Informe -Tema '<texto>' ou -Numero <N> (linha de 30_REELS_FACELESS.csv)."
    exit 1
}

$cliArgs = @("main.py", "run-all")
if ($Tema) { $cliArgs += @("--tema", $Tema) }
if ($Numero) { $cliArgs += @("--numero", $Numero) }
if ($Publicar) { $cliArgs += "--publicar" }
if ($Metodo) { $cliArgs += @("--metodo", $Metodo) }
if ($DryRun) { $cliArgs += "--dry-run" }

Write-Host "== Rodando pipeline ==" -ForegroundColor Cyan
Write-Host ("$venvPython " + ($cliArgs -join " ")) -ForegroundColor DarkGray

& $venvPython @cliArgs
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Host "`nPipeline terminou com erro (codigo $exitCode). Veja logs\errors.log." -ForegroundColor Red
} else {
    Write-Host "`nPipeline concluido com sucesso." -ForegroundColor Green
}

exit $exitCode
