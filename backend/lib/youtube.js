/**
 * YouTube Data API v3 — upload de Shorts e vídeos longos (scripts/bot-publicar.js).
 *
 * Autenticação: OAuth 2.0 com refresh token do DONO do canal
 * (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN; obter o
 * refresh token com `npm run youtube:autorizar`). Service Account NÃO serve:
 * o YouTube não permite que conta de serviço publique num canal.
 *
 * Atenção: vídeos enviados por projeto do Google Cloud não verificado ficam
 * privados até o projeto passar pela auditoria de conformidade da API do
 * YouTube — o `privacyStatus` pedido pode ser rebaixado para "private".
 *
 * Upload resumível oficial: POST (metadados) → Location → PUT (bytes).
 * O access token vai só no cabeçalho; nunca é gravado nem logado.
 */
const fs = require('fs');

const LIMITE_TITULO = 100;
const LIMITE_DESCRICAO_BYTES = 5000;
const LIMITE_TAGS = 500;
// 27 = Educação (categorias do YouTube para BR).
const CATEGORIA_PADRAO = '27';

class ErroYoutube extends Error {
  constructor(mensagem, codigo) {
    super(mensagem);
    this.name = 'ErroYoutube';
    this.codigo = codigo;
  }
}

function credenciaisYoutube() {
  const { YOUTUBE_CLIENT_ID: id, YOUTUBE_CLIENT_SECRET: segredo, YOUTUBE_REFRESH_TOKEN: refresh } = process.env;
  return id && segredo && refresh ? { id, segredo, refresh } : null;
}

async function obterAccessToken() {
  const c = credenciaisYoutube();
  if (!c) throw new ErroYoutube('YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET e YOUTUBE_REFRESH_TOKEN precisam estar no .env local.', 'YOUTUBE_SEM_CREDENCIAL');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: c.id, client_secret: c.segredo, refresh_token: c.refresh, grant_type: 'refresh_token' }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) {
    throw new ErroYoutube(`Google recusou o refresh token (${d.error || r.status}: ${d.error_description || ''}) — rode npm run youtube:autorizar`, 'YOUTUBE_TOKEN_INVALIDO');
  }
  return d.access_token;
}

/** Problemas nos metadados antes de gastar cota da API (vazia = ok). */
function validarMetadados({ titulo, descricao, tags }) {
  const falhas = [];
  if (!titulo) falhas.push('sem título');
  if ([...String(titulo)].length > LIMITE_TITULO) falhas.push(`título com mais de ${LIMITE_TITULO} caracteres`);
  if (/[<>]/.test(titulo) || /[<>]/.test(descricao)) falhas.push('"<" ou ">" não são aceitos pelo YouTube');
  if (Buffer.byteLength(String(descricao), 'utf8') > LIMITE_DESCRICAO_BYTES) falhas.push(`descrição acima de ${LIMITE_DESCRICAO_BYTES} bytes`);
  if ((tags || []).join(',').length > LIMITE_TAGS) falhas.push(`tags acima de ${LIMITE_TAGS} caracteres`);
  return falhas;
}

/**
 * Envia o vídeo. `privacidade`: public | unlisted | private.
 * Devolve id, link, status HTTP e a privacidade que o YouTube aplicou.
 */
async function enviarVideo({ arquivo, titulo, descricao, tags = [], privacidade = 'public', short = false }) {
  const token = await obterAccessToken();
  const tamanho = fs.statSync(arquivo).size;
  const inicio = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': String(tamanho),
    },
    body: JSON.stringify({
      snippet: { title: titulo, description: descricao, tags, categoryId: CATEGORIA_PADRAO, defaultLanguage: 'pt-BR', defaultAudioLanguage: 'pt-BR' },
      status: { privacyStatus: privacidade, selfDeclaredMadeForKids: false },
    }),
  });
  const destino = inicio.headers.get('location');
  if (!inicio.ok || !destino) {
    const d = await inicio.json().catch(() => ({}));
    throw new ErroYoutube(`YouTube recusou o início do upload (${inicio.status}: ${d.error?.message || ''})`, 'YOUTUBE_UPLOAD_FALHOU');
  }

  const envio = await fetch(destino, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'video/mp4', 'Content-Length': String(tamanho) },
    body: fs.readFileSync(arquivo),
  });
  const video = await envio.json().catch(() => ({}));
  if (!envio.ok || !video.id) {
    throw new ErroYoutube(`YouTube recusou o vídeo (${envio.status}: ${video.error?.message || ''})`, 'YOUTUBE_UPLOAD_FALHOU');
  }
  return {
    id: video.id,
    link: short ? `https://www.youtube.com/shorts/${video.id}` : `https://www.youtube.com/watch?v=${video.id}`,
    statusHttp: envio.status,
    privacidade: video.status?.privacyStatus || null,
  };
}

module.exports = { enviarVideo, obterAccessToken, validarMetadados, credenciaisYoutube, ErroYoutube };
