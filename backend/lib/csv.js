/** Escapa um valor para uso seguro como campo CSV (RFC 4180). */
function escaparCampoCsv(valor) {
  const texto = valor === undefined || valor === null ? '' : String(valor);
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Monta um CSV (separado por vírgula, quebra de linha CRLF) a partir de
 * cabeçalhos e linhas (arrays de valores, na mesma ordem dos cabeçalhos).
 */
function paraCsv(cabecalhos, linhas) {
  return [cabecalhos, ...linhas]
    .map((linha) => linha.map(escaparCampoCsv).join(','))
    .join('\r\n');
}

module.exports = { paraCsv };
