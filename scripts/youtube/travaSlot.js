// Trava de slot de upload do YouTube (ordem do Dr. Antônio, 23/11/2026).
// Regra: UPLOADS só em seg, ter, qua, sex (20:15) e sáb (20:45); NUNCA qui ou dom.
// Horário de Brasília = UTC-3 fixo (sem horário de verão desde 2019).
// Função pura: não lê arquivo, não grava nada.

const DIAS_PROIBIDOS = { 0: 'domingo', 4: 'quinta-feira' };
const SABADO = 6;
const SABADO_MINIMO_MIN = 20 * 60 + 45; // 20:45 BRT

// Retorna { bloqueio: string|null, avisos: string[] }
function checarSlot(slotISO) {
  const data = new Date(slotISO);
  if (Number.isNaN(data.getTime())) return { bloqueio: `slot inválido: "${slotISO}"`, avisos: [] };
  const brt = new Date(data.getTime() - 3 * 60 * 60 * 1000);
  const dia = brt.getUTCDay();
  const minutos = brt.getUTCHours() * 60 + brt.getUTCMinutes();
  const hora = String(brt.getUTCHours()).padStart(2, '0') + ':' + String(brt.getUTCMinutes()).padStart(2, '0');
  const avisos = [];
  if (DIAS_PROIBIDOS[dia]) {
    return { bloqueio: `slot em ${DIAS_PROIBIDOS[dia]} (${hora} BRT): uploads não são permitidos nesse dia`, avisos };
  }
  if (dia === SABADO && minutos < SABADO_MINIMO_MIN) {
    avisos.push(`slot de sábado às ${hora} BRT é antes das 20:45 (horário definido pelo Dr. Antônio)`);
  }
  return { bloqueio: null, avisos };
}

module.exports = { checarSlot };
