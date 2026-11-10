/**
 * Limpa o que um portão interrompido deixou para trás (ordem de 28/10/2026): o servidor de teste da porta 3000
 * e os navegadores do Playwright cujo processo pai já não existe. Só mexe no que é do projeto:
 *   - servidor: ouve na porta de teste e a linha de comando é `index.js` de uma pasta DRS* (o repositório e os worktrees);
 *   - navegador: executável dentro de `ms-playwright` e pai morto. Navegador do MCP ou do Chrome do usuário tem pai vivo ou não é deste cache.
 * Chamado no início de cada portão (com a trava já tomada) e na saída normal.
 */
const { spawnSync } = require('node:child_process');

const PORTA_TESTE = 3000;
const SERVIDOR_TESTE = /index\.js/;
const PASTA_PROJETO = /DRS(AUDEMENTAL|-[\w-]+)/i;
const NAVEGADOR_TESTE = /ms-playwright/i;

/** Função pura: dada a lista de processos e as pids que ouvem na porta, devolve as pids a encerrar. */
function candidatosAEncerrar({ escuta = [], processos = [] }) {
  const vivos = new Set(processos.map((p) => p.pid));
  const pids = new Set();
  for (const p of processos) {
    const cmd = p.cmd || '';
    const exe = p.exe || '';
    if (escuta.includes(p.pid) && SERVIDOR_TESTE.test(cmd) && PASTA_PROJETO.test(cmd)) pids.add(p.pid);
    if (NAVEGADOR_TESTE.test(exe) && !vivos.has(p.paiPid)) pids.add(p.pid);
  }
  return [...pids];
}

function listarProcessos() {
  const script = `$escuta = @(Get-NetTCPConnection -LocalPort ${PORTA_TESTE} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { [int]$_.OwningProcess }); $procs = @(Get-CimInstance Win32_Process | ForEach-Object { [pscustomobject]@{ pid = [int]$_.ProcessId; paiPid = [int]$_.ParentProcessId; cmd = [string]$_.CommandLine; exe = [string]$_.ExecutablePath } }); [pscustomobject]@{ escuta = $escuta; processos = $procs } | ConvertTo-Json -Depth 4 -Compress`;
  const r = spawnSync('powershell', ['-NoProfile', '-Command', script], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0 || !r.stdout) return { escuta: [], processos: [] };
  return interpretarSaidaProcessos(r.stdout);
}

/**
 * Interpreta a saída JSON do PowerShell. A linha de comando de alguns processos traz caractere de controle
 * que o ConvertTo-Json (PowerShell 5.1) não escapa: isso quebrava o JSON.parse e o portão parava no 1º passo.
 * Caracteres de controle viram espaço (são irrelevantes na estrutura JSON). Saída vazia = nenhum processo.
 * Se ainda assim não for JSON válido, LANÇA erro: não se finge que a limpeza rodou (falha fechada).
 */
function interpretarSaidaProcessos(saida) {
  const semBom = String(saida).replace(/^﻿/, '');
  const limpo = semBom.replace(/[\u0000-\u001f]+/g, ' ').trim();
  if (!limpo) return { escuta: [], processos: [] };
  let j;
  try {
    j = JSON.parse(limpo);
  } catch (erro) {
    throw new Error('encerrarTesteOrfao: saída de processos não é JSON válido (' + erro.message + ')');
  }
  return { escuta: [].concat(j.escuta || []), processos: [].concat(j.processos || []) };
}

/** Encerra as árvores de processo encontradas. Devolve as pids encerradas (vazio se nada). Só no Windows; em outros sistemas não faz nada. */
function encerrarTesteOrfao({ dryRun = false } = {}) {
  if (process.platform !== 'win32') return [];
  const pids = candidatosAEncerrar(listarProcessos());
  if (!dryRun) for (const pid of pids) spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  return pids;
}

module.exports = { encerrarTesteOrfao, candidatosAEncerrar, interpretarSaidaProcessos, PORTA_TESTE };
