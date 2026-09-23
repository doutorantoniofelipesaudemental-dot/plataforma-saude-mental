/**
 * Publicação de artigos aprovados no Instagram e LinkedIn, com tripla
 * checagem antes de qualquer chamada de escrita a uma API externa, e
 * disparo automático (opcional, ver AUTO_PUBLICAR_REDES) a partir do status
 * do artigo no MongoDB.
 *
 * ATENÇÃO — sistemas de publicação já existentes neste projeto: a raiz do
 * repo tem `publicar_instagram.py` (Graph API direto) e `post_instagram.py`
 * (via Composio, com legenda gerada por Claude), ambos para Instagram. Este
 * módulo é um caminho adicional, disparado a partir do status de aprovação
 * do artigo no MongoDB. Não rode os três ao mesmo tempo para o mesmo artigo
 * — risco de post duplicado.
 *
 * ESCOPO REAL DO QUE ESTE MÓDULO PUBLICA DE VERDADE VIA API (importante não
 * confundir com os "pacotes de mídia" gerados como texto/roteiro):
 *   - Instagram feed (imagem única = imagemCapa do artigo): publica de verdade.
 *   - LinkedIn (compartilhamento de link do artigo): publica de verdade.
 *   - Reel, Stories e YouTube Short: este projeto não tem pipeline de vídeo
 *     nem asset com URL pública para essas mídias (a única imagem com URL
 *     pública é `imagemCapa`; os carrosséis são gerados como PNG local, sem
 *     upload). Por isso essas três saem como PACOTE DE TEXTO/ROTEIRO pronto
 *     para produção e publicação manual (ou por uma ferramenta externa) — a
 *     função `dispararPublicacaoAutomatica` NUNCA finge postar essas três.
 *
 * INTERRUPTOR DE SEGURANÇA — AUTO_PUBLICAR_REDES:
 *   Por padrão (variável ausente ou "false"), `dispararPublicacaoAutomatica`
 *   monta tudo (pacotes de mídia, payloads, checagens) e NÃO publica nada —
 *   só loga. Só publica de verdade no Instagram/LinkedIn quando
 *   AUTO_PUBLICAR_REDES=true está definida no ambiente. Esse é um switch que
 *   o dono do site liga deliberadamente — nunca o padrão de fábrica. Ver
 *   Seção 20 do CLAUDE.md para a decisão por trás disso.
 *
 * Fluxo: checarStatusAprovado -> checarUrlsAcessiveis (inclui o webapp,
 * quando existe) -> montarPayloads + montarPacotesMidia (sempre) -> só
 * executa a chamada de fato com { confirmar: true }.
 */

const db = require('./db');
const Artigo = require('../models/Artigo');
const { montarSlides } = require('./carrossel');

const BASE_URL = 'https://drsaudemental.vercel.app';
const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

/** Interruptor de segurança — ver nota no topo do arquivo. Desligado por padrão. */
function autoPublicarLigado() {
  return process.env.AUTO_PUBLICAR_REDES === 'true';
}

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
/** Confirma status === 'aprovado' e integridade básica do artigo (e do webapp, se houver) no MongoDB. */
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
  if (!artigo.conteudo || artigo.conteudo.trim().length < 50) {
    throw new ErroPublicacao(`Artigo "${artigo.titulo}" está com conteúdo vazio ou suspeito demais para publicar.`, 'CONTEUDO_INVALIDO');
  }
  return artigo;
}

/** Detecta se o artigo tem um miniaplicativo embutido (ver Seção 20/`ferramenta-embutida` no CSS) e devolve o id do container, se houver. */
function detectarWebapp(artigo) {
  const m = /id="(ferramenta-[a-z0-9-]+)"/.exec(artigo.conteudo || '');
  return m ? m[1] : null;
}

