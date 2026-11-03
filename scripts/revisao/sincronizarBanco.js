// Sincroniza relatorios/revisoes/registro.json com a coleção revisoes_medicas (ordem de 02/11/2026, item 4).
// Padrão: dry-run (não grava). Com --aplicar: faz backup do JSON em .tmp/ e grava no banco (upsert por slug).
// Uso: node --env-file=.env scripts/revisao/sincronizarBanco.js            (dry-run)
//      node --env-file=.env scripts/revisao/sincronizarBanco.js --aplicar  (grava, com backup)
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.join(__dirname, '..', '..');
const REGISTRO = path.join(RAIZ, 'relatorios', 'revisoes', 'registro.json');
const { COLECAO, migrarJson } = require(path.join(RAIZ, 'backend', 'lib', 'revisaoRepo'));

async function main() {
  const aplicar = process.argv.includes('--aplicar');
  const json = JSON.parse(fs.readFileSync(REGISTRO, 'utf8'));
  const db = require(path.join(RAIZ, 'backend', 'lib', 'db'));
  if (!db.isConfigured()) throw new Error('MONGODB_URI não configurada: nada gravado');
  await db.connect();
  const col = require('mongoose').connection.db.collection(COLECAO);
  if (aplicar) {
    const dir = path.join(RAIZ, '.tmp');
    fs.mkdirSync(dir, { recursive: true });
    const cópia = path.join(dir, `backup-revisoes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.copyFileSync(REGISTRO, cópia);
    console.log('backup:', cópia);
  }
  const r = await migrarJson(col, json, { aplicar });
  console.log(JSON.stringify({ modo: aplicar ? 'APLICAR' : 'DRY-RUN', ...r }));
  await db.disconnect?.();
  await require('mongoose').disconnect();
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
