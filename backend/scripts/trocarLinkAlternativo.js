/**
 * Troca uma fonte que falhou 2 semanas seguidas (relatorios/links-estado.json, ver scripts/rotinaSemanal.js) pelo link OFICIAL
 * alternativo. Só mexe no href e no rótulo do link (a referência fica dentro do bloco de referências, fora da narração: o hash não muda).
 * DRY-RUN POR PADRÃO. Com --aplicar: backup (Mongo + .mdx) e gravação.
 *   node --env-file=.env backend/scripts/trocarLinkAlternativo.js [--aplicar] [--forcar]
 * Sem --forcar, só troca o link cujo contador em links-estado.json já está em 2 ou mais.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const aplicar = process.argv.includes('--aplicar');
const forcar = process.argv.includes('--forcar');

// href antigo → { href novo, rótulo antigo → rótulo novo }
const TROCAS = [
  {
    velho: 'https://www.conass.org.br/?p=43106',
    novo: 'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3681_22_05_2024.html',
    rotuloVelho: 'www.conass.org.br',
    rotuloNovo: 'bvsms.saude.gov.br',
    prefixoVelho: 'Resumo técnico disponível em: ',
    prefixoNovo: 'Texto oficial disponível em: ',
  },
];

function aplicarTrocas(texto, ativas, registro, rotulo) {
  let t = texto;
  for (const x of ativas) {
    const alvo = `<a href="${x.velho}" target="_blank" rel="noopener">${x.rotuloVelho}</a>`;
    const alvoComPrefixo = `${x.prefixoVelho}${alvo}`;
    const novoLink = `<a href="${x.novo}" target="_blank" rel="noopener">${x.rotuloNovo}</a>`;
    const n1 = t.split(alvoComPrefixo).length - 1;
    if (n1) { t = t.split(alvoComPrefixo).join(`${x.prefixoNovo}${novoLink}`); registro.push(`${rotulo}: ${n1}× ${x.velho}`); }
    const n2 = t.split(alvo).length - 1; // sobrou algum sem o prefixo
    if (n2) { t = t.split(alvo).join(novoLink); registro.push(`${rotulo}: ${n2}× ${x.velho} (sem prefixo)`); }
  }
  return t;
}

(async () => {
  let estado = {};
  try { estado = JSON.parse(fs.readFileSync(path.join(RAIZ, 'relatorios', 'links-estado.json'), 'utf8')); } catch { /* sem estado */ }
  const ativas = TROCAS.filter((x) => forcar || (estado[x.velho]?.falhasSeguidas || 0) >= 2);
  if (!ativas.length) { console.log('Nada a trocar: nenhum link alternativo atingiu 2 semanas de falha (use --forcar para testar).'); return; }

  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const registro = [], mud = [];
  for (const d of await col.find({}).toArray()) {
    const t = aplicarTrocas(d.conteudo, ativas, registro, `site:${d.slug}`);
    if (t !== d.conteudo) mud.push({ d, novo: t });
  }
  const arquivos = [];
  const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.mdx$/.test(e.name) ? [path.join(dir, e.name)] : [])) : []);
  for (const arq of [...walk(path.join(APP, 'src/content')), ...walk(path.join(APP, 'content'))]) {
    const orig = fs.readFileSync(arq, 'utf8');
    const t = aplicarTrocas(orig, ativas, registro, `next:${path.basename(arq)}`);
    if (t !== orig) arquivos.push({ arq, orig, novo: t });
  }
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · textos do site: ${mud.length} · .mdx do Next: ${arquivos.length}`);
  registro.forEach((r) => console.log('  •', r));
  if (aplicar && (mud.length || arquivos.length)) {
    const dl = new Date(); const p2 = (x) => String(x).padStart(2, '0');
    const dir = path.join(RAIZ, 'backups', `link-alternativo-${dl.getFullYear()}${p2(dl.getMonth() + 1)}${p2(dl.getDate())}-${p2(dl.getHours())}${p2(dl.getMinutes())}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'artigos.json'), JSON.stringify(mud.map((m) => m.d)));
    for (const a of arquivos) { const alvo = path.join(dir, 'mdx', path.basename(a.arq)); fs.mkdirSync(path.dirname(alvo), { recursive: true }); fs.writeFileSync(alvo, a.orig, 'utf8'); }
    if (JSON.parse(fs.readFileSync(path.join(dir, 'artigos.json'), 'utf8')).length !== mud.length) throw new Error('backup não confere');
    for (const m of mud) await col.updateOne({ _id: m.d._id }, { $set: { conteudo: m.novo, ...(m.d.publicado ? { atualizadoEm: new Date() } : {}) } });
    for (const a of arquivos) fs.writeFileSync(a.arq, a.novo, 'utf8');
    console.log(`GRAVADO. Backup em ${path.relative(RAIZ, dir)}.`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
