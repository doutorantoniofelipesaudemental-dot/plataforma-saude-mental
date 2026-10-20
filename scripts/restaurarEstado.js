/**
 * Restaura o estado operacional a partir do backup do dia (ordem de 20/10/2026).
 *   node --env-file-if-exists=.env scripts/restaurarEstado.js --data=AAAA-MM-DD --simular
 *       Só mostra o que seria restaurado. Não grava nada.
 *   node --env-file-if-exists=.env scripts/restaurarEstado.js --data=AAAA-MM-DD --aplicar --ordem="restaurar estado AAAA-MM-DD"
 *       Só com a ordem escrita do Dr. Antônio (texto exato). Antes de escrever, copia o arquivo atual para
 *       .tmp/antes-restauracao/<data-hora>/ (cópia, nunca apaga). Confere o hash antes de gravar.
 * Só restaura arquivos da LISTA do scripts/backupEstado.js, dentro do projeto.
 */
const fs = require('node:fs');
const path = require('node:path');
const { LISTA, COLECAO, RAIZ, sha256 } = require('./backupEstado');

const ORDEM = (data) => `restaurar estado ${data}`;

// Planeja a restauração: para cada documento do dia, confere o hash e o destino. Não grava nada.
async function planejar({ col, data, raiz = RAIZ, lista = LISTA }) {
  const docs = await col.find({ data }).toArray();
  return docs.map((d) => {
    const existe = fs.existsSync(path.join(raiz, d.arquivo));
    const noLista = lista.includes(d.arquivo);
    const hashOk = typeof d.conteudo === 'string' && sha256(d.conteudo) === d.sha256;
    return { arquivo: d.arquivo, bytes: d.bytes, hashOk, noLista, existe, pode: hashOk && noLista };
  });
}

// Aplica: copia o atual para .tmp/antes-restauracao/ e grava o backup. Só se a ordem bater exatamente.
async function aplicar({ col, data, ordem, raiz = RAIZ, lista = LISTA, agora = new Date() }) {
  if (ordem !== ORDEM(data)) throw new Error(`ordem ausente ou diferente. Use --ordem="${ORDEM(data)}"`);
  const plano = await planejar({ col, data, raiz, lista });
  const pasta = path.join(raiz, '.tmp', 'antes-restauracao', agora.toISOString().replace(/[:.]/g, '-'));
  const feitos = [];
  for (const p of plano.filter((x) => x.pode)) {
    const destino = path.join(raiz, p.arquivo);
    const doc = await col.findOne({ _id: `${data}|${p.arquivo}` });
    if (fs.existsSync(destino)) {
      fs.mkdirSync(path.join(pasta, path.dirname(p.arquivo)), { recursive: true });
      fs.copyFileSync(destino, path.join(pasta, p.arquivo));
    }
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, doc.conteudo, 'utf8');
    feitos.push(p.arquivo);
  }
  return { feitos, guardadoEm: fs.existsSync(pasta) ? path.relative(raiz, pasta) : null, recusados: plano.filter((x) => !x.pode).map((x) => x.arquivo) };
}

module.exports = { planejar, aplicar, ORDEM };

if (require.main === module) {
  const args = process.argv.slice(2);
  const arg = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
  const data = arg('data');
  const ordem = arg('ordem');
  const simular = args.includes('--simular');
  const aplicarAgora = args.includes('--aplicar');
  (async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error('informe --data=AAAA-MM-DD');
    if (simular === aplicarAgora) throw new Error('escolha exatamente um: --simular ou --aplicar');
    const db = require('../backend/lib/db');
    const mongoose = require('mongoose');
    await db.connect();
    const col = mongoose.connection.db.collection(COLECAO);
    if (simular) {
      const plano = await planejar({ col, data });
      console.log(`SIMULAÇÃO (nada foi gravado) — backup de ${data}: ${plano.length} arquivo(s)`);
      for (const p of plano) console.log(`${p.pode ? 'SERIA restaurado' : 'NÃO restauraria'}: ${p.arquivo} (${p.bytes} bytes)${p.existe ? ' — substituiria o atual (cópia antes)' : ''}${p.hashOk ? '' : ' — HASH NÃO CONFERE'}${p.noLista ? '' : ' — fora da lista'}`);
    } else {
      const r = await aplicar({ col, data, ordem });
      console.log(`Restaurados: ${r.feitos.length}. Cópia do estado anterior: ${r.guardadoEm || 'nenhuma (não havia arquivo)'}`);
      if (r.recusados.length) console.log(`Não restaurados: ${r.recusados.join(', ')}`);
    }
    await mongoose.disconnect();
  })().catch((e) => { console.error(`Erro: ${e.message}`); process.exit(1); });
}
