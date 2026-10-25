/**
 * Trava da validação de carrosséis na Graph API (ordem de 25/10/2026, 17h20).
 * Regras: nada de lote na hora anterior ao publicador (08:00) ou ao diagnóstico (20:00), ambos America/Bahia;
 * só posts até 01/11 e dentro de 7 dias, no máximo 7 por execução, com pausa de 60 s; código 4 (limite) para a execução.
 */
const PAUSA_MS = 60 * 1000;
const LIMITE_POR_EXECUCAO = 7;
const DATA_LIMITE = '2026-11-01';
const HORARIOS_PROTEGIDOS = [8 * 60, 20 * 60]; // minutos do dia em America/Bahia (UTC-3, sem horário de verão)
const JANELA_PROTEGIDA_MIN = 60;

// Função pura: hora de Salvador a partir de um instante.
function minutosBahia(agora) {
  const local = new Date(agora.getTime() - 3 * 3600e3);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

// Função pura: true se o instante cai na hora anterior a 08:00 ou a 20:00 (inclusive 08:00 e 20:00).
function janelaProibida(agora) {
  const m = minutosBahia(agora);
  return HORARIOS_PROTEGIDOS.some((h) => m >= h - JANELA_PROTEGIDA_MIN && m <= h);
}

// Função pura: escolhe os posts a validar agora. Só os que não estão validados, até DATA_LIMITE e 7 dias à frente.
function selecionarParaValidar({ posts, jaValidados = [], agora, limite = LIMITE_POR_EXECUCAO }) {
  const fimJanela = new Date(agora.getTime() + 7 * 24 * 3600e3);
  const fimData = new Date(`${DATA_LIMITE}T23:59:59-03:00`);
  const limiteData = fimJanela < fimData ? fimJanela : fimData;
  const validados = new Set(jaValidados);
  return posts
    .filter((p) => !validados.has(p._id) && p.dataSugerida && new Date(p.dataSugerida) <= limiteData)
    .sort((a, b) => new Date(a.dataSugerida) - new Date(b.dataSugerida))
    .slice(0, Math.min(limite, LIMITE_POR_EXECUCAO));
}

// Função pura: a Meta recusou por limite de aplicação (código 4). Para a execução e não tenta de novo hoje.
function ehLimiteMeta(mensagem = '') {
  return /código 4\/|Application request limit/i.test(String(mensagem));
}

module.exports = { janelaProibida, selecionarParaValidar, ehLimiteMeta, minutosBahia, PAUSA_MS, LIMITE_POR_EXECUCAO, DATA_LIMITE, JANELA_PROTEGIDA_MIN };
