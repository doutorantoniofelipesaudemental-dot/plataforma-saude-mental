// Trava de slot de upload do YouTube (ordem do Dr. Antônio, 23/11/2026, 21:33).
// Regra: slots de UPLOAD só em seg, ter, qua e sex. Quinta, sábado e domingo são RECUSADOS.
// Horário de Brasília = UTC-3 fixo (sem horário de verão desde 2019).
// Função pura: não lê arquivo, não grava nada.

const DIAS_PROIBIDOS = { 0: 'domingo', 4: 'quinta-feira', 6: 'sábado' };

// Retorna { bloqueio: string|null, avisos: string[] }
function checarSlot(slotISO) {
  const data = new Date(slotISO);
  if (Number.isNaN(data.getTime())) return { bloqueio: `slot inválido: "${slotISO}"`, avisos: [] };
  const brt = new Date(data.getTime() - 3 * 60 * 60 * 1000);
  const dia = brt.getUTCDay();
  const hora = String(brt.getUTCHours()).padStart(2, '0') + ':' + String(brt.getUTCMinutes()).padStart(2, '0');
  if (DIAS_PROIBIDOS[dia]) {
    return { bloqueio: `slot em ${DIAS_PROIBIDOS[dia]} (${hora} BRT): slots de upload só seg, ter, qua e sex`, avisos: [] };
  }
  return { bloqueio: null, avisos: [] };
}

module.exports = { checarSlot };
