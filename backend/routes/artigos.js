const express = require('express');
const Artigo = require('../models/Artigo');
const { CATEGORIAS } = require('../models/Artigo');
const { exigirBanco, exigirAdmin, tratarErroValidacao } = require('../middleware');
const { slugify } = require('../lib/texto');

const router = express.Router();

// Campos devolvidos na listagem (o conteúdo completo só vem no detalhe).
const CAMPOS_LISTA = 'titulo slug resumo categoria tags autor imagemCapa tempoLeitura publicadoEm visualizacoes';

/** GET /api/artigos/categorias — categorias disponíveis + contagem publicada. */
router.get('/categorias', exigirBanco, async (req, res) => {
  try {
    const contagens = await Artigo.aggregate([
      { $match: { publicado: true } },
      { $group: { _id: '$categoria', total: { $sum: 1 } } },
    ]);
    const mapa = Object.fromEntries(contagens.map((c) => [c._id, c.total]));
    res.json({
      categorias: CATEGORIAS.map((nome) => ({ nome, total: mapa[nome] || 0 })),
    });
  } catch (err) {
    console.error('[artigos] erro ao agregar categorias:', err);
    res.status(500).json({ erro: 'Não foi possível carregar as categorias.' });
  }
});

/**
 * GET /api/artigos
 * Query: categoria, busca, pagina, limite, destaque
 * Retorna apenas artigos publicados.
 */
router.get('/', exigirBanco, async (req, res) => {
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const limite = Math.min(24, Math.max(1, parseInt(req.query.limite, 10) || 9));
  const filtro = { publicado: true };

  if (req.query.categoria && CATEGORIAS.includes(req.query.categoria)) {
    filtro.categoria = req.query.categoria;
  }

  const busca = (req.query.busca || '').trim();
  if (busca) {
    // Regex escapada em título/resumo/tags: mais previsível que $text para
    // buscas parciais e acentuadas, e o volume de artigos é pequeno.
    const termo = new RegExp(busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filtro.$or = [{ titulo: termo }, { resumo: termo }, { tags: termo }];
  }

  try {
    const [itens, total] = await Promise.all([
      Artigo.find(filtro)
        .select(CAMPOS_LISTA)
        .sort({ publicadoEm: -1 })
        .skip((pagina - 1) * limite)
        .limit(limite)
        .lean(),
      Artigo.countDocuments(filtro),
    ]);

    res.json({
      itens,
      paginacao: { pagina, limite, total, paginas: Math.ceil(total / limite) || 1 },
    });
  } catch (err) {
    console.error('[artigos] erro ao listar:', err);
    res.status(500).json({ erro: 'Não foi possível carregar os artigos.' });
  }
});

/**
 * GET /api/artigos/:slug
 * Detalhe do artigo + até 3 relacionados da mesma categoria.
 */
router.get('/:slug', exigirBanco, async (req, res) => {
  try {
    const artigo = await Artigo.findOneAndUpdate(
      { slug: req.params.slug, publicado: true },
      { $inc: { visualizacoes: 1 } },
      { new: true }
    ).lean();

    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

    const relacionados = await Artigo.find({
      _id: { $ne: artigo._id },
      categoria: artigo.categoria,
      publicado: true,
    })
      .select(CAMPOS_LISTA)
      .sort({ publicadoEm: -1 })
      .limit(3)
      .lean();

    res.json({ artigo, relacionados });
  } catch (err) {
    console.error('[artigos] erro ao buscar:', err);
    res.status(500).json({ erro: 'Não foi possível carregar o artigo.' });
  }
});

/* ------------------------- rotas administrativas ------------------------- */

/** POST /api/artigos — cria artigo. */
router.post('/', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const dados = { ...req.body };
    if (dados.slug) dados.slug = slugify(dados.slug);
    const artigo = await Artigo.create(dados);
    res.status(201).json({ ok: true, artigo });
  } catch (err) {
    if (tratarErroValidacao(err, res)) return;
    console.error('[artigos] erro ao criar:', err);
    res.status(500).json({ erro: 'Não foi possível criar o artigo.' });
  }
});

/** PUT /api/artigos/:slug — atualiza artigo. */
router.put('/:slug', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const dados = { ...req.body };
    if (dados.slug) dados.slug = slugify(dados.slug);
    const artigo = await Artigo.findOneAndUpdate({ slug: req.params.slug }, dados, {
      new: true,
      runValidators: true,
    }).lean();

    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });
    res.json({ ok: true, artigo });
  } catch (err) {
    if (tratarErroValidacao(err, res)) return;
    console.error('[artigos] erro ao atualizar:', err);
    res.status(500).json({ erro: 'Não foi possível atualizar o artigo.' });
  }
});

/** DELETE /api/artigos/:slug — remove artigo. */
router.delete('/:slug', exigirAdmin, exigirBanco, async (req, res) => {
  try {
    const artigo = await Artigo.findOneAndDelete({ slug: req.params.slug }).lean();
    if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[artigos] erro ao remover:', err);
    res.status(500).json({ erro: 'Não foi possível remover o artigo.' });
  }
});

module.exports = router;
