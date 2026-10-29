const test = require('node:test');
const assert = require('node:assert/strict');
const { candidatosAEncerrar } = require('../../scripts/lib/encerrarTesteOrfao');

const SERVIDOR = { pid: 100, paiPid: 1, cmd: 'node --env-file-if-exists="C:\DRS-licoes\.env" index.js', exe: 'C:\Program Files\nodejs\node.exe' };

test('encerra o servidor de teste que ouve na porta, de pasta DRS*', () => {
  assert.deepEqual(candidatosAEncerrar({ escuta: [100], processos: [SERVIDOR] }), [100]);
});

test('não encerra o que ouve na porta mas não é do projeto (ex.: outro programa)', () => {
  const outro = { ...SERVIDOR, pid: 200, cmd: 'node server.js' };
  assert.deepEqual(candidatosAEncerrar({ escuta: [200], processos: [outro] }), []);
  const fora = { ...SERVIDOR, pid: 201, cmd: 'node index.js', exe: 'x' };
  assert.deepEqual(candidatosAEncerrar({ escuta: [201], processos: [fora] }), []);
});

test('encerra navegador do Playwright órfão (pai morto), mas não o de pai vivo', () => {
  const orfao = { pid: 300, paiPid: 999, cmd: '', exe: 'C:\\Users\\x\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1\\chrome-headless-shell.exe' };
  const comPaiVivo = { ...orfao, pid: 301, paiPid: 100 };
  const pai = { pid: 100, paiPid: 1, cmd: 'node mcp.js', exe: 'node.exe' };
  assert.deepEqual(candidatosAEncerrar({ escuta: [], processos: [pai, comPaiVivo, orfao] }), [300]);
});

test('Chrome do usuário nunca entra na lista', () => {
  const chrome = { pid: 400, paiPid: 1, cmd: '--type=renderer', exe: 'C:\Program Files\Google\Chrome\Application\chrome.exe' };
  assert.deepEqual(candidatosAEncerrar({ escuta: [], processos: [chrome] }), []);
});
