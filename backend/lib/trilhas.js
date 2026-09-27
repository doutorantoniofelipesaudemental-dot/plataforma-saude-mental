/**
 * Trilhas instrumentais de fundo para os vídeos do bot (assets/audio/*.mp3).
 *
 * Os MP3 ficam FORA do git (repositório público: redistribuir a faixa pode
 * violar a licença). Só entra na pasta faixa com licença de uso comercial em
 * redes sociais — ver assets/audio/LEIA-ME.md.
 *
 * A escolha é determinística pelo slug: o mesmo artigo recebe sempre a mesma
 * trilha, então regerar o vídeo produz o mesmo resultado (e a aprovação do
 * arquivo por hash continua fazendo sentido).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PASTA_TRILHAS = path.join(__dirname, '..', '..', 'assets', 'audio');

function listarTrilhas(pasta = PASTA_TRILHAS) {
  if (!fs.existsSync(pasta)) return [];
  return fs
    .readdirSync(pasta)
    .filter((f) => /\.mp3$/i.test(f))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => path.join(pasta, f));
}

/** Trilha do artigo, ou null se a pasta estiver vazia. */
function escolherTrilha(slug, trilhas = listarTrilhas()) {
  if (!trilhas.length) return null;
  const n = crypto.createHash('sha256').update(String(slug)).digest().readUInt32BE(0);
  return trilhas[n % trilhas.length];
}

module.exports = { PASTA_TRILHAS, listarTrilhas, escolherTrilha };
