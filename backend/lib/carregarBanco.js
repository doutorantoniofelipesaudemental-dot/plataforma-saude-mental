/**
 * `npm start` (flag --carregar-banco): garante que o blog local não abra vazio.
 * Se o banco configurado NÃO tem nenhum artigo, insere os artigos iniciais de
 * backend/seed-artigos.js. Se já tem artigos, não toca em nada: nunca sobrescreve
 * nem apaga (o banco padrão "drsaudemental" pode ser o de produção). Para
 * atualizar/limpar de propósito, use `npm run seed` / `npm run seed:reset`.
 */
const db = require('./db');
const Artigo = require('../models/Artigo');
const artigos = require('../seed-artigos');

const FLAG = '--carregar-banco';
const pedido = (argv = process.argv) => argv.includes(FLAG);

/** @returns {Promise<{acao: 'ignorado'|'ja-populado'|'carregado', motivo?: string, existentes?: number, criados?: number}>} */
async function carregarBancoSeVazio({ log = console.log, modelo = Artigo, conectar = db.connect, configurado = db.isConfigured, seed = artigos } = {}) {
  if (!configurado()) {
    log('  --carregar-banco: MONGODB_URI ausente — nada a carregar (o blog abre em modo estático).');
    return { acao: 'ignorado', motivo: 'sem banco configurado' };
  }
  await conectar();
  const existentes = await modelo.countDocuments();
  if (existentes > 0) {
    log(`  --carregar-banco: o banco já tem ${existentes} artigo(s) — mantido como está.`);
    return { acao: 'ja-populado', existentes };
  }
  let criados = 0;
  for (const dados of seed) {
    await modelo.create(dados);
    criados += 1;
  }
  log(`  --carregar-banco: banco vazio — ${criados} artigo(s) inicial(is) carregado(s).`);
  return { acao: 'carregado', criados };
}

module.exports = { carregarBancoSeVazio, pedido, FLAG };
