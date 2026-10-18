// Espelho de backend/lib/caixaViolencia.js (mesma regra; tests/unit/caixa-violencia.test.js confere os dois).
export const CAIXA_VIOLENCIA_TITULO = 'Precisa de ajuda agora?';
export const CAIXA_VIOLENCIA_ITENS = [
  'Ligue 180: Central de Atendimento à Mulher (violência contra a mulher; ligação gratuita, 24h)',
  '190: emergência policial, se houver risco imediato',
  'Disque 100: violações de direitos humanos, inclusive contra crianças, adolescentes e pessoas idosas (ligação gratuita, 24h)',
  'CVV 188: apoio emocional (ligação gratuita, 24h)',
  'SAMU 192: emergência de saúde',
];
const VIOLENCIA = /(viol[êe]ncia dom[ée]stica|viol[êe]ncia contra a mulher|viol[êe]ncia no namoro|abuso sexual|abuso f[ií]sico|maus-tratos|relacionamento abusivo|Maria da Penha|viol[êe]ncia (?:f[ií]sica|psicol[óo]gica|sexual))/gi;

export function precisaCaixaViolencia({ titulo, texto }) {
  const t = String(texto || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  const n = (t.match(VIOLENCIA) || []).length;
  if (!(n >= 3 || (n >= 1 && new RegExp(VIOLENCIA.source, 'i').test(titulo || '')))) return false;
  return !(/Ligue 180/i.test(t) && /\b190\b/.test(t) && /Disque 100/i.test(t));
}
