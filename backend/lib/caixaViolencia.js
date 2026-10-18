/**
 * Caixa padrão de canais de apoio nos textos de violência (decisão de 17/10/2026): Ligue 180, 190, Disque 100, CVV 188 e SAMU 192.
 * Exibida UMA vez, após o texto e fora do trecho narrado (o hash da narração não muda). Não aparece quando o corpo já traz os três canais de violência.
 * Tema "violência" = mesmo critério da varredura científica (3+ menções, ou 1+ com o termo no título).
 * Espelhos: apps/plataforma-saude-mental/app/caixaViolencia.js (app Next) e public/assets/js/artigo.js (navegador); tests/unit/caixa-violencia.test.js confere os três.
 */
const CAIXA_VIOLENCIA_TITULO = 'Precisa de ajuda agora?';
const CAIXA_VIOLENCIA_ITENS = [
  'Ligue 180: Central de Atendimento à Mulher (violência contra a mulher; ligação gratuita, 24h)',
  '190: emergência policial, se houver risco imediato',
  'Disque 100: violações de direitos humanos, inclusive contra crianças, adolescentes e pessoas idosas (ligação gratuita, 24h)',
  'CVV 188: apoio emocional (ligação gratuita, 24h)',
  'SAMU 192: emergência de saúde',
];
const VIOLENCIA = /(viol[êe]ncia dom[ée]stica|viol[êe]ncia contra a mulher|viol[êe]ncia no namoro|abuso sexual|abuso f[ií]sico|maus-tratos|relacionamento abusivo|Maria da Penha|viol[êe]ncia (?:f[ií]sica|psicol[óo]gica|sexual))/gi;

const limpar = (t) => String(t || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');

/** true quando o tema é violência e o corpo ainda não traz Ligue 180, 190 e Disque 100. */
function precisaCaixaViolencia({ titulo, texto }) {
  const t = limpar(texto);
  const n = (t.match(VIOLENCIA) || []).length;
  if (!(n >= 3 || (n >= 1 && new RegExp(VIOLENCIA.source, 'i').test(titulo || '')))) return false;
  return !(/Ligue 180/i.test(t) && /\b190\b/.test(t) && /Disque 100/i.test(t));
}

module.exports = { CAIXA_VIOLENCIA_TITULO, CAIXA_VIOLENCIA_ITENS, precisaCaixaViolencia };
