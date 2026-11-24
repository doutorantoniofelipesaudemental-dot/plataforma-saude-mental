// Trava de slot do YouTube (ordem do Dr. Antônio, 24/11/2026, substitui a de 23/11/2026).
// Regra: o DIA DO UPLOAD tem de ser seg, ter, qua ou sex (Brasília). Quinta, sábado e domingo são RECUSADOS
// como dia de upload. O dia de ESTREIA (publishAt) pode ser qualquer dia.
// Horário de Brasília = UTC-3 fixo (sem horário de verão desde 2019).
// Função pura: não lê arquivo, não grava nada.

const DIAS_UPLOAD_PERMITIDOS = [1, 2, 3, 5]; // getUTCDay() em BRT: seg, ter, qua, sex
const NOMES = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

// uploadISO: instante em que o upload acontece (padrão: agora). estreiaISO: publishAt (não é checado).
// Retorna { bloqueio: string|null, avisos: string[] }
function checarSlot(estreiaISO, uploadISO = new Date().toISOString()) {
  const up = new Date(uploadISO);
  if (Number.isNaN(up.getTime())) return { bloqueio: `upload inválido: "${uploadISO}"`, avisos: [] };
  if (estreiaISO !== undefined && Number.isNaN(new Date(estreiaISO).getTime())) {
    return { bloqueio: `estreia inválida: "${estreiaISO}"`, avisos: [] };
  }
  const brt = new Date(up.getTime() - 3 * 60 * 60 * 1000);
  const dia = brt.getUTCDay();
  const hora = String(brt.getUTCHours()).padStart(2, '0') + ':' + String(brt.getUTCMinutes()).padStart(2, '0');
  if (!DIAS_UPLOAD_PERMITIDOS.includes(dia)) {
    return { bloqueio: `upload em ${NOMES[dia]} (${hora} BRT): o dia do upload só pode ser seg, ter, qua ou sex`, avisos: [] };
  }
  return { bloqueio: null, avisos: [] };
}

module.exports = { checarSlot, DIAS_UPLOAD_PERMITIDOS };
