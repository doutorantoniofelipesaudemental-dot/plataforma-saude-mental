/**
 * Selo da capa (decisão de 29/10/2026): mostra o PÚBLICO, com o prefixo "Para".
 * O título grande é sempre o tema (artigo.titulo). Categoria sem público definido (ex.: "Geral") não tem selo.
 * Módulo puro, sem dependências: usado por capaRedes.js e carrossel.js (evita ciclo entre os dois).
 */
const PUBLICO_SELO = Object.freeze({
  'Médicos & Enfermeiros': 'Para Médicos & Enfermeiros',
  'Residentes & Estudantes': 'Para residentes e estudantes',
  'Pacientes & Famílias': 'Para pacientes e famílias',
  'Pais & Famílias': 'Para pais e famílias',
  'Empresas & RH': 'Para empresas e RH',
  'Relatos da Prática': 'Para profissionais de saúde',
});

// Função pura: rótulo do público para o selo. Vazio quando a categoria não tem público definido.
function rotuloPublico(categoria) {
  return PUBLICO_SELO[categoria] || '';
}

// Função pura: problemas da capa (lista vazia = coerente). Toda capa tem título (o tema); selo, quando existe, começa com "Para".
function problemasDaCapa(artigo) {
  const problemas = [];
  if (!String(artigo.titulo || '').trim()) problemas.push('capa sem título (o tema)');
  const selo = rotuloPublico(artigo.categoria);
  if (selo && !selo.startsWith('Para ')) problemas.push(`selo "${selo}" não começa com "Para"`);
  return problemas;
}

module.exports = { PUBLICO_SELO, rotuloPublico, problemasDaCapa };
