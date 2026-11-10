#!/usr/bin/env node
/*
 * Aplicação da revisão de 10/11/2026 (ordem de 09/11, 23:15). NÃO RODAR sem ordem escrita do Dr. Antônio.
 * Só aplica itens com "status": "aprovado" em relatorios/revisao-20261110/decisoes-temas.json (padrão: "proposto").
 *
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js                          # dry-run (padrão)
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js --backup                 # cópia do tema atual
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js --aplicar --etapa temas --backup-dir <pasta>
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js --conferir --backup-dir <pasta>
 *   node --env-file-if-exists=.env backend/scripts/portal/aplicarRevisao20261110.js --reverter --aplicar --etapa reverter-temas --backup-dir <pasta>
 *
 * Etapas "textos" e "audios": sem itens nesta rodada (nenhum texto de artigo foi alterado). Não há envio ao Blob nem publicação.
 * Textos alterados, quando houver, perdem o selo até revisao:aprovar (fora deste script).
 */
const fs = require('node:fs');
const path = require('node:path');
const { TEMAS, RELATOS } = require('../../lib/temas');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const DECISOES = path.join(RAIZ, 'relatorios', 'revisao-20261110', 'decisoes-temas.json');
// Nomes aceitos: o curto (usado nas decisões) e o completo.
const SLUG_DE = new Map(TEMAS.flatMap((t) => [[t.curto, t.slug], [t.nome, t.slug]]));
const TEMAS_VALIDOS = new Set(SLUG_DE.keys());

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

async function main() {
  const decisoes = carregarDecisoes();
  const aprovados = decisoes.filter((d) => d.status === 'aprovado');
  const etapa = valor('--etapa');
  const backupDirArg = valor('--backup-dir');

  if (!flag('--aplicar') && !flag('--backup') && !flag('--conferir') && !flag('--reverter')) {
    const porTema = {};
    decisoes.forEach((d) => (porTema[d.para] = (porTema[d.para] || 0) + 1));
    console.log(JSON.stringify({ modo: 'DRY-RUN', nada_gravado: true, itens: decisoes.length, aprovados: aprovados.length, mudancasDeTema: decisoes.filter((d) => d.de !== d.para).length, porTemaFinal: porTema, relatosAlterados: 0 }, null, 2));
    return;
  }

  const db = await abrirBanco();
  try {
    const Artigo = require('../../models/Artigo');

    if (flag('--backup')) {
      const docs = await Artigo.find({ slug: { $in: decisoes.map((d) => d.slug) } }).select('slug tema').lean();
      const pasta = path.join(RAIZ, 'backups', `revisao-20261110-${carimbo()}`);
      fs.mkdirSync(pasta, { recursive: true });
      fs.writeFileSync(path.join(pasta, 'temas-antes.json'), JSON.stringify(docs.map((x) => ({ _id: String(x._id), slug: x.slug, tema: x.tema || '' })), null, 2), 'utf8');
      console.log(JSON.stringify({ backup: true, pasta, registros: docs.length, gravou: false }, null, 2));
      return;
    }

    if (!backupDirArg) throw new Error('Informe --backup-dir <pasta do backup>.');
    const antes = JSON.parse(fs.readFileSync(path.join(backupDirArg, 'temas-antes.json'), 'utf8'));

    if (flag('--conferir')) {
      const ok = aprovados;
      const atuais = await Artigo.find({ slug: { $in: ok.map((d) => d.slug) } }).select('slug tema').lean();
      const mapa = new Map(atuais.map((x) => [x.slug, x.tema || '']));
      const divergentes = ok.filter((d) => mapa.get(d.slug) !== SLUG_DE.get(d.para)).length;
      console.log(JSON.stringify({ conferencia: true, aprovados: ok.length, divergentes, ok: divergentes === 0 }, null, 2));
      return;
    }

    if (flag('--reverter')) {
      if (etapa !== 'reverter-temas') throw new Error('Reversão exige --aplicar --etapa reverter-temas.');
      const ops = antes.map((x) => ({ updateOne: { filter: { _id: x._id }, update: { $set: { tema: x.tema } } } }));
      const r = ops.length ? await Artigo.bulkWrite(ops) : { modifiedCount: 0 };
      console.log(JSON.stringify({ revertido: true, modificados: r.modifiedCount }, null, 2));
      return;
    }

    if (!flag('--aplicar')) throw new Error('Gravação exige --aplicar.');
    if (etapa === 'textos' || etapa === 'audios') {
      console.log(JSON.stringify({ etapa, itens: 0, gravou: false, aviso: 'Nenhum item nesta rodada.' }, null, 2));
      return;
    }
    if (etapa !== 'temas') throw new Error('Etapa inválida. Use temas, textos ou audios.');

    const idsDoBackup = new Set(antes.map((x) => x.slug));
    const fora = aprovados.filter((d) => !idsDoBackup.has(d.slug));
    if (fora.length) throw new Error(`Há ${fora.length} aprovado(s) fora do backup. Refaça o --backup.`);

    const ops = aprovados.map((d) => ({ updateOne: { filter: { slug: d.slug }, update: { $set: { tema: SLUG_DE.get(d.para) } } } }));
    const r = ops.length ? await Artigo.bulkWrite(ops) : { modifiedCount: 0 };
    console.log(JSON.stringify({ etapa: 'temas', aprovados: aprovados.length, modificados: r.modifiedCount, gravou: true }, null, 2));
  } finally {
    await db.mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[aplicar-revisao] erro:', err.message);
  process.exitCode = 1;
});
