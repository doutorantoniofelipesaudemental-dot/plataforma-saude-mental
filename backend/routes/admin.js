const express = require('express');
const { exigirAdmin, exigirBanco } = require('../middleware');
const { ROTEIROS_REELS, HASHTAGS_FIXAS } = require('../data/roteirosVideoReels');
const { ROTEIROS_STORIES, HASHTAGS_FIXAS: HASHTAGS_FIXAS_STORIES } = require('../data/roteirosStories');
const { paraCsv } = require('../lib/csv');
const { publicarArtigoNasRedes, ErroPublicacao } = require('../lib/socialPublisher');

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
    const resultado = await publicarArtigoNasRedes(req.params.id, { redes, confirmar });
    res.json(resultado);
  } catch (err) {
    if (err instanceof ErroPublicacao) {
      return res.status(422).json({ erro: err.message, codigo: err.codigo });
    }
    console.error('[admin] erro ao publicar nas redes:', err);
    res.status(500).json({ erro: 'Falha inesperada ao publicar nas redes.' });
  }
});

module.exports = router;
