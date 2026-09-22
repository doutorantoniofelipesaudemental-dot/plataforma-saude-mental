const Artigo = require('../models/Artigo');

const { CATEGORIAS } = Artigo;

// Campos devolvidos na listagem (o conteúdo completo só vem no detalhe).
const CAMPOS_LISTA = 'titulo slug resumo categoria tags autor imagemCapa tempoLeitura publicadoEm visualizacoes';

/** Normaliza query params (categoria/busca/pagina/limite) nos mesmos limites usados pela API. */
function normalizarQuery({ categoria, busca, pagina, limite } = {}) {
  const paginaNum = Math.max(1, parseInt(pagina, 10) || 1);
  const limiteNum = Math.min(24, Math.max(1, parseInt(limite, 10) || 9));
  const filtro = { publicado: true };

  if (categoria && CATEGORIAS.includes(categoria)) {
    filtro.categoria = categoria;
  }

  const termo = (busca || '').trim();
  if (termo) {
    // Regex escapada em título/resumo/tags: mais previsível que $text para
    // buscas parciais e acentuadas, e o volume de artigos é pequeno.
    const regex = new RegExp(termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filtro.$or = [{ titulo: regex }, { resumo: regex }, { tags: regex }];
  }

  return { filtro, pagina: paginaNum, limite: limiteNum, categoria: filtro.categoria || '', busca: termo };
}

/** Usada tanto pela API (`GET /api/artigos`) quanto pelo SSR da listagem do blog. */
async function listarArtigos(opcoes) {
  const { filtro, pagina, limite, categoria, busca } = normalizarQuery(opcoes);

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
  return { itens, paginacao: { pagina, limite, total, paginas }, categoria, busca };
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

module.exports = { listarArtigos, listarCategorias, CAMPOS_LISTA };
