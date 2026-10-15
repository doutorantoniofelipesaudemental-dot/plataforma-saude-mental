/**
 * Identificação ÚNICA por página (15/10/2026): remove o bloco de identificação do CORPO dos textos (MongoDB e .mdx).
 * A identificação oficial (5 linhas, com a TCC) fica só no rodapé do template. DRY-RUN POR PADRÃO.
 *   node --env-file=.env backend/scripts/removerBlocoIdentificacao.js            dry-run
 *   node --env-file=.env backend/scripts/removerBlocoIdentificacao.js --aplicar  grava (exige backup de hoje: prefixo identificacao-unica)
 * Só o bloco sai (nem o atualizadoEm muda). O hash da narração já ignora o bloco: o script confere que NENHUM estado de narração muda.
 */
const fs = require('node:fs');
const path = require('node:path');
const narr = require('../lib/narracao');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const aplicar = process.argv.includes('--aplicar');
// parágrafo que contém "NÃO ESPECIALISTA" (assinatura padrão), com o espaço em branco que o precede
const RE_BLOCO = /\s*<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?N[ÃA]O ESPECIALISTA(?:(?!<\/p>)[\s\S])*?<\/p>/g;
const RE_BLOCO_MDX = /\s*<p className="identificacao-medico">[\s\S]*?<\/p>/g;

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const docs = await col.find({}).toArray();
  const plano = [], problemas = [];
  const estados = { antes: {}, depois: {} };
  for (const d of docs) {
    const n = (d.conteudo.match(RE_BLOCO) || []).length;
    if (!n) continue;
    if (n > 1) { problemas.push(`${d.slug}: ${n} blocos`); continue; }
    const conteudo = d.conteudo.replace(RE_BLOCO, '');
    const antes = narr.estadoNarracao(d).estado, depois = narr.estadoNarracao({ ...d, conteudo }).estado;
    estados.antes[antes] = (estados.antes[antes] || 0) + 1; estados.depois[depois] = (estados.depois[depois] || 0) + 1;
    if (antes !== depois) problemas.push(`${d.slug}: estado da narração mudaria ${antes}→${depois}`);
    plano.push({ d, conteudo });
  }
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.mdx$/.test(e.name) ? [path.join(dir, e.name)] : []));
  const planoMdx = [];
  for (const arq of [...walk(path.join(APP, 'src/content')), ...walk(path.join(APP, 'content'))]) {
    const t = fs.readFileSync(arq, 'utf8');
    const n = (t.match(RE_BLOCO_MDX) || []).length;
    if (n === 1) planoMdx.push({ arq, novo: t.replace(RE_BLOCO_MDX, '\n') });
    else if (n > 1) problemas.push(`${path.relative(RAIZ, arq)}: ${n} blocos`);
  }
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · blocos a remover do corpo: MongoDB ${plano.length} · MDX ${planoMdx.length}`);
  console.log('Narração antes:', JSON.stringify(estados.antes), '· depois:', JSON.stringify(estados.depois));
  problemas.forEach((p) => console.log('  PROBLEMA', p));
  if (aplicar) {
    if (problemas.length) throw new Error('há problemas: nada foi gravado');
    const dl = new Date(); const p2 = (x) => String(x).padStart(2, '0');
    const hoje = `${dl.getFullYear()}${p2(dl.getMonth() + 1)}${p2(dl.getDate())}`;
    const bk = fs.readdirSync(path.join(RAIZ, 'backups')).filter((x) => x.startsWith('identificacao-unica-')).sort().pop();
    if (!bk || !bk.includes(hoje)) throw new Error('sem backup identificacao-unica de hoje');
    for (const p of plano) await col.updateOne({ _id: p.d._id }, { $set: { conteudo: p.conteudo } });
    for (const p of planoMdx) fs.writeFileSync(p.arq, p.novo, 'utf8');
    console.log(`GRAVADO: MongoDB ${plano.length} · MDX ${planoMdx.length}`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
