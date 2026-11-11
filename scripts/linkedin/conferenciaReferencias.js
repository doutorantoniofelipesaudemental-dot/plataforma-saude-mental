/**
 * Aplica na fila do LinkedIn o resultado da conferência de referências (ordem de 29/10/2026).
 *   node scripts/linkedin/conferenciaReferencias.js                       dry-run: mostra o plano, não grava
 *   node scripts/linkedin/conferenciaReferencias.js --aplicar             grava (backup antes, conferência depois)
 *   node scripts/linkedin/conferenciaReferencias.js --exportar=<arquivo>  só lê a fila e grava um JSON (para ensaio)
 *   node scripts/linkedin/conferenciaReferencias.js --fonte=<arquivo>     usa o JSON exportado no lugar do banco (ensaio)
 * Aprovado: grava referenciaConferida (PMID ou DOI). Reprovado: status "manual" com o motivo. Não altera o texto.
 * Só mexe em item com status aprovado-checagem (aprovado) ou aprovado-checagem (reprovado); agendado não é tocado.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..');
const RESULTADO_PADRAO = path.join(RAIZ, '.tmp', 'conferencia-referencias-20261029.json');
const REGEX_PMID = /^\d{5,9}$/;
const REGEX_DOI = /^10\.\d{4,}\//;

// Função pura: problemas no resultado da conferência (vazio = válido).
function validarResultados(resultados) {
  const problemas = [];
  if (!Array.isArray(resultados) || resultados.length === 0) return ['resultado vazio ou fora do formato'];
  for (const r of resultados) {
    const id = r.post || '(sem post)';
    if (!r.post) problemas.push(`${id}: falta o campo post`);
    if (r.status === 'aprovado') {
      if (!(REGEX_PMID.test(String(r.pmid || '')) || REGEX_DOI.test(String(r.doi || '')))) problemas.push(`${id}: aprovado sem PMID ou DOI válido`);
    } else if (r.status === 'reprovado') {
      if (!String(r.motivo || '').trim()) problemas.push(`${id}: reprovado sem motivo`);
    } else {
      problemas.push(`${id}: status inválido (${r.status})`);
    }
  }
  const ids = resultados.map((r) => r.post);
  for (const id of ids) if (ids.indexOf(id) !== ids.lastIndexOf(id)) problemas.push(`${id}: aparece mais de uma vez`);
  return problemas;
}

// Função pura: garante o campo id em cada documento (o banco traz _id; o snapshot exportado pode trazer só _id).
function comId(docs) {
  return docs.map((d) => ({ ...d, id: String(d._id || d.id) }));
}

// Função pura: o que fazer em cada item citado no resultado. Itens fora do resultado não são tocados.
function planejar(docs, resultados, conferidoEm) {
  const porId = new Map(docs.map((d) => [String(d._id || d.id), d]));
  return resultados.map((r) => {
    const doc = porId.get(r.post);
    if (!doc) return { id: r.post, acao: 'pular', motivo: 'item não existe na fila' };
    if (doc.tipo !== 'texto') return { id: r.post, acao: 'pular', motivo: `tipo ${doc.tipo}: a regra vale só para texto` };
    if (doc.status !== 'aprovado-checagem') return { id: r.post, acao: 'pular', motivo: `status atual ${doc.status}: não tocado` };
    if (r.status === 'aprovado') {
      const ref = REGEX_PMID.test(String(r.pmid || '')) ? { pmid: String(r.pmid) } : { doi: String(r.doi) };
      return { id: r.post, acao: 'aprovar', set: { referenciaConferida: { ...ref, fonte: 'PubMed', conferidoEm } } };
    }
    return { id: r.post, acao: 'manual', set: { status: 'manual', motivoManual: String(r.motivo), conferidoEm } };
  });
}

// Função pura: a conferência depois de gravar. Lista o que não bate com o plano.
function conferirDepois(docsDepois, resultados) {
  const porId = new Map(docsDepois.map((d) => [String(d._id || d.id), d]));
  const falhas = [];
  for (const r of resultados) {
    const d = porId.get(r.post);
    if (!d) { falhas.push(`${r.post}: sumiu da fila`); continue; }
    if (r.status === 'aprovado') {
      const rc = d.referenciaConferida || {};
      if (!(REGEX_PMID.test(String(rc.pmid || '')) || REGEX_DOI.test(String(rc.doi || '')))) falhas.push(`${r.post}: sem referenciaConferida`);
      if (d.status !== 'aprovado-checagem') falhas.push(`${r.post}: status ${d.status} (esperado aprovado-checagem)`);
    } else if (d.status !== 'manual') {
      falhas.push(`${r.post}: status ${d.status} (esperado manual)`);
    }
  }
  return falhas;
}

function lerResultado(arquivo) {
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
}

async function lerFilaDoBanco() {
  require(path.join(RAIZ, 'scripts', 'carregarEnv')).carregarEnv();
  const db = require(path.join(RAIZ, 'backend', 'lib', 'db'));
  const mongoose = require(path.join(RAIZ, 'node_modules', 'mongoose'));
  await db.connect();
  const col = mongoose.connection.db.collection('linkedin_fila');
  return { col, fechar: () => mongoose.connection.close() };
}

async function principal() {
  const args = process.argv.slice(2);
  const valor = (nome) => (args.find((a) => a.startsWith(`--${nome}=`)) || '').slice(nome.length + 3) || null;
  const aplicar = args.includes('--aplicar');
  const exportar = valor('exportar');
  const fonte = valor('fonte');
  const resultadoArquivo = valor('resultado') || RESULTADO_PADRAO;

  if (exportar) {
    const { col, fechar } = await lerFilaDoBanco();
    const docs = await col.find({}).toArray();
    fs.writeFileSync(exportar, JSON.stringify(docs.map((d) => ({ ...d, _id: String(d._id) })), null, 2));
    console.log(`exportado: ${docs.length} itens -> ${exportar}`);
    await fechar();
    return;
  }

  const resultados = lerResultado(resultadoArquivo);
  const problemas = validarResultados(resultados);
  if (problemas.length) { console.log('NÃO APLICADO: resultado inválido'); problemas.forEach((p) => console.log(`- ${p}`)); process.exitCode = 1; return; }

  const conferidoEm = new Date().toISOString();
  let docs;
  let col = null;
  let fechar = async () => {};
  if (fonte) {
    docs = comId(JSON.parse(fs.readFileSync(fonte, 'utf8')));
  } else {
    ({ col, fechar } = await lerFilaDoBanco());
    docs = await col.find({}).toArray();
    docs = docs.map((d) => ({ ...d, id: String(d._id) }));
  }

  const plano = planejar(docs, resultados, conferidoEm);
  for (const p of plano) console.log(`${p.id}: ${p.acao}${p.motivo ? ` (${p.motivo})` : ''}`);
  const alvo = plano.filter((p) => p.acao === 'aprovar' || p.acao === 'manual');
  console.log(`plano: ${plano.filter((p) => p.acao === 'aprovar').length} aprovar · ${plano.filter((p) => p.acao === 'manual').length} manual · ${plano.filter((p) => p.acao === 'pular').length} pulados`);

  if (!aplicar) { console.log('DRY-RUN: nada gravado. Use --aplicar para gravar.'); await fechar(); return; }

  if (fonte) {
    const saida = path.join(path.dirname(fonte), 'fila-aplicada.json');
    const depois = docs.map((d) => {
      const p = alvo.find((x) => x.id === d.id);
      return p ? { ...d, ...p.set } : d;
    });
    fs.writeFileSync(saida, JSON.stringify(depois, null, 2));
    const falhas = conferirDepois(depois, resultados);
    console.log(falhas.length ? `CONFERÊNCIA FALHOU:\n- ${falhas.join('\n- ')}` : `CONFERÊNCIA OK (ensaio, ${saida})`);
    if (falhas.length) process.exitCode = 1;
    return;
  }

  // Backup antes de gravar: os itens que serão tocados, com o estado atual.
  const stamp = conferidoEm.replace(/[:.]/g, '-');
  const arquivoBackup = path.join(RAIZ, '.tmp', `backup-conferencia-${stamp}.json`);
  const afetados = docs.filter((d) => alvo.some((x) => x.id === d.id));
  fs.writeFileSync(arquivoBackup, JSON.stringify(afetados, null, 2));
  const relido = JSON.parse(fs.readFileSync(arquivoBackup, 'utf8'));
  if (relido.length !== afetados.length) { console.log('NÃO APLICADO: backup não conferiu'); await fechar(); process.exitCode = 1; return; }
  console.log(`backup: ${relido.length} itens -> ${arquivoBackup}`);

  for (const p of alvo) {
    await col.updateOne({ _id: docs.find((d) => d.id === p.id)._id }, { $set: p.set });
  }
  const depois = (await col.find({}).toArray()).map((d) => ({ ...d, id: String(d._id) }));
  const falhas = conferirDepois(depois, resultados);
  console.log(falhas.length ? `CONFERÊNCIA FALHOU:\n- ${falhas.join('\n- ')}` : 'CONFERÊNCIA OK');
  if (falhas.length) process.exitCode = 1;
  await fechar();
}

module.exports = { validarResultados, planejar, conferirDepois, comId };

if (require.main === module) {
  principal().catch((e) => { console.error('ERRO:', e.message.slice(0, 300)); process.exitCode = 1; });
}
