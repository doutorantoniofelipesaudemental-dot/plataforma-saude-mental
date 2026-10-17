/**
 * Varredura científica preventiva dos textos (MongoDB + .mdx do app Next). SOMENTE LEITURA: não grava nos textos.
 *   node --env-file=.env backend/scripts/varreduraCientifica.js      grava relatorios/varredura-cientifica-AAAAMMDD.md
 * Procura: (1) potência de antipsicóticos; (2) doses e faixas de lítio, valproato, antidepressivos e benzodiazepínicos; (3) rankings ("o país que mais…", "o maior…",
 * "lidera…"); (4) textos sobre violência sem os canais de apoio (Ligue 180, 190; Disque 100 quando houver criança, adolescente ou idoso); (5) posts de redes que citam
 * textos corrigidos. Cada achado é um ponto para CONFERIR com fonte; só erro factual inequívoco é corrigido (fora deste script, com backup).
 */
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

const RAIZ = path.resolve(__dirname, '../..');
const limpar = (h) => String(h || '').replace(/<sup>[^<]*<\/sup>/g, '').replace(/<\/(p|li|h[1-6]|div)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const trecho = (t, i, n = 110) => t.slice(Math.max(0, i - 50), i + n).replace(/\s+/g, ' ').trim();

const ALTA = /(halop?eridol|flufenazina|trifluoperazina|pimozida)/i, BAIXA = /(clorpromazina|levomepromazina|tioridazina)/i, ATIPICO = /(risperidona|olanzapina|quetiapina|aripiprazol|clozapina|ziprasidona|paliperidona|lurasidona|cariprazina|asenapina)/i;
const REGRAS = [
  { grupo: 'potência de antipsicóticos', re: /(alta|baixa|média) potência/gi, julga: (t, i, m) => {
    const ctx = t.slice(Math.max(0, i - 160), i + 160); const baixa = /baixa/i.test(m[0]), alta = /alta/i.test(m[0]);
    if (baixa && ALTA.test(ctx)) return 'haloperidol e afins são de ALTA potência, mas o trecho fala em baixa potência';
    if (alta && BAIXA.test(ctx)) return 'clorpromazina e afins são de BAIXA potência, mas o trecho fala em alta potência';
    if ((baixa || alta) && ATIPICO.test(ctx)) return 'antipsicótico atípico citado junto de "potência" (a classificação alta/baixa vale para os típicos): conferir';
    return null; } },
  { grupo: 'lítio', re: /(l[ií]tio|litemia)[^\n]{0,300}?\d+(?:[.,]\d+)?\s?(?:mEq\/L|mmol\/L|mg)/gi },
  { grupo: 'valproato', re: /(valpro[ai]to|[áa]cido valproico|divalproato)[^\n]{0,300}?\d+(?:[.,]\d+)?\s?(?:mg|µg\/mL|mcg\/mL|ug\/mL)/gi },
  { grupo: 'antidepressivos', re: /(fluoxetina|sertralina|escitalopram|citalopram|paroxetina|venlafaxina|duloxetina|amitriptilina|nortriptilina|bupropiona|mirtazapina)[^\n]{0,240}?\d+(?:[.,]\d+)?\s?mg/gi },
  { grupo: 'benzodiazepínicos', re: /(lorazepam|diazepam|clonazepam|alprazolam|midazolam|bromazepam)[^\n]{0,240}?\d+(?:[.,]\d+)?\s?mg/gi },
  { grupo: 'ranking / superlativo', re: /\b(o país que mais|o pa[ií]s com (?:mais|maior)|o maior (?:pa[ií]s|n[úu]mero|causa|ind[ií]ce)|a maior causa|lidera|primeiro lugar|1º lugar|campe[ãa]o mundial|o que mais (?:mata|adoece)|mais comum do mundo|o mais comum)\b/gi },
];
const VIOLENCIA = /(viol[êe]ncia dom[ée]stica|viol[êe]ncia contra a mulher|viol[êe]ncia no namoro|abuso sexual|abuso f[ií]sico|maus-tratos|relacionamento abusivo|Maria da Penha|viol[êe]ncia (?:f[ií]sica|psicol[óo]gica|sexual))/i;
const CANAIS = /(Ligue 180|\b180\b)/, POLICIA = /\b190\b/, DISQUE100 = /Disque 100|\b100\b/, VULNERAVEL = /(crian[çc]a|adolescente|idos[oa]|menor de idade)/i;

function varrer({ id, titulo, categoria, texto }) {
  const t = limpar(texto), achados = [];
  for (const r of REGRAS) {
    let m; const re = new RegExp(r.re.source, r.re.flags);
    while ((m = re.exec(t))) {
      const julg = r.julga ? r.julga(t, m.index, m) : null;
      if (r.julga && !julg) continue;
      achados.push({ grupo: r.grupo, trecho: trecho(t, m.index), nota: julg || '' });
      if (achados.filter((a) => a.grupo === r.grupo).length >= 3) break;
    }
  }
  const nViol = (t.match(new RegExp(VIOLENCIA.source, 'gi')) || []).length;
  if (nViol >= 3 || (nViol >= 1 && VIOLENCIA.test(titulo || ''))) { // tema principal (3+ menções ou no título); menção de passagem não entra
    const falta = [];
    if (!CANAIS.test(t)) falta.push('Ligue 180'); if (!POLICIA.test(t)) falta.push('190');
    if (VULNERAVEL.test(t) && !DISQUE100.test(t)) falta.push('Disque 100 (há criança/adolescente/idoso no tema)');
    if (falta.length) achados.push({ grupo: 'violência sem canais de apoio', trecho: trecho(t, t.search(VIOLENCIA)), nota: `faltam: ${falta.join(', ')}` });
  }
  return { id, titulo, achados };
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const docs = await db.collection('artigos').find({}, { projection: { slug: 1, titulo: 1, categoria: 1, conteudo: 1 } }).toArray();
  const itens = docs.map((d) => ({ id: d.slug, titulo: d.titulo, categoria: d.categoria, texto: d.conteudo }));
  const dirMdx = path.join(RAIZ, 'apps', 'plataforma-saude-mental', 'src', 'content', 'artigos');
  let nMdx = 0;
  for (const f of fs.existsSync(dirMdx) ? fs.readdirSync(dirMdx).filter((x) => x.endsWith('.mdx')) : []) {
    const s = fs.readFileSync(path.join(dirMdx, f), 'utf8'); nMdx++;
    itens.push({ id: `mdx:${f.replace('.mdx', '')}`, titulo: (s.match(/titulo:\s*'([^']*)'/) || [])[1] || f, categoria: (s.match(/categoria:\s*'([^']*)'/) || [])[1] || '', texto: s });
  }
  const res = itens.map(varrer).filter((r) => r.achados.length);
  const porGrupo = {}; for (const r of res) for (const a of r.achados) porGrupo[a.grupo] = (porGrupo[a.grupo] || 0) + 1;

  // posts de redes que citam textos com achados
  const slugsAchados = new Set(res.map((r) => r.id.replace(/^mdx:/, '')));
  const posts = [];
  for (const it of await db.collection('linkedin_fila').find({}).toArray()) { const s = it.slug || (String(it.url || '').match(/\/artigo\/([^/?#]+)/) || [])[1]; if (s && slugsAchados.has(s)) posts.push(`LinkedIn ${it.id} (${String(it.slot).slice(0, 10)}) → ${s}`); }

  const data = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sep = ' · ';
  const linhas = [`# Varredura científica preventiva (${data})`, '', `Textos varridos: **${itens.length}** (${docs.length} no MongoDB + ${nMdx} .mdx do app Next). Somente leitura; nada foi alterado por esta varredura.`, `Com pelo menos um ponto a conferir: **${res.length}**. Por grupo: ${Object.entries(porGrupo).map(([g, n]) => `${g} ${n}`).join(sep)}.`, '', 'Cada linha é um ponto a CONFERIR com fonte; faixas, doses e rankings só mudam com fonte literal e, se mudar o sentido clínico, com OK do Dr. Antônio.', ''];
  for (const g of Object.keys(porGrupo)) {
    linhas.push(`## ${g}`, '');
    for (const r of res) for (const a of r.achados.filter((x) => x.grupo === g)) linhas.push(`- \`${r.id}\` — ${a.nota ? `**${a.nota}**: ` : ''}"${a.trecho}"`);
    linhas.push('');
  }
  linhas.push('## Posts das redes que citam textos com pontos a conferir', '', ...(posts.length ? posts.map((p) => `- ${p}`) : ['- nenhum post da fila do LinkedIn aponta para esses textos']), '');
  const arq = path.join(RAIZ, 'relatorios', `varredura-cientifica-${data}.md`);
  fs.writeFileSync(arq, linhas.join('\n'), 'utf8');
  console.log(`varridos ${itens.length} · com pontos ${res.length} · ${Object.entries(porGrupo).map(([g, n]) => `${g}: ${n}`).join(' | ')}\n${arq}`);
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
