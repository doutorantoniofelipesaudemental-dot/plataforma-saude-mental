/**
 * Redações aprovadas pelo Dr. Antônio em 30/10/2026 para os episódios de estreia do podcast (ordem escrita, 30/10 22:30).
 *  R1 psicofarmacos-mitos-verdades: Geddes 2003 (recaída 41% → 18%, junto da chance reduzida em cerca de 70%).
 *  R2 saude-mental-idoso: Kok & Reynolds 2017 (evidência de benefício dos antidepressivos em depressão maior; psicoterapia nos leves e moderados).
 *  R3 psicofarmacos-mitos-verdades e psicofarmacos-mitos-culturais: aviso de protocolos locais no corpo (CLAUDE.md §1.C), se ainda não houver.
 * Só troca trechos com ocorrência exata e única. Nenhuma outra frase muda.
 * DRY-RUN POR PADRÃO. Com --aplicar: backup (artigos.json + .mdx) em backups/ e gravação no Mongo (campo conteudo) e nos .mdx.
 *   node --env-file-if-exists=.env backend/scripts/redacoesPodcastEstreia.js [--aplicar]
 * Textos com acento ("Antônio") não são alterados aqui.
 */
const fs = require('node:fs');
const path = require('node:path');
const { estadoNarracao } = require('../lib/narracao');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const aplicar = process.argv.includes('--aplicar');

const AVISO_P = '<p>Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.</p>';
const SEP_REF = '<h2>Referências</h2>';

const R1 = {
  slug: 'psicofarmacos-mitos-verdades',
  de: 'reduz em cerca de 70% a chance de recaída<sup>2</sup>.',
  para: 'reduz em cerca de 70% as chances de recaída; na prática, a recaída caiu de cerca de 41% para 18%<sup>2</sup>.',
  mdx: 'src/content/artigos/psicofarmacos-mitos-verdades.mdx',
};
const R2 = {
  slug: 'saude-mental-idoso',
  de: 'psicoterapia e medicação têm eficácia comprovada em idosos com depressão<sup>4</sup>.',
  para: 'há evidência de benefício dos antidepressivos em idosos com depressão maior; a psicoterapia também pode ajudar, sobretudo nos quadros leves e moderados<sup>4</sup>.',
  mdx: 'src/content/artigos/saude-mental-idoso.mdx',
};
const AVISOS = [
  { slug: 'psicofarmacos-mitos-verdades', mdx: 'src/content/artigos/psicofarmacos-mitos-verdades.mdx' },
  { slug: 'psicofarmacos-mitos-culturais', mdx: 'src/content/artigos/psicofarmacos-mitos-culturais.mdx' },
];

const conta = (t, s) => t.split(s).length - 1;

