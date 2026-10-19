/**
 * Botão de desligar do agendamento diário do LinkedIn: desativa a tarefa DrSM-LinkedIn-Agendar e marca pausa no estado.
 *   npm run linkedin:pausar                 desativa a tarefa e marca pausa no estado
 *   node scripts/linkedin/pausar.js --simular   só mostra o que faria (não desativa, não grava estado)
 * Para religar: só por ordem do Dr. Antônio (Enable-ScheduledTask DrSM-LinkedIn-Agendar e apagar "pausado" no estado).
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '../..');
const ESTADO = path.join(RAIZ, 'relatorios/linkedin/agendar-diario-estado.json');
const TAREFA = 'DrSM-LinkedIn-Agendar';

if (process.argv.includes('--simular')) {
  console.log(`simulação: rodaria "Disable-ScheduledTask -TaskName ${TAREFA}" e marcaria "pausado" em ${path.relative(RAIZ, ESTADO)}. Nada foi alterado.`);
  process.exit(0);
}

const r = spawnSync('powershell', ['-NoProfile', '-Command', `Disable-ScheduledTask -TaskName ${TAREFA}`], { encoding: 'utf8' });
let estado = {};
try { estado = JSON.parse(fs.readFileSync(ESTADO, 'utf8')); } catch { /* sem estado ainda */ }
fs.mkdirSync(path.dirname(ESTADO), { recursive: true });
fs.writeFileSync(ESTADO, `${JSON.stringify({ ...estado, pausado: true, pausadoEm: new Date().toISOString() }, null, 1)}\n`, 'utf8');
console.log(r.status === 0 ? 'agendamento do LinkedIn PAUSADO (tarefa desativada).' : `não consegui desativar a tarefa (código ${r.status}); estado marcado como pausado mesmo assim.`);
