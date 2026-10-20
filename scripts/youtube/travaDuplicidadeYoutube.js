/**
 * Trava contra publicação duplicada do YouTube (ordem de 20/10/2026). O registro vive no BANCO (coleção youtube_publicados),
 * não só em fila.json: se o arquivo for perdido ou regredir, o banco ainda impede de subir o mesmo vídeo de novo.
 */
const COLECAO = 'youtube_publicados';

async function jaRegistrado(col, id) {
  return Boolean(await col.findOne({ _id: id }));
}

// Grava depois do upload. Se falhar, quem chama deve PARAR (o vídeo já está no ar; não pode subir de novo).
async function registrar(col, { id, youtubeId, publicadoEm }) {
  await col.insertOne({ _id: id, youtubeId, publicadoEm });
}

module.exports = { COLECAO, jaRegistrado, registrar };
