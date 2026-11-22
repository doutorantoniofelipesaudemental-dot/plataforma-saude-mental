/**
 * YouTube Data API v3 — upload de Shorts e vídeos longos (scripts/bot-publicar.js).
 *
 * Autenticação: OAuth 2.0 com refresh token do DONO do canal
 * (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN; obter o
 * refresh token com `npm run youtube:autorizar`). Service Account NÃO serve:
 * o YouTube não permite que conta de serviço publique num canal.
 *
 * Atenção: o `privacyStatus` pedido é o aplicado; a verificação do resultado é feita depois do envio.
 * (03/11/2026: a auditoria do YouTube foi encerrada pelo Google em 02/11; a API não força privado por projeto não verificado.)
 *
 * Upload resumível oficial: POST (metadados) → Location → PUT (bytes).
 * O access token vai só no cabeçalho; nunca é gravado nem logado.
 */
const fs = require('fs');
const { exigirRedesAtivas } = require('./freioRedes');

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
// Status do envio. Com publicarEm (ISO): privado + publishAt (o YouTube publica sozinho na data). Sem: privacidade pedida.
function montarStatus({ privacidade = 'public', publicarEm = null } = {}) {
  if (publicarEm) {
    if (Number.isNaN(Date.parse(publicarEm))) throw new ErroYoutube('publicarEm inválido (use ISO 8601)', 'YOUTUBE_PUBLICARTEM_INVALIDO');
    return { privacyStatus: 'private', publishAt: new Date(publicarEm).toISOString(), selfDeclaredMadeForKids: false };
  }
  return { privacyStatus: privacidade, selfDeclaredMadeForKids: false };
}

// Corpo multipart/related da legenda (captions.insert com uploadType=multipart): metadados + arquivo SRT.
function montarCorpoLegenda({ videoId, srt, boundary = 'drsm-legenda-boundary' }) {
  const meta = { snippet: { videoId, language: 'pt', name: 'Português', isDraft: false } };
  return Buffer.concat([
    Buffer.from(`--${boundary}
Content-Type: application/json; charset=UTF-8

${JSON.stringify(meta)}
--${boundary}
Content-Type: application/octet-stream

`, 'utf8'),
    Buffer.from(srt, 'utf8'),
    Buffer.from(`
--${boundary}--
`, 'utf8'),
  ]);
}

async function enviarLegenda({ videoId, arquivo, token }) {
  const boundary = 'drsm-legenda-boundary';
  const corpo = montarCorpoLegenda({ videoId, srt: fs.readFileSync(arquivo, 'utf8'), boundary });
  const r = await fetch('https://www.googleapis.com/upload/youtube/v3/captions?uploadType=multipart&part=snippet', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: corpo,
  });
  if (!r.ok) throw new ErroYoutube(`legenda não enviada (HTTP ${r.status})`, 'YOUTUBE_LEGENDA_FALHOU');
  return r.status;
}

async function enviarVideo({ arquivo, titulo, descricao, tags = [], privacidade = 'public', publicarEm = null, short = false }) {
  exigirRedesAtivas('upload no YouTube');
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
      status: montarStatus({ privacidade, publicarEm }),
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

// Privacidade que o YouTube deve aplicar: com publicarEm o upload é sempre privado (publishAt publica na data).
function privacidadeEsperada({ privacidade = 'public', publicarEm = null } = {}) {
  return publicarEm ? 'private' : privacidade;
}

// Lê o estado de processamento de um vídeo (resposta de videos.list part=status,processingDetails).
function interpretarProcessamento(json) {
  const it = (json && json.items || [])[0];
  if (!it) return 'aguardar';
  const p = it.processingDetails?.processingStatus;
  const u = it.status?.uploadStatus;
  if (p === 'succeeded' || (!p && u === 'processed')) return 'pronto';
  if (p === 'failed' || p === 'terminated' || u === 'failed' || u === 'rejected') return 'falha';
  return 'aguardar';
}

// Espera o YouTube terminar de processar o vídeo antes de aceitar legenda (senão a legenda dá HTTP 400).
// Devolve 'pronto' ou 'tempo esgotado'. Falha de processamento lança ErroYoutube.
async function aguardarProcessamento({ videoId, token, limiteMs = 10 * 60 * 1000, intervaloMs = 20 * 1000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const inicio = Date.now();
  for (;;) {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id=${encodeURIComponent(videoId)}`, { headers: { Authorization: `Bearer ${token}` } });
    const estado = interpretarProcessamento(await r.json().catch(() => ({})));
    if (estado === 'pronto') return 'pronto';
    if (estado === 'falha') throw new ErroYoutube('processamento do vídeo falhou no YouTube', 'YOUTUBE_PROCESSAMENTO_FALHOU');
    if (Date.now() - inicio >= limiteMs) return 'tempo esgotado';
    await sleep(intervaloMs);
  }
}

module.exports = { enviarVideo, enviarLegenda, montarStatus, montarCorpoLegenda, obterAccessToken, validarMetadados, credenciaisYoutube, ErroYoutube, privacidadeEsperada, interpretarProcessamento, aguardarProcessamento };
