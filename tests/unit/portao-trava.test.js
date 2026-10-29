const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { tentarTrava, soltarTrava, aguardarTravaSync } = require('../../scripts/lib/portaoTrava');

const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'drs-trava-')), 'portao.lock');
const todosVivos = () => true;
const nenhumVivo = () => false;

test('pega a trava quando está livre e grava o pid', () => {
  const arq = tmp();
  assert.equal(tentarTrava({ arquivo: arq, pid: 10, vivo: todosVivos }).pegou, true);
  assert.equal(JSON.parse(fs.readFileSync(arq, 'utf8')).pid, 10);
});

test('não pega quando o dono está vivo e a trava é recente', () => {
  const arq = tmp();
  tentarTrava({ arquivo: arq, pid: 10, vivo: todosVivos, agora: 1000 });
  const r = tentarTrava({ arquivo: arq, pid: 11, vivo: todosVivos, agora: 2000 });
  assert.equal(r.pegou, false);
  assert.equal(r.dono.pid, 10);
});

test('toma a trava de processo morto, com aviso', () => {
  const arq = tmp();
  tentarTrava({ arquivo: arq, pid: 10, vivo: todosVivos, agora: 1000 });
  const r = tentarTrava({ arquivo: arq, pid: 11, vivo: nenhumVivo, agora: 2000 });
  assert.equal(r.pegou, true);
  assert.match(r.motivo, /antiga/);
});

test('toma a trava com mais de 2 horas mesmo com o dono vivo', () => {
  const arq = tmp();
  tentarTrava({ arquivo: arq, pid: 10, vivo: todosVivos, agora: 0 });
  assert.equal(tentarTrava({ arquivo: arq, pid: 11, vivo: todosVivos, agora: 3 * 60 * 60 * 1000 }).pegou, true);
});

test('soltar só remove a trava do próprio processo', () => {
  const arq = tmp();
  tentarTrava({ arquivo: arq, pid: 10, vivo: todosVivos });
  soltarTrava({ arquivo: arq, pid: 11 });
  assert.equal(fs.existsSync(arq), true);
  soltarTrava({ arquivo: arq, pid: 10 });
  assert.equal(fs.existsSync(arq), false);
});

test('aguardar espera o dono soltar e depois pega; estoura o limite se não soltar', () => {
  const arq = tmp();
  tentarTrava({ arquivo: arq, pid: process.pid, vivo: todosVivos });
  assert.throws(() => aguardarTravaSync({ arquivo: arq, intervaloMs: 5, limiteMs: 20 }), /em uso por outro processo/);
  soltarTrava({ arquivo: arq, pid: process.pid });
  const r = aguardarTravaSync({ arquivo: arq, intervaloMs: 5, limiteMs: 1000 });
  assert.equal(r.pegou, true);
});
