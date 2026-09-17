<#
.SYNOPSIS
    Limpa artefatos gerados (audio, imagens, video, legendas, runs, logs),
    preservando a estrutura de pastas e os .gitkeep.

.PARAMETER Logs
    Tambem limpa logs\*.log (por padrao os logs sao preservados).

.PARAMETER Confirmar
    Executa a limpeza sem perguntar (por padrao pede confirmacao, ja que a
    operacao apaga arquivos e nao pode ser desfeita).
#>

param(
    [switch]$Logs,
    [switch]$Confirmar
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

$targets = @(
    "assets\audio",
    "assets\images",
    "assets\captions",
    "assets\output",
    "assets\runs"
)

Write-Host "Isto vai apagar o CONTEUDO das pastas abaixo (mantendo as pastas):" -ForegroundColor Yellow
$targets | ForEach-Object { Write-Host "  - $_" }
if ($Logs) { Write-Host "  - logs\*.log" }

if (-not $Confirmar) {
    $resp = Read-Host "Confirmar? (s/N)"
    if ($resp -ne "s" -and $resp -ne "S") {
        Write-Host "Cancelado." -ForegroundColor Red
        exit 0
    }
}

foreach ($rel in $targets) {
    $full = Join-Path $ProjectRoot $rel
    if (Test-Path $full) {
        Get-ChildItem -Path $full -Force | Where-Object { $_.Name -ne ".gitkeep" } | Remove-Item -Recurse -Force
        Write-Host "Limpo: $rel" -ForegroundColor Green
    }
}

if ($Logs) {
    $logsPath = Join-Path $ProjectRoot "logs"
    Get-ChildItem -Path $logsPath -Filter "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "Logs (*.log) removidos." -ForegroundColor Green
}

Write-Host "Limpeza concluida." -ForegroundColor Cyan
