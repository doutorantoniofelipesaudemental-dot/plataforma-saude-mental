/**
 * Escolhe o próximo lote de narração (padrão 50): primeiro os textos PUBLICADOS (mais lidos primeiro), depois os agendados na ordem do
 * calendário. Só entram textos cujo estado de narração não é "ok". Somente leitura.
 *   node --env-file=.env backend/scripts/proximoLoteNarracao.js [--n=50]      imprime os slugs separados por vírgula
 *   node --env-file=.env backend/scripts/proximoLoteNarracao.js --resumo       imprime feitos/faltam
 */
require('../../scripts/carregarEnv').carregarEnv(); // .env carregado aqui (sem --env-file na linha de comando)
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const { estadoNarracao, precisaVinheta, textoParaNarracao, hashNarracao } = require('../lib/narracao');
const { VINHETA_VERSAO } = require('../lib/vinheta');

// --pre-gerar: ignora os textos que já têm MP3 pré-gerado com selo (<slug>.hash) válido em narracoes-geradas/ (agendados esperando a publicação).
const PASTA = path.join(__dirname, '../../narracoes-geradas');
const comVinhetaLocal = (d) => { try { return fs.readFileSync(path.join(PASTA, `${d.slug}.vinheta`), 'utf8').trim() === String(VINHETA_VERSAO); } catch { return false; } };
const preGerado = (d) => { try { return fs.existsSync(path.join(PASTA, `${d.slug}.mp3`)) && fs.readFileSync(path.join(PASTA, `${d.slug}.hash`), 'utf8').trim() === hashNarracao(textoParaNarracao(d)) && comVinhetaLocal(d); } catch { return false; } };

// textos que reprovaram 2x na conferência (relatorios/narracao-revisar.json) ficam fora do ciclo até alguém olhar
const parados = (() => { try { const j = JSON.parse(fs.readFileSync(path.join(__dirname, '../../relatorios/narracao-revisar.json'), 'utf8')); return new Set(Object.keys(j).filter((k) => (j[k].tentativas || 0) >= 2)); } catch { return new Set(); } })();

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
    if (e !== 'ok' || precisaVinheta(d)) pend.push(d); // "ok" sem vinheta também volta para a fila (regerar com a vinheta)
  }
  if (process.argv.includes('--resumo')) {
    const preGer = process.argv.includes('--pre-gerar') || true ? pend.filter((d) => !d.publicado && preGerado(d)).length : 0;
    console.log(JSON.stringify({ total: docs.length, estados, faltam: pend.length, agendadosComMp3PreGerado: preGer }));
  } else {
    const pub = pend.filter((d) => d.publicado).sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0));
    // agendados: pela data de publicação (slot do agendamento; senão publicadoEm) — nenhum texto pode publicar sem áudio, os dos próximos dias vêm primeiro
    const dataPub = (d) => new Date((d.agendamento && d.agendamento.slot) || d.publicadoEm || '2099-01-01').getTime();
    const agend = pend.filter((d) => !d.publicado).sort((a, b) => dataPub(a) - dataPub(b));
    const pular = process.argv.includes('--pre-gerar') ? preGerado : () => false;
    const lote = [...pub, ...agend].filter((d) => !pular(d) && !parados.has(d.slug) && textoParaNarracao(d).length * 1 <= LIMITE_CARACTERES).slice(0, n);
    console.log(lote.map((d) => d.slug).join(','));
    console.error(`lote de ${lote.length}: ${lote.filter((d) => d.publicado).length} publicados + ${lote.filter((d) => !d.publicado).length} agendados · faltam ${pend.length} no total`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERRO:', e.message); process.exit(2); });
