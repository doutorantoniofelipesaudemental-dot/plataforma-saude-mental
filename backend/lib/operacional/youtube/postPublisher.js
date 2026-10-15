/**
 * Publicação autônoma no YouTube (Data API v3): upload (ou agendamento via
 * publishAt), legendas .SRT e thumbnail. Reaproveita youtube.js (OAuth/upload).
 */
const fs = require('node:fs');
const yt = require('../../youtube');

const temCredencial = () => {
  try { return Boolean(yt.credenciaisYoutube()); } catch { return false; }
};

/** Título SEO: palavra-chave primeiro, até 100 caracteres, sem < >. */
function tituloSeo(titulo, palavraChave) {
  const t = String(titulo).replace(/[<>]/g, '').trim();
  const base = palavraChave && !t.toLowerCase().includes(palavraChave.toLowerCase()) ? `${palavraChave}: ${t}` : t;
  return [...base].slice(0, 100).join('');
}

async function chamar(url, token, opcoes) {
  const r = await fetch(url, { ...opcoes, headers: { Authorization: `Bearer ${token}`, ...(opcoes.headers || {}) } });
  if (!r.ok) throw new Error(`YouTube ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r;
}

/**
 * @param {{arquivo:string, titulo:string, descricao:string, tags?:string[], palavraChave?:string,
 *          srt?:string, thumbnail?:string, short?:boolean, agendarPara?:string}} peca
 */
async function publicar(peca, { simulado = true } = {}) {
  const titulo = tituloSeo(peca.titulo, peca.palavraChave);
  const falhas = yt.validarMetadados({ titulo, descricao: peca.descricao, tags: peca.tags });
  if (falhas.length) return { rede: 'youtube', bloqueado: `metadados inválidos: ${falhas.join('; ')}` };
  if (simulado) return { rede: 'youtube', simulado: true, id: `sim-yt-${Date.now()}`, titulo, agendado: peca.agendarPara || null, srt: Boolean(peca.srt), thumbnail: Boolean(peca.thumbnail) };
  if (!temCredencial()) return { rede: 'youtube', bloqueado: 'sem credencial válida do YouTube' };

  const video = await yt.enviarVideo({ arquivo: peca.arquivo, titulo, descricao: peca.descricao, tags: peca.tags, privacidade: peca.agendarPara ? 'private' : 'public', short: peca.short });
  const token = await yt.obterAccessToken();
  if (peca.agendarPara) {
    await chamar('https://www.googleapis.com/youtube/v3/videos?part=status', token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: video.id, status: { privacyStatus: 'private', publishAt: new Date(peca.agendarPara).toISOString(), selfDeclaredMadeForKids: false } }),
    });
  }
  if (peca.srt && fs.existsSync(peca.srt)) {
    const limite = 'drsm' + Date.now();
    const meta = JSON.stringify({ snippet: { videoId: video.id, language: 'pt-BR', name: 'Português (Brasil)' } });
    const corpo = `--${limite}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n--${limite}\r\nContent-Type: application/octet-stream\r\n\r\n${fs.readFileSync(peca.srt, 'utf8')}\r\n--${limite}--`;
    await chamar('https://www.googleapis.com/upload/youtube/v3/captions?uploadType=multipart&part=snippet', token, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${limite}` }, body: corpo });
  }
  if (peca.thumbnail && fs.existsSync(peca.thumbnail)) {
    await chamar(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${video.id}`, token, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: fs.readFileSync(peca.thumbnail) });
  }
  return { rede: 'youtube', ...video, agendado: peca.agendarPara || null };
}

module.exports = { publicar, tituloSeo, temCredencial };
