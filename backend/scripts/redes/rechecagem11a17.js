/**
 * Rechecagem SÓ LEITURA das peças 11–17/11 (ordem de 10/11/2026, 21:15, item 7).
 * Não grava nada: não altera meta.json, status nem banco. Quem grava "aprovado-checagem" é o Dr. (script de --aplicar).
 * Para cada pasta: resolve o artigo efetivo (troca de pauta em overrides), refaz a peça como gerarFila.js
 * (mesmo plano, mesmas correções de forma), compara legenda e telas com as da pasta (hash), e roda checarPost
 * (técnica, arte, 5 linhas, CVV), zero genérico, checarEticaCfm (contexto social) e a regra do link (na bio).
 *
 *   REDES_HISTORICO=<pasta da fila para o histórico de similaridade> (padrão: a própria REDES_FILA)
 *   REDES_FILA=<pasta da fila> node --env-file-if-exists=.env backend/scripts/redes/rechecagem11a17.js [--relatorio=<arquivo.json>]
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { planejarPost, montarLegenda, palavras, encurtar } = require('../../lib/redesV2/conteudo');
const { renderizarTelas, textoAlternativo } = require('../../lib/redesV2/arte');
const { checarPost } = require('../../lib/redesV2/checagem');
const { checarEticaCfm } = require('../../lib/checagensAprovacao');
const { carregarOverrides, aplicarOverride, historicoDe, avaliarZeroGenerico } = require('../../lib/redesV2/zgGate');

const RAIZ = path.resolve(__dirname, '../../..');
const FILA = process.env.REDES_FILA || 'C:/DRSAUDEMENTAL/conteudo/redes-v2';
const OVERRIDES = carregarOverrides(path.join(RAIZ, 'scripts/redes/overrides-11-17.json'));
const SITE = 'https://www.drantoniofelipemedico.com.br';
const RE_PECA = /^2026-11-(1[1-7])-/;
const argRel = (process.argv.find((a) => a.startsWith('--relatorio=')) || '').split('=')[1];
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** Cópia de corrigirPlano de gerarFila.js (correção só de forma). Mantida igual; se mudar lá, mudar aqui. */
function corrigirPlano(plano, falhas, tentativa) {
  const p = JSON.parse(JSON.stringify(plano));
  const msgs = falhas.map((x) => x.msg);
  for (const t of p.telas) {
    t.texto = t.texto.replace(/\bonline\b/gi, 'na internet').replace(/\bfeedback\b/gi, 'retorno').replace(/\bstress\b/gi, 'estresse');
    if (t.tipo === 'capa' && palavras(`${t.titulo || ''} ${t.texto}`).length > 25) t.titulo = '';
    t.texto = encurtar(t.texto, Math.max(6, (tentativa === 1 ? 24 : 18) - palavras(t.titulo || '').length)).replace(/([^.!?…])$/, '$1.');
  }
  if (msgs.some((m) => /legenda com \d+ caracteres|hashtags/.test(m)) || tentativa === 2) { p.legendaCorpo = p.legendaCorpo.split('\n').slice(0, tentativa === 2 ? 1 : 5).join('\n') + '\n\nTexto completo no link da bio.'; }
  if (msgs.some((m) => /hashtags/.test(m))) p.hashtags = [...new Set([...p.hashtags, '#saudemental', '#cuidado', '#bemestar'])].slice(0, 4);
  return p;
}

/** Mesmo laço de gerarUm (gerarFila.js): até 2 correções de forma. */
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

