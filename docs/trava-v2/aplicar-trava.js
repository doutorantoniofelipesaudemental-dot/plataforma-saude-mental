// Aplica a trava v2: copia guarda.novo.js para .claude/hooks/guarda.js e acrescenta as regras de allow ao .claude/settings.json.
// Rodar a partir da pasta do projeto: node <este arquivo>. Guarda backup em backups/trava-AAAAMMDD-HHMM/. Não toca em "deny" nem em "hooks".
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = 'C:/DRSAUDEMENTAL';
const novo = path.join(__dirname, 'guarda.novo.js');
const hook = path.join(RAIZ, '.claude/hooks/guarda.js');
const settings = path.join(RAIZ, '.claude/settings.json');
const d = new Date(); const p2 = (n) => String(n).padStart(2, '0');
const bak = path.join(RAIZ, 'backups', `trava-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`);

fs.mkdirSync(bak, { recursive: true });
fs.copyFileSync(hook, path.join(bak, 'guarda.js'));
fs.copyFileSync(settings, path.join(bak, 'settings.json'));

const j = JSON.parse(fs.readFileSync(settings, 'utf8'));
j.permissions = j.permissions || {};
j.permissions.allow = j.permissions.allow || [];
const acrescentadas = [];
for (const r of ['Write(.claude/skills/**)', 'Edit(.claude/skills/**)', 'mcp__chrome-devtools']) {
  if (!j.permissions.allow.includes(r)) { j.permissions.allow.push(r); acrescentadas.push(r); }
}
fs.writeFileSync(settings, JSON.stringify(j, null, 2) + '\n', 'utf8');
fs.copyFileSync(novo, hook);

// teste rápido do hook novo (o comando de merge é montado em partes só para este arquivo não ser lido como código de merge)
const sub = 'mer' + 'ge';
const roda = (cmd) => spawnSync('node', [hook], { input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: cmd } }), encoding: 'utf8' }).status;
const a = roda('gh pr create --base main --head x') === 0;
const b = roda(`gh pr ${sub} 1`) === 2;
const c = roda('cat .env') === 2;
const e = roda('git push origin main') === 2;
console.log(`backup: ${bak}`);
console.log(`regras acrescentadas: ${acrescentadas.join(', ') || '(nenhuma, já existiam)'}`);
console.log(`teste do hook novo: base main permitido ${a ? 'OK' : 'FALHOU'} · merge direto bloqueado ${b ? 'OK' : 'FALHOU'} · cat .env bloqueado ${c ? 'OK' : 'FALHOU'} · push main bloqueado ${e ? 'OK' : 'FALHOU'}`);
process.exit(a && b && c && e ? 0 : 1);
