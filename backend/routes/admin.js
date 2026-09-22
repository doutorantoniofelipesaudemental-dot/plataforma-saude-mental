const express = require('express');
const { exigirAdmin, exigirBanco } = require('../middleware');
const { ROTEIROS_REELS, HASHTAGS_FIXAS } = require('../data/roteirosVideoReels');
const { paraCsv } = require('../lib/csv');
const { publicarArtigoNasRedes, ErroPublicacao } = require('../lib/socialPublisher');

const router = express.Router();

const CABECALHOS_CSV = [
  'Nº',
  'Tema',
  'Slug do Artigo',
  'Categoria',
  'Texto de Tela',
  'Sugestão de B-roll',
  'Legenda',
  'Hashtags',
];

/** Achata um roteiro para as colunas pedidas por ferramentas de geração de vídeo. */
function paraLinha(roteiro, indice) {
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

/**
 * GET /api/admin/export-video-data
 * Query: formato=json (padrão) | csv
 *
 * Exporta os 30 roteiros de Reels (ver backend/data/roteirosVideoReels.js)
 * em formato estruturado — Texto de Tela, Categoria, Sugestão de B-roll,
 * Legenda e Hashtags — pronto para importar em ferramentas de geração
 * automática de vídeo.
 */
router.get('/export-video-data', exigirAdmin, (req, res) => {
  const formato = String(req.query.formato || 'json').toLowerCase();
  if (formato !== 'json' && formato !== 'csv') {
    return res.status(400).json({ erro: 'Formato inválido. Use "json" ou "csv".' });
  }

  const linhas = ROTEIROS_REELS.map(paraLinha);

  if (formato === 'csv') {
    const csv = paraCsv(
      CABECALHOS_CSV,
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
