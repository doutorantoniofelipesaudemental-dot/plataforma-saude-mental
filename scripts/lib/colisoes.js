/**
 * Arquivos que o PR cria e que já existem como não rastreados na pasta principal (ordem de 28/10/2026).
 * O checkout do merge sobrescreve esses arquivos e o merge falha ("untracked working tree files would be overwritten").
 */

// Função pura: interseção entre os arquivos do PR e os não rastreados, sem repetição e na ordem do PR.
function arquivosQueColidem({ arquivosDoPr = [], naoRastreados = [] }) {
  const normalizar = (f) => f.replace(/\\/g, '/');
  const existentes = new Set(naoRastreados.map(normalizar));
  return [...new Set(arquivosDoPr.map(normalizar))].filter((f) => existentes.has(f));
}

module.exports = { arquivosQueColidem };
