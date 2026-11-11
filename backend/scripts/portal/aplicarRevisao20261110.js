#!/usr/bin/env node
/*
 * Aplicação da revisão de 10/11/2026 (ordens de 09/11 23:15 e de 10/11 21:15).
 * Só aplica itens aprovados pelo Dr. Antônio. Padrão: DRY-RUN (não grava nada).
 *
 * Etapas (cada uma com --aplicar e --backup-dir):
 *   temas   -> tema dos artigos, a partir de decisoes-temas.json (status "aprovado")
 *   ofertas -> remove "Agendar uma avaliação" e "Solicitar consulta de orientação"; "Falar sobre mentoria
 *              individual/médica" passa a "Mentoria, consultoria e formação" (/mentoria). Fonte: ofertas-individuais.json
 *   textos  -> 23 relatos de risco médio + item 358. AGUARDA aprovação do Dr. (sem itens nesta rodada)
 *   audios  -> narrações novas dos textos alterados. AGUARDA a etapa "textos"
 *
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js                          # dry-run (padrão)
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js --backup                 # cópia do estado atual
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js --aplicar --etapa temas   --backup-dir <pasta>
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js --aplicar --etapa ofertas --backup-dir <pasta>
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js --conferir --backup-dir <pasta>
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js --reverter --aplicar --etapa reverter-temas|reverter-ofertas --backup-dir <pasta>
 *
 * Variável REVISAO_DIR: pasta com decisoes-temas.json e ofertas-individuais.json (padrão: relatorios/revisao-20261110).
 * Textos alterados perdem o selo até revisao:aprovar (o selo é o hash do corpo; fora deste script).
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { TEMAS } = require('../../lib/temas');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const REVISAO_DIR = process.env.REVISAO_DIR || path.join(RAIZ, 'relatorios', 'revisao-20261110');
const DECISOES = path.join(REVISAO_DIR, 'decisoes-temas.json');
const OFERTAS = path.join(REVISAO_DIR, 'ofertas-individuais.json');
const SLUG_DE = new Map(TEMAS.flatMap((t) => [[t.curto, t.slug], [t.nome, t.slug]]));
const TEMAS_VALIDOS = new Set(SLUG_DE.keys());
const ETAPAS_TEXTO = ['textos', 'audios'];

const flag = (n) => process.argv.includes(n);
const valor = (n) => {
  const i = process.argv.indexOf(n);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const carimbo = () => {
  const d = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};
const hash = (s) => crypto.createHash('sha256').update(String(s || ''), 'utf8').digest('hex');

// ---------- Ofertas ----------
const RE_AVALIACAO = /<a\b[^>]*>\s*Agendar uma avalia[cç][aã]o\s*<\/a>/gi;
const RE_ORIENTACAO = /<a\b[^>]*>\s*Solicitar consulta de orienta[cç][aã]o\s*<\/a>/gi;
const RE_MENTORIA = /<a\b([^>]*?)href="\/\?tipo=particular#contato-servicos"([^>]*)>\s*Falar sobre mentoria (?:individual|m[eé]dica)\s*<\/a>/gi;
const RESTOS = /Agendar uma avalia|Solicitar consulta de orienta|tipo=particular|Falar sobre mentoria (?:individual|m[eé]dica)|href="\/#agendar"/i;

/** Aplica as trocas de oferta ao corpo HTML. Devolve o novo corpo, a contagem e se restou algum padrão proibido. */
function transformarOferta(conteudo) {
  const c = { avaliacao: 0, orientacao: 0, mentoria: 0 };
  let novo = String(conteudo).replace(RE_AVALIACAO, () => { c.avaliacao += 1; return ''; });
  novo = novo.replace(RE_ORIENTACAO, () => { c.orientacao += 1; return ''; });
  novo = novo.replace(RE_MENTORIA, (_m, antes, depois) => {
    c.mentoria += 1;
    return `<a${antes}href="/mentoria"${depois}>Mentoria, consultoria e formação</a>`;
  });
  return { novo, contagem: c, restou: RESTOS.test(novo) };
}

function slugsDeOferta() {
  const itens = JSON.parse(fs.readFileSync(OFERTAS, 'utf8')).itens || [];
  return [...new Set(itens.map((x) => x.slug))];
}

