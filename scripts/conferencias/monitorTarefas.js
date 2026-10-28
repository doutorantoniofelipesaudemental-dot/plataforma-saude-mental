/**
 * Monitoramento das tarefas DrSM-* (ordem de 20/10/2026): lê o último resultado (LastTaskResult) e devolve o alerta com a correção.
 * Função pura para a decisão; a leitura do Agendador é feita por quem chama (PowerShell, somente leitura).
 * Ordem de 28/10/2026: tarefa desativada pelo Dr. Antônio é aviso, não falha; falha já corrigida no código vira aviso até a data indicada.
 */
const CORRECOES = {
  'DrSM-LinkedIn-Agendar': 'confira no Chrome se o LinkedIn está logado e rode `! npm run linkedin:agendar`; veja relatorios/logs-agendador/DrSM-LinkedIn-Agendar.log',
  'DrSM-Manutencao-Semanal': 'se falhou no push de sexta, confira a credencial do git (`gh auth status`); veja relatorios/logs-agendador/DrSM-Manutencao-Semanal.log',
};
// Falha já corrigida no código, à espera da próxima execução. Depois de "ate" volta a ser falha.
const AGUARDANDO_EXECUCAO = {
  'DrSM-Manutencao-Semanal': { ate: '2026-10-30', corrigido: 'deps instaladas antes do portão; portão APROVADO em 26/10 21:55 (portao-20261026-2155)' },
};
const SEM_RESULTADO = new Set([267011, 267009]); // 0x41303 = ainda não rodou; 0x41301 = em execução

// Função pura: 'ok', { aviso } ou { alerta } com o texto e a correção.
function avaliarTarefa({ nome, ultimoResultado, estado, hoje }) {
  if (ultimoResultado === 0 || SEM_RESULTADO.has(ultimoResultado)) return 'ok';
  if (estado === 'Disabled') return { aviso: `tarefa ${nome} pausada pelo Dr. Antônio (último resultado ${ultimoResultado}); não conta como falha enquanto estiver pausada` };
  const espera = AGUARDANDO_EXECUCAO[nome];
  if (espera && hoje && hoje <= espera.ate) return { aviso: `tarefa ${nome}: último resultado ${ultimoResultado}, causa já corrigida (${espera.corrigido}); aguardando a execução até ${espera.ate}. Se continuar depois dessa data, vira falha` };
  const correcao = CORRECOES[nome] || 'veja relatorios/logs-agendador/' + nome + '.log';
  return { alerta: `tarefa ${nome} terminou com código ${ultimoResultado} (0x${(ultimoResultado >>> 0).toString(16)}). Correção: ${correcao}` };
}

module.exports = { avaliarTarefa, CORRECOES, AGUARDANDO_EXECUCAO };
