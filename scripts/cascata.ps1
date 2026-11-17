# Cascata DrSM — alterna o modo de trabalho sem gastar cota do Claude.
# Uso: powershell -NoProfile -File scripts/cascata.ps1 -Modo normal|local|off|status
# Regras: conteúdo CLÍNICO e textos de vídeo/YouTube NUNCA vão ao modo local (ordem de 16/11/2026).
# Nenhum modo lê o .env nem imprime chave. Nenhum modo usa roteador/gateway (OmniRoute, NadirClaw).
param(
  [ValidateSet('normal', 'local', 'off', 'status')]
  [string]$Modo = 'status'
)

$ErrorActionPreference = 'Stop'
$OllamaUrl = 'http://localhost:11434'
$Modelos = @{
  codigo  = 'qwen2.5-coder:14b'
  geral   = 'gemma2:9b'
  trivial = 'llama3.2:3b'
}

function Mostrar-Estado {
  $base = $env:ANTHROPIC_BASE_URL
  if ($base) { Write-Host "ANTHROPIC_BASE_URL = $base  (ATENÇÃO: para tarefa clínica use -Modo off)" }
  else { Write-Host 'ANTHROPIC_BASE_URL = (vazio: Claude direto)' }
  try {
    $v = Invoke-RestMethod -Uri "$OllamaUrl/api/version" -TimeoutSec 3
    Write-Host "Ollama: ativo, versão $($v.version)"
  } catch { Write-Host 'Ollama: inativo' }
}

switch ($Modo) {
  'status' { Mostrar-Estado }

  'off' {
    Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
    Write-Host 'Modo OFF: Claude direto. Use nesta sessão para qualquer tarefa clínica.'
    Mostrar-Estado
  }

  'normal' {
    Remove-Item Env:ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue
    Write-Host 'Modo NORMAL: Claude Code direto, sem proxy. RTK/Caveman/Ponytail conforme instalados.'
    Mostrar-Estado
  }

  'local' {
    Write-Host 'Modo LOCAL: somente tarefas de CÓDIGO e rascunho técnico. Conteúdo clínico e vídeo ficam no Claude.'
    try { Invoke-RestMethod -Uri "$OllamaUrl/api/version" -TimeoutSec 3 | Out-Null }
    catch {
      Write-Host 'Ollama inativo: iniciando "ollama serve" em segundo plano...'
      Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden
      Start-Sleep -Seconds 5
    }
    $instalados = (ollama list) -join "`n"
    foreach ($k in $Modelos.Keys) {
      $m = $Modelos[$k]
      if ($instalados -match [regex]::Escape($m)) { Write-Host "  $k -> $m (instalado)" }
      else { Write-Host "  $k -> $m (NÃO instalado: não será baixado por este script)" }
    }
    # Ferramenta escolhida: Aider (teste de 17/11: qwen2.5-coder:14b, CSS descartável, 78 s, edição correta).
    # Claude Code não serve: Ollama 0.40.16 não responde em /v1/messages. Detalhes em docs/cascata-local.md.
    $aider = 'C:\DRS-tools\aider-venv\Scripts\aider.exe'
    if (-not (Test-Path $aider)) {
      Write-Host 'indisponível: Aider não instalado (ver docs/cascata-local.md). Modo local não disponível.'
      exit 2
    }
    $env:OLLAMA_API_BASE = 'http://127.0.0.1:11434'
    Write-Host "Abrindo Aider (modelo: $($Modelos.codigo)). NUNCA use com conteúdo clínico ou textos de vídeo."
    & $aider --model "ollama_chat/$($Modelos.codigo)" --no-git --no-auto-commits --no-check-update --no-analytics --no-show-model-warnings
    Remove-Item Env:OLLAMA_API_BASE -ErrorAction SilentlyContinue
  }
}
