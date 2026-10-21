/**
 * Criação de texto novo com a fonte única contra duplicidade (ordem de 20/10/2026). Usada pela importação.
 * Nunca grava se verificarConteudo achar duplicado (banco, MDX, rota compilada ou similaridade acima de 60%).
 */
const { verificarConteudo } = require('./existeConteudo');

// Devolve { criado: true } ou { criado: false, motivos }. `col` precisa de insertOne; a checagem usa find.
async function criarSeNaoExistir({ col, doc, fontesDisco = null }) {
  const dup = await verificarConteudo({ slug: doc.slug, titulo: doc.titulo, corpo: doc.conteudo || '', col, fontesDisco });
  if (dup.existe) return { criado: false, motivos: dup.motivos };
  await col.insertOne(doc);
  return { criado: true };
}

module.exports = { criarSeNaoExistir };
