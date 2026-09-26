const express = require('express');
const { exigirAdmin, exigirBanco } = require('../middleware');
const { ROTEIROS_REELS, HASHTAGS_FIXAS } = require('../data/roteirosVideoReels');
const { ROTEIROS_STORIES, HASHTAGS_FIXAS: HASHTAGS_FIXAS_STORIES } = require('../data/roteirosStories');
const { paraCsv } = require('../lib/csv');
const { publicarArtigoNasRedes, ErroPublicacao } = require('../lib/socialPublisher');
const { redesConfiguradas, motivoParaAguardar, listarFila, configuracao } = require('../lib/filaRedes');
const Artigo = require('../models/Artigo');
const RegistroPublicacao = require('../models/RegistroPublicacao');
const { garantirCapaRedes, capaAtualizada } = require('../lib/capaRedes');
const { resumoToken } = require('../lib/tokenInstagram');
const { log } = require('../lib/log');

const router = express.Router();

const CABECALHOS_CSV_REELS = [
  'Nº',
  'Tema',
  'Slug do Artigo',
  'Categoria',
  'Texto de Tela',
  'Sugestão de B-roll',
  'Legenda',
  'Hashtags',
];

const CABECALHOS_CSV_STORIES = [
  'Nº',
  'Tema',
  'Slug do Artigo',
  'Categoria',
  'Quadros (ordem: texto de tela)',
  'Hashtags',
];

/** Achata um roteiro de Reels para as colunas pedidas por ferramentas de geração de vídeo. */
function paraLinhaReels(roteiro, indice) {
  return {
    numero: indice + 1,
    tema: roteiro.tema,
    slugArtigo: roteiro.slugArtigo,
    categoria: roteiro.categoria,
    textoTela: roteiro.textoTela,
    bRoll: roteiro.bRoll,
    legenda: roteiro.legenda,
    hashtags: [...HASHTAGS_FIXAS, ...roteiro.hashtagsExtras],
    alertaEmergencia: Boolean(roteiro.alertaEmergencia),
  };
}

/** Achata um roteiro de Stories (sequência de quadros) para exportação. */
function paraLinhaStories(roteiro, indice) {
  return {
    numero: indice + 1,
    tema: roteiro.tema,
    slugArtigo: roteiro.slugArtigo,
    categoria: roteiro.categoria,
    quadros: roteiro.quadros,
    hashtags: [...HASHTAGS_FIXAS_STORIES, ...roteiro.hashtagsExtras],
  };
}

/**
 * GET /api/admin/export-video-data
 * Query: formato=json (padrão) | csv · tipo=reels (padrão) | stories
 *
 * Exporta os roteiros de Reels (backend/data/roteirosVideoReels.js) ou de
 * Stories (backend/data/roteirosStories.js) em formato estruturado — pronto
 * para importar em ferramentas de geração automática de vídeo/imagem.
 */
router.get('/export-video-data', exigirAdmin, (req, res) => {
  const formato = String(req.query.formato || 'json').toLowerCase();
  const tipo = String(req.query.tipo || 'reels').toLowerCase();

  if (formato !== 'json' && formato !== 'csv') {
    return res.status(400).json({ erro: 'Formato inválido. Use "json" ou "csv".' });
  }
  if (tipo !== 'reels' && tipo !== 'stories') {
    return res.status(400).json({ erro: 'Tipo inválido. Use "reels" ou "stories".' });
  }

  if (tipo === 'stories') {
    const linhas = ROTEIROS_STORIES.map(paraLinhaStories);
    if (formato === 'csv') {
      const csv = paraCsv(
        CABECALHOS_CSV_STORIES,
        linhas.map((l) => [
          l.numero,
          l.tema,
          l.slugArtigo,
          l.categoria,
          l.quadros.map((q) => `${q.ordem}) ${q.textoTela}`).join(' | '),
          l.hashtags.join(' '),
        ])
      );
      res.set('Content-Type', 'text/csv; charset=utf-8');
      res.set('Content-Disposition', 'attachment; filename="roteiros-stories.csv"');
      return res.send(`﻿${csv}`);
    }
    return res.json({ total: linhas.length, itens: linhas });
  }

  const linhas = ROTEIROS_REELS.map(paraLinhaReels);

  if (formato === 'csv') {
    const csv = paraCsv(
      CABECALHOS_CSV_REELS,
      linhas.map((l) => [
        l.numero,
        l.tema,
        l.slugArtigo,
        l.categoria,
        l.textoTela.join(' | '),
        l.bRoll,
        l.legenda,
        l.hashtags.join(' '),
      ])
    );
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="roteiros-video-reels.csv"');
    // BOM no início: sem isso o Excel abre acentos como caracteres corrompidos.
    return res.send(`﻿${csv}`);
  }

  res.json({ total: linhas.length, itens: linhas });
});

