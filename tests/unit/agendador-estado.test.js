const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { decidirAcao, deveDesativar } = require('../../scripts/agendadorEstado');

test('tarefa nova nasce ativada, a menos que seja marcada para nascer desativada', () => {
  assert.equal(decidirAcao({ existe: false, ativa: false }), 'criar-ativada');
  assert.equal(decidirAcao({ existe: false, ativa: false, nascerDesativada: true }), 'criar-desativada');
});

test('tarefa existente desativada continua desativada, mesmo que o script a atualize', () => {
  assert.equal(decidirAcao({ existe: true, ativa: false }), 'atualizar-mantendo-desativada');
  assert.equal(decidirAcao({ existe: true, ativa: false, nascerDesativada: true }), 'atualizar-mantendo-desativada');
});

test('tarefa existente ativa continua ativa, mesmo quando marcada para nascer desativada', () => {
  assert.equal(decidirAcao({ existe: true, ativa: true }), 'atualizar-mantendo-ativada');
  assert.equal(decidirAcao({ existe: true, ativa: true, nascerDesativada: true }), 'atualizar-mantendo-ativada');
});

test('só as ações que terminam em "desativada" mandam desativar', () => {
  assert.equal(deveDesativar('criar-desativada'), true);
  assert.equal(deveDesativar('atualizar-mantendo-desativada'), true);
  assert.equal(deveDesativar('criar-ativada'), false);
  assert.equal(deveDesativar('atualizar-mantendo-ativada'), false);
});

test('script do agendador: tem -Simular e não recria o gatilho antigo das 12:30', () => {
  const ps = fs.readFileSync(path.join(__dirname, '../../scripts/agendar-tarefas-windows.ps1'), 'utf8');
  assert.match(ps, /\[switch\]\$Simular/);
  assert.doesNotMatch(ps, /-At 12:30/);
});
