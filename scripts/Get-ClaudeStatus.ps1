function Get-ClaudeStatus {
    $claudeDir = Join-Path $HOME ".claude"
    if (-not (Test-Path $claudeDir)) {
        Write-Warning "Diretório do Claude Code ($claudeDir) não encontrado."
        return
    }

    $latestSession = Get-ChildItem -Path "$claudeDir\*.json" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $latestSession) {
        Write-Warning "Nenhuma sessão ativa encontrada."
        return
    }

    $json = Get-Content -Path $latestSession.FullName -Raw | ConvertFrom-Json
    $tokensIn = if ($json.stats.input_tokens) { $json.stats.input_tokens } else { 0 }
    $tokensOut = if ($json.stats.output_tokens) { $json.stats.output_tokens } else { 0 }

    $totalTokens = $tokensIn + $tokensOut
    $maxContext = 200000
    $usagePct = [math]::Round(($totalTokens / $maxContext) * 100)

    Write-Host "------------------------------------------------" -ForegroundColor Cyan
    Write-Host "🤖 CLAUDE CODE - OBSERVABILIDADE DE CONTEXTO" -ForegroundColor Cyan
    Write-Host "------------------------------------------------" -ForegroundColor Cyan
    Write-Host "📥 Tokens Entrada: $tokensIn | 📤 Tokens Saída: $tokensOut"
    Write-Host "📊 Total: $totalTokens / $maxContext"
    
    if ($usagePct -ge 50) {
        Write-Host "📈 Uso do Contexto: $usagePct% ⚠️ (>50%! Use /clear com handoff)" -ForegroundColor Yellow
    } else {
        Write-Host "📈 Uso do Contexto: $usagePct% ✅ (Saudável)" -ForegroundColor Green
    }
    Write-Host "------------------------------------------------" -ForegroundColor Cyan
}
Get-ClaudeStatus
