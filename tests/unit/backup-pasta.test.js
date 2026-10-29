const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { backupAntesDeSobrescrever, contarArquivos } = require('../../scripts/lib/backupPasta');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'drs-backup-'));

test('pasta com arquivos é copiada para backups/ antes de ser sobrescrita', () => {
  const raiz = tmp();
  const dir = path.join(raiz, 'short-x');
  fs.mkdirSync(path.join(dir, 'sub'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'a.txt'), '1');
  fs.writeFileSync(path.join(dir, 'sub', 'b.txt'), '2');
  const destino = backupAntesDeSobrescrever(dir, { raiz, agora: new Date(2026, 9, 28, 21, 5) });
  assert.equal(destino, path.join(raiz, 'backups', 'short-x-20261028-2105'));
  assert.equal(contarArquivos(destino), 2);
  assert.equal(fs.readFileSync(path.join(destino, 'sub', 'b.txt'), 'utf8'), '2');
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('nome repetido ganha sufixo -2 e não sobrescreve o backup anterior', () => {
  const raiz = tmp();
  const dir = path.join(raiz, 'pasta');
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'a'), '1');
  const agora = new Date(2026, 9, 28, 21, 5);
  const primeiro = backupAntesDeSobrescrever(dir, { raiz, agora });
  const segundo = backupAntesDeSobrescrever(dir, { raiz, agora });
  assert.notEqual(primeiro, segundo);
  assert.match(segundo, /-2$/);
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('pasta ausente ou vazia não gera backup', () => {
  const raiz = tmp();
  assert.equal(backupAntesDeSobrescrever(path.join(raiz, 'nao-existe'), { raiz }), null);
  fs.mkdirSync(path.join(raiz, 'vazia'));
  assert.equal(backupAntesDeSobrescrever(path.join(raiz, 'vazia'), { raiz }), null);
  assert.equal(fs.existsSync(path.join(raiz, 'backups')), false);
  fs.rmSync(raiz, { recursive: true, force: true });
});
