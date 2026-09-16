const express = require('express');
const { exigirAdmin } = require('../middleware');
const { ROTEIROS_REELS, HASHTAGS_FIXAS } = require('../data/roteirosVideoReels');
const { paraCsv } = require('../lib/csv');

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

module.exports = router;
