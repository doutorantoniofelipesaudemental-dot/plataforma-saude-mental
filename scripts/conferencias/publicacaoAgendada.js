// Conferência de publicação dos artigos agendados (ordem de 02/11/2026, item 3b).
// Para os artigos com horário de publicação ontem e hoje (America/Bahia): conferem se foram publicados
// no horário e se a página responde 200. Só leitura. Falha entra na conferência diária e no RESUMO-DO-DIA.
// Funções puras (sem banco nem rede) para teste; quem chama fornece os dados.

const MINUTOS_TOLERANCIA = 60; // atraso acima disso vira aviso

const dataBahia = (d) => new Date(new Date(d).getTime() - 3 * 3600e3).toISOString().slice(0, 10);
const hora = (d) => new Date(new Date(d).getTime() - 3 * 3600e3).toISOString().slice(11, 16);

function diaAnterior(dataIso) {
  const d = new Date(`${dataIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Artigos com horário de publicação ontem ou hoje (data em America/Bahia).
function alvosDoDia({ hoje, artigos }) {
  const dias = [diaAnterior(hoje), hoje];
  return artigos
    .filter((a) => a.agendamento && a.agendamento.slot && dias.includes(dataBahia(a.agendamento.slot)))
    .sort((x, y) => new Date(x.agendamento.slot) - new Date(y.agendamento.slot));
}

// Avalia um artigo. Retorna { nivel: 'ok' | 'aviso' | 'falha', texto }.
function avaliarPublicacao({ artigo, agora, statusHttp }) {
  const slot = new Date(artigo.agendamento.slot);
  const rotulo = `${artigo.slug} (${dataBahia(slot)} ${hora(slot)})`;
  if (artigo.publicado !== true) {
    if (slot > new Date(agora)) return { nivel: 'aviso', texto: `${rotulo}: ainda não é hora da publicação` };
    const motivo = artigo.agendamento.falha ? ` · motivo: ${String(artigo.agendamento.falha).slice(0, 120)}` : '';
    return { nivel: 'falha', texto: `${rotulo}: agendado e NÃO publicado${motivo}` };
  }
  if (!artigo.publicadoEm) return { nivel: 'falha', texto: `${rotulo}: marcado como publicado sem data de publicação` };
  if (statusHttp !== 200) return { nivel: 'falha', texto: `${rotulo}: publicado, mas a página responde HTTP ${statusHttp}` };
  const atrasoMin = Math.round((new Date(artigo.publicadoEm) - slot) / 60000);
  if (Math.abs(atrasoMin) > MINUTOS_TOLERANCIA) {
    return { nivel: 'aviso', texto: `${rotulo}: publicado com ${atrasoMin} min de diferença do horário (página HTTP 200)` };
  }
  return { nivel: 'ok', texto: `${rotulo}: publicado no horário, página HTTP 200` };
}

module.exports = { alvosDoDia, avaliarPublicacao, dataBahia, diaAnterior, MINUTOS_TOLERANCIA };
