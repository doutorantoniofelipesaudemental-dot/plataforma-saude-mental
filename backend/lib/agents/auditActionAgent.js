/**
 * Checagem 3 — Ética e Sanitária/CFM (gemma2:9b).
 * Autoridade: checarEticaCfm (Res. CFM 2.336/2023) + avisos obrigatórios
 * (Res. CFM 2.454/2026, CVV 188/SAMU 192, orientação geral/protocolos locais)
 * + assinatura oficial de 3 linhas. O LLM só pode reprovar, nunca aprovar.
 */
const ollama = require('../ollamaAdapter');
const { checarEticaCfm } = require('../checagensAprovacao');
const { AVISO_CFM } = require('../conformidadeCfm');

const RE_PROMESSA = /\b(cura garantida|resultado garantido|garantimos|sem riscos?|milagr\w+|100%)\b/i;
const RE_ORIENTACAO = /orienta[çc][ãa]o geral/i;
const RE_PROTOCOLOS = /protocolos? (?:hospitalares?|locais|do (?:pronto|PA)|da rede)/i;
const RE_MENSAGERIA = /wa\.me|whatsapp\.com|api\.whatsapp|t\.me\//i;

async function checar(peca, { usarLlm = true } = {}) {
  const texto = String(peca.legenda || '');
  const falhas = [];
  const base = checarEticaCfm(texto, { contexto: 'social' });
  falhas.push(...base.falhas);
  if (!texto.includes(AVISO_CFM)) falhas.push('sem aviso de IA (Res. CFM 2.454/2026)');
  if (!/CVV 188/.test(texto) || !/SAMU 192/.test(texto)) falhas.push('sem "CVV 188 · SAMU 192"');
  if (!RE_ORIENTACAO.test(texto) || !RE_PROTOCOLOS.test(texto)) falhas.push('sem aviso de orientação geral/protocolos locais');
  if (RE_PROMESSA.test(texto)) falhas.push('promessa de resultado');
  if (RE_MENSAGERIA.test(texto)) falhas.push('mensageria de terceiros proibida (CLAUDE.md §3.B)');

  let modelo = null;
  if (usarLlm && !falhas.length) {
    const r = await ollama.gerar('redacao', {
      sistema: 'Você audita publicidade médica pelas Resoluções CFM 2.336/2023 (sem sensacionalismo, autopromoção, promessa de resultado, diagnóstico à distância). Responda só JSON: {"aprovado":true|false,"violacoes":["..."]}. Contexto normativo: as Resoluções CFM 2.336/2023 e 2.454/2026 existem e estão vigentes (não questione sua existência); [DOSE A CONFIRMAR] é uma trava intencional que remete à revisão médica (aceite-a); avisos de CVV 188/SAMU 192 e a assinatura são obrigatórios. Reprove só por erro claro.',
      usuario: texto.slice(0, 1800),
      json: true, maxTokens: 160, timeoutMs: 150_000,
    });
    modelo = r.modelo || null;
    if (r.json && r.json.aprovado === false) falhas.push(...(r.json.violacoes || ['reprovado na auditoria CFM']).slice(0, 3).map((p) => `auditoria CFM: ${p}`));
  }
  return { ok: !falhas.length, falhas, modelo };
}

module.exports = { nome: 'auditActionAgent', checar };
