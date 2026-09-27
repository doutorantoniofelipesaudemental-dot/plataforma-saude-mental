/**
 * Linhas fixas de conformidade de TODA peça do bot de mídias (Regra 17 e
 * Res. CFM 2.454/2026): identificação do médico com CRM e RQE, aviso de apoio
 * de IA com responsabilidade médica final e, em tema sensível, CVV 188/SAMU 192.
 * São acrescentadas pelo código — nunca pedidas ao LLM —, para nunca faltarem.
 *
 * Fonte única: bot-gemini (rascunho), bot-publicar (legendas, LinkedIn,
 * YouTube) e as checagens antes do envio usam estas mesmas constantes.
 */
const { IDENTIFICACAO, LINHA_CVV } = require('./legendaInstagram');

const AVISO_CFM =
  'Conteúdo produzido com apoio de ferramentas de inteligência artificial, com revisão e responsabilidade médica final do Dr. Antônio Felipe (Resolução CFM 2.454/2026).';

// Versão completa (roteiros, descrições longas): Regra 17 — "NÃO ESPECIALISTA"
// logo abaixo da linha das pós-graduações.
const IDENTIFICACAO_COMPLETA = [
  'Dr. Antônio Felipe · Médico · CRM-BA 41322',
  'Especialista em Medicina de Família e Comunidade · RQE 26638',
  'Atuo em Pronto Atendimento Psiquiátrico (PAP) e Atenção Primária à Saúde (APS)',
  'Pós-graduação em Psiquiatria, Saúde Mental, Atenção Psicossocial, Neuropsicologia e Medicina do Trabalho',
  'NÃO ESPECIALISTA',
].join('\n');

// Versão curta, para dentro de arte (último slide, último Story).
const APOIO_CURTO = 'Apoio agora: CVV 188 · SAMU 192';

const temIdentificacao = (t) => /CRM-BA 41322/.test(t) && /RQE 26638/.test(t);

/**
 * Acrescenta ao texto o que faltar — CVV (tema sensível), identificação e
 * aviso CFM, nessa ordem — ANTES do bloco de hashtags, se houver. Idempotente:
 * o que já está no texto não é repetido.
 */
function garantirConformidade(texto, { sensivel = false, identificacao = IDENTIFICACAO } = {}) {
  const blocos = String(texto).trim().split(/\n\s*\n/);
  const iHashtags = blocos.findIndex((b) => /^\s*#/.test(b));
  const corpo = blocos.join('\n\n');
  const fixos = [
    sensivel && !/CVV 188/.test(corpo) ? LINHA_CVV : null,
    temIdentificacao(corpo) ? null : identificacao,
    corpo.includes(AVISO_CFM) ? null : AVISO_CFM,
  ].filter(Boolean);
  if (iHashtags < 0) return [...blocos, ...fixos].join('\n\n');
  return [...blocos.slice(0, iHashtags), ...fixos, ...blocos.slice(iHashtags)].join('\n\n');
}

/** O que falta no texto final — usado como trava antes de qualquer envio. */
function faltasConformidade(texto, { sensivel = false } = {}) {
  const t = String(texto);
  const faltas = [];
  if (!temIdentificacao(t)) faltas.push('sem a identificação do médico (CRM-BA 41322 · RQE 26638)');
  if (!t.includes(AVISO_CFM)) faltas.push('sem o aviso da Res. CFM 2.454/2026');
  if (sensivel && !/CVV 188/.test(t)) faltas.push('tema sensível sem CVV 188');
  return faltas;
}

module.exports = { AVISO_CFM, IDENTIFICACAO, IDENTIFICACAO_COMPLETA, LINHA_CVV, APOIO_CURTO, garantirConformidade, faltasConformidade };
