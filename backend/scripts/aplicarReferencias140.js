/**
 * Aplica o pacote importacao-completa/referencias-140 (140 textos com referências conferidas). DRY-RUN POR PADRÃO.
 *   node --env-file=.env backend/scripts/aplicarReferencias140.js            dry-run
 *   node --env-file=.env backend/scripts/aplicarReferencias140.js --aplicar  grava (exige backup de hoje com prefixo referencias-140)
 * MongoDB: muda só `conteudo`, `tempoLeitura` e `atualizadoEm` (o player antigo some pelo hash da narração; áudio preservado).
 * MDX (app Next): sobrescreve o arquivo inteiro SE a metadata for idêntica à atual; se diferir, o item é barrado.
 * Item cuja nova versão falhar na auditoria (qualquer falha) é barrado e listado.
 */
const fs = require('node:fs');
const path = require('node:path');
const { checarTexto } = require('../lib/auditoriaTexto');
const { estadoNarracao } = require('../lib/narracao');

const RAIZ = path.resolve(__dirname, '../..');
const PKG = path.join(RAIZ, 'importacao-completa/referencias-140');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const aplicar = process.argv.includes('--aplicar');
const contarRefs = (t) => { const i = t.search(/<h[2-4][^>]*>\s*(?:Refer[êe]ncias|Fontes)/i); return i < 0 ? 0 : (t.slice(i).match(/<li[ >]/g) || []).length; };
const palavras = (t) => t.replace(/<h[2-4][^>]*>\s*Refer[\s\S]*$/i, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const metadataDe = (t) => { const m = t.match(/export const metadata = \{[\s\S]*?\n\};/); return m ? m[0].replace(/\r/g, '').trim() : null; };
const ref = (k) => (k.startsWith('mdx (') ? k.slice(5, -1) : null);

(async () => {
  const lote = JSON.parse(fs.readFileSync(path.join(PKG, 'lote.json'), 'utf8'));
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const plano = [], barrados = [];
  for (const it of lote) {
    const novo = fs.readFileSync(path.join(PKG, 'conteudo', it.arquivo_conteudo), 'utf8');
    const refDepois = contarRefs(novo);
    if (it.origem === 'mongodb') {
      const d = await col.findOne({ slug: it.slug });
      if (!d) { barrados.push({ it, motivo: 'documento não encontrado no MongoDB' }); continue; }
      const falhas = checarTexto({ origem: 'mongo', slug: d.slug, titulo: d.titulo, resumo: d.resumo, tempoLeitura: d.tempoLeitura, corpo: novo });
      if (falhas.length) { barrados.push({ it, motivo: `auditoria da nova versão: ${falhas.map((f) => f.msg).join(' | ')}` }); continue; }
      const estadoAntes = estadoNarracao(d).estado, estadoDepois = estadoNarracao({ ...d, conteudo: novo }).estado;
      plano.push({ tipo: 'mongo', it, d, novo, refAntes: contarRefs(d.conteudo), refDepois, tempoLeitura: Math.max(1, Math.ceil(palavras(novo) / 200)), narracao: `${estadoAntes}→${estadoDepois}` });
    } else {
      const arq = path.join(APP, ref(it.origem), `${it.slug}.mdx`);
      if (!fs.existsSync(arq)) { barrados.push({ it, motivo: `arquivo ${path.relative(RAIZ, arq)} não existe` }); continue; }
      const atual = fs.readFileSync(arq, 'utf8');
      if (metadataDe(atual) !== metadataDe(novo)) { barrados.push({ it, motivo: 'metadata do .mdx DIFERE da atual (parar e avisar)' }); continue; }
      const falhas = checarTexto({ origem: 'mdx', slug: it.slug, titulo: 'x', resumo: 'x', tempoLeitura: 1, corpo: novo });
      if (falhas.length) { barrados.push({ it, motivo: `auditoria da nova versão: ${falhas.map((f) => f.msg).join(' | ')}` }); continue; }
      plano.push({ tipo: 'mdx', it, arq, novo, refAntes: contarRefs(atual), refDepois });
    }
  }
  const soma = (k) => plano.reduce((s, p) => s + p[k], 0);
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · itens: ${lote.length} · a atualizar: ${plano.length} (Mongo ${plano.filter((p) => p.tipo === 'mongo').length}, MDX ${plano.filter((p) => p.tipo === 'mdx').length}) · barrados: ${barrados.length}`);
  console.log(`Referências antes → depois (nos itens a atualizar): ${soma('refAntes')} → ${soma('refDepois')} · menor número depois: ${Math.min(...plano.map((p) => p.refDepois))}`);
  const narr = {}; for (const p of plano.filter((x) => x.tipo === 'mongo')) narr[p.narracao] = (narr[p.narracao] || 0) + 1;
  console.log('Narração (Mongo):', JSON.stringify(narr), '(ok→desatualizada = player oculto; áudio preservado)');
  barrados.forEach((b) => console.log(`  BARRADO ${b.it.slug}: ${b.motivo}`));

  if (aplicar) {
    const dl = new Date(); const p2 = (n) => String(n).padStart(2, '0');
    const hoje = `${dl.getFullYear()}${p2(dl.getMonth() + 1)}${p2(dl.getDate())}`;
    const bk = fs.readdirSync(path.join(RAIZ, 'backups')).filter((n) => n.startsWith('referencias-140-')).sort().pop();
    if (!bk || !bk.includes(hoje)) throw new Error('sem backup referencias-140 de hoje');
    const agora = new Date();
    let m = 0, x = 0;
    for (const p of plano) {
      if (p.tipo === 'mongo') { await col.updateOne({ _id: p.d._id }, { $set: { conteudo: p.novo, tempoLeitura: p.tempoLeitura, atualizadoEm: agora } }); m += 1; }
      else { fs.writeFileSync(p.arq, p.novo, 'utf8'); x += 1; }
    }
    console.log(`GRAVADO: MongoDB ${m} · MDX ${x}`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
