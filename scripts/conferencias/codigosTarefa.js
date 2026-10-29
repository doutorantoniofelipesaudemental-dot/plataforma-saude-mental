/**
 * Interpreta o LastTaskResult do Agendador do Windows (Get-ScheduledTaskInfo) para a conferência diária.
 * Códigos do Microsoft Learn ("Task Scheduler error and success constants"); 1 e o código de arquivo não encontrado vêm do próprio script e do Windows.
 * O Get-ScheduledTaskInfo devolve o código com sinal, por isso o 0x80070002 aparece como número negativo.
 */
const CODIGOS = new Map([
  [0, 'executou com sucesso'],
  [1, 'o script saiu com erro (código de saída 1)'],
  [0x41301, 'está rodando agora'],
  [0x41303, 'ainda não rodou desde a criação'],
  [0x41306, 'a última execução foi encerrada pelo usuário ou pelo sistema'],
  [0x80070002 - 2 ** 32, 'arquivo não encontrado (caminho do script errado)'],
]);

// Função pura: texto curto para a conferência diária.
function interpretarResultado(codigo) {
  if (Number.isNaN(codigo)) return 'resultado não lido';
  if (CODIGOS.has(codigo)) return CODIGOS.get(codigo);
  return `código ${codigo} (ver o Agendador do Windows)`;
}

module.exports = { interpretarResultado };
