/**
 * Decide o que o agendar-tarefas-windows.ps1 faz com cada tarefa DrSM-* (ordem do Dr. Antônio, 19/10/2026).
 * Regra: tarefa que já existe mantém o estado atual (ativa continua ativa; desativada continua desativada).
 * Só tarefa NOVA pode nascer desativada (nascerDesativada).
 *   node scripts/agendadorEstado.js <existe 0|1> <ativa 0|1> <nascerDesativada 0|1>   imprime a ação
 */

// Função pura: existe = a tarefa está registrada; ativa = não está "Disabled".
function decidirAcao({ existe, ativa, nascerDesativada = false }) {
  if (!existe) return nascerDesativada ? 'criar-desativada' : 'criar-ativada';
  return ativa ? 'atualizar-mantendo-ativada' : 'atualizar-mantendo-desativada';
}

// Função pura: a ação termina em "desativada" => o script deve deixar a tarefa desativada.
const deveDesativar = (acao) => /desativada$/.test(acao);

module.exports = { decidirAcao, deveDesativar };

if (require.main === module) {
  const [existe, ativa, nascer] = process.argv.slice(2).map((v) => v === '1');
  console.log(decidirAcao({ existe, ativa, nascerDesativada: nascer }));
}
