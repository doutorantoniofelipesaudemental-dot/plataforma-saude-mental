/** Converte um título em slug de URL (sem acentos, sem símbolos). */
function slugify(texto) {
  return String(texto)
    .normalize('NFD')
    // Remove os sinais diacríticos separados pela normalização NFD.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

/** Escapa HTML para uso seguro de texto vindo do usuário. */
function escapeHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

// Mesmo formato usado no client-side (assets/js/site.js) — mantém a data
// idêntica entre o HTML pré-renderizado no servidor e o que o JS montaria.
const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Formata uma data (Date, string ISO, ou timestamp) como "11 de setembro de 2026". */
function formatarData(valor) {
  if (!valor) return '';
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '' : formatadorData.format(data);
}

module.exports = { slugify, escapeHtml, formatarData };
