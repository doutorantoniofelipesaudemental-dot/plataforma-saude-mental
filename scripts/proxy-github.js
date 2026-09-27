#!/usr/bin/env node
/**
 * npm run proxy:github — LiteLLM Proxy com o litellm.config.yaml (GitHub Models)
 * em 127.0.0.1:4000, para o Claude Code (CLAUDE.md, "Infraestrutura e ferramentas").
 *
 * Por que um lançador em vez de `litellm --config ...` direto no package.json:
 *   - PYTHONUTF8=1: no Windows, o banner Unicode do LiteLLM derruba a
 *     inicialização (UnicodeEncodeError, cp1252) quando a saída não é UTF-8;
 *   - --host 127.0.0.1: o padrão do LiteLLM é 0.0.0.0 — exporia o proxy (e o
 *     token do GitHub por trás dele) para a rede local;
 *   - avisa se GITHUB_TOKEN não estiver no ambiente, sem mostrar o valor.
 */
const { spawn } = require('child_process');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

if (!process.env.GITHUB_TOKEN) {
  console.error('\n  ⚠️  GITHUB_TOKEN não está no ambiente deste terminal — o proxy sobe, mas toda chamada ao GitHub Models vai falhar (401).');
  console.error('     PowerShell: $env:GITHUB_TOKEN = "<PAT com Models: read>"   ·   bash: export GITHUB_TOKEN=...\n');
}

const filho = spawn('litellm', ['--config', path.join(RAIZ, 'litellm.config.yaml'), '--host', '127.0.0.1', '--port', '4000'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
});
filho.on('error', (err) => {
  console.error(`\n  Falha ao iniciar o litellm (${err.message}). Instale com: uv tool install "litellm[proxy]"\n`);
  process.exit(1);
});
filho.on('exit', (codigo) => process.exit(codigo ?? 0));
