const express = require('express');
const Artigo = require('../models/Artigo');
const { exigirAdmin, exigirBanco } = require('../middleware');
const { gerarCarrossel, empacotarZip } = require('../lib/carrossel');

const router = express.Router();

/**
 * GET /api/carrossel/:slug
 * Prévia administrativa: gera as imagens em base64 + legenda/hashtags,
 * sem empacotar em zip. Usado pelo painel para mostrar os slides antes do
 * download.
 */
router.get('/:slug', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const artigo = await Artigo.findOne({ slug: req.params.slug }).lean();
    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

    const resultado = await gerarCarrossel(artigo);
    res.json({
      slug: resultado.slug,
      titulo: resultado.titulo,
      legenda: resultado.legenda,
      hashtags: resultado.hashtags,
      slides: resultado.imagens.map((img) => ({
        indice: img.indice,
        tipo: img.tipo,
        tituloSlide: img.tituloSlide,
        imagemBase64: `data:image/png;base64,${img.buffer.toString('base64')}`,
      })),
    });
  } catch (err) {
    console.error('[carrossel] erro ao gerar prévia:', err);
    res.status(500).json({ erro: 'Não foi possível gerar o carrossel.' });
  }
});

/**
 * GET /api/carrossel/:slug/zip
 * Baixa o carrossel completo (imagens numeradas + legenda.txt) em um .zip.
 */
router.get('/:slug/zip', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const artigo = await Artigo.findOne({ slug: req.params.slug }).lean();
    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

    const resultado = await gerarCarrossel(artigo);
    const zip = await empacotarZip(resultado);

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="carrossel-${artigo.slug}.zip"`);
    res.send(zip);
  } catch (err) {
    console.error('[carrossel] erro ao gerar zip:', err);
    res.status(500).json({ erro: 'Não foi possível gerar o arquivo do carrossel.' });
  }
});

module.exports = router;
