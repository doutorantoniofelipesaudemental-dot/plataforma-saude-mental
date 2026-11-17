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
    # Ferramenta local: ordem de teste Claude Code -> OpenCode -> Aider. Claude Code não fala com este Ollama
    # (versão 0.40.16 não responde em /v1/messages, teste de 16/11). Usa a primeira que existir no PATH.
    $ferramenta = $null
    foreach ($c in @('opencode', 'aider')) {
      if (Get-Command $c -ErrorAction SilentlyContinue) { $ferramenta = $c; break }
    }
    if ($ferramenta) {
      Write-Host "Abrindo $ferramenta (modelo: $($Modelos.codigo))."
      & $ferramenta --model "ollama/$($Modelos.codigo)"
    } else {
      Write-Host 'Nenhuma ferramenta local instalada (OpenCode/Aider). Modo local não disponível ainda.'
      exit 2
    }
  }
}