/**
 * POST /api/admin/artigos/:id/publicar-redes
 * Body: { redes?: ['instagram','linkedin'], confirmar?: boolean }
 *
 * Roda a tripla checagem (status aprovado -> URLs acessíveis -> payloads) e só
 * publica de fato no Instagram/LinkedIn se `confirmar: true` vier no corpo —
 * sem isso, devolve os payloads exatos para revisão (dry-run), nunca posta
 * sozinho. Aprove o artigo primeiro via `PUT /api/artigos/:slug` com
 * `{ "status": "aprovado" }`. Ver backend/lib/socialPublisher.js.
 */
router.post('/artigos/:id/publicar-redes', exigirAdmin, exigirBanco, async (req, res) => {
  const redes = Array.isArray(req.body.redes) && req.body.redes.length ? req.body.redes : ['instagram', 'linkedin'];
  const confirmar = req.body.confirmar === true;

  try {
    const { capaBuffer, ...resultado } = await publicarArtigoNasRedes(req.params.id, { redes, confirmar, origem: 'admin' });
    res.json(resultado);
  } catch (err) {
    if (err instanceof ErroPublicacao) {
      return res.status(422).json({ erro: err.message, codigo: err.codigo });
    }
    log.erro('[admin] erro ao publicar nas redes:', err);
    res.status(500).json({ erro: 'Falha inesperada ao publicar nas redes.' });
  }
});

/**
 * GET /api/admin/fila-redes — estado da fila diária, SÓ LEITURA: redes com
 * credencial (nomes, nunca valores), travas, próximos da fila e os últimos
 * postados. Nunca publica — para isso existe o cron (backend/lib/filaRedes.js).
 */
router.get('/fila-redes', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const [aguardar, proximos, ultimos, token] = await Promise.all([
      motivoParaAguardar(),
      listarFila(5),
      Artigo.find({ publicadoRedesEm: { $ne: null } }).sort({ publicadoRedesEm: -1 }).limit(5).select('slug publicadoRedesEm').lean(),
      resumoToken(),
    ]);
    res.json({
      redes: redesConfiguradas(),
      // Só metadados: origem, impressão digital (SHA-256 truncado), validade, pausa. Nunca o token.
      tokenInstagram: token,
      ...configuracao(),
      podePublicarAgora: !aguardar && !token.pausa,
      aguardar,
      proximos: proximos.map((a) => ({ slug: a.slug, engajamento: a.engajamento })),
      ultimosPublicados: ultimos.map((a) => ({ slug: a.slug, em: a.publicadoRedesEm })),
    });
  } catch (err) {
    log.erro('[admin] erro ao consultar a fila de redes:', err);
    res.status(500).json({ erro: 'Não foi possível consultar a fila.' });
  }
});

/**
 * GET /api/admin/previa-redes[?slug=] — prévia do post do feed (do próximo da
 * fila, sem slug): legenda, capa 4:5 (PNG em base64) e o resultado de cada
 * uma das três checagens. Nunca publica e nunca grava a capa; registra a
 * prévia em RegistroPublicacao (origem "previa").
 */
