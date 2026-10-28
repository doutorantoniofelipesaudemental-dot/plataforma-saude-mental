const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../../scripts/conferencias/monitorTarefas');

test('tarefa desativada pelo Dr. com resultado de falha é aviso, não alerta', () => {
  const a = M.avaliarTarefa({ nome: 'DrSM-LinkedIn-Agendar', ultimoResultado: 1, estado: 'Disabled', hoje: '2026-10-28' });
  assert.ok(a.aviso && !a.alerta);
  assert.match(a.aviso, /pausada pelo Dr/);
});

test('falha já corrigida no código vira aviso até a data indicada', () => {
  const a = M.avaliarTarefa({ nome: 'DrSM-Manutencao-Semanal', ultimoResultado: 1, estado: 'Ready', hoje: '2026-10-28' });
  assert.ok(a.aviso && !a.alerta);
  assert.match(a.aviso, /aguardando a execução até 2026-10-30/);
});

test('depois da data limite, a mesma falha volta a ser alerta com a correção', () => {
  const a = M.avaliarTarefa({ nome: 'DrSM-Manutencao-Semanal', ultimoResultado: 1, estado: 'Ready', hoje: '2026-11-02' });
  assert.match(a.alerta, /credencial do git/);
});

test('tarefa ativa sem regra especial continua sendo alerta (comportamento antigo)', () => {
  const a = M.avaliarTarefa({ nome: 'DrSM-LinkedIn-Agendar', ultimoResultado: 1, estado: 'Ready', hoje: '2026-10-28' });
  assert.match(a.alerta, /LinkedIn/);
});