/* ============================== Checagem 2 =============================== */
/** Confirma que a URL do artigo, a og:image e (se houver) o webapp embutido respondem/estão presentes em produção. */
async function checarUrlsAcessiveis(artigo) {
  const url = `${BASE_URL}/artigo/${encodeURIComponent(artigo.slug)}`;

  const respArtigo = await fetchComTimeout(url);
  if (!respArtigo.ok) {
    throw new ErroPublicacao(`URL do artigo respondeu ${respArtigo.status}: ${url}`, 'URL_ARTIGO_INACESSIVEL');
  }

  // "Funcionamento do miniaplicativo" checado via HTTP: confirma que o HTML
  // realmente entregue em produção contém o container do widget (prova que o
  // SSR injetou o corpo do artigo, e não só o <head> ou o shell estático —
  // ver armadilha de roteamento na Seção 19.2). Isto NÃO executa o
  // JavaScript do widget (exigiria um navegador headless); é uma checagem de
  // entrega, não de interatividade em runtime.
  const idFerramenta = detectarWebapp(artigo);
  if (idFerramenta) {
    const htmlArtigo = await respArtigo.text();
    if (!htmlArtigo.includes(idFerramenta) || !htmlArtigo.includes('data-ssr="1"')) {
      throw new ErroPublicacao(
        `Miniaplicativo "${idFerramenta}" não foi encontrado no HTML servido em produção (ou o SSR não injetou o corpo do artigo) — publicação bloqueada até isso ser corrigido.`,
        'WEBAPP_NAO_ENTREGUE'
      );
    }
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

  return { url, idFerramenta };
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

function montarLegenda(artigo, url) {
  return `${artigo.titulo}\n\n${artigo.resumo}\n\nLeia mais: ${url}`;
}

/** Monta os 4 pacotes de mídia (Carrossel, Reel, Stories, YouTube Short) — sempre texto/roteiro, nunca upload de vídeo/imagem além da capa. */
function montarPacotesMidia(artigo, url, idFerramenta) {
  const linkFerramenta = idFerramenta ? `${url}#${idFerramenta}` : url;
  const chamadaFerramenta = idFerramenta
    ? `Tem uma ferramenta interativa no artigo — teste em ${linkFerramenta}`
    : `Leia o artigo completo em ${url}`;

  // Carrossel: reaproveita o mesmo motor de slides de backend/lib/carrossel.js
  // (fonte única de verdade da estrutura) — aqui só formata para o pacote.
  const slides = montarSlides(artigo);
  const carrossel = {
    formato: 'Carrossel Instagram (1080x1350)',
    paleta: ['#FAF7F2', '#0D3330', '#185D58'],
    totalSlides: slides.length,
    tituloCapa: artigo.titulo,
    legenda: `${artigo.titulo}\n\n${artigo.resumo}\n\n${chamadaFerramenta}`,
    observacao:
      'Imagens geradas localmente via `npm run carrosseis -- --slug=' +
      artigo.slug +
      '` (PNG sem URL pública) — publicação é manual ou via upload prévio a um host de imagens; este módulo não posta o carrossel sozinho.',
  };

  // Reel: mesmo formato usado em backend/data/roteirosVideoReels.js.
  const reel = {
    formato: 'Roteiro para Reel (até 30-60s)',
    tema: artigo.titulo,
    textoTela: [artigo.titulo.toUpperCase(), (idFerramenta ? 'TESTE A FERRAMENTA NO ARTIGO' : 'LEIA O ARTIGO COMPLETO')],
    legenda: `${artigo.resumo} ${chamadaFerramenta}`,
    observacao: 'Roteiro para gravação/edição — sem asset de vídeo neste projeto, publicação manual.',
  };

  // Stories: mesmo formato usado em backend/data/roteirosStories.js (4 quadros).
  const stories = {
    formato: 'Sequência para Stories (4 quadros)',
    quadros: [
      { ordem: 1, tipo: 'gancho', textoTela: artigo.titulo },
      { ordem: 2, tipo: 'conteudo', textoTela: artigo.resumo },
      {
        ordem: 3,
        tipo: idFerramenta ? 'enquete' : 'conteudo',
        textoTela: idFerramenta ? 'Já avaliou isso na sua realidade? Testa a ferramenta do artigo.' : 'Vale a leitura completa.',
        sugestaoInteracao: idFerramenta ? 'Sticker de enquete (Sim/Ainda não) apontando para a ferramenta' : null,
      },
      { ordem: 4, tipo: 'cta', textoTela: 'Arraste para cima', linkSticker: linkFerramenta },
    ],
    observacao: 'Sequência de texto/quadros — sem imagem/vídeo com URL pública neste projeto, publicação manual.',
  };

  // YouTube Short: sem integração de API neste projeto — só roteiro + título.
  const youtubeShort = {
    formato: 'Roteiro e título para YouTube Short (até 60s)',
    titulo: `${artigo.titulo} | Dr. Antônio Felipe`,
    roteiro: [
      `Gancho (0-5s): ${artigo.titulo}`,
      `Contexto (5-40s): ${artigo.resumo}`,
      `CTA (40-60s): ${chamadaFerramenta}`,
    ],
    duracaoAlvoSegundos: 60,
    observacao: 'Este projeto não tem integração com a API do YouTube — roteiro para produção e upload manual.',
  };

  return { carrossel, reel, stories, youtubeShort };
}

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

  // Checagem 2 (inclui o webapp, se houver)
  const { url, idFerramenta } = await checarUrlsAcessiveis(artigo);

  // Checagem 3 — monta sempre (payloads das redes + os 4 pacotes de mídia),
  // executa a chamada de escrita real só com confirmação explícita.
  const { legenda, payloads } = montarPayloads(artigo, url, redes);
  const pacotesMidia = montarPacotesMidia(artigo, url, idFerramenta);

  if (!confirmar) {
    return {
      executado: false,
      motivo: 'Confirmação explícita ausente — rode de novo com confirmar:true (ou --confirmar no CLI) para publicar de verdade.',
      artigo: { id: String(artigo._id), titulo: artigo.titulo, slug: artigo.slug },
      url,
      idFerramenta,
      legenda,
      payloads,
      pacotesMidia,
    };
  }

  // Cada rede é tentada de forma independente: token ausente ou falha numa
  // rede não impede a tentativa nas demais (Seção 20 do CLAUDE.md).
  const resultados = {};
  const erros = {};

  if (redes.includes('instagram')) {
    try {
      resultados.instagram = await publicarNoInstagram({ imagemUrl: artigo.imagemCapa, legenda });
    } catch (err) {
      erros.instagram = { codigo: err.codigo || 'ERRO_DESCONHECIDO', mensagem: err.message };
      console.error(`[social] falha ao publicar no Instagram (artigo ${artigo.slug}):`, err.codigo, err.message);
    }
  }

  if (redes.includes('linkedin')) {
    try {
      resultados.linkedin = await publicarNoLinkedIn({ url, titulo: artigo.titulo, legenda });
    } catch (err) {
      erros.linkedin = { codigo: err.codigo || 'ERRO_DESCONHECIDO', mensagem: err.message };
      console.error(`[social] falha ao publicar no LinkedIn (artigo ${artigo.slug}):`, err.codigo, err.message);
    }
  }

  // Só marca como publicado se pelo menos uma rede realmente publicou —
  // se todas falharam (ex.: os dois tokens ausentes), o artigo continua
  // "aprovado" para poder ser retentado depois.
  const publicouAlgumaRede = Object.keys(resultados).length > 0;
  if (publicouAlgumaRede) {
    await Artigo.findByIdAndUpdate(artigoId, { status: 'publicado', publicadoRedesEm: new Date() });
  }

  return {
    executado: publicouAlgumaRede,
    parcial: publicouAlgumaRede && Object.keys(erros).length > 0,
    artigo: { id: String(artigo._id), titulo: artigo.titulo, slug: artigo.slug },
    url,
    idFerramenta,
    resultados,
    erros: Object.keys(erros).length > 0 ? erros : undefined,
    pacotesMidia,
  };
}

/**
 * Ponto de entrada do disparo automático — chamado pela rota de artigos
 * (backend/routes/artigos.js) sempre que um artigo TRANSICIONA para
 * status='aprovado'. Nunca lança exceção: qualquer falha é logada e
 * devolvida no retorno, para nunca derrubar a requisição HTTP que salvou o
 * artigo. Só publica de verdade se AUTO_PUBLICAR_REDES=true (ver nota no
 * topo do arquivo) — caso contrário só monta e loga os pacotes, sem postar.
 */
async function dispararPublicacaoAutomatica(artigoId) {
  if (!autoPublicarLigado()) {
    console.log(
      `[social-auto] Artigo ${artigoId} aprovado, mas AUTO_PUBLICAR_REDES não está "true" — publicação automática NÃO disparada. Defina a variável de ambiente para ativar.`
    );
    return { executado: false, motivo: 'AUTO_PUBLICAR_REDES desligado' };
  }

  console.log(`[social-auto] Artigo ${artigoId} aprovado — AUTO_PUBLICAR_REDES=true, iniciando publicação automática.`);
  try {
    const resultado = await publicarArtigoNasRedes(artigoId, { confirmar: true });
    console.log(`[social-auto] Resultado para ${artigoId}:`, JSON.stringify({ executado: resultado.executado, parcial: resultado.parcial, erros: resultado.erros }));
    return resultado;
  } catch (err) {
    // Falha nas checagens 1/2 (status, URLs, webapp) — não é erro de rede
    // individual (esses já são capturados por rede dentro do orquestrador).
    console.error(`[social-auto] Publicação automática bloqueada para ${artigoId}: [${err.codigo || 'ERRO'}] ${err.message}`);
    return { executado: false, erro: err.message, codigo: err.codigo };
  }
}

module.exports = {
  ErroPublicacao,
  autoPublicarLigado,
  detectarWebapp,
  checarStatusAprovado,
  checarUrlsAcessiveis,
  montarPayloads,
  montarPacotesMidia,
  publicarNoInstagram,
  publicarNoLinkedIn,
  publicarArtigoNasRedes,
  dispararPublicacaoAutomatica,
};
