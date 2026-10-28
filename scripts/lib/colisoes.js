/**
 * Checagem antes de trocar de branch no merge-seguro (ordem de 27/10/2026): a troca e o merge param se a pasta principal
 * tiver alteração que o checkout sobrescreveria. Nada é copiado, movido ou apagado aqui.
 */

const normalizar = (f) => f.replace(/\\/g, '/');

// Função pura: arquivos que o PR adiciona e que já existem como não rastreados na pasta principal.
function arquivosQueColidem({ arquivosDoPr = [], naoRastreados = [] }) {
  const existentes = new Set(naoRastreados.map(normalizar));
  return [...new Set(arquivosDoPr.map(normalizar))].filter((f) => existentes.has(f));
}

// Função pura: lista os bloqueios. Ok só se não houver nenhum.
function verificarAntesDaTroca({ rastreadosAlterados = [], naoRastreadosLocais = [], arquivosDoPr = [] }) {
  const bloqueios = [];
  for (const f of rastreadosAlterados.map(normalizar)) {
    bloqueios.push({ tipo: 'rastreado-alterado', arquivo: f, motivo: 'alterado na pasta principal (rastreado). Faça backup em .tmp/ e restaure com git restore, ou leve a alteração para um PR em worktree.' });
  }
  for (const f of arquivosQueColidem({ arquivosDoPr, naoRastreados: naoRastreadosLocais })) {
    bloqueios.push({ tipo: 'nao-rastreado-colide', arquivo: f, motivo: 'existe na pasta principal como não rastreado e o PR também o adiciona. Confira se é igual ao do PR; se for, copie para .tmp/ e remova da pasta principal.' });
  }
  return { ok: bloqueios.length === 0, bloqueios };
}

module.exports = { arquivosQueColidem, verificarAntesDaTroca };
