/**
 * Copia os arquivos de estado (LISTA do backupEstado.js) para .tmp/estado-AAAAMMDD-HHMM/ antes de qualquer troca de branch
 * na pasta principal (ordem de 27/10/2026: trocar de branch apagou arquivo ignorado pelo Git que era rastreado no branch de origem).
 *   node scripts/guardarEstado.js
 */
const fs = require('node:fs');
const path = require('node:path');
const { LISTA, RAIZ } = require('./backupEstado');

// Função pura: carimbo AAAAMMDD-HHMM (horário local) para o nome da pasta.
function carimbo(agora = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}${p(agora.getMonth() + 1)}${p(agora.getDate())}-${p(agora.getHours())}${p(agora.getMinutes())}`;
}

function guardar(agora = new Date()) {
  const destino = path.join(RAIZ, '.tmp', `estado-${carimbo(agora)}`);
  const copiados = [];
  for (const rel of LISTA) {
    const origem = path.join(RAIZ, rel);
    if (!fs.existsSync(origem)) continue;
    const alvo = path.join(destino, rel);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.copyFileSync(origem, alvo);
    copiados.push(rel);
  }
  return { destino, copiados };
}

module.exports = { carimbo, guardar };

if (require.main === module) {
  const r = guardar();
  console.log(`estado guardado em ${path.relative(RAIZ, r.destino)} (${r.copiados.length} arquivos)`);
}
