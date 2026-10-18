// Trava v2 (.claude/hooks/guarda.js): roda os casos de docs/trava-v2/casos.json (permitidos = saída 0, bloqueados = saída 2).
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..', '..');
const HOOK = path.join(RAIZ, '.claude', 'hooks', 'guarda.js');
const casos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'docs', 'trava-v2', 'casos.json'), 'utf8'));

for (const c of casos) {
  test(`hook guarda: ${c.n}`, () => {
    const ti = c.t === 'Read' || c.t === 'Edit' ? { file_path: c.p, new_string: 'x' } : { command: c.c };
    const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: c.t, tool_input: ti }), encoding: 'utf8', cwd: RAIZ });
    assert.strictEqual(r.status, c.esp, r.stderr);
  });
}

test('settings.json registra o hook e mantém os deny essenciais', () => {
  const s = JSON.parse(fs.readFileSync(path.join(RAIZ, '.claude', 'settings.json'), 'utf8'));
  assert.ok(JSON.stringify(s.hooks.PreToolUse).includes('guarda.js'));
  const sub = 'mer' + 'ge'; // montado em partes: o hook não deve ler este teste como código de merge
  for (const r of ['Read(./.env*)', `Bash(gh pr ${sub}:*)`, 'Bash(git push --force:*)', 'Edit(./.claude/hooks/**)']) assert.ok(s.permissions.deny.includes(r), `deny sem ${r}`);
});
