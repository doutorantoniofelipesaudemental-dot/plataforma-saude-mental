/**
 * Varredura de retratações (decisão de 15/10/2026): todo DOI e PMID citado nos textos é conferido no Crossref e no PubMed.
 * Uma referência retratada vira FALHA na auditoria (`npm run auditoria`).
 *  - DOI: Crossref (`title` começa com "RETRACTED", relação/atualização do tipo retraction).
 *  - PMID: PubMed esummary (`pubtype` contém "Retracted Publication").
 * Cache de 7 dias em relatorios/.cache-retratacoes.json (ignorado pelo git) para não repetir ~650 consultas a cada execução.
 * Falha de rede NÃO vira falha de auditoria: o item fica "não verificado" e é listado à parte.
 */
const fs = require('node:fs');
const path = require('node:path');

const CACHE = path.join(__dirname, '../../relatorios/.cache-retratacoes.json');
const VALIDADE_MS = 7 * 86400e3;
const EMAIL = 'doutor.antoniofelipe.saudemental@gmail.com';

function extrairDois(texto) {
  const dois = new Set();
  for (const m of String(texto).matchAll(/10\.\d{4,9}\/[^\s"'<>\]]+/g)) {
    let d = m[0].replace(/[.,;]+$/, '');
    while (d.endsWith(')') && (d.match(/\)/g) || []).length > (d.match(/\(/g) || []).length) d = d.slice(0, -1);
    dois.add(d);
  }
  return [...dois];
}
function extrairPmids(texto) {
  const p = new Set();
  for (const m of String(texto).matchAll(/(?:PMID[:\s]*|pubmed\.ncbi\.nlm\.nih\.gov\/)(\d{6,9})/gi)) p.add(m[1]);
  return [...p];
}

const lerCache = () => { try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { return {}; } };
const gravarCache = (c) => { try { fs.writeFileSync(CACHE, JSON.stringify(c)); } catch { /* cache é opcional */ } };

async function consultaDoi(doi) {
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${EMAIL}`, { signal: AbortSignal.timeout(20000) });
      if (r.status === 404) return { estado: 'inexistente' };
      if (r.status === 429) { await new Promise((x) => setTimeout(x, 3000)); continue; }
      if (!r.ok) return { estado: 'nao-verificado', motivo: `HTTP ${r.status}` };
      const m = (await r.json()).message;
      const titulo = (m.title && m.title[0]) || '';
      const retratado = /^retract|retracted/i.test(titulo) || JSON.stringify(m.relation || {}).includes('retract') || [...(m['update-to'] || []), ...(m['updated-by'] || [])].some((u) => /retract/i.test(u.type || ''));
      return retratado ? { estado: 'retratado', titulo: titulo.slice(0, 120) } : { estado: 'ok' };
    } catch (e) { if (t === 2) return { estado: 'nao-verificado', motivo: e.message.slice(0, 40) }; }
  }
  return { estado: 'nao-verificado', motivo: 'tentativas esgotadas' };
}
async function consultaPmids(pmids) {
  const res = {};
  for (let i = 0; i < pmids.length; i += 100) {
    const lote = pmids.slice(i, i + 100);
    try {
      const r = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${lote.join(',')}&retmode=json`, { signal: AbortSignal.timeout(30000) });
      const j = await r.json();
      for (const id of lote) {
        const x = j.result && j.result[id];
        if (!x || x.error) res[id] = { estado: 'inexistente' };
        else res[id] = (x.pubtype || []).some((t) => /retracted publication/i.test(t)) ? { estado: 'retratado', titulo: String(x.title || '').slice(0, 120) } : { estado: 'ok' };
      }
    } catch (e) { for (const id of lote) res[id] = { estado: 'nao-verificado', motivo: e.message.slice(0, 40) }; }
  }
  return res;
}

/** textos: [{ chave, corpo }]. Devolve { retratados: [{ id, tipo, titulo, chaves }], inexistentes: [...], naoVerificados: n, total } */
async function varrer(textos, { usarCache = true } = {}) {
  const uso = new Map(); // "doi:..." / "pmid:..." -> Set(chave)
  for (const t of textos) {
    for (const d of extrairDois(t.corpo)) { const k = `doi:${d}`; if (!uso.has(k)) uso.set(k, new Set()); uso.get(k).add(t.chave); }
    for (const p of extrairPmids(t.corpo)) { const k = `pmid:${p}`; if (!uso.has(k)) uso.set(k, new Set()); uso.get(k).add(t.chave); }
  }
  const cache = usarCache ? lerCache() : {};
  const agora = Date.now();
  const pendentes = [...uso.keys()].filter((k) => !(cache[k] && agora - cache[k].em < VALIDADE_MS && cache[k].estado !== 'nao-verificado'));
  const dois = pendentes.filter((k) => k.startsWith('doi:'));
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (i < dois.length) { const k = dois[i++]; cache[k] = { ...(await consultaDoi(k.slice(4))), em: Date.now() }; } }));
  const pm = pendentes.filter((k) => k.startsWith('pmid:')).map((k) => k.slice(5));
  if (pm.length) { const r = await consultaPmids(pm); for (const [id, v] of Object.entries(r)) cache[`pmid:${id}`] = { ...v, em: Date.now() }; }
  if (usarCache) gravarCache(cache);
  const retratados = [], inexistentes = [];
  let naoVerificados = 0;
  for (const [k, chaves] of uso) {
    const c = cache[k] || { estado: 'nao-verificado' };
    if (c.estado === 'retratado') retratados.push({ id: k, titulo: c.titulo, chaves: [...chaves] });
    else if (c.estado === 'inexistente') inexistentes.push({ id: k, chaves: [...chaves] });
    else if (c.estado === 'nao-verificado') naoVerificados += 1;
  }
  return { retratados, inexistentes, naoVerificados, total: uso.size };
}

module.exports = { varrer, extrairDois, extrairPmids };