// ---------- Decisões de tema ----------
function carregarDecisoes() {
  const lista = JSON.parse(fs.readFileSync(DECISOES, 'utf8'));
  const erros = [];
  const vistos = new Set();
  for (const d of lista) {
    if (vistos.has(d.slug)) erros.push(`slug duplicado: ${d.slug}`);
    vistos.add(d.slug);
    if (!TEMAS_VALIDOS.has(d.para)) erros.push(`tema inválido para ${d.slug}: ${d.para}`);
  }
  if (erros.length) throw new Error(erros.slice(0, 5).join('; '));
  return lista.map((d) => ({ ...d, status: d.status || 'proposto' }));
}

async function abrirBanco() {
  const db = require('../../lib/db');
  if (!db.isConfigured()) throw new Error('Banco não configurado (MONGODB_URI). Rode com --env-file-if-exists=.env, pelo Dr.');
  await db.connect();
  return db;
}

function escreverJson(arquivo, dados) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), 'utf8');
}

async function main() {
  const decisoes = carregarDecisoes();
  const aprovados = decisoes.filter((d) => d.status === 'aprovado');
  const etapa = valor('--etapa');
  const backupDirArg = valor('--backup-dir');
  const slugsOferta = slugsDeOferta();

  if (!flag('--aplicar') && !flag('--backup') && !flag('--conferir') && !flag('--reverter')) {
    const porTema = {};
    decisoes.forEach((d) => (porTema[d.para] = (porTema[d.para] || 0) + 1));
    const base = { modo: 'DRY-RUN', nada_gravado: true, itens: decisoes.length, aprovados: aprovados.length, mudancasDeTema: decisoes.filter((d) => d.de !== d.para).length, porTemaFinal: porTema, relatosAlterados: 0, textos: { item358: 'aguarda aprovação do Dr.' } };
    const db = require('../../lib/db');
    if (!db.isConfigured()) {
      console.log(JSON.stringify({ ...base, ofertas: { artigos: slugsOferta.length, aviso: 'sem banco configurado: dry-run das ofertas não foi feito' } }, null, 2));
      return;
    }
    await db.connect();
    try {
      const Artigo = require('../../models/Artigo');
      const docs = await Artigo.find({ slug: { $in: slugsOferta } }).select('slug publicado conteudo').lean();
      const porSlug = new Map(docs.map((d) => [d.slug, d]));
      const soma = { avaliacao: 0, orientacao: 0, mentoria: 0 };
      const restam = [];
      const naoEncontrados = [];
      let comAlteracao = 0;
      for (const slug of slugsOferta) {
        const d = porSlug.get(slug);
        if (!d) { naoEncontrados.push(slug); continue; }
        const t = transformarOferta(d.conteudo || '');
        for (const k of Object.keys(soma)) soma[k] += t.contagem[k];
        if (t.restou) restam.push(slug);
        if (t.novo !== d.conteudo) comAlteracao += 1;
      }
      console.log(JSON.stringify({ ...base, ofertas: { artigos: slugsOferta.length, encontrados: docs.length, naoEncontrados, comAlteracao, substituicoes: soma, restamPadroesProibidos: restam } }, null, 2));
    } finally {
      await db.mongoose.disconnect();
    }
    return;
  }

  const db = await abrirBanco();
  try {
    const Artigo = require('../../models/Artigo');

    if (flag('--backup')) {
      const temas = await Artigo.find({ slug: { $in: decisoes.map((d) => d.slug) } }).select('slug tema').lean();
      const ofertas = await Artigo.find({ slug: { $in: slugsOferta } }).select('slug conteudo').lean();
      const pasta = path.join(RAIZ, 'backups', `revisao-20261110-${carimbo()}`);
      escreverJson(path.join(pasta, 'temas-antes.json'), temas.map((x) => ({ _id: String(x._id), slug: x.slug, tema: x.tema || '' })));
      escreverJson(path.join(pasta, 'ofertas-antes.json'), ofertas.map((x) => ({ _id: String(x._id), slug: x.slug, hash: hash(x.conteudo), conteudo: x.conteudo })));
      console.log(JSON.stringify({ backup: true, pasta, temas: temas.length, ofertas: ofertas.length, gravou: false }, null, 2));
      return;
    }

    if (!backupDirArg) throw new Error('Informe --backup-dir <pasta do backup>.');

    if (flag('--conferir')) {
      const atuais = await Artigo.find({ slug: { $in: aprovados.map((d) => d.slug) } }).select('slug tema').lean();
      const mapa = new Map(atuais.map((x) => [x.slug, x.tema || '']));
      const divergentes = aprovados.filter((d) => mapa.get(d.slug) !== SLUG_DE.get(d.para)).length;
      const ofertasAtuais = await Artigo.find({ slug: { $in: slugsOferta } }).select('slug conteudo').lean();
      const restos = ofertasAtuais.filter((x) => transformarOferta(x.conteudo || '').restou).map((x) => x.slug);
      console.log(JSON.stringify({ conferencia: true, temas: { aprovados: aprovados.length, divergentes }, ofertas: { restos }, ok: divergentes === 0 && restos.length === 0 }, null, 2));
      return;
    }

    if (flag('--reverter')) {
      if (etapa === 'reverter-temas') {
        const antes = JSON.parse(fs.readFileSync(path.join(backupDirArg, 'temas-antes.json'), 'utf8'));
        const ops = antes.map((x) => ({ updateOne: { filter: { _id: x._id }, update: { $set: { tema: x.tema } } } }));
        const r = ops.length ? await Artigo.bulkWrite(ops) : { modifiedCount: 0 };
        console.log(JSON.stringify({ revertido: 'temas', modificados: r.modifiedCount }, null, 2));
        return;
      }
      if (etapa === 'reverter-ofertas') {
        const antes = JSON.parse(fs.readFileSync(path.join(backupDirArg, 'ofertas-antes.json'), 'utf8'));
        const ops = antes.map((x) => ({ updateOne: { filter: { _id: x._id }, update: { $set: { conteudo: x.conteudo } } } }));
        const r = ops.length ? await Artigo.bulkWrite(ops) : { modifiedCount: 0 };
        console.log(JSON.stringify({ revertido: 'ofertas', modificados: r.modifiedCount }, null, 2));
        return;
      }
      throw new Error('Reversão exige --aplicar --etapa reverter-temas ou reverter-ofertas.');
    }

    if (!flag('--aplicar')) throw new Error('Gravação exige --aplicar.');
    if (ETAPAS_TEXTO.includes(etapa)) {
      console.log(JSON.stringify({ etapa, itens: 0, gravou: false, aviso: 'Aguarda aprovação do Dr. (23 relatos e item 358). Nenhum item nesta rodada.' }, null, 2));
      return;
    }

    if (etapa === 'temas') {
      const antes = JSON.parse(fs.readFileSync(path.join(backupDirArg, 'temas-antes.json'), 'utf8'));
      const idsDoBackup = new Set(antes.map((x) => x.slug));
      const fora = aprovados.filter((d) => !idsDoBackup.has(d.slug));
      if (fora.length) throw new Error(`Há ${fora.length} aprovado(s) fora do backup. Refaça o --backup.`);
      const ops = aprovados.map((d) => ({ updateOne: { filter: { slug: d.slug }, update: { $set: { tema: SLUG_DE.get(d.para) } } } }));
      const r = ops.length ? await Artigo.bulkWrite(ops) : { modifiedCount: 0 };
      console.log(JSON.stringify({ etapa: 'temas', aprovados: aprovados.length, modificados: r.modifiedCount, gravou: true }, null, 2));
      return;
    }

    if (etapa === 'ofertas') {
      const antes = JSON.parse(fs.readFileSync(path.join(backupDirArg, 'ofertas-antes.json'), 'utf8'));
      const porSlug = new Map(antes.map((x) => [x.slug, x]));
      const docs = await Artigo.find({ slug: { $in: slugsOferta } }).select('slug conteudo').lean();
      const ops = [];
      const recusados = [];
      for (const d of docs) {
        const b = porSlug.get(d.slug);
        if (!b) { recusados.push(`${d.slug}: fora do backup`); continue; }
        if (hash(d.conteudo) !== b.hash) { recusados.push(`${d.slug}: conteúdo mudou desde o backup`); continue; }
        const t = transformarOferta(d.conteudo || '');
        if (t.restou) { recusados.push(`${d.slug}: padrão de oferta fora do esperado`); continue; }
        if (t.novo === d.conteudo) continue;
        ops.push({ updateOne: { filter: { _id: d._id }, update: { $set: { conteudo: t.novo } } } });
      }
      if (recusados.length) throw new Error(`Não aplico: ${recusados.slice(0, 5).join('; ')}`);
      const r = ops.length ? await Artigo.bulkWrite(ops) : { modifiedCount: 0 };
      console.log(JSON.stringify({ etapa: 'ofertas', artigos: docs.length, modificados: r.modifiedCount, gravou: true, aviso: 'Textos alterados perdem o selo: revisao:aprovar depois de conferir.' }, null, 2));
      return;
    }

    throw new Error('Etapa inválida. Use temas, ofertas, textos ou audios.');
  } finally {
    await db.mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[aplicar-revisao] erro:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { transformarOferta };
