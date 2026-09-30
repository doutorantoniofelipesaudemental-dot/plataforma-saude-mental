/**
 * Metas editoriais por categoria (CONTEUDO_INSTAGRAM/pautas/METAS_EDITORIAL.json):
 * lê o planejamento, cruza com a contagem de artigos publicados no banco e monta a
 * tabela "atual × meta". Funções puras: a contagem vem de fora (bot-ideacao --listar).
 */
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, '..', '..', 'CONTEUDO_INSTAGRAM', 'pautas', 'METAS_EDITORIAL.json');

function lerMetas(arquivo = ARQUIVO) {
  return fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, 'utf8')) : null;
}

/**
 * @param {object} metas conteúdo do METAS_EDITORIAL.json
 * @param {Record<string, number>|null} contagem artigos publicados por categoria do banco (null = banco indisponível)
 */
function calcularProgresso(metas, contagem) {
  const linhas = metas.categorias.map((c) => {
    const atual = contagem ? c.categoriasNoBanco.reduce((s, n) => s + (contagem[n] || 0), 0) : null;
    return {
      nome: c.nome,
      atual,
      meta: c.meta,
      novos: c.novos,
      faltam: atual === null ? null : Math.max(0, c.meta - atual),
      pct: atual === null ? null : Math.min(100, Math.round((atual / c.meta) * 100)),
    };
  });
  const mapeadas = new Set(metas.categorias.flatMap((c) => c.categoriasNoBanco));
  const foraDoPlano = contagem ? Object.entries(contagem).filter(([n]) => !mapeadas.has(n)).reduce((s, [, v]) => s + v, 0) : null;
  const somaMetas = linhas.reduce((s, l) => s + l.meta, 0);
  const somaNovos = linhas.reduce((s, l) => s + l.novos, 0);
  const atualTotal = contagem ? Object.values(contagem).reduce((s, v) => s + v, 0) : null;
  return {
    linhas,
    foraDoPlano,
    atualTotal,
    somaMetas,
    somaNovos,
    avisos: [
      somaNovos !== metas.novosPlanejados && `soma dos novos por categoria (${somaNovos}) ≠ novosPlanejados (${metas.novosPlanejados})`,
      somaMetas + (metas.naoAlocados || 0) !== metas.metaTotal && `tetos (${somaMetas}) + não alocados (${metas.naoAlocados || 0}) ≠ metaTotal (${metas.metaTotal})`,
    ].filter(Boolean),
  };
}

const barra = (pct) => (pct === null ? '' : `${'█'.repeat(Math.round(pct / 10))}${'░'.repeat(10 - Math.round(pct / 10))}`);

function renderizarProgresso(metas, prog) {
  const larg = Math.max(...prog.linhas.map((l) => l.nome.length), 13);
  const num = (v) => (v === null ? 'n/d' : String(v));
  const l = [`  Metas editoriais — total ${metas.metaTotal} artigos (base ${metas.baseAtual}, +${metas.novosPlanejados} planejados)`, ''];
  l.push(`  ${'Categoria'.padEnd(larg)}  ${'Atual'.padStart(5)}  ${'Meta'.padStart(4)}  ${'Faltam'.padStart(6)}  ${'Novos'.padStart(5)}  Progresso`);
  for (const x of prog.linhas) {
    l.push(`  ${x.nome.padEnd(larg)}  ${num(x.atual).padStart(5)}  ${String(x.meta).padStart(4)}  ${num(x.faltam).padStart(6)}  ${('+' + x.novos).padStart(5)}  ${barra(x.pct)} ${x.pct === null ? '' : x.pct + '%'}`);
  }
  l.push(`  ${'TOTAL (tetos)'.padEnd(larg)}  ${num(prog.atualTotal).padStart(5)}  ${String(prog.somaMetas).padStart(4)}`);
  if (prog.foraDoPlano) l.push('', `  ${prog.foraDoPlano} artigo(s) publicado(s) em categorias fora do plano (ex.: "Geral") — a reclassificar.`);
  if (metas.naoAlocados) l.push(`  ${metas.naoAlocados} artigo(s) da meta de ${metas.metaTotal} ainda sem categoria alocada.`);
  prog.avisos.forEach((a) => l.push(`  ⚠ ${a}`));
  return l.join('\n');
}

module.exports = { lerMetas, calcularProgresso, renderizarProgresso, ARQUIVO };
