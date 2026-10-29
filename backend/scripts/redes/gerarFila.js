/**
 * Fila NOVA de redes (PROMPT-MESTRE Parte 3.2/3.3). Gera conteudo/redes-v2/<data>-<slug>/ com telas PNG 1080x1350,
 * legenda, textos alternativos e meta.json; roda a auditoria + tripla checagem + marca d'água e corrige sozinho em
 * até 2 tentativas. Aprovada → status "aprovado-checagem" (com hash de cada imagem). Reprovada → conteudo/redes-v2/revisar/.
 *   node --env-file=.env backend/scripts/redes/gerarFila.js [--limite=60] [--inicio=2026-10-26] [--so-planejar]
 * Calendário: 5 posts por semana (segunda a sexta, 08:00 America/Bahia), públicos alternados, nunca a mesma
 * categoria em posts seguidos, e só depois de o texto estar no ar. A série "Corpo e Saúde Mental" fica de fora
 * até a decisão sobre os feriados.
 */
const fs = require('node:fs');
const path = require('node:path');
const { planejarPost, montarLegenda, palavras, encurtar } = require('../../lib/redesV2/conteudo');
const { backupAntesDeSobrescrever } = require('../../../scripts/lib/backupPasta');
const { renderizarTelas, textoAlternativo } = require('../../lib/redesV2/arte');
const { checarPost } = require('../../lib/redesV2/checagem');
const { publicoDe, FERIADOS } = require('../../lib/calendarioSite');

const RAIZ = path.resolve(__dirname, '../../..');
const SAIDA = path.join(RAIZ, 'conteudo/redes-v2');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const LIMITE = +arg('limite', 60);
const INICIO = arg('inicio', '2026-10-26');
const SO_PLANEJAR = process.argv.includes('--so-planejar');
const REFAZER_EXISTENTES = process.argv.includes('--refazer-existentes'); // mantém ids e datas da fila atual; só regera arte e legenda (crédito da marca)
const SITE = 'https://www.drantoniofelipemedico.com.br';
const ROTACAO = ['pacientes', 'pais', 'profissionais', 'empresas'];

