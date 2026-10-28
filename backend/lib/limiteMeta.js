/**
 * Contador de chamadas à Meta com teto por hora (proposta de 25/10/2026, ordem do plantão).
 * Lê o cabeçalho X-App-Usage que a própria Meta devolve nas respostas (nenhuma chamada extra para medir),
 * e soma as chamadas feitas nesta hora. Para ANTES do limite: o publicador e o diagnóstico adiam em vez de bater no teto.
 * Funções puras: quem chama guarda o estado (ex.: documento por hora no banco).
 */
const TETO_HORA_PADRAO = 150;   // chamadas por hora que este projeto se permite (abaixo do teto da Meta)
const TETO_USO_PERCENT = 75;    // para quando o X-App-Usage passar de 75% do teto da Meta

// Função pura: maior percentual do X-App-Usage ({"call_count":80,"total_time":10,"total_cputime":5}). null se o cabeçalho não veio.
function usoDoCabecalho(valor) {
  if (!valor) return null;
  try {
    const u = JSON.parse(valor);
    const nums = [u.call_count, u.total_time, u.total_cputime].filter((n) => Number.isFinite(n));
    return nums.length ? Math.max(...nums) : null;
  } catch {
    return null;
  }
}

// Função pura: chave da hora em America/Bahia, ex.: "2026-10-25T18".
function chaveHora(agora) {
  const local = new Date(agora.getTime() - 3 * 3600e3);
  return local.toISOString().slice(0, 13);
}

// Função pura: pode fazer mais uma chamada? Devolve o motivo quando não pode.
function podeChamar({ agora, estado = {}, usoPercent = null, teto = TETO_HORA_PADRAO }) {
  if (usoPercent !== null && usoPercent >= TETO_USO_PERCENT) return { pode: false, motivo: `uso da Meta em ${usoPercent}% (limite de parada ${TETO_USO_PERCENT}%)` };
  const hora = chaveHora(agora);
  const contagem = estado.hora === hora ? estado.contagem : 0;
  if (contagem >= teto) return { pode: false, motivo: `teto de ${teto} chamadas nesta hora atingido` };
  return { pode: true, motivo: '' };
}

// Função pura: novo estado depois de uma chamada (não altera o anterior).
function registrarChamada(estado = {}, agora) {
  const hora = chaveHora(agora);
  const contagem = estado.hora === hora ? estado.contagem + 1 : 1;
  return { hora, contagem };
}

module.exports = { usoDoCabecalho, chaveHora, podeChamar, registrarChamada, TETO_HORA_PADRAO, TETO_USO_PERCENT };
