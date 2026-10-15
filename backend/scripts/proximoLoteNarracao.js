/**
 * Escolhe o próximo lote de narração (padrão 50): primeiro os textos PUBLICADOS (mais lidos primeiro), depois os agendados na ordem do
 * calendário. Só entram textos cujo estado de narração não é "ok". Somente leitura.
 *   node --env-file=.env backend/scripts/proximoLoteNarracao.js [--n=50]      imprime os slugs separados por vírgula
 *   node --env-file=.env backend/scripts/proximoLoteNarracao.js --resumo       imprime feitos/faltam
 */
const mongoose = require('mongoose');
const { estadoNarracao, textoParaNarracao } = require('../lib/narracao');

const n = Number((process.argv.find((a) => a.startsWith('--n=')) || '--n=50').split('=')[1]);
const LIMITE_CARACTERES = 56000; // ~68 min seria demais; o envio aceita até ~4,4 MB (~12 min = ~9 900 caracteres de fala por MP3)

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const docs = await mongoose.connection.db.collection('artigos').find({}).toArray();
  const estados = {};
  const pend = [];
  for (const d of docs) {
    const e = estadoNarracao(d).estado;
    estados[e] = (estados[e] || 0) + 1;
    if (e !== 'ok') pend.push(d);
  }
  if (process.argv.includes('--resumo')) {
    console.log(JSON.stringify({ total: docs.length, estados, faltam: pend.length }));
  } else {
    const pub = pend.filter((d) => d.publicado).sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0));
    const agend = pend.filter((d) => !d.publicado).sort((a, b) => new Date(a.publicadoEm || 0) - new Date(b.publicadoEm || 0));
    const lote = [...pub, ...agend].filter((d) => textoParaNarracao(d).length * 1 <= LIMITE_CARACTERES).slice(0, n);
    console.log(lote.map((d) => d.slug).join(','));
    console.error(`lote de ${lote.length}: ${lote.filter((d) => d.publicado).length} publicados + ${lote.filter((d) => !d.publicado).length} agendados · faltam ${pend.length} no total`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
