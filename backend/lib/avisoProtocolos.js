/**
 * Aviso padrão de protocolos locais (CLAUDE.md §1.C, decisão de 17/10/2026): exibido UMA vez, perto do fim, nos textos clínicos
 * (manejo, urgência, medicação, protocolos), fora do texto narrado (o hash da narração não muda). Não aparece em relatos nem em textos leigos
 * e não duplica quando o corpo já traz o aviso.
 * Espelho no app Next: apps/plataforma-saude-mental/app/avisoProtocolos.js (mesma regra; tests/unit/aviso-protocolos.test.js confere os dois).
 * Espelho no navegador: public/assets/js/artigo.js (mesma regra, em JS de página).
 */
const AVISO_PROTOCOLOS = 'Orientação geral: respeitam-se sempre os protocolos hospitalares, do Pronto Atendimento (PA) e da rede de saúde locais.';
const CATEGORIAS_PROFISSIONAIS = ['Médicos & Enfermeiros', 'Residentes & Estudantes', 'Pós-Graduação & Concursos'];

const temAviso = (texto) => /protocolos hospitalares/i.test(String(texto || ''));
const eRelato = (slug, categoria) => /^Relatos/i.test(categoria || '') || /^relato-/.test(slug || '');

/** true quando o texto é clínico e ainda não traz o aviso no corpo. */
function precisaAviso({ slug, categoria, texto }) {
  if (eRelato(slug, categoria) || temAviso(texto)) return false;
  const t = String(texto || '');
  return CATEGORIAS_PROFISSIONAIS.includes(categoria) || /Manejo Clínico/i.test(t) || /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|mEq\/L|mmol\/L)\b/i.test(t);
}

module.exports = { AVISO_PROTOCOLOS, CATEGORIAS_PROFISSIONAIS, precisaAviso, temAviso, eRelato };
