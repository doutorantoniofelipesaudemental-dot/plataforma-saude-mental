/**
 * Auditoria + tripla checagem (técnica, ética/científica de forma, humanizada) + marca d'água de UM post do fluxo
 * novo de redes (PROMPT-MESTRE 3.3). Determinística (sem LLM): a revisão científica profunda é do texto de origem,
 * já auditado na Parte 2; aqui só se confere que a peça não distorce, não promete e carrega os avisos obrigatórios.
 */
const crypto = require('node:crypto');
const sharp = require('sharp');
const { checarEticaCfm, checarImagemSemMarcaDagua } = require('../checagensAprovacao');
const { checarTexto } = require('../auditoriaTexto');
const { AVISO_CFM } = require('../conformidadeCfm');
const { MAX_PALAVRAS_TELA, palavras, ORIENTACAO, LINHA_CREDITO } = require('./conteudo');
const { ASSINATURA } = require('./arte');

const RE_INGLES = /\b(the|and|with|your|feedback|online|home office|stress|follow|link in bio|swipe)\b/i; // "burnout" é a única exceção aprovada
const RE_MENSAGERIA = /wa\.me|whatsapp|t\.me\/|telegram/i;
const RE_PRECO_DEPOIMENTO = /\b(R\$\s?\d|reais|valor da consulta|pre[çc]o|promo[çc][ãa]o|depoimento de paciente|antes e depois)\b/i;

async function checarPost({ legenda, telas, imagens, alts, glifosAusentes = [] }) {
  const falhas = [];
  const f = (grupo, msg) => falhas.push({ grupo, msg });

  /* técnica */
  if (imagens.length < 5 || imagens.length > 8) f('técnica', `${imagens.length} telas (esperado 5 a 8)`);
  for (const [i, img] of imagens.entries()) {
    const m = await sharp(img).metadata();
    if (m.width !== 1080 || m.height !== 1350) f('técnica', `tela ${i + 1}: ${m.width}x${m.height} (esperado 1080x1350)`);
  }
  if (alts.length !== imagens.length || alts.some((a) => !a || a.length < 20)) f('técnica', 'texto alternativo ausente em alguma imagem');
  if (glifosAusentes.length) f('técnica', `acento/caractere sem glifo na arte: ${glifosAusentes.join(' ')} (arte reprovada)`);
  // A arte tem de trazer a assinatura de 3 linhas (25/10/2026: o post de 26/10 saiu com 2 e a checagem não viu).
  if (ASSINATURA.length !== 3) f('técnica', `assinatura da arte com ${ASSINATURA.length} linhas (esperado 3)`);
  if (alts.some((a) => !String(a).includes(ASSINATURA[2]))) f('técnica', 'texto alternativo sem a 3ª linha da assinatura');
  for (const [i, t] of telas.entries()) {
    const n = palavras(`${t.titulo || ''} ${t.texto || ''}`).length;
    if (n > MAX_PALAVRAS_TELA) f('técnica', `tela ${i + 1} com ${n} palavras (máx. ${MAX_PALAVRAS_TELA})`);
  }
  if (legenda.length > 1500) f('técnica', `legenda com ${legenda.length} caracteres (máx. 1500)`);
  const tags = legenda.match(/#[\p{L}\d_]+/gu) || [];
  if (tags.length < 3 || tags.length > 5) f('técnica', `${tags.length} hashtags (esperado 3 a 5)`);
  const primeira = legenda.split('\n')[0];
  if (!primeira || primeira.length > 140) f('técnica', 'primeira linha da legenda sem gancho claro (vazia ou > 140 caracteres)');
  if (!telas[0] || !telas[0].texto) f('técnica', 'primeira tela sem gancho');

  /* ética (Res. CFM 2.336/2023 e 2.454/2026) */
  for (const x of checarEticaCfm(legenda, { contexto: 'social' }).falhas) f('ética', x);
  if (!legenda.includes(AVISO_CFM)) f('ética', 'sem aviso de IA (Res. CFM 2.454/2026)');
  if (!legenda.includes(ORIENTACAO)) f('ética', 'sem aviso de orientação geral/protocolos locais');
  if (!legenda.includes(LINHA_CREDITO)) f('ética', 'sem a linha de crédito "Conteúdo do Portal de Saúde Mental Doutor Antônio Felipe Garabito"');
  if (!telas.length || telas[telas.length - 1].tipo !== 'final') f('técnica', 'último cartão (com o crédito da marca) ausente');
  if (!/CVV 188/.test(legenda) || !/SAMU 192/.test(legenda)) f('ética', 'sem "Em crise: CVV 188 · SAMU 192"');
  if (/#psiquiatri/i.test(legenda)) f('ética', '#psiquiatria é vetado');
  if (RE_MENSAGERIA.test(legenda)) f('ética', 'mensageria de terceiros proibida');
  if (RE_PRECO_DEPOIMENTO.test(legenda) || telas.some((t) => RE_PRECO_DEPOIMENTO.test(`${t.titulo || ''} ${t.texto}`))) f('ética', 'preço, promoção, depoimento ou antes/depois (vedado)');
  const todoTexto = [legenda, ...telas.flatMap((t) => [t.titulo, t.texto])].filter(Boolean).join('\n');
  const textoArte = telas.map((t) => `${t.titulo || ''} ${t.texto}`).join(' ').replace(/The (Lancet|BMJ)/g, '$1');
  const ingles = textoArte.match(RE_INGLES);
  if (ingles) f('técnica', `palavra em inglês na arte: "${ingles[0]}" (exceção: "burnout")`);
  /* humanizada + sentido: reaproveita o detector da Parte 2 (estigma, culpa, promessa) */
  for (const x of checarTexto({ origem: 'mongo', slug: 'post', titulo: 'x', resumo: 'x', tempoLeitura: 1, corpo: `<p>${todoTexto}</p><h2>Referências</h2><ol><li>a</li><li>b</li><li>c</li><li>d</li></ol>` })) {
    if (/decisão do autor/.test(x.msg)) f(x.grupo, x.msg);
  }

  /* marca d'água */
  for (const [i, img] of imagens.entries()) {
    const r = await checarImagemSemMarcaDagua(img);
    if (!r.ok) f('marca d\'água', `tela ${i + 1}: ${r.falhas.join('; ')}`);
  }
  const hashes = imagens.map((b) => crypto.createHash('sha256').update(b).digest('hex'));
  return { ok: !falhas.length, falhas, hashes };
}

module.exports = { checarPost };
