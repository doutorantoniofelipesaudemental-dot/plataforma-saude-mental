/**
 * Exporta os textos com menos de 4 referências para importacao-completa/exportar-sem-referencias.zip
 * (lote.json + conteudo/<slug>.html|.mdx), para o Claude acrescentar referências conferidas no PubMed.
 * NÃO inventa referência. Só leitura.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { checarTexto } = require('../lib/auditoriaTexto');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const SAIDA = path.join(RAIZ, 'importacao-completa/exportar-sem-referencias');
const refs = (html) => { const i = html.search(/<h[2-4][^>]*>\s*(?:Refer[êe]ncias|Fontes)/i); return i < 0 ? 0 : (html.slice(i).match(/<li[ >]/g) || []).length; };

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const docs = await mongoose.connection.db.collection('artigos').find({}).toArray();
  await mongoose.disconnect();
  fs.rmSync(path.join(RAIZ, 'importacao-completa/exportar-sem-referencias.zip'), { force: true });
  fs.rmSync(SAIDA, { recursive: true, force: true });
  fs.mkdirSync(path.join(SAIDA, 'conteudo'), { recursive: true });
  const lote = [];
  for (const d of docs) {
    if (!checarTexto({ origem: 'mongo', slug: d.slug, titulo: d.titulo, resumo: d.resumo, tempoLeitura: d.tempoLeitura, corpo: d.conteudo }).some((f) => /menos de 4 referências/.test(f.msg))) continue;
    fs.writeFileSync(path.join(SAIDA, 'conteudo', `${d.slug}.html`), d.conteudo, 'utf8');
    lote.push({ slug: d.slug, titulo: d.titulo, resumo: d.resumo, categoria: d.categoria, tipo: d.importacao?.tipo || (d.categoria === 'Relatos da Prática' ? 'relato' : 'artigo'), n_referencias: refs(d.conteudo), origem: 'mongodb', status: d.publicado ? 'publicado' : d.agendamento?.agendado ? 'agendado' : 'rascunho', dataAgendada: d.agendamento?.agendado ? d.agendamento.slot : null, arquivo_conteudo: `${d.slug}.html` });
  }
  for (const dir of [path.join(APP, 'src/content/artigos'), path.join(APP, 'content/blog')]) {
    for (const n of fs.readdirSync(dir).filter((x) => /\.mdx$/.test(x))) {
      const corpo = fs.readFileSync(path.join(dir, n), 'utf8');
      if (!checarTexto({ origem: 'mdx', slug: n.replace(/\.mdx$/, ''), titulo: 'x', resumo: 'x', tempoLeitura: 1, corpo }).some((f) => /menos de 4 referências/.test(f.msg))) continue;
      const slug = n.replace(/\.mdx$/, '');
      const titulo = (corpo.match(/titulo:\s*'([^']*)'/) || [])[1] || slug;
      fs.writeFileSync(path.join(SAIDA, 'conteudo', `${slug}.mdx.html`), corpo, 'utf8');
      lote.push({ slug, titulo, resumo: (corpo.match(/resumo:\s*'([^']*)'/) || [])[1] || '', categoria: (corpo.match(/categoria:\s*'([^']*)'/) || [])[1] || '', tipo: /^relato-/.test(slug) ? 'relato' : 'artigo', n_referencias: refs(corpo), origem: `mdx (${path.relative(APP, dir).split(path.sep).join('/')})`, status: 'publicado no app Next (arquivo .mdx; o conteúdo exportado é o arquivo inteiro, com metadata JS)', dataAgendada: null, arquivo_conteudo: `${slug}.mdx.html` });
    }
  }
  fs.writeFileSync(path.join(SAIDA, 'lote.json'), JSON.stringify(lote, null, 2), 'utf8');
  fs.writeFileSync(path.join(SAIDA, 'LEIA-ME.md'), `# Textos sem 4 referências (${lote.length})\n\nAcrescentar referências CONFERIDAS (PubMed/fontes oficiais); não inventar. Devolver no mesmo formato (lote.json + conteudo/).\nOs itens "mdx" vêm do app Next: o arquivo inteiro está em conteudo/<slug>.mdx.html.\n`);
  execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${path.join(SAIDA, '*')}' -DestinationPath '${SAIDA}.zip' -Force`]);
  const porStatus = {};
  for (const l of lote) { const k = l.origem.startsWith('mdx') ? 'mdx (app Next)' : l.status; porStatus[k] = (porStatus[k] || 0) + 1; }
  console.log(JSON.stringify({ total: lote.length, porStatus, zip: `${SAIDA}.zip` }, null, 2));
})().catch((e) => { console.error(e.message); process.exit(2); });
