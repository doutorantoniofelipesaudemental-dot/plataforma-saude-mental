/**
 * Inventário do Vercel Blob (plano Hobby: 1 GB). Narrações antigas de textos regerados ficam órfãs
 * (artigos/<slug>/narracao-<hash12>.mp3 que nenhum documento referencia mais). Só leitura por padrão;
 * apagar exige `aplicar: true` e só atinge arquivos com esse padrão de nome E sem referência no banco.
 */
const { list, del } = require('@vercel/blob');
const Artigo = require('../models/Artigo');

const PADRAO = /^artigos\/[a-z0-9-]+\/narracao-[0-9a-f]{12}\.mp3$/;

async function inventario({ aplicar = false } = {}) {
  const docs = await Artigo.collection.find({}, { projection: { narracao: 1, audioNarracaoUrl: 1 } }).toArray();
  const ref = new Set();
  for (const d of docs) for (const u of [d.narracao && d.narracao.url, d.audioNarracaoUrl]) if (u) ref.add(u);
  let cursor, total = 0, n = 0, narr = 0, narrN = 0, orf = [], orfBytes = 0;
  do {
    const r = await list({ cursor, limit: 1000 });
    for (const b of r.blobs) {
      total += b.size; n++;
      if (PADRAO.test(b.pathname)) { narr += b.size; narrN++; if (!ref.has(b.url)) { orf.push(b); orfBytes += b.size; } }
    }
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  const MB = (x) => Math.round(x / 1048576);
  const out = { blobs: n, totalMB: MB(total), narracoes: narrN, narracoesMB: MB(narr), orfas: orf.length, orfasMB: MB(orfBytes), exemplos: orf.slice(0, 5).map((b) => b.pathname), apagadas: 0 };
  if (aplicar && orf.length) { for (let i = 0; i < orf.length; i += 100) await del(orf.slice(i, i + 100).map((b) => b.url)); out.apagadas = orf.length; }
  return out;
}

module.exports = { inventario };
