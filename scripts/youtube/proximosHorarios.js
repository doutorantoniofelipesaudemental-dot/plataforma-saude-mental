/**
 * Próximos horários da fila do YouTube (ordem de 20/10/2026): 1 vídeo por dia, depois do último já programado.
 * Regras da fila (montarFila): Shorts seg/qua/sex/sab/dom às 12h (Bahia); longos ter/qui/sab às 18h (Bahia).
 * Alterna Shorts e longos quando os dois cabem no dia; pula os feriados do calendário do site. Função pura.
 */
const { FERIADOS } = require('../../backend/lib/calendarioSite');

const DIAS_SHORT = new Set([0, 1, 3, 5, 6]); // dom, seg, qua, sex, sáb
const DIAS_LONGO = new Set([2, 4, 6]);       // ter, qui, sáb
const HORA = { short: 12, longo: 18 };

// Data (AAAA-MM-DD) em Salvador, a partir de um instante UTC.
const diaBahia = (dt) => new Date(dt.getTime() - 3 * 3600e3).toISOString().slice(0, 10);
const diaDaSemana = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

// tipos: array de 'short' | 'longo' na ordem de publicação. Devolve [{ tipo, slot (ISO UTC) }].
function proximosHorarios({ ultimoSlot, tipos, feriados = FERIADOS }) {
  const pend = { short: tipos.filter((t) => t === 'short').length, longo: tipos.filter((t) => t === 'longo').length };
  const out = [];
  let dia = new Date(`${diaBahia(new Date(ultimoSlot))}T12:00:00Z`);
  let anterior = null;
  while (pend.short + pend.longo > 0) {
    dia = new Date(dia.getTime() + 24 * 3600e3);
    const iso = dia.toISOString().slice(0, 10);
    if (feriados.has(iso)) continue;
    const dow = diaDaSemana(iso);
    const cabe = { short: DIAS_SHORT.has(dow) && pend.short > 0, longo: DIAS_LONGO.has(dow) && pend.longo > 0 };
    let escolha = null;
    if (cabe.short && cabe.longo) escolha = anterior === 'short' ? 'longo' : anterior === 'longo' ? 'short' : (pend.short >= pend.longo ? 'short' : 'longo');
    else if (cabe.short) escolha = 'short';
    else if (cabe.longo) escolha = 'longo';
    if (!escolha) continue;
    pend[escolha] -= 1;
    const slot = new Date(`${iso}T${String(HORA[escolha] + 3).padStart(2, '0')}:00:00Z`).toISOString();
    out.push({ tipo: escolha, slot });
    anterior = escolha;
  }
  return out;
}

module.exports = { proximosHorarios, DIAS_SHORT, DIAS_LONGO, HORA };
