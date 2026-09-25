const express = require('express');
const Artigo = require('../models/Artigo');
const { exigirBanco, exigirAdmin } = require('../middleware');
const { estadoNarracao, VOZ_NARRACAO } = require('../lib/narracao');
const { log } = require('../lib/log');

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

/**
 * PUT /api/artigos/:slug/midia/narracao — corpo: o MP3 (audio/mpeg, até
 * 4,4 MB, o limite de corpo das funções da Vercel). Cabeçalhos:
 * X-Narracao-Hash (hash do texto narrado, lib/narracao.js), X-Narracao-Caracteres.
 * Recusa com 409 se o texto do artigo mudou depois de o áudio ser gerado —
 * nunca grava uma narração que já nasceria desatualizada. Grava no Blob,
 * em `narracao` e em `audioNarracaoUrl`, sem mexer em `atualizadoEm`.
 */
router.put(
  '/:slug/midia/narracao',
  exigirAdmin,
  exigirBanco,
  express.raw({ type: 'audio/mpeg', limit: '4400kb' }),
  async (req, res) => {
    try {
      const audio = req.body;
      if (!Buffer.isBuffer(audio) || audio.length < 1024) {
        return res.status(400).json({ erro: 'Envie o MP3 no corpo, com Content-Type: audio/mpeg.' });
      }
      const ehMp3 = audio.slice(0, 3).toString('latin1') === 'ID3' || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0);
      if (!ehMp3) return res.status(400).json({ erro: 'O corpo não é um MP3.' });

      const artigo = await Artigo.findOne({ slug: req.params.slug }).lean();
      if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

      const { esperado } = estadoNarracao(artigo);
      const hash = String(req.get('x-narracao-hash') || '');
      if (hash !== esperado) {
        return res.status(409).json({ erro: 'O texto do artigo mudou depois de o áudio ser gerado — gere a narração de novo.', esperado });
      }
      if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ erro: 'Blob não configurado.' });

      const { put } = require('@vercel/blob');
      const enviado = await put(`artigos/${artigo.slug}/narracao-${hash.slice(0, 12)}.mp3`, audio, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      const narracao = {
        url: enviado.url,
        hash,
        voz: VOZ_NARRACAO,
        provedor: ['azure', 'edge'].includes(req.get('x-narracao-provedor')) ? req.get('x-narracao-provedor') : 'edge',
        caracteres: Number(req.get('x-narracao-caracteres')) || null,
        bytes: audio.length,
        geradaEm: new Date(),
      };
      await Artigo.updateOne({ _id: artigo._id }, { $set: { narracao, audioNarracaoUrl: enviado.url } }, { timestamps: false });
      res.json({ ok: true, narracao });
    } catch (err) {
      log.erro('[midia] erro ao gravar a narração:', err.message);
      res.status(500).json({ erro: 'Não foi possível gravar a narração.' });
    }
  }
);

module.exports = router;
