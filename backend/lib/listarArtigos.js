const Artigo = require('../models/Artigo');
const { TEMAS, RELATOS, categoriasDoTema } = require('./temas');

const { CATEGORIAS } = Artigo;

// Campos devolvidos na listagem (o conteúdo completo só vem no detalhe).
const CAMPOS_LISTA = 'titulo slug resumo categoria tags autor imagemCapa tempoLeitura publicadoEm visualizacoes enquete audioNarracaoUrl solicitacoesNarracao usosFerramenta';

/**
 * Artigo entra no tema se `tema` = slug ou, sem tema próprio ainda, se a categoria for a ponte do tema.
 */
function filtroDoTema(slug) {
  return {
    $or: [
      { tema: slug },
      {
        $and: [
          { $or: [{ tema: '' }, { tema: null }, { tema: { $exists: false } }] },
          { categoria: { $in: categoriasDoTema(slug) } },
        ],
      },
    ],
  };
}

/**
 * Normaliza query params (tema/formato/categoria/busca/pagina/limite) nos mesmos limites usados pela API.
 * `formato=relatos` lista só "Relatos da Prática"; `tema=<slug>` lista as categorias do tema (ver temas.js).
 * Relatos nunca entram nos filtros de tema. `categoria` (legado) continua aceito.
 */
function normalizarQuery({ categoria, tema, formato, busca, pagina, limite } = {}) {
  const paginaNum = Math.max(1, parseInt(pagina, 10) || 1);
  const limiteNum = Math.min(24, Math.max(1, parseInt(limite, 10) || 9));
  const filtro = { publicado: true };

  if (formato === 'relatos') {
    filtro.categoria = RELATOS;
  } else if (tema && TEMAS.some((t) => t.slug === tema)) {
    filtro.$and = [filtroDoTema(tema), { categoria: { $ne: RELATOS } }];
  } else if (categoria && CATEGORIAS.includes(categoria)) {
    filtro.categoria = categoria;
  }

  const termo = (busca || '').trim();
  if (termo) {
    // Regex escapada em título/resumo/tags: mais previsível que $text para
    // buscas parciais e acentuadas, e o volume de artigos é pequeno.
    const regex = new RegExp(termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filtro.$or = [{ titulo: regex }, { resumo: regex }, { tags: regex }];
  }

  const temaAtual = formato !== 'relatos' && tema && TEMAS.some((t) => t.slug === tema) ? tema : '';
  return {
    filtro,
    pagina: paginaNum,
    limite: limiteNum,
    categoria: typeof filtro.categoria === 'string' ? filtro.categoria : '',
    tema: temaAtual,
    formato: formato === 'relatos' ? 'relatos' : '',
    busca: termo,
  };
}

/** Usada tanto pela API (`GET /api/artigos`) quanto pelo SSR da listagem do blog. */
async function listarArtigos(opcoes) {
  const { filtro, pagina, limite, categoria, tema, formato, busca } = normalizarQuery(opcoes);

  const [itens, total] = await Promise.all([
    Artigo.find(filtro)
      .select(CAMPOS_LISTA)
      .sort({ publicadoEm: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)
      .lean(),
    Artigo.countDocuments(filtro),
  ]);

  const paginas = Math.ceil(total / limite) || 1;
  return { itens, paginacao: { pagina, limite, total, paginas }, categoria, tema, formato, busca };
}

/** Usada tanto pela API (`GET /api/artigos/categorias`) quanto pelo SSR dos filtros do blog. */
async function listarCategorias() {
  const contagens = await Artigo.aggregate([
    { $match: { publicado: true } },
    { $group: { _id: '$categoria', total: { $sum: 1 } } },
  ]);
  const mapa = Object.fromEntries(contagens.map((c) => [c._id, c.total]));
  return CATEGORIAS.map((nome) => ({ nome, total: mapa[nome] || 0 }));
}

/**
 * Filtros do blog: os 7 temas (com contagem publicada) e Relatos da Prática à parte.
 * Usada pela API (`GET /api/artigos/temas`) e pelo SSR dos filtros do blog.
 */
async function listarTemas() {
  const grupos = await Artigo.aggregate([
    { $match: { publicado: true } },
    { $group: { _id: { tema: '$tema', categoria: '$categoria' }, total: { $sum: 1 } } },
  ]);
  // Mesma regra de filtroDoTema: tema próprio, ou categoria-ponte quando o tema estiver vazio.
  const contarTema = (slug) =>
    grupos.reduce((soma, g) => {
      const { tema, categoria } = g._id;
      if (categoria === RELATOS) return soma;
      if (tema === slug || (!tema && categoriasDoTema(slug).includes(categoria))) return soma + g.total;
      return soma;
    }, 0);
  const totalRelatos = grupos.reduce((soma, g) => (g._id.categoria === RELATOS ? soma + g.total : soma), 0);
  return {
    temas: TEMAS.map((t) => ({ slug: t.slug, nome: t.nome, curto: t.curto, total: contarTema(t.slug) })),
    relatos: { nome: RELATOS, total: totalRelatos },
  };
}

module.exports = { listarArtigos, listarCategorias, listarTemas, normalizarQuery, filtroDoTema, CAMPOS_LISTA };
