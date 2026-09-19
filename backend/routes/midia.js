const express = require('express');
const { put } = require('@vercel/blob');
const Artigo = require('../models/Artigo');
const { exigirBanco, exigirAdmin } = require('../middleware');

const router = express.Router();

/**
 * Garante que o Blob store da Vercel está configurado antes de tentar subir
 * mídia. Mesmo espírito do `exigirBanco`: 503 explicando o que falta, nunca
 * um 500 cru — o backend Python de automação depende dessa resposta para
 * distinguir "ambiente mal configurado" de "erro de verdade".
 */
function exigirBlob(req, res, next) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      erro: 'Armazenamento de mídia não configurado.',
      detalhe: 'Defina BLOB_READ_WRITE_TOKEN nas variáveis de ambiente.',
    });
  }
  next();
}

/**
 * PUT /api/artigos/:slug/midia/audio
 *
 * Recebe, como corpo binário `audio/mpeg`, a narração TTS do artigo completo
 * (gerada pelo backend Python de automação) e guarda no Vercel Blob. O
 * caminho é fixo por slug e `allowOverwrite` fica ligado de propósito: uma
 * regeneração da narração deve substituir o arquivo anterior, não acumular
 * lixo no Blob store.
 */
router.put(
  '/:slug/midia/audio',
  exigirAdmin,
  exigirBanco,
  exigirBlob,
  express.raw({ type: 'audio/mpeg', limit: '30mb' }),
  async (req, res) => {
    try {
      const artigo = await Artigo.findOne({ slug: req.params.slug });
      if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ erro: 'Corpo da requisição vazio ou em formato inválido.' });
      }

      const blob = await put(`artigos/${artigo.slug}/narracao.mp3`, req.body, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      artigo.audioNarracaoUrl = blob.url;
      await artigo.save();

      res.json({ ok: true, audioNarracaoUrl: blob.url });
    } catch (err) {
      console.error('[midia] erro ao salvar áudio de narração:', err);
      res.status(500).json({ erro: 'Não foi possível salvar o áudio da narração.' });
    }
  }
);

/**
 * PUT /api/artigos/:slug/midia/capa
 *
 * Recebe, como corpo binário `image/png`, a imagem de capa gerada pelo
 * backend Python de automação e guarda no Vercel Blob, salvando a URL no
 * campo `imagemCapa` já existente no schema.
 */
router.put(
  '/:slug/midia/capa',
  exigirAdmin,
  exigirBanco,
  exigirBlob,
  express.raw({ type: 'image/png', limit: '30mb' }),
  async (req, res) => {
    try {
      const artigo = await Artigo.findOne({ slug: req.params.slug });
      if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ erro: 'Corpo da requisição vazio ou em formato inválido.' });
      }

      const blob = await put(`artigos/${artigo.slug}/capa.png`, req.body, {
        access: 'public',
        contentType: 'image/png',
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      artigo.imagemCapa = blob.url;
      await artigo.save();

      res.json({ ok: true, imagemCapa: blob.url });
    } catch (err) {
      console.error('[midia] erro ao salvar imagem de capa:', err);
      res.status(500).json({ erro: 'Não foi possível salvar a imagem de capa.' });
    }
  }
);

module.exports = router;
