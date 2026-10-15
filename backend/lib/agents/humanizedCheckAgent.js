/**
 * Checagem 4 — Humanização e Cuidado (gemma2:9b).
 * Fala COM a pessoa, tom simples sem culpa/medo/vergonha, caminhos de cuidado
 * (inclui SUS), sem estereótipos, dignidade acima do efeito literário.
 * Base determinística: checarHumanizacao do projeto + regras abaixo.
 */
const ollama = require('../ollamaAdapter');
const { checarHumanizacao } = require('../checagensAprovacao');

const RE_CULPA_MEDO = /\b(culpa sua|voc[êe] [ée] fraco|frescura|falta de f[ée]|é só querer|drama|louco[a]?s?|doido[a]?s?|surtad[oa]s?|vergonha de ser)\b/i;
const RE_TERCEIRA_PESSOA = /\b(os pacientes (?:são|ficam)|essas pessoas (?:são|sofrem))\b/i;
const RE_CAMINHO_CUIDADO = /\b(SUS|UBS|CAPS|Unidade B[áa]sica|posto de sa[úu]de|procure (?:um|uma|ajuda)|buscar ajuda|m[ée]dic[oa])\b/i;

async function checar(peca, { usarLlm = true } = {}) {
  const texto = String(peca.legenda || '');
  const falhas = [...checarHumanizacao(texto).falhas];
  if (RE_CULPA_MEDO.test(texto)) falhas.push('linguagem de culpa, medo, vergonha ou estereótipo');
  if (RE_TERCEIRA_PESSOA.test(texto)) falhas.push('fala sobre a pessoa, não com ela');
  if (!RE_CAMINHO_CUIDADO.test(texto) || !/\bSUS\b/.test(texto)) falhas.push('sem caminhos de cuidado, incluindo o SUS');

  let modelo = null;
  if (usarLlm && !falhas.length) {
    const r = await ollama.gerar('redacao', {
      sistema: 'Você revisa humanização em saúde mental. Critérios: fala COM a pessoa (você), tom simples, sem culpa/medo/vergonha, mostra caminhos de cuidado (incluindo SUS), sem estereótipos, preserva a dignidade. Responda só JSON: {"aprovado":true|false,"problemas":["..."]}. Contexto normativo: as Resoluções CFM 2.336/2023 e 2.454/2026 existem e estão vigentes (não questione sua existência); [DOSE A CONFIRMAR] é uma trava intencional que remete à revisão médica (aceite-a); avisos de CVV 188/SAMU 192 e a assinatura são obrigatórios. Reprove só por erro claro.',
      usuario: texto.slice(0, 1800),
      json: true, maxTokens: 160, timeoutMs: 150_000,
    });
    modelo = r.modelo || null;
    if (r.json && r.json.aprovado === false) falhas.push(...(r.json.problemas || ['reprovado na humanização']).slice(0, 3).map((p) => `humanização: ${p}`));
  }
  return { ok: !falhas.length, falhas, modelo };
}

module.exports = { nome: 'humanizedCheckAgent', checar };
