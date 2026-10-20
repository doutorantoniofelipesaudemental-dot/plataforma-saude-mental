/**
 * Nomes dos arquivos do lote do LinkedIn. Em simulação, grava em arquivo próprio (ignorado pelo git),
 * para não regravar o lote rastreado. O arquivo rastreado só muda em execução real.
 */
function nomesLote({ simulacao = false } = {}) {
  const base = simulacao ? 'agendamento-lote.simulacao' : 'agendamento-lote';
  return { json: `${base}.json`, md: `${base}.md` };
}

module.exports = { nomesLote };