const diaBahia = (d) => new Date(new Date(d).getTime() - 3 * 3600e3).toISOString().slice(0, 10);
function diasUteis(inicio, n) {
  const out = []; const d = new Date(`${inicio}T12:00:00Z`);
  while (out.length < n) { const iso = d.toISOString().slice(0, 10); if (![0, 6].includes(d.getUTCDay()) && !FERIADOS.has(iso)) out.push(iso); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}

/** Correção automática da peça (até 2 tentativas): só forma — o sentido do texto do site nunca muda. */
function corrigirPlano(plano, falhas, tentativa) {
  const p = JSON.parse(JSON.stringify(plano));
  const msgs = falhas.map((x) => x.msg);
  for (const t of p.telas) {
    t.texto = t.texto.replace(/\bonline\b/gi, 'na internet').replace(/\bfeedback\b/gi, 'retorno').replace(/\bstress\b/gi, 'estresse');
    if (t.tipo === 'capa' && palavras(`${t.titulo || ''} ${t.texto}`).length > 25) t.titulo = ''; // subtítulo da capa é opcional
    t.texto = encurtar(t.texto, Math.max(6, (tentativa === 1 ? 24 : 18) - palavras(t.titulo || '').length)).replace(/([^.!?…])$/, '$1.');
  }
  if (msgs.some((m) => /legenda com \d+ caracteres|hashtags/.test(m)) || tentativa === 2) { p.refs = []; p.legendaCorpo = p.legendaCorpo.split('\n').slice(0, tentativa === 2 ? 1 : 5).join('\n') + '\n\nTexto completo no link da bio.'; }
  if (msgs.some((m) => /hashtags/.test(m))) p.hashtags = [...new Set([...p.hashtags, '#saudemental', '#cuidado', '#bemestar'])].slice(0, 4);
  return p;
}

async function gerarUm(doc, tipo, dataPost) {
  let plano = planejarPost(doc, { tipo });
  let tentativas = 0, ultimo = null;
  for (;;) {
    const legenda = montarLegenda(plano, { limite: tentativas ? 1300 : 1500 });
    const { imagens, glifosAusentes } = await renderizarTelas(plano.telas);
    const alts = plano.telas.map((t, i) => textoAlternativo(t, i, plano.telas.length));
    const chk = await checarPost({ legenda, telas: plano.telas, imagens, alts, glifosAusentes });
    ultimo = { plano, legenda, imagens, alts, chk };
    if (chk.ok || tentativas >= 2 || glifosAusentes.length) break; // acento quebrado não se "corrige" por texto
    tentativas += 1;
    plano = corrigirPlano(plano, chk.falhas, tentativas);
  }
  return { ...ultimo, tentativas };
}

/** Gera e grava um post (pasta, imagens, legenda, alt, meta). Devolve {aprovado, r}. */
async function gerarEGravar({ id, doc, tipo, publico, dataSugerida }) {
  const r = await gerarUm(doc, tipo, dataSugerida.slice(0, 10));
  const aprovado = r.chk.ok;
  const dir = path.join(SAIDA, aprovado ? '' : 'revisar', id);
  // Lição de 28/10/2026: a pasta existente vai para backups/ antes de ser apagada
  const copia = backupAntesDeSobrescrever(dir);
  if (copia) console.log(`backup da pasta anterior: ${copia}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  r.imagens.forEach((img, i) => fs.writeFileSync(path.join(dir, `tela-${i + 1}.png`), img));
  fs.writeFileSync(path.join(dir, 'legenda.txt'), r.legenda, 'utf8');
  fs.writeFileSync(path.join(dir, 'alt.txt'), r.alts.map((a, i) => `${i + 1}. ${a}`).join('\n'), 'utf8');
  const meta = {
    id, slug: doc.slug, titulo: doc.titulo, tipo, publico, formato: 'carrossel', publicador: 'api (Instagram Graph: carrossel)',
    status: aprovado ? 'aprovado-checagem' : 'revisar', dataSugerida, urlTexto: `${SITE}/artigo/${doc.slug}`,
    categoria: doc.categoria, hashtags: r.plano.hashtags, telas: r.plano.telas.length, legendaCaracteres: r.legenda.length,
    origemImagens: 'geradas localmente (vetor + sharp), sem banco de imagens, sem Canva, sem IA generativa — nenhuma marca d\'água', tentativasDeCorrecao: r.tentativas,
    creditoMarca: 'v1', checagem: { ok: aprovado, falhas: r.chk.falhas, hashes: r.chk.hashes, em: new Date().toISOString() },
  };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
  return { aprovado, r };
}

async function refazerExistentes(docs) {
  const porSlug = new Map(docs.map((d) => [d.slug, d]));
  const resumo = { aprovados: 0, revisar: 0, falhas: [] };
  for (const nome of fs.readdirSync(SAIDA).sort()) {
    const f = path.join(SAIDA, nome, 'meta.json');
    if (nome === 'revisar' || !fs.existsSync(f)) continue;
    const m = JSON.parse(fs.readFileSync(f, 'utf8'));
    const doc = porSlug.get(m.slug);
    if (!doc) { resumo.revisar += 1; resumo.falhas.push(`${nome}: texto de origem não encontrado`); continue; }
    try {
      const { aprovado, r } = await gerarEGravar({ id: m.id, doc, tipo: m.tipo, publico: m.publico, dataSugerida: m.dataSugerida });
      if (aprovado) resumo.aprovados += 1; else { resumo.revisar += 1; resumo.falhas.push(`${nome}: ${r.chk.falhas.map((x) => x.msg).join(' | ')}`); }
    } catch (e) { resumo.revisar += 1; resumo.falhas.push(`${nome}: ERRO ${e.message}`); }
  }
  console.log(`Refeitos com crédito de marca · aprovados: ${resumo.aprovados} · em revisar/: ${resumo.revisar}`);
  resumo.falhas.slice(0, 15).forEach((x) => console.log('  -', x.slice(0, 260)));
}

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection('artigos');
  const docs = await col.find({ 'importacao.pasta': { $exists: true }, 'importacao.serie': { $exists: false }, 'agendamento.falha': { $in: ['', null] } }).toArray();
  await mongoose.disconnect();

  if (REFAZER_EXISTENTES) return refazerExistentes(docs);
  const hoje = diaBahia(new Date());
  const cand = docs.map((d) => ({
    d, tipo: d.importacao.tipo || (d.categoria === 'Relatos da Prática' ? 'relato' : 'artigo'),
    live: d.publicado ? hoje : diaBahia(d.agendamento?.slot || d.publicadoEm), semana: d.importacao.semanaPublicacao ?? 99,
    publico: d.categoria === 'Relatos da Prática' ? 'relato' : publicoDe(d.categoria),
  })).sort((a, b) => a.live.localeCompare(b.live) || a.semana - b.semana);

  // Calendário: 5 por semana; a cada 4º post é um relato; demais alternam os públicos.
  const dias = diasUteis(INICIO, LIMITE);
  const usados = new Set(); let rot = 0; let anterior = null;
  const plano = [];
  dias.forEach((data, k) => {
    const queroRelato = (k + 1) % 4 === 0;
    const alvo = queroRelato ? 'relato' : ROTACAO[rot % ROTACAO.length];
    const ok = (c, estrito) => !usados.has(c.d.slug) && c.live < data && (!estrito || (c.publico === alvo && c.d.categoria !== anterior));
    const c = cand.find((x) => ok(x, true)) || cand.find((x) => !usados.has(x.d.slug) && x.live < data && x.d.categoria !== anterior) || cand.find((x) => ok(x, false));
    if (!c) return;
    usados.add(c.d.slug); if (!queroRelato) rot += 1; anterior = c.d.categoria;
    plano.push({ ...c, data });
  });
  console.log(`Candidatos: ${cand.length} · posts planejados: ${plano.length} (de ${plano[0]?.data} a ${plano.at(-1)?.data})`);
  if (SO_PLANEJAR) { plano.slice(0, 10).forEach((p) => console.log(' ', p.data, p.publico.padEnd(13), p.d.slug)); return; }

  fs.mkdirSync(path.join(SAIDA, 'revisar'), { recursive: true });
  const resumo = { aprovados: 0, revisar: 0, falhas: [] };
  for (const p of plano) {
    const id = `${p.data}-${p.d.slug}`;
    try {
      const { aprovado, r } = await gerarEGravar({ id, doc: p.d, tipo: p.tipo, publico: p.publico, dataSugerida: `${p.data}T08:00:00-03:00` });
      if (aprovado) resumo.aprovados += 1; else { resumo.revisar += 1; resumo.falhas.push(`${id}: ${r.chk.falhas.map((x) => x.msg).join(' | ')}`); }
    } catch (e) { resumo.revisar += 1; resumo.falhas.push(`${id}: ERRO ${e.message}`); }
  }
  console.log(`Aprovados na checagem: ${resumo.aprovados} · em revisar/: ${resumo.revisar}`);
  resumo.falhas.slice(0, 15).forEach((x) => console.log('  -', x.slice(0, 260)));
  fs.writeFileSync(path.join(SAIDA, 'resumo-geracao.json'), JSON.stringify({ geradoEm: new Date().toISOString(), ...resumo }, null, 2));
})().catch((e) => { console.error(e); process.exit(2); });
