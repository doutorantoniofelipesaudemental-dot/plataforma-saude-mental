/**
 * Atualiza SÓ o bloco de identificação (assinatura padrão completa, 15/10/2026) em todos os textos que o têm no próprio
 * conteúdo: MongoDB (coleção artigos) e .mdx do app Next. DRY-RUN POR PADRÃO.
 *   node --env-file=.env backend/scripts/atualizarAssinatura.js            dry-run (contagens)
 *   node --env-file=.env backend/scripts/atualizarAssinatura.js --aplicar  grava (exige backup de hoje com prefixo assinatura-tcc)
 * Nada além do bloco muda (nem atualizadoEm). Narração: o hash passa a ignorar o bloco (backend/lib/narracao.js); para
 * as narrações em estado "ok" pelo cálculo ANTIGO, o hash guardado é migrado para o cálculo novo, então nenhum áudio é invalidado.
 */
const fs = require('node:fs');
const path = require('node:path');
const antigo = require('../../scratchpad/narracao_old.js'); // cópia do cálculo anterior (git show HEAD:backend/lib/narracao.js)
const novo = require('../lib/narracao');
const { IDENTIFICACAO_COMPLETA } = require('../lib/conformidadeCfm');

const RAIZ = path.resolve(__dirname, '../..');
const APP = path.join(RAIZ, 'apps/plataforma-saude-mental');
const aplicar = process.argv.includes('--aplicar');
const LINHAS = IDENTIFICACAO_COMPLETA.split('\n');
const BLOCO_HTML = `<p class="identificacao-medico">${LINHAS.join('<br>')}</p>`;
const BLOCO_MDX = `<p className="identificacao-medico">${LINHAS.join('<br />')}</p>`;
// parágrafo que contém "NÃO ESPECIALISTA" (as 4 formas existentes são todas <p>)
const RE_BLOCO = /<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?N[ÃA]O ESPECIALISTA(?:(?!<\/p>)[\s\S])*?<\/p>/g;
const RE_BLOCO_MDX = /<p className="identificacao-medico">[\s\S]*?<\/p>/g;

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const docs = await col.find({}).toArray();
  const plano = [], semBloco = [], problemas = [];
  const narr = { 'ok→ok (hash migrado)': 0, 'legado (sem hash, intacto)': 0, 'já desatualizada (intacta)': 0, 'ausente': 0 };
  for (const d of docs) {
    const blocos = d.conteudo.match(RE_BLOCO) || [];
    if (!blocos.length) { semBloco.push(d.slug); continue; }
    if (blocos.length > 1) { problemas.push(`${d.slug}: ${blocos.length} blocos`); continue; }
    const conteudo = d.conteudo.replace(RE_BLOCO, () => BLOCO_HTML);
    const set = { conteudo };
    const antes = antigo.estadoNarracao(d).estado;
    if (antes === 'ok') {
      set['narracao.hash'] = novo.estadoNarracao(d).esperado; // hash do cálculo novo (independe do bloco)
      narr['ok→ok (hash migrado)'] += 1;
    } else if (antes === 'legado') narr['legado (sem hash, intacto)'] += 1;
    else if (antes === 'desatualizada') narr['já desatualizada (intacta)'] += 1;
    else narr.ausente += 1;
    // verificação: depois da troca, quem estava ok continua ok
    const depois = novo.estadoNarracao({ ...d, conteudo, narracao: { ...(d.narracao || {}), ...(set['narracao.hash'] ? { hash: set['narracao.hash'] } : {}) } }).estado;
    if (antes === 'ok' && depois !== 'ok') problemas.push(`${d.slug}: narração deixaria de estar ok (${depois})`);
    if (antes === 'legado' && depois !== 'legado') problemas.push(`${d.slug}: legado mudaria para ${depois}`);
    plano.push({ d, set });
  }
  // MDX
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.mdx$/.test(e.name) ? [path.join(dir, e.name)] : []));
  const mdx = [...walk(path.join(APP, 'src/content')), ...walk(path.join(APP, 'content'))];
  const planoMdx = [];
  for (const arq of mdx) {
    const t = fs.readFileSync(arq, 'utf8');
    const n = (t.match(RE_BLOCO_MDX) || []).length;
    if (n === 1) planoMdx.push({ arq, novo: t.replace(RE_BLOCO_MDX, () => BLOCO_MDX) });
    else if (n > 1) problemas.push(`${path.relative(RAIZ, arq)}: ${n} blocos`);
  }
  console.log(`${aplicar ? 'APLICAR' : 'DRY-RUN'} · MongoDB: ${plano.length} textos com bloco a atualizar (de ${docs.length}); ${semBloco.length} sem bloco (não alterados) · MDX: ${planoMdx.length} de ${mdx.length}`);
  console.log('Narração (Mongo):', JSON.stringify(narr));
  if (problemas.length) { console.log('PROBLEMAS:'); problemas.forEach((p) => console.log('  -', p)); }

  if (aplicar) {
    if (problemas.length) throw new Error('há problemas: nada foi gravado');
    const dl = new Date(); const p2 = (n) => String(n).padStart(2, '0');
    const hoje = `${dl.getFullYear()}${p2(dl.getMonth() + 1)}${p2(dl.getDate())}`;
    const bk = fs.readdirSync(path.join(RAIZ, 'backups')).filter((n) => n.startsWith('assinatura-tcc-')).sort().pop();
    if (!bk || !bk.includes(hoje)) throw new Error('sem backup assinatura-tcc de hoje');
    for (const p of plano) await col.updateOne({ _id: p.d._id }, { $set: p.set });
    for (const p of planoMdx) fs.writeFileSync(p.arq, p.novo, 'utf8');
    console.log(`GRAVADO: MongoDB ${plano.length} · MDX ${planoMdx.length}`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
