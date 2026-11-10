#!/usr/bin/env node
/*
 * Retira da AGENDA os Relatos da Prática AGENDADOS e classificados como ALTO risco (OMS 2023), até revisão do Dr. Antônio
 * (ordem de 09/11/2026, item 4). Publicados NÃO são tocados: só listados (decisão do Dr.).
 * Não altera `conteudo`. Grava só agendamento.agendado (false) e agendamento.motivoRetirada.
 *
 *   node --env-file-if-exists=.env backend/scripts/portal/retirarAgendadosAltoRisco.js              # dry-run (padrão, só lista)
 *   node --env-file-if-exists=.env backend/scripts/portal/retirarAgendadosAltoRisco.js --backup     # cópia dos agendados antes de gravar
 *   node --env-file-if-exists=.env backend/scripts/portal/retirarAgendadosAltoRisco.js --aplicar --etapa retirada-alto --backup-dir <pasta>
 *   node --env-file-if-exists=.env backend/scripts/portal/retirarAgendadosAltoRisco.js --conferir --backup-dir <pasta>
 *   node --env-file-if-exists=.env backend/scripts/portal/retirarAgendadosAltoRisco.js --reverter --backup-dir <pasta>
 *
 * Backups em backups/ (ignorado pelo Git). Gravação só com --aplicar --etapa retirada-alto e backup da mesma lista.
 */
const fs = require('node:fs');
const path = require('node:path');
const { classificarRelatoSuicidio } = require('../../lib/auditoriaSuicidio');
const { RELATOS } = require('../../lib/temas');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const MOTIVO = 'revisão OMS 20261109';
const ETAPA = 'retirada-alto';

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

async function abrirBanco() {
  const db = require('../../lib/db');
  if (!db.isConfigured()) throw new Error('Banco não configurado (MONGODB_URI). Rode com --env-file-if-exists=.env, pelo Dr.');
  await db.connect();
  return db;
}

async function candidatosAgendados(Artigo) {
  const docs = await Artigo.find({ categoria: RELATOS, 'agendamento.agendado': true })
    .select('slug titulo conteudo agendamento')
    .lean();
  return docs
    .map((a) => ({ a, r: classificarRelatoSuicidio(a.conteudo) }))
    .filter(({ r }) => r.toca && r.nivel === 'ALTO')
    .map(({ a, r }) => ({ _id: String(a._id), slug: a.slug, titulo: a.titulo, criterios: r.criterios, agendamento: a.agendamento }));
}

async function main() {
  const modoBackup = flag('--backup');
  const aplicar = flag('--aplicar');
  const conferir = flag('--conferir');
  const reverter = flag('--reverter');
  const etapa = valor('--etapa');
  const backupDirArg = valor('--backup-dir');

  const db = await abrirBanco();
  try {
    const Artigo = require('../../models/Artigo');

    if (reverter || conferir) {
      if (!backupDirArg) throw new Error('Informe --backup-dir <pasta do backup>.');
      const lista = JSON.parse(fs.readFileSync(path.join(backupDirArg, 'agendados-alto.json'), 'utf8'));
      if (conferir) {
        const abertos = await Artigo.countDocuments({ _id: { $in: lista.map((x) => x._id) }, 'agendamento.agendado': true });
        const comMotivo = await Artigo.countDocuments({ _id: { $in: lista.map((x) => x._id) }, 'agendamento.motivoRetirada': MOTIVO });
        console.log(JSON.stringify({ conferencia: true, lista: lista.length, aindaAgendados: abertos, comMotivo, ok: abertos === 0 && comMotivo === lista.length }, null, 2));
        return;
      }
      // reverter: volta o agendamento exatamente como estava no backup
      if (!flag('--aplicar') || etapa !== 'reverter-' + ETAPA) throw new Error(`Reversão exige --aplicar --etapa reverter-${ETAPA}.`);
      const ops = lista.map((x) => ({
        updateOne: { filter: { _id: x._id }, update: { $set: { agendamento: x.agendamento } } },
      }));
      const r = await Artigo.bulkWrite(ops);
      console.log(JSON.stringify({ revertido: r.modifiedCount, lista: lista.length }, null, 2));
      return;
    }

    const lista = await candidatosAgendados(Artigo);
    const publicadosAlto = await Artigo.countDocuments({ categoria: RELATOS, publicado: true });
    const resumo = { modo: aplicar ? 'APLICAR' : modoBackup ? 'BACKUP' : 'DRY-RUN', agendadosAlto: lista.length, slugs: lista.map((x) => x.slug), publicadosRelatos: publicadosAlto };

    if (!aplicar) {
      if (modoBackup) {
        const pasta = path.join(RAIZ, 'backups', `relatos-revisao-${carimbo()}`);
        fs.mkdirSync(pasta, { recursive: true });
        fs.writeFileSync(path.join(pasta, 'agendados-alto.json'), JSON.stringify(lista, null, 2), 'utf8');
        console.log(JSON.stringify({ ...resumo, backupDir: pasta, gravou: false }, null, 2));
        return;
      }
      console.log(JSON.stringify({ ...resumo, gravou: false, aviso: 'DRY-RUN: nada gravado. Backup: --backup. Aplicar: --aplicar --etapa retirada-alto --backup-dir <pasta>.' }, null, 2));
      return;
    }

    if (etapa !== ETAPA) throw new Error(`Gravação exige --etapa ${ETAPA}.`);
    if (!backupDirArg) throw new Error('Gravação exige --backup-dir com o backup desta mesma lista.');
    const salvo = JSON.parse(fs.readFileSync(path.join(backupDirArg, 'agendados-alto.json'), 'utf8'));
    const idsSalvos = new Set(salvo.map((x) => x._id));
    const fora = lista.filter((x) => !idsSalvos.has(x._id));
    if (fora.length) throw new Error(`Lista mudou desde o backup (${fora.length} item(ns) novos). Refaça o --backup.`);

    const ops = lista.map((x) => ({
      updateOne: { filter: { _id: x._id }, update: { $set: { 'agendamento.agendado': false, 'agendamento.motivoRetirada': MOTIVO } } },
    }));
    const r = ops.length ? await Artigo.bulkWrite(ops) : { modifiedCount: 0 };
    console.log(JSON.stringify({ ...resumo, gravou: true, modificados: r.modifiedCount }, null, 2));
  } finally {
    await db.mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[retirar-alto] erro:', err.message);
  process.exitCode = 1;
});
