/**
 * Checagem de cenas (ordem de 30/10/2026): vídeo com menos de 2 cenas é REPROVADO.
 * Imagem parada (um único quadro com `ffmpeg -loop 1`) não sobe. Até o padrão novo (Remotion/FFmpeg com cenas),
 * os geradores de YouTube passam 1 cena e ficam bloqueados. Não apagar arquivos: só impede a geração.
 */
const MINIMO_CENAS = 2;

function exigirCenasMinimas(cenas, origem = 'Vídeo') {
  if (!Number.isInteger(cenas) || cenas < MINIMO_CENAS) {
    throw new Error(`${origem} reprovado: ${cenas} cena(s), mínimo ${MINIMO_CENAS} (ordem de 30/10/2026). Imagem parada não sobe.`);
  }
  return cenas;
}

module.exports = { MINIMO_CENAS, exigirCenasMinimas };
