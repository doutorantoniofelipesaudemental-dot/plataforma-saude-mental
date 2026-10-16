/**
 * Inventário do Vercel Blob (plano Hobby: 1 GB). Classifica CADA narração (artigos/<slug>/narracao-<hash12>.mp3):
 *   a = ligada a texto PUBLICADO (narracao.url ou audioNarracaoUrl);
 *   b = ligada a texto AGENDADO (publicado:false);
 *   c = hash antigo: o texto existe, mas nenhum documento referencia mais esse arquivo;
 *   d = sem texto correspondente (slug inexistente).
 * Só leitura por padrão. Apagar (`aplicar: true`) atinge SÓ os grupos c e d, nunca a/b, e recusa se (c+d) passar de 50% das narrações
 * (decisão do Dr. Antônio, 16/10/2026: nesse caso parar e mostrar os números). `completo: true` devolve a lista de cada grupo.
 */
const { list, del } = require('@vercel/blob');
const Artigo = require('../models/Artigo');

const PADRAO = /^artigos\/([a-z0-9-]+)\/narracao-[0-9a-f]{12}\.mp3$/;
const MB = (x) => Math.round((x / 1048576) * 10) / 10;

async function inventario({ aplicar = false, completo = false } = {}) {
  const docs = await Artigo.collection.find({}, { projection: { slug: 1, publicado: 1, narracao: 1, audioNarracaoUrl: 1 } }).toArray();
  const slugs = new Set(docs.map((d) => d.slug));
  const refPub = new Set(), refAgen = new Set();
  for (const d of docs) for (const u of [d.narracao && d.narracao.url, d.audioNarracaoUrl]) if (u) (d.publicado === true ? refPub : refAgen).add(u);
  const g = { a: [], b: [], c: [], d: [] };
  let cursor, total = 0, n = 0, outros = 0;
  do {
    const r = await list({ cursor, limit: 1000 });
    for (const b of r.blobs) {
      total += b.size; n++;
      const m = PADRAO.exec(b.pathname);
      if (!m) { outros++; continue; }
      const item = { pathname: b.pathname, url: b.url, size: b.size, uploadedAt: b.uploadedAt };
      if (refPub.has(b.url)) g.a.push(item);
      else if (refAgen.has(b.url)) g.b.push(item);
      else if (slugs.has(m[1])) g.c.push(item);
      else g.d.push(item);
    }
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  const soma = (l) => l.reduce((s, x) => s + x.size, 0);
  const narr = g.a.length + g.b.length + g.c.length + g.d.length;
  const apagaveis = [...g.c, ...g.d];
  const out = {
    blobs: n, totalMB: MB(total), outrosArquivos: outros, narracoes: narr, narracoesMB: MB(soma([...g.a, ...g.b, ...g.c, ...g.d])),
    grupos: Object.fromEntries(Object.entries(g).map(([k, l]) => [k, { arquivos: l.length, MB: MB(soma(l)) }])),
    apagaveis: { arquivos: apagaveis.length, MB: MB(soma(apagaveis)), percentualDasNarracoes: narr ? Math.round((apagaveis.length / narr) * 1000) / 10 : 0 },
    apagadas: 0,
  };
  if (completo) out.listas = Object.fromEntries(Object.entries(g).map(([k, l]) => [k, l.map(({ url, ...x }) => ({ ...x, url }))]));
  if (aplicar) {
    if (narr && apagaveis.length / narr > 0.5) { out.recusado = 'grupos c+d passam de 50% das narrações: confirmar números com o Dr. Antônio antes de apagar'; return out; }
    for (let i = 0; i < apagaveis.length; i += 100) await del(apagaveis.slice(i, i + 100).map((b) => b.url));
    out.apagadas = apagaveis.length;
  }
  return out;
}

module.exports = { inventario };
