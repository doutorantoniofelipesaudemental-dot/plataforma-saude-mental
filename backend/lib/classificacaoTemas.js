/**
 * Regra de classificação de temas compartilhada pelo levantamento e pela reclassificação
 * (ordem de 09/11/2026). Determinística, sem IA externa.
 */
const { TEMAS } = require('./temas');

const SLUG_TRANSTORNOS = 'transtornos-mentais';

// Sinais textuais: conceito/diagnóstico/conduta vs. termos de transtorno.
const RE_CONCEITO = /\b(o que (é|são)|diagn[óo]stic|tratamento|sintomas?|conduta|causas?|como (é|se) (feito|faz|diagnostic))/i;
const RE_TRANSTORNO = /(transtorno|depress|ansiedade|p[âa]nico|TDAH|\bTEA\b|autis|bipolar|esquizofrenia|\bTOC\b|obsess|fobia|dem[êe]ncia|psicose|burnout|ins[ôo]nia|compuls|anorexia|bulimia)/i;

/** Mapa slug do artigo → slug do tema proposto pelo plano-diretor (eixo_nome do inventário). */
function temaProposto(inventario) {
  const mapa = new Map();
  for (const l of inventario) {
    const t = TEMAS.find((x) => x.nome === (l.eixo_nome || '').trim());
    if (t) mapa.set(l.slug, t.slug);
  }
  return mapa;
}

/** Motivo de dúvida pela regra 5 (texto) ou '' quando o tema proposto pode ser aplicado. */
function duvidaRegra5(titulo, resumo, proposto) {
  const texto = `${titulo || ''} ${resumo || ''}`;
  if (proposto === SLUG_TRANSTORNOS && !RE_CONCEITO.test(texto)) {
    return 'inventário põe em Transtornos, mas sem sinal de conceito/diagnóstico/conduta (pode ser psicoeducação)';
  }
  if (proposto && proposto !== SLUG_TRANSTORNOS && RE_CONCEITO.test(texto) && RE_TRANSTORNO.test(texto)) {
    return 'parece conceito/diagnóstico de transtorno (regra 5 sugere Transtornos Mentais)';
  }
  return '';
}

module.exports = { SLUG_TRANSTORNOS, temaProposto, duvidaRegra5 };
