// Espelho de backend/lib/avisoProtocolos.js (mesma regra; tests/unit/aviso-protocolos.test.js confere os dois).
export const AVISO_PROTOCOLOS = 'Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.';
const CATEGORIAS_PROFISSIONAIS = ['Médicos & Enfermeiros', 'Residentes & Estudantes', 'Pós-Graduação & Concursos'];

export function precisaAviso({ slug, categoria, texto }) {
  const t = String(texto || '');
  if (/^Relatos/i.test(categoria || '') || /^relato-/.test(slug || '') || /protocolos hospitalares/i.test(t)) return false;
  return CATEGORIAS_PROFISSIONAIS.includes(categoria) || /Manejo Clínico/i.test(t) || /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|mEq\/L|mmol\/L)\b/i.test(t);
}
