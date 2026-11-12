// AUDITORIA SÓ LEITURA da fila conteudo/redes-v2 (todas as pastas). Não grava nada: nem meta.json, nem banco, nem arquivos.
// Uso: node --env-file-if-exists=C:/DRSAUDEMENTAL/.env C:/DRSAUDEMENTAL/.tmp/fila-redes-20261111/auditar.js [--relatorio=<arquivo.json>]
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const RAIZ = path.resolve(__dirname, '..', '..', '..');
const B = path.join(RAIZ, 'backend');
const { planejarPost, montarLegenda, palavras, encurtar } = require(`${B}/lib/redesV2/conteudo`);
const { renderizarTelas, textoAlternativo } = require(`${B}/lib/redesV2/arte`);
const { checarPost } = require(`${B}/lib/redesV2/checagem`);
const { checarEticaCfm } = require(`${B}/lib/checagensAprovacao`);
const { carregarOverrides, aplicarOverride, historicoDe, avaliarZeroGenerico } = require(`${B}/lib/redesV2/zgGate`);
const { EIXO_DO_DIA } = require(`${B}/lib/redesV2/zeroGenerico`);

const FILA = 'C:/DRSAUDEMENTAL/conteudo/redes-v2';
const OVERRIDES = carregarOverrides(path.join(RAIZ, 'scripts', 'redes', 'overrides-11-17.json'));
const SITE = 'https://www.drantoniofelipemedico.com.br';
const HOJE = '2026-11-11';
const RE_PECA = /^\d{4}-\d{2}-\d{2}-/;
const argRel = (process.argv.find((a) => a.startsWith('--relatorio=')) || '').split('=')[1];
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// Mesma correção de forma de rechecagem11a17.js / gerarFila.js (cópia; a regra é só de forma).
function corrigirPlano(plano, falhas, tentativa) {
  const p = JSON.parse(JSON.stringify(plano));
  const msgs = falhas.map((x) => x.msg);
  for (const t of p.telas) {
    t.texto = t.texto.replace(/\bonline\b/gi, 'na internet').replace(/\bfeedback\b/gi, 'retorno').replace(/\bstress\b/gi, 'estresse');
    if (t.tipo === 'capa' && palavras(`${t.titulo || ''} ${t.texto}`).length > 25) t.titulo = '';
    t.texto = encurtar(t.texto, Math.max(6, (tentativa === 1 ? 24 : 18) - palavras(t.titulo || '').length)).replace(/([^.!?…])$/, '$1.');
  }
  if (msgs.some((m) => /legenda com \d+ caracteres|hashtags/.test(m)) || tentativa === 2) {
    p.legendaCorpo = p.legendaCorpo.split('\n').slice(0, tentativa === 2 ? 1 : 5).join('\n');
  }
  if (msgs.some((m) => /hashtags/.test(m))) p.hashtags = [...new Set([...p.hashtags, '#saudemental', '#cuidado', '#bemestar'])].slice(0, 4);
  return p;
}

async function gerarComoNaFila(doc, tipo, ov) {
  let plano = aplicarOverride(planejarPost(doc, { tipo }), ov);
  let tentativas = 0, ultimo = null;
  for (;;) {
    const legenda = montarLegenda(plano, { limite: tentativas ? 1300 : 1500 });
    const { imagens, glifosAusentes } = await renderizarTelas(plano.telas);
    const alts = plano.telas.map((t, i) => textoAlternativo(t, i, plano.telas.length));
    const chk = await checarPost({ legenda, telas: plano.telas, imagens, alts, glifosAusentes });
    ultimo = { plano, legenda, imagens, alts, chk, glifosAusentes };
    if (chk.ok || tentativas >= 2 || glifosAusentes.length) break;
    tentativas += 1;
    plano = corrigirPlano(plano, chk.falhas, tentativas);
  }
  return { ...ultimo, tentativas };
}