(async () => {
  const problemas = [];
  const registro = [];
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');

  // Alterações planejadas por documento (Mongo) e por arquivo (.mdx).
  const mudMongo = new Map();
  const mudMdx = new Map();
  const docPorSlug = {};
  for (const slug of [R1.slug, R2.slug, ...AVISOS.map((a) => a.slug)]) {
    const d = await col.findOne({ slug });
    if (!d) { problemas.push(`site:${slug}: não encontrado no banco`); continue; }
    docPorSlug[slug] = d;
  }
  const aplicarNoTexto = (slug, t, trocas, rotulo) => {
    let out = t;
    for (const x of trocas) {
      const n = conta(out, x.de);
      if (n !== 1) { problemas.push(`${rotulo}: trecho ocorre ${n}x (${x.de.slice(0, 50)}…)`); continue; }
      out = out.replace(x.de, x.para);
      registro.push(`${rotulo}: ${x.nome}`);
    }
    return out;
  };
  const inserirAviso = (t, rotulo) => {
    if (/protocolos hospitalares/i.test(t)) { registro.push(`${rotulo}: aviso já existe, sem mudança`); return t; }
    if (conta(t, SEP_REF) !== 1) { problemas.push(`${rotulo}: "<h2>Referências</h2>" ocorre ${conta(t, SEP_REF)}x`); return t; }
    registro.push(`${rotulo}: aviso de protocolos locais inserido antes das referências`);
    return t.replace(SEP_REF, `${AVISO_P}\n\n${SEP_REF}`);
  };

  for (const [trocas] of [[[R1]], [[R2]]]) {
    const x = trocas[0];
    const d = docPorSlug[x.slug];
    if (!d) continue;
    const novo = aplicarNoTexto(x.slug, d.conteudo, [{ ...x, nome: 'redação aprovada (ordem 30/10)' }], `site:${x.slug}`);
    if (novo !== d.conteudo) mudMongo.set(x.slug, { d, novo });
  }
  for (const av of AVISOS) {
    const d = docPorSlug[av.slug];
    if (!d) continue;
    const novo = inserirAviso(d.conteudo, `site:${av.slug}`);
    if (novo !== d.conteudo) {
      const m = mudMongo.get(av.slug) || { d, novo: d.conteudo };
      m.novo = novo; mudMongo.set(av.slug, m);
    }
  }

  // .mdx: a mesma lista. O aviso do verdades já está no .mdx (commit 3952905); só o culturais recebe o aviso.
  const mdxAlvos = [
    { rel: R1.mdx, trocas: [{ ...R1, nome: 'redação aprovada (ordem 30/10)' }] },
    { rel: R2.mdx, trocas: [{ ...R2, nome: 'redação aprovada (ordem 30/10)' }] },
  ];
  const arquivos = [];
  for (const alvo of mdxAlvos) {
    const arq = path.join(APP, alvo.rel);
    const orig = fs.readFileSync(arq, 'utf8');
    const eol = orig.includes('\r\n') ? '\r\n' : '\n';
    const lf = orig.replace(/\r\n/g, '\n');
    const novo = aplicarNoTexto(alvo.rel, lf, alvo.trocas, `next:${path.basename(alvo.rel)}`);
    if (novo !== lf) arquivos.push({ arq, rel: alvo.rel, orig, novo: novo.split('\n').join(eol) });
  }
  const avisoCulturalMdx = AVISOS.find((a) => a.slug === 'psicofarmacos-mitos-culturais');
  {
    const arq = path.join(APP, avisoCulturalMdx.mdx);
    const orig = fs.readFileSync(arq, 'utf8');
    const eol = orig.includes('\r\n') ? '\r\n' : '\n';
    const lf = orig.replace(/\r\n/g, '\n');
    const novo = inserirAviso(lf, `next:${path.basename(arq)}`);
    if (novo !== lf) arquivos.push({ arq, rel: avisoCulturalMdx.mdx, orig, novo: novo.split('\n').join(eol) });
  }

  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · textos do banco: ${mudMongo.size} · .mdx: ${arquivos.length}`);
  registro.forEach((r) => console.log('  •', r));
  for (const m of mudMongo.values()) {
    const antes = estadoNarracao(m.d).estado;
    const depois = estadoNarracao({ ...m.d, conteudo: m.novo }).estado;
    console.log(`  narração ${m.d.slug}: ${antes} → ${depois}`);
  }
  problemas.forEach((p) => console.log('  PROBLEMA', p));

  if (aplicar) {
    if (problemas.length) throw new Error('há problemas: nada foi gravado');
    const dl = new Date(); const p2 = (x) => String(x).padStart(2, '0');
    const dir = path.join(RAIZ, 'backups', `redacoes-podcast-${dl.getFullYear()}${p2(dl.getMonth() + 1)}${p2(dl.getDate())}-${p2(dl.getHours())}${p2(dl.getMinutes())}`);
    fs.mkdirSync(dir, { recursive: true });
    const docs = [...mudMongo.values()].map((m) => m.d);
    fs.writeFileSync(path.join(dir, 'artigos.json'), JSON.stringify(docs));
    for (const a of arquivos) { const destino = path.join(dir, 'mdx', a.rel); fs.mkdirSync(path.dirname(destino), { recursive: true }); fs.writeFileSync(destino, a.orig, 'utf8'); }
    const lido = JSON.parse(fs.readFileSync(path.join(dir, 'artigos.json'), 'utf8'));
    if (lido.length !== docs.length) throw new Error('backup não confere');
    for (const m of mudMongo.values()) await col.updateOne({ _id: m.d._id }, { $set: { conteudo: m.novo, ...(m.d.publicado ? { atualizadoEm: new Date() } : {}) } });
    for (const a of arquivos) fs.writeFileSync(a.arq, a.novo, 'utf8');
    console.log(`GRAVADO. Backup em ${path.relative(RAIZ, dir)} (${lido.length} documentos + ${arquivos.length} .mdx).`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
