// node testar-trava.js <hook.js> <casos.json>  — roda cada caso no hook e compara o código de saída
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const [hook, casos] = process.argv.slice(2);
let ok = 0, falhas = 0;
for (const c of JSON.parse(fs.readFileSync(casos, 'utf8'))) {
  const ti = c.t === 'Read' || c.t === 'Edit' ? { file_path: c.p, new_string: 'x' } : { command: c.c };
  const r = spawnSync('node', [hook], { input: JSON.stringify({ tool_name: c.t, tool_input: ti }), encoding: 'utf8', cwd: 'C:/DRSAUDEMENTAL' });
  const bom = r.status === c.esp;
  bom ? ok++ : falhas++;
  console.log(`${bom ? 'OK   ' : 'FALHA'} ${c.n} (esperado ${c.esp}, obtido ${r.status})`);
}
console.log(`\n${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
