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

module.exports = { slugify, escapeHtml };
