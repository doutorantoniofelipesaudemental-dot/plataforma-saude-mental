/**
 * Verifica links externos (DOI, PubMed, órgãos oficiais…) dos textos do MongoDB. SÓ LEITURA.
 * Conta como QUEBRADO apenas 404/410/DNS/URL inválida. 401/403/429/5xx/timeout = "não verificável"
 * (muitos sites bloqueiam robôs). Relatório: relatorios/links-AAAAMMDD.md
 *   node --env-file=.env backend/scripts/verificarLinks.js [--so-importados]
 */
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const filtro = process.argv.includes('--so-importados') ? { 'importacao.pasta': { $exists: true } } : {};
  const docs = await mongoose.connection.db.collection('artigos').find(filtro, { projection: { slug: 1, conteudo: 1 } }).toArray();
  await mongoose.disconnect();
  const urls = new Map();
  for (const d of docs) for (const m of d.conteudo.matchAll(/href="(https?:\/\/[^"]+)"/g)) { const u = m[1].replace(/&amp;/g, '&'); (urls.get(u) || urls.set(u, []).get(u)).push(d.slug); }
  const lista = [...urls.keys()];
  console.log(`${docs.length} textos · ${lista.length} links únicos`);
  const res = { ok: 0, quebrados: [], naoVerificavel: 0 };
  let i = 0;
  async function worker() {
    while (i < lista.length) {
      const u = lista[i++];
      try {
        let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'Mozilla/5.0 (verificador de links do portal)' } });
        if (r.status === 405 || r.status === 403 || r.status === 400) r = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'Mozilla/5.0 (verificador de links do portal)' } });
        if (r.status === 404 || r.status === 410) res.quebrados.push({ u, status: r.status });
        else if (r.ok) res.ok += 1; else res.naoVerificavel += 1;
      } catch (e) {
        const causa = String(e.cause?.code || e.message);
        if (/ENOTFOUND|EAI_AGAIN|ERR_INVALID_URL/.test(causa)) res.quebrados.push({ u, status: causa }); else res.naoVerificavel += 1;
      }
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));
  const p = (n) => String(n).padStart(2, '0'); const d = new Date();
  const arq = path.join(__dirname, '../../relatorios', `links-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.md`);
  fs.writeFileSync(arq, [`# Verificação de links — ${d.toISOString()}`, '', `- links únicos: ${lista.length} · OK: ${res.ok} · não verificáveis (bloqueio/timeout): ${res.naoVerificavel} · QUEBRADOS: ${res.quebrados.length}`, '', ...res.quebrados.map((q) => `- ${q.status} ${q.u} — em ${[...new Set(urls.get(q.u))].slice(0, 4).join(', ')}`)].join('\n') + '\n', 'utf8');
  console.log(`OK ${res.ok} · não verificáveis ${res.naoVerificavel} · quebrados ${res.quebrados.length}\n${arq}`);
})().catch((e) => { console.error(e.message); process.exit(2); });
