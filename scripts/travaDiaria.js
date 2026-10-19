/**
 * Trava diária das tarefas DrSM-* (plantão, 19/10/2026). Feita pelo agendar-tarefas-windows.ps1:
 *   node --env-file=.env scripts/travaDiaria.js <NomeDaTarefa> <script.js> [args]
 * Roda o comando; se ele já deu certo hoje (dia de Salvador), não roda de novo. Grava o dia só quando termina com código 0,
 * para o Agendador poder reiniciar uma falha no mesmo dia.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const PASTA = path.join(RAIZ, 'relatorios/logs-agendador');
const [tarefa, ...comando] = process.argv.slice(2);

if (!tarefa || !comando.length) {
  console.error('uso: node scripts/travaDiaria.js <NomeDaTarefa> <script.js> [args]');
  process.exit(2);
}

const arquivo = path.join(PASTA, `${tarefa}.dia`);
const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const jaFeitoHoje = () => {
  try { return fs.readFileSync(arquivo, 'utf8').trim() === hoje; } catch { return false; }
};

if (jaFeitoHoje()) {
  console.log(`${tarefa}: já deu certo hoje (${hoje}). Nada feito.`);
  process.exit(0);
}

const r = spawnSync(process.execPath, comando, { cwd: RAIZ, stdio: 'inherit' });
if (r.status === 0) {
  fs.mkdirSync(PASTA, { recursive: true });
  fs.writeFileSync(arquivo, hoje, 'utf8');
}
process.exit(r.status ?? 1);
