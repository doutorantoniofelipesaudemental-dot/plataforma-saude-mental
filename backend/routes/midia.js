const express = require('express');
const Artigo = require('../models/Artigo');
const { exigirBanco, exigirAdmin } = require('../middleware');

const router = express.Router();

// Só aceita URL do próprio Blob Store desta plataforma — nunca salva no
// artigo (campo renderizado direto em <audio>/<img> pra qualquer visitante)
// uma URL arbitrária vinda de quem quer que tenha o ADMIN_TOKEN.
const BLOB_URL_RE = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//;

function validarUrlDeMidia(req, res, next) {
  const { url } = req.body || {};
  if (typeof url !== 'string' || !BLOB_URL_RE.test(url)) {
    return res.status(400).json({ erro: 'Campo "url" ausente ou não aponta para o Blob Store desta plataforma.' });
  }
  next();
}

/**
 * PUT /api/artigos/:slug/midia/audio
 *
 * O upload em si (narração TTS do artigo completo, gerada pelo backend
 * Python de automação) já foi feito DIRETO para o Vercel Blob pelo próprio
 * Python — arquivos de narração longos passavam do limite de payload de
 * serverless function da Vercel (413) quando iam inteiros por aqui. Esta
 * rota só recebe a URL pública resultante (JSON pequeno) e salva no artigo.
 */
router.put('/:slug/midia/audio', exigirAdmin, exigirBanco, validarUrlDeMidia, async (req, res) => {
  try {
    const artigo = await Artigo.findOne({ slug: req.params.slug });
    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

    artigo.audioNarracaoUrl = req.body.url;
    await artigo.save();

    res.json({ ok: true, audioNarracaoUrl: artigo.audioNarracaoUrl });
  } catch (err) {
    console.error('[midia] erro ao salvar URL do áudio de narração:', err);
    res.status(500).json({ erro: 'Não foi possível salvar o áudio da narração.' });
  }
});

/**
 * PUT /api/artigos/:slug/midia/capa
 *
 * Mesmo esquema da rota de áudio: o Python já subiu a imagem direto pro
 * Vercel Blob, aqui só chega a URL pública para salvar em `imagemCapa`.
 */
router.put('/:slug/midia/capa', exigirAdmin, exigirBanco, validarUrlDeMidia, async (req, res) => {
  try {
    const artigo = await Artigo.findOne({ slug: req.params.slug });
    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

    artigo.imagemCapa = req.body.url;
    await artigo.save();

    res.json({ ok: true, imagemCapa: artigo.imagemCapa });
  } catch (err) {
    console.error('[midia] erro ao salvar URL da imagem de capa:', err);
    res.status(500).json({ erro: 'Não foi possível salvar a imagem de capa.' });
  }
});

module.exports = router;
