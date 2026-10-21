const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../../scripts/conferencias/monitorTarefas');

test('resultado 0 e tarefas ainda não rodadas ou em execução: sem alerta', () => {
  assert.equal(M.avaliarTarefa({ nome: 'DrSM-LinkedIn-Agendar', ultimoResultado: 0 }), 'ok');
  assert.equal(M.avaliarTarefa({ nome: 'DrSM-LinkedIn-Agendar', ultimoResultado: 267011 }), 'ok');
  assert.equal(M.avaliarTarefa({ nome: 'DrSM-LinkedIn-Agendar', ultimoResultado: 267009 }), 'ok');
});

test('falha: alerta com o código e a correção específica da tarefa', () => {
  const a = M.avaliarTarefa({ nome: 'DrSM-Manutencao-Semanal', ultimoResultado: 1 });
  assert.match(a.alerta, /código 1/);
  assert.match(a.alerta, /credencial do git/);
  const b = M.avaliarTarefa({ nome: 'DrSM-LinkedIn-Agendar', ultimoResultado: 1 });
  assert.match(b.alerta, /LinkedIn/);
});

test('tarefa sem correção cadastrada aponta o log', () => {
  const a = M.avaliarTarefa({ nome: 'DrSM-Outra', ultimoResultado: 2 });
  assert.match(a.alerta, /logs-agendador\/DrSM-Outra\.log/);
});