router.get('/previa-redes', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const slug = req.query.slug || (await listarFila(1))[0]?.slug;
    if (!slug) return res.status(404).json({ erro: 'Fila vazia.' });
    const artigo = await Artigo.findOne({ slug }).select('_id').lean();
    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });
    const r = await publicarArtigoNasRedes(String(artigo._id), { redes: ['instagram'], confirmar: false });
    res.json({
      slug,
      checagem: r.checagem,
      pendencias: r.pendencias,
      legenda: r.legendaInstagram,
      capaPngBase64: r.capaBuffer ? r.capaBuffer.toString('base64') : null,
    });
  } catch (err) {
    if (err instanceof ErroPublicacao) return res.status(422).json({ erro: err.message, codigo: err.codigo });
    log.erro('[admin] erro na prévia de redes:', err);
    res.status(500).json({ erro: 'Falha inesperada na prévia.' });
  }
});

/**
 * POST /api/admin/capas-redes/gerar — gera e grava no Blob a capa 4:5 dos
 * artigos da fila que ainda não têm uma atual. Em lotes (body { limite },
 * padrão 20) por causa do limite de 60s da função: repita até "faltam: 0".
 */
router.post('/capas-redes/gerar', exigirAdmin, exigirBanco, async (req, res) => {
  const limite = Math.min(Math.max(Number(req.body?.limite) || 20, 1), 40);
  try {
    const fila = await Artigo.find({ status: 'aprovado', publicado: true })
      .select('slug titulo categoria subtituloRedes capaRedes')
      .lean();
    const pendentes = fila.filter((a) => !capaAtualizada(a));
    const geradas = [];
    const erros = [];
    for (const artigo of pendentes.slice(0, limite)) {
      try {
        const capa = await garantirCapaRedes(artigo);
        geradas.push({ slug: artigo.slug, url: capa.url });
      } catch (err) {
        erros.push({ slug: artigo.slug, codigo: err.codigo, erro: err.message });
        if (err.codigo === 'BLOB_SEM_TOKEN') break;
      }
    }
    res.json({ geradas: geradas.length, erros, faltam: pendentes.length - geradas.length, exemplos: geradas.slice(0, 3) });
  } catch (err) {
    log.erro('[admin] erro ao gerar capas das redes:', err);
    res.status(500).json({ erro: 'Falha inesperada ao gerar as capas.' });
  }
});

/** GET /api/admin/registros-publicacao[?slug=&limite=] — trilha de auditoria da tripla checagem. */
/**
 * PUT /api/admin/redes-midia/:slug/:nome — corpo: PNG (image/png, até 4,4 MB).
 * Recebe as imagens do carrossel desenhadas localmente pelo bot de mídias
 * (scripts/bot-publicar.js) e grava no Blob em redes/<slug>/<nome>.png, com o
 * token do Blob de produção. Só aceita PNG e nomes simples.
 */
router.put(
  '/redes-midia/:slug/:nome',
  exigirAdmin,
  express.raw({ type: 'image/png', limit: '4400kb' }),
  async (req, res) => {
    const { slug, nome } = req.params;
    if (!/^[a-z0-9-]{1,120}$/.test(slug) || !/^[a-z0-9-]{1,60}$/.test(nome)) {
      return res.status(400).json({ erro: 'slug ou nome inválido.' });
    }
    const png = req.body;
    if (!Buffer.isBuffer(png) || png.length < 100 || png.readUInt32BE(0) !== 0x89504e47) {
      return res.status(400).json({ erro: 'Envie um PNG no corpo, com Content-Type: image/png.' });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ erro: 'Blob não configurado.' });
    try {
      const { put } = require('@vercel/blob');
      const r = await put(`redes/${slug}/${nome}.png`, png, { access: 'public', contentType: 'image/png', addRandomSuffix: false, allowOverwrite: true });
      res.json({ url: r.url });
    } catch (err) {
      log.erro('[admin] erro ao gravar mídia de redes:', err.message);
      res.status(500).json({ erro: 'Não foi possível gravar a imagem.' });
    }
  }
);

router.get('/registros-publicacao', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const filtro = req.query.slug ? { slug: String(req.query.slug) } : {};
    const limite = Math.min(Number(req.query.limite) || 20, 100);
    const registros = await RegistroPublicacao.find(filtro).sort({ data: -1 }).limit(limite).select('-legenda').lean();
    res.json({ registros });
  } catch (err) {
    log.erro('[admin] erro ao listar registros de publicação:', err);
    res.status(500).json({ erro: 'Não foi possível listar os registros.' });
  }
});

module.exports = router;
