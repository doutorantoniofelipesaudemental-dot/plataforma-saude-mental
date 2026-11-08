/**
 * IA EXTERNA DESATIVADA (ordem do Dr. Antônio Felipe, 08/11/2026).
 *
 * Gemini, Groq e OpenAI não são mais chamados por nenhum script. Este módulo
 * continua existindo só para que os scripts carreguem; `gerarJson` recusa a
 * tarefa com mensagem clara, sem nenhuma chamada de rede e sem ler chave de API.
 * Para reativar qualquer provedor, é preciso ordem escrita do Dr. Antônio e um PR.
 */
const MENSAGEM_DESATIVADA =
  'IA externa desativada por ordem de 08/11/2026 (Gemini, Groq e OpenAI). ' +
  'Nenhuma chamada de API foi feita. Para este trabalho, use o fluxo sem IA ou peça ordem escrita ao Dr. Antônio.';

class IaDesativadaError extends Error {
  constructor() {
    super(MENSAGEM_DESATIVADA);
    this.name = 'IaDesativadaError';
    this.codigo = 'IA_DESATIVADA';
  }
}

/** Recusa sempre. Não há provedor: a cadeia está vazia. */
async function gerarJson() {
  throw new IaDesativadaError();
}

/** Lista de provedores: vazia por ordem de 08/11/2026, independentemente do ambiente. */
function montarProvedores() {
  return [];
}

/** Aviso padrão para os scripts bot:* que não chamam IA mas dependem deste módulo. */
function avisarBotDesativado(nome) {
  console.warn(`[${nome}] ${MENSAGEM_DESATIVADA}`);
}

module.exports = { gerarJson, montarProvedores, IaDesativadaError, MENSAGEM_DESATIVADA, avisarBotDesativado };
