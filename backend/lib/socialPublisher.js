/**
 * Publicação de artigos aprovados no Instagram e LinkedIn, com tripla
 * checagem antes de qualquer chamada de escrita a uma API externa.
 *
 * ATENÇÃO — sistemas de publicação já existentes neste projeto: a raiz do
 * repo tem `publicar_instagram.py` (Graph API direto) e `post_instagram.py`
 * (via Composio, com legenda gerada por Claude), ambos para Instagram. Este
 * módulo é um caminho adicional, disparado a partir do status de aprovação
 * do artigo no MongoDB, e cobre Instagram + LinkedIn. Não rode os três ao
 * mesmo tempo para o mesmo artigo — risco de post duplicado.
 *
 * Fluxo: checarStatusAprovado -> checarUrlsAcessiveis -> montarPayloads
 * (sempre) -> só executa a chamada de fato com { confirmar: true }.
 */

const db = require('./db');
const Artigo = require('../models/Artigo');

const BASE_URL = 'https://drsaudemental.vercel.app';
const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

class ErroPublicacao extends Error {
  constructor(mensagem, codigo) {
    super(mensagem);
    this.name = 'ErroPublicacao';
    this.codigo = codigo;
  }
}

function requerEnv(nome) {
  const valor = process.env[nome];
  if (!valor) {
    throw new ErroPublicacao(`Variável de ambiente ${nome} não definida.`, 'ENV_AUSENTE');
  }
  return valor;
}

/* ============================== Checagem 1 =============================== */
/** Confirma status === 'aprovado' no MongoDB antes de qualquer outra coisa. */
async function checarStatusAprovado(artigoId) {
  await db.connect();
  const artigo = await Artigo.findById(artigoId).lean();

  if (!artigo) {
    throw new ErroPublicacao(`Artigo ${artigoId} não encontrado.`, 'ARTIGO_NAO_ENCONTRADO');
  }
  if (artigo.status !== 'aprovado') {
    throw new ErroPublicacao(
      `Artigo "${artigo.titulo}" está com status "${artigo.status}", não "aprovado". Publicação bloqueada — aprove antes pela rota administrativa.`,
      'STATUS_NAO_APROVADO'
    );
  }
  if (!artigo.publicado) {
    throw new ErroPublicacao(
      `Artigo "${artigo.titulo}" está aprovado para redes mas não está publicado no site (publicado=false) — a URL não existiria publicamente.`,
      'NAO_PUBLICADO_NO_SITE'
    );
  }
  return artigo;
}

/* ============================== Checagem 2 =============================== */
/** Confirma que a URL do artigo e a og:image (capa) respondem 200 OK. */
async function checarUrlsAcessiveis(artigo) {
  const url = `${BASE_URL}/artigo/${encodeURIComponent(artigo.slug)}`;

  const respArtigo = await fetchComTimeout(url);
  if (!respArtigo.ok) {
    throw new ErroPublicacao(`URL do artigo respondeu ${respArtigo.status}: ${url}`, 'URL_ARTIGO_INACESSIVEL');
  }

  if (!artigo.imagemCapa) {
    throw new ErroPublicacao(
      `Artigo "${artigo.titulo}" não tem imagemCapa — obrigatória para publicar no Instagram (og:image também usada pelo LinkedIn).`,
      'SEM_IMAGEM_CAPA'
    );
  }
  const respImagem = await fetchComTimeout(artigo.imagemCapa);
  if (!respImagem.ok) {
    throw new ErroPublicacao(`og:image respondeu ${respImagem.status}: ${artigo.imagemCapa}`, 'OG_IMAGE_INACESSIVEL');
  }

  return { url };
}

async function fetchComTimeout(url, { timeoutMs = 10_000 } = {}) {
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controlador.signal });
  } catch (err) {
    throw new ErroPublicacao(`Falha de rede ao checar ${url}: ${err.message}`, 'REDE_INDISPONIVEL');
  } finally {
    clearTimeout(timer);
  }
}

/* ============================== Checagem 3 =============================== */
/** Monta a legenda e os payloads exatos que seriam enviados — nunca executa sozinha. */
function montarPayloads(artigo, url, redes) {
  const legenda = montarLegenda(artigo, url);
  const payloads = {};

  if (redes.includes('instagram')) {
    payloads.instagram = {
      passo1CriarContainer: {
        endpoint: `${GRAPH_BASE}/${process.env.INSTAGRAM_ACCOUNT_ID || '<INSTAGRAM_ACCOUNT_ID>'}/media`,
        metodo: 'POST',
        corpo: { image_url: artigo.imagemCapa, caption: legenda, access_token: '[REDACTED]' },
      },
      passo2PublicarContainer: {
        endpoint: `${GRAPH_BASE}/${process.env.INSTAGRAM_ACCOUNT_ID || '<INSTAGRAM_ACCOUNT_ID>'}/media_publish`,
        metodo: 'POST',
        corpo: { creation_id: '<preenchido após o passo 1 responder>', access_token: '[REDACTED]' },
      },
    };
  }

  if (redes.includes('linkedin')) {
    payloads.linkedin = {
      endpoint: `${LINKEDIN_API_BASE}/ugcPosts`,
      metodo: 'POST',
      headers: { Authorization: 'Bearer [REDACTED]', 'X-Restli-Protocol-Version': '2.0.0' },
      corpo: {
        author: process.env.LINKEDIN_AUTHOR_URN || '<LINKEDIN_AUTHOR_URN, ex: urn:li:organization:12345678>',
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: legenda },
            shareMediaCategory: 'ARTICLE',
            media: [{ status: 'READY', originalUrl: url, title: { text: artigo.titulo } }],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      },
    };
  }

  return { legenda, payloads };
}

