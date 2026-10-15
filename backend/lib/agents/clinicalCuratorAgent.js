/**
 * Checagem 2 — Científica/Curadoria Clínica (gemma2:9b).
 * Trava dura: dose/posologia sem o marcador [DOSE A CONFIRMAR] reprova, e
 * revisaoMedica deve permanecer "pendente" (a peça não se declara revisada).
 */
const ollama = require('../ollamaAdapter');

const TRAVA_DOSE = '[DOSE A CONFIRMAR]';
// mg/mcg/g/mL com número, ou "comprimido(s)" com posologia.
const RE_DOSE = /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|ml|mL|g)\b(?:\s*\/?\s*(?:dia|kg|dose|vez(?:es)?))?/i;
const RE_ABSOLUTISMO = /\b(sempre cura|cura definitiva|100% eficaz|comprovado que cura|garante)\b/i;

async function checar(peca, { usarLlm = true } = {}) {
  const falhas = [];
  const texto = String(peca.legenda || '');
  const fm = peca.frontmatter || {};

  if (RE_DOSE.test(texto) && !texto.includes(TRAVA_DOSE)) falhas.push(`dose/posologia sem a trava ${TRAVA_DOSE}`);
  const status = peca.revisaoMedica ?? fm.revisaoMedica;
  if (status !== 'pendente') falhas.push(`revisaoMedica deve ser "pendente" (atual: ${status ?? 'ausente'})`);
  if (RE_ABSOLUTISMO.test(texto)) falhas.push('afirmação clínica absoluta/promessa sem evidência');

  let modelo = null;
  if (usarLlm && !falhas.length) {
    const r = await ollama.gerar('redacao', {
      sistema: 'Você é curador clínico em saúde mental. Avalie coesão e correção científica geral do texto. Responda só JSON: {"aprovado":true|false,"problemas":["..."]}. Reprove apenas por erro factual claro ou incoerência. Contexto normativo: as Resoluções CFM 2.336/2023 e 2.454/2026 existem e estão vigentes (não questione sua existência); [DOSE A CONFIRMAR] é uma trava intencional que remete à revisão médica (aceite-a); avisos de CVV 188/SAMU 192 e a assinatura são obrigatórios. Reprove só por erro claro.',
      usuario: texto.slice(0, 1800),
      json: true, maxTokens: 160, timeoutMs: 150_000,
    });
    modelo = r.modelo || null;
    if (r.json && r.json.aprovado === false) falhas.push(...(r.json.problemas || ['reprovado na curadoria']).slice(0, 3).map((p) => `curadoria: ${p}`));
  }
  return { ok: !falhas.length, falhas, modelo };
}

module.exports = { nome: 'clinicalCuratorAgent', checar, TRAVA_DOSE };
