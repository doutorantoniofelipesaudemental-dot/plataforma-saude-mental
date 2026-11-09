#!/usr/bin/env node
/*
 * Reclassificação de temas (ordem de 09/11/2026). Só grava o campo `tema` dos artigos.
 * Não altera `conteudo`, títulos nem slugs (o hash de narração continua válido).
 * Aplica só os grupos A e B do levantamento; o grupo C (dúvidas) fica de fora até decisão do Dr. Antônio.
 *
 * Modos (um por vez):
 *   (padrão) ou --dry-run                       mostra quantos mudariam; não grava
 *   --backup                                    salva relatorios/logs/backups-temas/<AAAAMMDD-HHMM>/artigos-tema.json
 *   --aplicar --etapa 1 --backup-dir <pasta>    grava o campo tema (exige backup informado e aprovação do Dr.)
 *   --conferir --backup-dir <pasta>             confere o banco contra a proposta A+B
 *   --reverter --backup-dir <pasta>             restaura o campo tema salvo no backup
 * Execução (pasta principal, depois do merge):
 *   node --env-file-if-exists=.env backend/scripts/portal/reclassificarTemas.js <modo>
 */
const fs = require('node:fs');
const path = require('node:path');
const db = require('../../lib/db');
const Artigo = require('../../models/Artigo');
const { TEMAS, RELATOS, PONTES_PROVISORIAS, temaEfetivo } = require('../../lib/temas');
const { temaProposto, duvidaRegra5 } = require('../../lib/classificacaoTemas');
const { parseCsv } = require('../../../scripts/plano-diretor/pilares');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const DIR_BACKUPS = path.join(RAIZ, 'relatorios', 'logs', 'backups-temas');
const args = process.argv.slice(2);
const flag = (nome) => args.includes(nome);
const valor = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};

function carimbo() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

async function carregar() {
  return Artigo.find({ $or: [{ publicado: true }, { 'agendamento.agendado': true }] })
    .select('slug titulo resumo categoria tema')
    .lean();
}

/** Alvos A+B: não-relatos com tema proposto, sem dúvida da regra 5. Órfãos entram (passam a aparecer num tema). */
function alvos(artigos, proposta) {
  const saida = [];
  for (const a of artigos) {
    if (a.categoria === RELATOS) continue;
    const proposto = proposta.get(a.slug);
    if (!proposto) continue;
    if (duvidaRegra5(a.titulo, a.resumo, proposto)) continue;
    saida.push({ _id: a._id, slug: a.slug, de: a.tema || '', para: proposto, orfao: PONTES_PROVISORIAS.includes(a.categoria) });
  }
  return saida;
}

function exigirBackupDir() {
  const dir = valor('--backup-dir');
  if (!dir || !fs.existsSync(path.join(dir, 'artigos-tema.json'))) {
    throw new Error('Informe --backup-dir com uma pasta que contenha artigos-tema.json (rode --backup antes).');
  }
  return dir;
}

async function main() {
  if (!db.isConfigured()) throw new Error('Banco não configurado. Rode com --env-file-if-exists=.env.');
  await db.connect();
  try {
    const proposta = temaProposto(parseCsv(fs.readFileSync(path.join(RAIZ, 'relatorios', 'plano-diretor', 'INVENTARIO.csv'), 'utf8')));

    if (flag('--backup')) {
      const todos = await Artigo.find({}).select('slug titulo categoria tema').lean();
      const dir = path.join(DIR_BACKUPS, carimbo());
      fs.mkdirSync(dir, { recursive: true });
      const salvo = todos.map((a) => ({ _id: String(a._id), slug: a.slug, titulo: a.titulo, categoria: a.categoria, tema: a.tema || '' }));
      fs.writeFileSync(path.join(dir, 'artigos-tema.json'), JSON.stringify(salvo, null, 2), 'utf8');
      console.log(JSON.stringify({ modo: 'backup', dir, documentos: salvo.length }));
      return;
    }

    if (flag('--reverter')) {
      const dir = exigirBackupDir();
      const salvo = JSON.parse(fs.readFileSync(path.join(dir, 'artigos-tema.json'), 'utf8'));
      const ops = salvo.map((a) => ({ updateOne: { filter: { _id: a._id }, update: { $set: { tema: a.tema || '' } } } }));
      const r = await Artigo.bulkWrite(ops, { ordered: false });
      console.log(JSON.stringify({ modo: 'reverter', restaurados: r.modifiedCount }));
      return;
    }

    if (flag('--conferir')) {
      exigirBackupDir();
      const lista = alvos(await carregar(), proposta);
      const aplicados = lista.filter((a) => a.de === a.para).length;
      console.log(JSON.stringify({ modo: 'conferir', alvos: lista.length, aplicados, pendentes: lista.length - aplicados }));
      return;
    }

    const lista = alvos(await carregar(), proposta);
    const mudam = lista.filter((a) => a.de !== a.para);
    if (!flag('--aplicar')) {
      console.log(JSON.stringify({ modo: 'dry-run', alvosAB: lista.length, mudariam: mudam.length, orfaosQueMudam: mudam.filter((a) => a.orfao).length, exemplos: mudam.slice(0, 5).map((a) => `${a.slug}: "${a.de || '—'}" → "${a.para}"`) }, null, 2));
      return;
    }
    if (valor('--etapa') !== '1') throw new Error('Gravação exige --etapa 1 (aprovação explícita do Dr. Antônio).');
    const dir = exigirBackupDir();
    const ops = mudam.map((a) => ({ updateOne: { filter: { _id: a._id }, update: { $set: { tema: a.para } } } }));
    const r = await Artigo.bulkWrite(ops, { ordered: false });
    console.log(JSON.stringify({ modo: 'aplicar', etapa: 1, backup: dir, gravados: r.modifiedCount }));
  } finally {
    await db.mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[reclassificacao] erro:', err.message);
  process.exitCode = 1;
});
