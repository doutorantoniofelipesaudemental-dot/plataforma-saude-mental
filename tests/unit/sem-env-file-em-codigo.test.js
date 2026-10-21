const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '../..');
const arquivosJs = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return e.name === 'node_modules' || e.name.startsWith('.') ? [] : arquivosJs(p);
  return /\.(js|mjs)$/.test(e.name) ? [p] : [];
});

test('código não passa --env-file para processos filhos (o script carrega o .env por dentro)', () => {
  const achados = [];
  for (const dir of ['scripts', 'backend']) {
    for (const f of arquivosJs(path.join(RAIZ, dir))) {
      const linhas = fs.readFileSync(f, 'utf8').split(/\r?\n/);
      linhas.forEach((l, i) => { if (/\[\s*['"]--env-file/.test(l)) achados.push(`${path.relative(RAIZ, f)}:${i + 1}`); });
    }
  }
  assert.deepEqual(achados, []);
});

test('os processos filhos convertidos carregam o .env por dentro', () => {
  const alvos = ['backend/scripts/auditoria.js', 'backend/scripts/redes/verificarToken.js', 'backend/scripts/proximoLoteNarracao.js', 'backend/scripts/verificarEEnviarNarracoes.js', 'scripts/linkedin/filaManual.js', 'scripts/youtube/publicarYoutube.js'];
  for (const a of alvos) assert.match(fs.readFileSync(path.join(RAIZ, a), 'utf8'), /carregarEnv\(\)/, a);
});
