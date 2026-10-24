/**
 * Narrações dos textos do app Next (domínio único): regras do envio pela API, usadas por routes/midia.js.
 * Mesma autenticação (exigirAdmin) e mesmas validações da narração do site: tipo, tamanho, MP3 e hash.
 *
 * Caminho no Blob: narracoes/app/<slug>.mp3. Ao lado, narracoes/app/<slug>.hash.json guarda o hash do texto narrado.
 * Um áudio de hash diferente nunca substitui outro sem a ordem X-Narracao-Renarrar: 1 (o item é marcado para renarrar).
 */
const SLUG_RE = /^[a-z0-9-]{3,120}$/;
const HASH_RE = /^[0-9a-f]{64}$/;
const LIMITE_BYTES = 4400 * 1024; // limite de corpo das funções da Vercel, como no site

function caminhoNarracaoApp(slug) {
  return `narracoes/app/${slug}.mp3`;
}

function caminhoHashNarracaoApp(slug) {
  return `narracoes/app/${slug}.hash.json`;
}

/** Erro de validação ({status, mensagem}) ou null quando o envio está correto. */
function validarEnvioNarracaoApp({ slug, audio, hash }) {
  if (!SLUG_RE.test(String(slug || ''))) return { status: 400, mensagem: 'Slug inválido.' };
  if (!Buffer.isBuffer(audio) || audio.length < 1024) return { status: 400, mensagem: 'Envie o MP3 no corpo, com Content-Type: audio/mpeg.' };
  if (audio.length > LIMITE_BYTES) return { status: 413, mensagem: 'MP3 acima do limite de envio.' };
  const ehMp3 = audio.slice(0, 3).toString('latin1') === 'ID3' || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0);
  if (!ehMp3) return { status: 400, mensagem: 'O corpo não é um MP3.' };
  if (!HASH_RE.test(String(hash || ''))) return { status: 400, mensagem: 'Cabeçalho X-Narracao-Hash ausente ou inválido (SHA-256 do texto narrado).' };
  return null;
}

/** Decide se o envio grava. Sem ordem de renarrar, não troca um áudio de texto diferente. */
function decidirGravacaoNarracaoApp({ existente, hash, renarrar }) {
  if (!existente || existente.hash === hash || renarrar) return { gravar: true };
  return {
    gravar: false,
    status: 409,
    mensagem: 'Já existe narração deste texto com outro hash. Envie com X-Narracao-Renarrar: 1 para substituir (o item deve ser marcado para renarrar).',
  };
}

/** Hash guardado pelo último envio ({hash, geradaEm}) ou null. Lê o arquivo ao lado do MP3 no Blob. */
async function lerHashNarracaoApp(slug, list) {
  const caminho = caminhoHashNarracaoApp(slug);
  const r = await list({ prefix: caminho, limit: 1 });
  const arquivo = (r.blobs || []).find((b) => b.pathname === caminho);
  if (!arquivo) return null;
  const resp = await fetch(arquivo.url, { cache: 'no-store' });
  return resp.ok ? resp.json() : null;
}

module.exports = {
  caminhoNarracaoApp,
  caminhoHashNarracaoApp,
  validarEnvioNarracaoApp,
  decidirGravacaoNarracaoApp,
  lerHashNarracaoApp,
  LIMITE_BYTES,
};
