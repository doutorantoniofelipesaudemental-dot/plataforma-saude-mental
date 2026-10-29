/**
 * Backup antes de sobrescrever (ordem de 28/10/2026): nenhum gerador apaga ou regrava uma pasta existente sem uma cópia antes.
 * A cópia vai para backups/<nome-da-pasta>-<AAAAMMDD-HHMM>/ (com -2, -3… se o nome já existir). Pasta vazia ou ausente não tem backup.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..');

const carimbo = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

function contarArquivos(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const caminho = path.join(dir, e.name);
    n += e.isDirectory() ? contarArquivos(caminho) : 1;
  }
  return n;
}

/** Copia `dir` para backups/ se existir e tiver arquivos. Devolve o destino, ou null se não havia nada a salvar. Lança erro se a cópia não bater. */
function backupAntesDeSobrescrever(dir, { raiz = RAIZ, agora = new Date() } = {}) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;
  const total = contarArquivos(dir);
  if (total === 0) return null;
  const base = path.join(raiz, 'backups', `${path.basename(dir)}-${carimbo(agora)}`);
  let destino = base;
  for (let k = 2; fs.existsSync(destino); k++) destino = `${base}-${k}`;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.cpSync(dir, destino, { recursive: true });
  if (contarArquivos(destino) !== total) throw new Error(`backup incompleto de ${dir} (${contarArquivos(destino)} de ${total} arquivos)`);
  return destino;
}

module.exports = { backupAntesDeSobrescrever, contarArquivos, carimbo };