async function auditar() {
  const mongoose = require('mongoose');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI ausente (rodar com --env-file-if-exists do .env).');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const artigos = mongoose.connection.db.collection('artigos');
  const pastas = fs.readdirSync(FILA).filter((d) => RE_PECA.test(d)).sort();
  const itens = [];
  for (const id of pastas) {
    const dir = path.join(FILA, id);
    const erros = [];
    const avisos = [];
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
    const legenda = fs.existsSync(path.join(dir, 'legenda.txt')) ? fs.readFileSync(path.join(dir, 'legenda.txt'), 'utf8') : '';
    const altPath = path.join(dir, 'alt.txt');
    const alt = fs.existsSync(altPath) ? fs.readFileSync(altPath, 'utf8') : '';
    if (!alt) erros.push('alt.txt ausente');
    const telaArquivos = fs.readdirSync(dir).filter((f) => /^tela-\d+\.png$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
    const imagens = telaArquivos.map((f) => fs.readFileSync(path.join(dir, f)));
    const dataISO = String(meta.dataSugerida || '').slice(0, 10);
    const dataDoNome = id.slice(0, 10);
    if (dataISO !== dataDoNome) erros.push(`data do nome (${dataDoNome}) diferente de dataSugerida (${dataISO})`);
    if (dataISO < HOJE) erros.push(`data vencida (${dataISO} antes de ${HOJE})`);
    const diaSemana = new Date(`${dataISO}T12:00:00Z`).getUTCDay();
    const eixoDoDia = EIXO_DO_DIA[diaSemana];
    if (meta.status !== 'aprovado-checagem') avisos.push(`status "${meta.status}"`);

    const slugEfetivo = OVERRIDES.trocas[meta.slug] || meta.slug;
    const linkEsperado = `${SITE}/artigo/${slugEfetivo}`;
    const doc = await artigos.findOne({ slug: slugEfetivo });
    if (!doc) erros.push('artigo não encontrado no banco pelo slug efetivo');
    if (doc && doc.publicado !== true) erros.push('artigo não está publicado');
    if (meta.urlTexto !== linkEsperado) erros.push(`urlTexto (${meta.urlTexto}) diferente do artigo efetivo (${linkEsperado})`);
    const links = legenda.match(/https?:\/\/\S+/g) || [];
    if (links.length) erros.push(`legenda com link (fica na bio): ${links.join(' ')}`);

    let eixo = null;
    if (doc) {
      const ov = OVERRIDES.ovs[slugEfetivo];
      const r = await gerarComoNaFila(doc, meta.tipo, ov);
      eixo = r.plano.eixo || (ov && ov.eixo) || null;
      if (eixo !== eixoDoDia) erros.push(`eixo "${eixo}" fora do eixo do dia (${dataISO} = ${eixoDoDia})`);
      if (r.legenda !== legenda) erros.push('legenda da pasta diferente do texto gerado a partir do artigo');
      const hashesAtuais = imagens.map(sha);
      const novas = r.imagens.map(sha);
      if (novas.length !== hashesAtuais.length || novas.some((h, i) => h !== hashesAtuais[i])) erros.push('arte refeita não coincide com as telas da pasta');
      if (meta.checagem?.hashes?.length && hashesAtuais.some((h, i) => h !== meta.checagem.hashes[i])) erros.push('telas diferentes das registradas na checagem');
      for (const f of r.chk.falhas) erros.push(`${f.grupo}: ${f.msg}`);
      const zg = avaliarZeroGenerico({ doc, legenda: r.legenda, ov, dataISO, historico: historicoDe(FILA, { excluirId: id }), urlTexto: linkEsperado });
      for (const f of zg.falhas) erros.push(`zero-genérico ${f.regra}: ${f.msg}`);
      const etica = checarEticaCfm(legenda, { contexto: 'social' });
      if (!etica.ok) erros.push(`ética CFM legenda: ${etica.falhas.join(' | ')}`);
      const eticaAlt = checarEticaCfm(alt, { contexto: 'social', exigirIdentificacao: false });
      if (!eticaAlt.ok) erros.push(`ética CFM alt: ${eticaAlt.falhas.join(' | ')}`);
    } else {
      eixo = '(sem artigo)';
    }
    itens.push({ id, dataISO, diaSemana, eixo, eixoDoDia, status: meta.status, titulo: meta.titulo, slugEfetivo, erros, avisos });
  }
  // duplicatas: mais de uma peça no mesmo dia (todas as datas da fila)
  const porDia = {};
  for (const it of itens) (porDia[it.dataISO] ||= []).push(it.id);
  for (const it of itens) if (porDia[it.dataISO].length > 1) it.erros.push(`mais de 1 peça no dia ${it.dataISO} (${porDia[it.dataISO].join(', ')})`);
  await mongoose.disconnect();
  const resumo = { geradoEm: new Date().toISOString(), hoje: HOJE, gravou: false, pecas: itens.length, ok: itens.filter((i) => !i.erros.length).length, reprovadas: itens.filter((i) => i.erros.length).length, itens };
  if (argRel) fs.writeFileSync(argRel, JSON.stringify(resumo, null, 2), 'utf8');
  return resumo;
}
module.exports = { auditar };
if (require.main === module) {
  auditar().then((r) => console.log(JSON.stringify({ pecas: r.pecas, ok: r.ok, reprovadas: r.reprovadas }, null, 2)))
    .catch((e) => { console.error('[auditar] erro:', e.message); process.exitCode = 2; });
}
