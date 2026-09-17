<#
.SYNOPSIS
    Prepara o ambiente do pipeline de automacao de Reels: venv Python, deps,
    verificacao de ffmpeg/ImageMagick/Ollama.

.DESCRIPTION
    Roda a partir de qualquer diretorio (resolve o caminho do projeto pela
    posicao deste script). Nao instala Ollama/AUTOMATIC1111/ffmpeg/ImageMagick
    automaticamente — apenas avisa o que falta, com o comando sugerido, porque
    sao instalacoes de sistema fora do escopo de um venv Python.
#>

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "== Instalando pipeline de automacao de Reels em $ProjectRoot ==" -ForegroundColor Cyan

# --- Python ---
# WhisperX depende de ctranslate2/faster-whisper/pyannote.audio com versoes
# exatas fixadas, que costumam demorar meses para ganhar build pronta em
# versoes novas do Python. Por isso preferimos 3.11/3.12/3.13 explicitamente
# via "py launcher" em vez do "python" generico do PATH (que pode ser uma
# versao mais nova, ex.: 3.14, ainda sem wheel para essas libs).
$pyLauncher = Get-Command py -ErrorAction SilentlyContinue
$baseExe = $null
if ($pyLauncher) {
    foreach ($ver in @("-3.12", "-3.11", "-3.13")) {
        & py $ver -c "" 2>$null
        if ($LASTEXITCODE -eq 0) {
            $baseExe = (& py $ver -c "import sys; print(sys.executable)").Trim()
            Write-Host "Usando Python $ver encontrado via 'py launcher': $baseExe" -ForegroundColor Green
            break
        }
    }
}

if (-not $baseExe) {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) {
        Write-Error "Python nao encontrado no PATH. Instale Python 3.11, 3.12 ou 3.13 antes de continuar."
        exit 1
    }
    $verStr = (& python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')").Trim()
    if ([version]$verStr -ge [version]"3.14") {
        Write-Host "[AVISO] O Python padrao do PATH e $verStr — o WhisperX ainda nao tem" -ForegroundColor DarkYellow
        Write-Host "        build pronta pra essa versao (ctranslate2/faster-whisper/pyannote)." -ForegroundColor DarkYellow
        Write-Host "        Instale o Python 3.12 (winget install Python.Python.3.12) para" -ForegroundColor DarkYellow
        Write-Host "        que este script o use automaticamente via 'py -3.12'." -ForegroundColor DarkYellow
    }
    $baseExe = $python.Source
    Write-Host "Usando Python do PATH: $baseExe (versao $verStr)" -ForegroundColor Green
}

# --- venv ---
$venvPath = Join-Path $ProjectRoot ".venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Criando virtualenv em $venvPath ..." -ForegroundColor Yellow
    & $baseExe -m venv $venvPath
} else {
    Write-Host "Virtualenv ja existe em $venvPath — reaproveitando." -ForegroundColor Green
}

$venvPython = Join-Path $venvPath "Scripts\python.exe"

Write-Host "Atualizando pip ..." -ForegroundColor Yellow
& $venvPython -m pip install --upgrade pip | Out-Null

Write-Host "Instalando dependencias (requirements.txt) — pode demorar (torch/whisperx sao pesados) ..." -ForegroundColor Yellow
& $venvPython -m pip install -r (Join-Path $ProjectRoot "requirements.txt")
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao instalar dependencias. Veja o erro acima."
    exit 1
}

# --- .env local ---
$envFile = Join-Path $ProjectRoot ".env"
$envExample = Join-Path $ProjectRoot ".env.example"
if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "Criado .env a partir de .env.example — revise os valores." -ForegroundColor Yellow
} else {
    Write-Host ".env ja existe — mantido sem alteracoes." -ForegroundColor Green
}

# --- Verificacoes de dependencias externas ---
Write-Host "`n== Verificando dependencias externas ==" -ForegroundColor Cyan

function Test-Tool {
    param([string]$Name, [string]$InstallHint)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($cmd) {
        Write-Host "[OK] $Name encontrado em $($cmd.Source)" -ForegroundColor Green
    } else {
        Write-Host "[FALTANDO] $Name nao encontrado no PATH." -ForegroundColor Red
        Write-Host "           $InstallHint" -ForegroundColor DarkYellow
    }
}

Test-Tool -Name "ffmpeg" -InstallHint "winget install Gyan.FFmpeg  (ou choco install ffmpeg)"
Test-Tool -Name "ollama" -InstallHint "Baixe em https://ollama.com/download e rode: ollama pull deepseek-r1:8b"

$vcredist = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\X64" -ErrorAction SilentlyContinue
if ($vcredist -and $vcredist.Installed -eq 1) {
    Write-Host "[OK] Microsoft Visual C++ Redistributable (x64) instalado (v$($vcredist.Version))" -ForegroundColor Green
} else {
    Write-Host "[FALTANDO] Microsoft Visual C++ Redistributable (x64) — necessario pro torch/whisperx." -ForegroundColor Red
    Write-Host "           winget install Microsoft.VCRedist.2015+.x64" -ForegroundColor DarkYellow
}

$ollamaRunning = $false
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -UseBasicParsing
    if ($resp.StatusCode -eq 200) { $ollamaRunning = $true }
} catch { $ollamaRunning = $false }

if ($ollamaRunning) {
    Write-Host "[OK] Ollama respondendo em http://localhost:11434" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Ollama nao respondeu em http://localhost:11434 — rode 'ollama serve' antes do pipeline." -ForegroundColor DarkYellow
}

Write-Host "`n== Instalacao concluida ==" -ForegroundColor Cyan
Write-Host "Ative o venv com:  $venvPath\Scripts\Activate.ps1"
Write-Host "Rode o pipeline com:  .\scripts\run_pipeline.ps1 -Tema 'seu tema'"