(async () => {
  const mongoose = require('mongoose');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI ausente (rode com --env-file-if-exists=.env, pelo Dr. ou pela tarefa).');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'drsaudemental', serverSelectionTimeoutMS: 10000 });
  const artigos = mongoose.connection.db.collection('artigos');
  const pastas = fs.readdirSync(FILA).filter((d) => RE_PECA.test(d)).sort();
  const resultado = [];
  for (const id of pastas) {
    const dir = path.join(FILA, id);
    const erros = [];
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
    const legenda = fs.readFileSync(path.join(dir, 'legenda.txt'), 'utf8');
    const alt = fs.readFileSync(path.join(dir, 'alt.txt'), 'utf8');
    const telaArquivos = fs.readdirSync(dir).filter((f) => /^tela-\d+\.png$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
    const imagens = telaArquivos.map((f) => fs.readFileSync(path.join(dir, f)));
    // Pasta com nome antigo: o artigo efetivo é o da troca de pauta (overrides, ordem de 10/11 06:15).
    const slugEfetivo = OVERRIDES.trocas[meta.slug] || meta.slug;
    const linkEsperado = `${SITE}/artigo/${slugEfetivo}`;

    const doc = await artigos.findOne({ slug: slugEfetivo });
    if (!doc) erros.push('artigo não encontrado no banco pelo slug efetivo');
    if (doc && doc.publicado !== true) erros.push('artigo não está publicado');
    if (meta.urlTexto !== linkEsperado) erros.push(`urlTexto do meta (${meta.urlTexto}) diferente do artigo efetivo (${linkEsperado})`);
    const linksNaLegenda = legenda.match(/https?:\/\/\S+/g) || [];
    if (linksNaLegenda.length) erros.push(`legenda com link (o link fica na bio): ${linksNaLegenda.join(' ')}`);

    if (doc) {
      const ov = OVERRIDES.ovs[slugEfetivo];
      const r = await gerarComoNaFila(doc, meta.tipo, ov);
      if (r.legenda !== legenda) erros.push('legenda da pasta diferente do texto gerado a partir do artigo');
      const hashesAtuais = imagens.map(sha);
      const novas = r.imagens.map(sha);
      if (novas.length !== hashesAtuais.length || novas.some((h, i) => h !== hashesAtuais[i])) erros.push('arte refeita não coincide com as telas da pasta (hash)');
      if (meta.checagem?.hashes?.length && hashesAtuais.some((h, i) => h !== meta.checagem.hashes[i])) erros.push('telas da pasta diferentes das registradas na checagem');
      for (const f of r.chk.falhas) erros.push(`${f.grupo}: ${f.msg}`);
      const zg = avaliarZeroGenerico({ doc, legenda: r.legenda, ov, dataISO: meta.dataSugerida.slice(0, 10), historico: historicoDe(process.env.REDES_HISTORICO || FILA, { excluirId: id }), urlTexto: linkEsperado });
      for (const f of zg.falhas) erros.push(`zero-genérico ${f.regra}: ${f.msg}`);
      const etica = checarEticaCfm(legenda, { contexto: 'social' });
      if (!etica.ok) erros.push(`ética CFM legenda: ${etica.falhas.join(' | ')}`);
      const eticaAlt = checarEticaCfm(alt, { contexto: 'social', exigirIdentificacao: false });
      if (!eticaAlt.ok) erros.push(`ética CFM alt: ${eticaAlt.falhas.join(' | ')}`);
    }
    resultado.push({ id, slugEfetivo, dataSugerida: meta.dataSugerida, statusAtual: meta.status, ok: erros.length === 0, erros });
  }
  await mongoose.disconnect();
  const resumo = { geradoEm: new Date().toISOString(), gravou: false, pecas: resultado.length, aprovadas: resultado.filter((r) => r.ok).length, reprovadas: resultado.filter((r) => !r.ok).length, itens: resultado };
  if (argRel) fs.writeFileSync(argRel, JSON.stringify(resumo, null, 2), 'utf8');
  console.log(JSON.stringify({ pecas: resumo.pecas, aprovadas: resumo.aprovadas, reprovadas: resumo.reprovadas, gravou: false, detalhes: resultado.map((r) => ({ id: r.id, ok: r.ok, erros: r.erros })) }, null, 2));
  process.exitCode = resumo.reprovadas ? 1 : 0;
})().catch((e) => { console.error('[rechecagem] erro:', e.message); process.exitCode = 2; });