function montarLegenda(artigo, url) {
  return `${artigo.titulo}\n\n${artigo.resumo}\n\nLeia mais: ${url}`;
}

/* ============================ Execução real ============================== */

/** Instagram Graph API — fluxo oficial de 2 passos (Regra 16 do CLAUDE.md): cria o container, espera FINISHED, publica. */
async function publicarNoInstagram({ imagemUrl, legenda }) {
  const token = requerEnv('INSTAGRAM_ACCESS_TOKEN');
  const contaId = requerEnv('INSTAGRAM_ACCOUNT_ID');

  const containerResp = await fetch(`${GRAPH_BASE}/${contaId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ image_url: imagemUrl, caption: legenda, access_token: token }),
  });
  const containerData = await containerResp.json();
  if (!containerResp.ok || !containerData.id) {
    throw new ErroPublicacao(`Falha ao criar container do Instagram: ${JSON.stringify(containerData)}`, 'INSTAGRAM_CONTAINER_FALHOU');
  }

  await aguardarContainerPronto(containerData.id, token);

  const publishResp = await fetch(`${GRAPH_BASE}/${contaId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: containerData.id, access_token: token }),
  });
  const publishData = await publishResp.json();
  if (!publishResp.ok || !publishData.id) {
    throw new ErroPublicacao(`Falha ao publicar container do Instagram: ${JSON.stringify(publishData)}`, 'INSTAGRAM_PUBLISH_FALHOU');
  }
  return { id: publishData.id };
}

async function aguardarContainerPronto(creationId, token, { tentativas = 10, intervaloMs = 3000 } = {}) {
  for (let i = 0; i < tentativas; i += 1) {
    const resp = await fetch(`${GRAPH_BASE}/${creationId}?fields=status_code&access_token=${token}`);
    const data = await resp.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') {
      throw new ErroPublicacao(`Container do Instagram falhou ao processar: ${JSON.stringify(data)}`, 'INSTAGRAM_CONTAINER_ERRO');
    }
    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
  throw new ErroPublicacao('Timeout aguardando o container do Instagram ficar pronto (status_code=FINISHED).', 'INSTAGRAM_TIMEOUT');
}

/** LinkedIn — UGC Posts API. Requer LINKEDIN_AUTHOR_URN (organização ou pessoa), não só o token. */
async function publicarNoLinkedIn({ url, titulo, legenda }) {
  const token = requerEnv('LINKEDIN_ACCESS_TOKEN');
  const autorUrn = requerEnv('LINKEDIN_AUTHOR_URN');

  const resp = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: autorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: legenda },
          shareMediaCategory: 'ARTICLE',
          media: [{ status: 'READY', originalUrl: url, title: { text: titulo } }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });

  if (!resp.ok) {
    const detalhe = await resp.text();
    throw new ErroPublicacao(`Falha ao publicar no LinkedIn (${resp.status}): ${detalhe}`, 'LINKEDIN_PUBLISH_FALHOU');
  }
  return { id: resp.headers.get('x-restli-id') || null };
}

/* =============================== Orquestrador ============================== */

/**
 * @param {string} artigoId
 * @param {object} opcoes
 * @param {('instagram'|'linkedin')[]} [opcoes.redes] - default: as duas.
 * @param {boolean} [opcoes.confirmar] - sem isso, só monta e devolve os payloads (dry-run).
 */
async function publicarArtigoNasRedes(artigoId, { redes = ['instagram', 'linkedin'], confirmar = false } = {}) {
  // Checagem 1
  const artigo = await checarStatusAprovado(artigoId);

  // Checagem 2
  const { url } = await checarUrlsAcessiveis(artigo);

  // Checagem 3 — monta sempre, executa só com confirmação explícita.
  const { legenda, payloads } = montarPayloads(artigo, url, redes);

  if (!confirmar) {
    return {
      executado: false,
      motivo: 'Confirmação explícita ausente — rode de novo com confirmar:true (ou --confirmar no CLI) para publicar de verdade.',
      artigo: { id: String(artigo._id), titulo: artigo.titulo, slug: artigo.slug },
      url,
      legenda,
      payloads,
    };
  }

  const resultados = {};
  if (redes.includes('instagram')) {
    resultados.instagram = await publicarNoInstagram({ imagemUrl: artigo.imagemCapa, legenda });
  }
  if (redes.includes('linkedin')) {
    resultados.linkedin = await publicarNoLinkedIn({ url, titulo: artigo.titulo, legenda });
  }

  await Artigo.findByIdAndUpdate(artigoId, { status: 'publicado' });

  return { executado: true, artigo: { id: String(artigo._id), titulo: artigo.titulo, slug: artigo.slug }, url, resultados };
}

module.exports = {
  ErroPublicacao,
  checarStatusAprovado,
  checarUrlsAcessiveis,
  montarPayloads,
  publicarNoInstagram,
  publicarNoLinkedIn,
  publicarArtigoNasRedes,
};
