/**
 * Cópia dos arquivos do pacote para a pasta de upload manual (ordem de 20/10/2026). Copia TUDO o que o conferidor exige:
 * vídeo, capa, legenda .srt (longos) e legendas queimadas cap.ass e credito.ass (Shorts). Nunca sobrescreve arquivo já existente.
 */
const fs = require('node:fs');
const path = require('node:path');

const EXTRAS = ['cap.ass', 'credito.ass'];

// Copia o que falta. Devolve a lista de arquivos copiados (ausentes na origem não são copiados e são informados).
function copiarPacote({ orig, dir, meta }) {
  const copiados = []; const faltando = [];
  const copiar = (de, para) => {
    if (!fs.existsSync(de)) { faltando.push(path.basename(de)); return; }
    if (fs.existsSync(para)) return;
    fs.copyFileSync(de, para); copiados.push(path.basename(para));
  };
  fs.mkdirSync(dir, { recursive: true });
  copiar(path.join(orig, meta.arquivos.video), path.join(dir, meta.arquivos.video));
  copiar(path.join(orig, meta.arquivos.capa), path.join(dir, 'capa.png'));
  if (meta.arquivos.legenda) copiar(path.join(orig, meta.arquivos.legenda), path.join(dir, 'legenda.srt'));
  for (const f of EXTRAS) if (fs.existsSync(path.join(orig, f))) copiar(path.join(orig, f), path.join(dir, f));
  return { copiados, faltando };
}

module.exports = { copiarPacote, EXTRAS };
