#!/usr/bin/env node
/*
 * Reclassificação de temas (ordem de 09/11/2026, item 6). Só mexe no campo `tema` dos artigos.
 * Não altera `conteudo`, títulos nem slugs (o hash de narração continua válido).
 *
 * Modos (um por vez):
 *   (padrão) ou --dry-run          mostra quantos mudariam; não grava
 *   --backup                       salva backups/reclassificacao-temas-AAAAMMDD-HHMM/artigos-tema.json
 *   --aplicar --etapa 1 --backup-dir <pasta>   grava o campo tema (só com backup já feito e aprovação do Dr. Antônio)
 *   --conferir --backup-dir <pasta>            confere o banco contra a proposta
 *   --reverter --backup-dir <pasta>            restaura o campo tema salvo no backup
 * Execução: node --env-file-if-exists=.env backend/scripts/portal/reclassificarTemas.js <modo>
 */
const fs = require('node:fs');
const path = require('node:path');
const db = require('../../lib/db');
const Artigo = require('../../models/Artigo');
const { TEMAS, RELATOS } = require('../../lib/temas');
const { parseCsv } = require('../../../scripts/plano-diretor/pilares');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
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

function propostaDoInventario() {
  const inventario = parseCsv(fs.readFileSync(path.join(RAIZ, 'relatorios', 'plano-diretor', 'INVENTARIO.csv'), 'utf8'));
  const mapa = new Map();
  for (const linha of inventario) {
    const tema = TEMAS.find((t) => t.nome === (linha.eixo_nome || '').trim());
    if (tema) mapa.set(linha.slug, tema.slug);
  }
  return mapa;
}

async function carregar() {
  return Artigo.find({ $or: [{ publicado: true }, { 'agendamento.agendado': true }] })
    .select('slug categoria tema')
    .lean();
}

/** Proposta por artigo: tema do inventário; Relatos ficam sem tema; sem proposta = não muda. */
function alvos(artigos, proposta) {
  return artigos
    .filter((a) => a.categoria !== RELATOS && proposta.has(a.slug))
    .map((a) => ({ _id: a._id, slug: a.slug, de: a.tema || '', para: proposta.get(a.slug) }));
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
    if (flag('--backup')) {
      const todos = await Artigo.find({}).select('slug titulo categoria tema').lean();
      const dir = path.join(RAIZ, 'backups', `reclassificacao-temas-${carimbo()}`);
      fs.mkdirSync(dir, { recursive: true });
      const salvo = todos.map((a) => ({ _id: String(a._id), slug: a.slug, titulo: a.titulo, categoria: a.categoria, tema: a.tema || '' }));
      fs.writeFileSync(path.join(dir, 'artigos-tema.json'), JSON.stringify(salvo, null, 2), 'utf8');
      const lido = JSON.parse(fs.readFileSync(path.join(dir, 'artigos-tema.json'), 'utf8'));
      console.log(JSON.stringify({ modo: 'backup', dir, documentos: lido.length }));
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
      const alvosAtuais = alvos(await carregar(), propostaDoInventario());
      const divergentes = alvosAtuais.filter((a) => (a.de || '') !== a.para && a.para !== '');
      const aplicados = alvosAtuais.filter((a) => a.de === a.para).length;
      console.log(JSON.stringify({ modo: 'conferir', alvos: alvosAtuais.length, aplicados, pendentes: divergentes.length }));
      return;
    }

    // Padrão: dry-run. Gravação só com --aplicar --etapa 1 e backup informado.
    const aplicar = flag('--aplicar');
    const lista = alvos(await carregar(), propostaDoInventario());
    const mudam = lista.filter((a) => a.de !== a.para);
    if (!aplicar) {
      console.log(JSON.stringify({ modo: 'dry-run', mudariam: mudam.length, exemplos: mudam.slice(0, 5).map((a) => `${a.slug}: "${a.de || '—'}" → "${a.para}"`) }, null, 2));
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
