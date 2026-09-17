<#
.SYNOPSIS
    Executa post_instagram.py para gerar a legenda do dia (Claude) e publicar
    no Instagram via Composio.
.DESCRIPTION
    Feito para ser chamado pelo Agendador de Tarefas do Windows (schtasks) uma
    vez por dia. Le as credenciais de .env.local (nao aceita segredos por
    parametro) e grava um log diario em logs\instagram\ para auditoria da
    automacao.
.PARAMETER MediaUrl
    URL HTTPS da midia a publicar. Se omitido, o script Python usa
    INSTAGRAM_MEDIA_URL_PADRAO de .env.local.
.PARAMETER Tema
    Tema da legenda. Se omitido, o script Python escolhe o pilar do dia.
.PARAMETER TipoMidia
    "imagem" (default) ou "video".
.PARAMETER DryRun
    Gera a legenda e mostra no log, mas nao publica no Instagram.
.EXAMPLE
    .\Publish-Instagram.ps1
.EXAMPLE
    .\Publish-Instagram.ps1 -MediaUrl "https://exemplo.com/post.jpg" -Tema "burnout"
#>

[CmdletBinding()]
param(
    [string]$MediaUrl,
    [string]$Tema,
    [ValidateSet("imagem", "video")]
    [string]$TipoMidia = "imagem",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$raiz = $PSScriptRoot
Set-Location $raiz

$pastaLogs = Join-Path $raiz "logs\instagram"
if (-not (Test-Path $pastaLogs)) {
    New-Item -ItemType Directory -Path $pastaLogs -Force | Out-Null
}
$arquivoLog = Join-Path $pastaLogs "$(Get-Date -Format 'yyyy-MM-dd').log"

function Escrever-Log([string]$mensagem) {
    $linha = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $mensagem"
    $linha | Tee-Object -FilePath $arquivoLog -Append
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $python) {
    Escrever-Log "Erro: nenhum interpretador Python (python/py) encontrado no PATH."
    exit 1
}

$argumentos = @("post_instagram.py", "publicar", "--verbose", "--tipo-midia", $TipoMidia)
if ($MediaUrl) { $argumentos += @("--media-url", $MediaUrl) }
if ($Tema) { $argumentos += @("--tema", $Tema) }
if ($DryRun) { $argumentos += "--dry-run" }

Escrever-Log "Iniciando publicacao no Instagram ($($python.Name) $($argumentos -join ' '))"

try {
    & $python.Source @argumentos 2>&1 | Tee-Object -FilePath $arquivoLog -Append
    $codigoSaida = $LASTEXITCODE
}
catch {
    Escrever-Log "Erro inesperado ao executar post_instagram.py: $_"
    exit 1
}

Escrever-Log "Finalizado com codigo de saida $codigoSaida."
exit $codigoSaida
