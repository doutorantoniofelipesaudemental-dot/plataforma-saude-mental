/**
 * Duração real do áudio (segundos) medida com ffprobe (ordem de 30/10/2026: o feed não usa mais caracteres ÷ 15).
 * Função pura lerSegundos() + medição em medirDuracaoMp3(). Sem ffprobe ou com saída inválida, devolve null.
 */
const { spawnSync } = require('node:child_process');

// Função pura: converte a saída do ffprobe (só o valor de format=duration) em segundos com 1 casa decimal.
function lerSegundos(saida) {
  const s = parseFloat(String(saida || '').trim());
  return Number.isFinite(s) && s > 0 ? Math.round(s * 10) / 10 : null;
}

function medirDuracaoMp3(arquivo, { ffprobe = process.env.FFPROBE_BIN || 'ffprobe' } = {}) {
  const r = spawnSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', arquivo], { encoding: 'utf8', timeout: 60_000 });
  if (r.status !== 0) return null;
  return lerSegundos(r.stdout);
}

module.exports = { lerSegundos, medirDuracaoMp3 };
