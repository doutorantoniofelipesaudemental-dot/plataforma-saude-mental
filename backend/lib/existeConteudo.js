/**
 * Fonte única de verdade contra duplicidade (ordem de 20/10/2026). Usada antes de QUALQUER importação, agendamento ou publicação de texto.
 * Confere quatro fontes e a similaridade de texto:
 *  1) banco (coleção artigos): slug e título;
 *  2) apps/plataforma-saude-mental/src/content/artigos e apps/plataforma-saude-mental/content/blog (MDX): slug e título;
 *  3) rotas compiladas (apps/plataforma-saude-mental/.next/server/app/blog e .../artigo): slug;
 *  4) similaridade de texto (5-gramas, Jaccard) acima de 60% com qualquer texto das fontes acima.
 * Função pura para a parte de comparação; o acesso ao banco e ao disco é injetado (testável sem rede nem banco).
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const PASTAS_MDX = [path.join(APP, 'src/content/artigos'), path.join(APP, 'content/blog')];
const PASTAS_COMPILADAS = [path.join(APP, '.next/server/app/blog'), path.join(APP, '.next/server/app/artigo')];
const LIMITE_SIMILARIDADE = 0.6;

const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const textoPuro = (s) => semAcento(String(s || '').replace(/export const metadata = \{[\s\S]*?\n\};/, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' '));
function cincoGramas(t) {
  const w = t.split(' ').filter(Boolean); const s = new Set();
  for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(' '));
  return s;
}
function jaccard(a, b) { let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n || 1); }
const tituloDeMdx = (s) => { const m = String(s).match(/titulo:\s*'([^']*)'/); return m ? m[1] : ''; };

// Lê as fontes do disco (MDX e rotas compiladas). Ausente = lista vazia (nunca lança).
function lerFontesDisco({ pastasMdx = PASTAS_MDX, pastasCompiladas = PASTAS_COMPILADAS } = {}) {
  const itens = [];
  for (const dir of pastasMdx) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((n) => /\.mdx?$/.test(n))) {
      const conteudo = fs.readFileSync(path.join(dir, f), 'utf8');
      itens.push({ origem: 'mdx', slug: f.replace(/\.mdx?$/, ''), titulo: tituloDeMdx(conteudo), corpo: conteudo });
    }
  }
  for (const dir of pastasCompiladas) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((n) => /\.html$/.test(n))) {
      itens.push({ origem: 'rota', slug: f.replace(/\.html$/, ''), titulo: '', corpo: '' });
    }
  }
  return itens;
}

// Núcleo: recebe o que já foi lido das fontes e devolve { existe, motivos, similaridade }.
function avaliar({ slug, titulo, corpo = '', fontes = [], bancoDocs = [], limite = LIMITE_SIMILARIDADE }) {
  const motivos = [];
  const sSlug = String(slug || '').toLowerCase(), sTit = semAcento(titulo);
  for (const d of bancoDocs) {
    if (d.slug === slug) motivos.push('slug já existe no banco');
    if (sTit && semAcento(d.titulo) === sTit) motivos.push('título já existe no banco');
  }
  for (const f of fontes) {
    if (f.slug === sSlug || f.slug === slug) motivos.push(`slug já existe em ${f.origem === 'rota' ? 'rota compilada' : 'MDX'}`);
    if (f.origem === 'mdx' && sTit && semAcento(f.titulo) === sTit) motivos.push('título já existe em MDX');
  }
  let maior = 0, comQuem = null;
  const alvo = cincoGramas(textoPuro(corpo));
  if (alvo.size) {
    for (const f of [...fontes.filter((x) => x.corpo), ...bancoDocs.filter((d) => d.corpo).map((d) => ({ origem: 'banco', slug: d.slug, corpo: d.corpo }))]) {
      const j = jaccard(alvo, cincoGramas(textoPuro(f.corpo)));
      if (j > maior) { maior = j; comQuem = f.slug; }
    }
    if (maior > limite) motivos.push(`texto parecido demais com "${comQuem}" (${(maior * 100).toFixed(1)}%)`);
  }
  return { existe: motivos.length > 0, motivos: [...new Set(motivos)], similaridade: maior, comQuem };
}

// Ponto de entrada usado pelas rotinas: lê banco (col com find) e disco, e avalia.
async function verificarConteudo({ slug, titulo, corpo = '', col = null, fontesDisco = null }) {
  const bancoDocs = col ? await col.find({}, { projection: { slug: 1, titulo: 1, conteudo: 1 } }).toArray().then((ds) => ds.map((d) => ({ slug: d.slug, titulo: d.titulo, corpo: d.conteudo || '' }))) : [];
  const fontes = fontesDisco || lerFontesDisco();
  return avaliar({ slug, titulo, corpo, fontes, bancoDocs });
}

module.exports = { verificarConteudo, avaliar, lerFontesDisco, textoPuro, cincoGramas, jaccard, LIMITE_SIMILARIDADE };
