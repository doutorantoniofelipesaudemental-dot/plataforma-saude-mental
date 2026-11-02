// Trava de 01/11/2026: reagendar.js --aplicar sem --ordem-dr deve recusar ANTES de conectar ao banco.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '../../backend/scripts/reagendar.js');

test('reagendar.js --aplicar sem --ordem-dr é recusado (exit 1, sem conectar ao banco)', () => {
  const r = spawnSync(process.execPath, [SCRIPT, '--aplicar'], { env: { PATH: process.env.PATH }, encoding: 'utf8', timeout: 20000 });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /RECUSADO: reagendar\.js --aplicar está travado/);
});
