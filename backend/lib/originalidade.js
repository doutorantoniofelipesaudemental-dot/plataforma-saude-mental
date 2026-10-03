/**
 * Originalidade e não duplicidade: compara uma pauta/artigo candidato com o acervo
 * (artigos já publicados no MongoDB + pautas já propostas) por título, resumo/pauta,
 * categoria e temas. Reprova cópia, paráfrase e redundância. Funções puras: o
 * acervo vem de fora (scripts/bot-ideacao.js lê o banco).
 *
 * Sem LLM e sem rede: similaridade lexical (tokens normalizados, sem acento nem
 * palavras vazias, com radical simples) restrita aos termos de assunto
 * (as fórmulas de título repetidas no acervo não contam).
 */

const STOPWORDS = new Set(
  ('a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre ate ao aos ' +
    'e ou mas que como quando onde qual quais se sua seu suas seus ele ela eles elas isso isto esse essa esses essas ' +
    'este esta estes estas mais menos muito muita muitos muitas ja nao sim tem ter ser sao foi era so tambem ' +
    'pelo pela pelos pelas num numa cada todo toda todos todas outro outra outros outras ' +
    'artigo guia pratico pratica texto cronica relato sobre'
  ).split(' ')
);

const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Radical simples: tira plural e sufixos comuns, para "cuidadores"≈"cuidador", "depressão"≈"depressivo". */
function radical(p) {
  let r = p;
  for (const suf of ['coes', 'cao', 'mente', 'mento', 'mentos', 'ivos', 'ivas', 'ivo', 'iva', 'oes', 'ais', 'eis', 'es', 's']) {
    if (r.length - suf.length >= 4 && r.endsWith(suf)) { r = r.slice(0, -suf.length); break; }
  }
  return r;
}

function tokens(texto) {
  return semAcento(texto)
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((p) => p.length >= 3 && !STOPWORDS.has(p))
    .map(radical);
}

const conjunto = (t) => new Set(t);

/**
 * Termos "de assunto": os que aparecem em poucos itens do acervo (insônia, docente, pós-parto).
 * Termos comuns ("saúde", "mental", "consulta", "rotina", "família", "sinais") são as fórmulas
 * de título que o acervo repete e não indicam redundância: ficam de fora da comparação.
 * Um termo é de assunto se aparece em até max(2, 5% do acervo) itens.
 */
function termosDeAssunto(itens) {
  const df = new Map();
  for (const it of itens) {
    const vistos = new Set(tokens(`${it.titulo} ${it.resumo || it.pauta || ''} ${(it.tags || []).join(' ')}`));
    vistos.forEach((t) => df.set(t, (df.get(t) || 0) + 1));
  }
  const teto = Math.max(2, Math.ceil(itens.length * 0.05));
  return (t) => (df.get(t) || 0) <= teto;
}

/** Dice entre dois conjuntos de termos. */
function dice(a, b) {
  if (!a.size || !b.size) return 0;
  let comuns = 0;
  for (const x of a) if (b.has(x)) comuns++;
  return (2 * comuns) / (a.size + b.size);
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let comuns = 0;
  for (const x of a) if (b.has(x)) comuns++;
  return comuns / (a.size + b.size - comuns);
}

function cosseno(ta, tb) {
  const fa = new Map();
  const fb = new Map();
  ta.forEach((t) => fa.set(t, (fa.get(t) || 0) + 1));
  tb.forEach((t) => fb.set(t, (fb.get(t) || 0) + 1));
  let prod = 0;
  for (const [t, n] of fa) if (fb.has(t)) prod += n * fb.get(t);
  const na = Math.sqrt([...fa.values()].reduce((x, n) => x + n * n, 0));
  const nb = Math.sqrt([...fb.values()].reduce((x, n) => x + n * n, 0));
  return na && nb ? prod / (na * nb) : 0;
}

// Limiares calibrados no acervo real (251 artigos): 99,9% dos pares de artigos distintos ficam
// abaixo de 0,36; as redundâncias conhecidas (ex.: dois "Burnout em médicos e enfermeiros…")
// ficam entre 0,47 e 0,67.
const LIMITES = {
  copiaTitulo: 0.85, // título praticamente igual (todos os termos)
  copia: 0.65, // score global de cópia
  redundante: 0.35, // paráfrase/redundância
};

/**
 * Similaridade por ASSUNTO: título (todos os termos e só os de assunto), resumo/pauta e tags
 * restritos aos termos de assunto, e categoria.
 * @param {{titulo: string, resumo?: string, pauta?: string, categoria?: string, tags?: string[]}} a
 * @param {{titulo: string, resumo?: string, pauta?: string, categoria?: string, tags?: string[]}} b
 * @param {(t: string) => boolean} [ehAssunto] termo de assunto (termosDeAssunto); padrão: todos
 */
function similaridade(a, b, ehAssunto = () => true) {
  const tituloA = tokens(a.titulo);
  const tituloB = tokens(b.titulo);
  const tituloTodos = dice(new Set(tituloA), new Set(tituloB)); // cópia literal do título
  const tituloAssunto = dice(new Set(tituloA.filter(ehAssunto)), new Set(tituloB.filter(ehAssunto)));
  const corpo = (x, tit) => [...tit, ...tokens(`${x.resumo || x.pauta || ''} ${(x.tags || []).join(' ')}`)].filter(ehAssunto);
  const simTexto = cosseno(corpo(a, tituloA), corpo(b, tituloB));
  const mesmaCategoria = Boolean(a.categoria && b.categoria && a.categoria === b.categoria);
  const score = 0.55 * tituloAssunto + 0.4 * simTexto + (mesmaCategoria ? 0.05 : 0);
  return { score, simTitulo: tituloTodos, simAssunto: tituloAssunto, simTexto, mesmaCategoria };
}

/**
 * Compara o candidato com o acervo. Devolve o veredito e os vizinhos mais próximos.
 * `ignorar(item)` exclui o próprio artigo quando ele já está no acervo (validação de artigo publicado).
 * @returns {{ok: boolean, veredito: 'original'|'redundante'|'copia', maisProximo: object|null, vizinhos: object[], motivos: string[]}}
 */
function checarOriginalidade(candidato, acervo, { limites = LIMITES, ignorar = () => false, topo = 3 } = {}) {
  const ehAssunto = termosDeAssunto(acervo);
  const vizinhos = acervo
    .filter((item) => !ignorar(item))
    .map((item) => ({ item, ...similaridade(candidato, item, ehAssunto) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, topo);
  const melhor = vizinhos[0] || null;
  let veredito = 'original';
  if (melhor) {
    if (melhor.simTitulo >= limites.copiaTitulo || melhor.score >= limites.copia) veredito = 'copia';
    else if (melhor.score >= limites.redundante) veredito = 'redundante';
  }
  const rotulo = { copia: 'cópia', redundante: 'paráfrase/redundância' };
  return {
    ok: veredito === 'original',
    veredito,
    maisProximo: melhor && { titulo: melhor.item.titulo, categoria: melhor.item.categoria || null, score: Number(melhor.score.toFixed(2)), simTitulo: Number(melhor.simTitulo.toFixed(2)) },
    vizinhos: vizinhos.map((v) => ({ titulo: v.item.titulo, score: Number(v.score.toFixed(2)) })),
    motivos: veredito === 'original' ? [] : [`${rotulo[veredito]} de "${melhor.item.titulo}" (similaridade ${melhor.score.toFixed(2)}, título ${melhor.simTitulo.toFixed(2)})`],
  };
}

module.exports = { checarOriginalidade, similaridade, termosDeAssunto, tokens, LIMITES };
