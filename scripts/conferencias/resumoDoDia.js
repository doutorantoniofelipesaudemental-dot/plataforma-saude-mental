/**
 * Resumo do dia (relatorios/RESUMO-DO-DIA.md, máx. 15 linhas), gerado pela conferência das 09:30.
 * Script determinístico: sem IA. Só lê o banco (redes_v2) e recebe as falhas/avisos da conferência.
 * Primeira linha: "PRECISA DO DR. ANTÔNIO: SIM — ação" só se algum alerta exigir ação do Dr. Antônio; senão, NÃO.
 */
const fs = require('node:fs');
const path = require('node:path');

const MAX_LINHAS = 15;
const DIA_MS = 24 * 3600e3;

// Função pura (testável): monta as linhas a partir dos dados já coletados.
// pendentesOllama: itens "aguardando Ollama" (pendentes, nunca aprovados nem reprovados por omissão).
function montarResumo({ hoje, publicadosOntem = [], saiHoje = [], alertas = [], pendentesOllama = 0 }) {
  const acoes = alertas.filter((a) => a.acao);
  const primeira = alertas.find((a) => a.primeira);
  const linhas = [
    primeira ? primeira.texto : acoes.length
      ? `PRECISA DO DR. ANTÔNIO: SIM — ${acoes[0].texto}`
      : 'PRECISA DO DR. ANTÔNIO: NÃO',
    ...(pendentesOllama ? [`Aguardando Ollama: ${pendentesOllama} item(ns), pendentes (não decididos)`] : []),
    `Resumo de ${hoje} (Portal e redes)`,
    `Publicado ontem: ${publicadosOntem.length ? publicadosOntem.join(', ') : 'nada'}`,
    `Sai hoje: ${saiHoje.length ? saiHoje.join(', ') : 'nada agendado'}`,
  ];
  if (!alertas.length) linhas.push('Alertas: nenhum');
  for (const a of alertas) linhas.push(`${a.acao ? '[AÇÃO]' : '[aviso]'} ${a.texto}`);
  // Corte com aviso explícito: o resumo nunca passa de 15 linhas.
  if (linhas.length > MAX_LINHAS) {
    const cortadas = linhas.length - (MAX_LINHAS - 1);
    return [...linhas.slice(0, MAX_LINHAS - 1), `(+${cortadas} linha(s) omitida(s): ver relatorios/conferencias/${hoje}.md)`];
  }
  return linhas;
}

// Lê do banco (somente leitura) o que saiu ontem e o que está previsto para hoje.
async function coletar(d, hoje) {
  const inicioHoje = new Date(`${hoje}T03:00:00Z`);
  const inicioOntem = new Date(inicioHoje.getTime() - DIA_MS);
  const fimHoje = new Date(inicioHoje.getTime() + DIA_MS);
  const publicadosOntem = (await d.collection('redes_v2').find({ status: 'publicado', publicadoEm: { $gte: inicioOntem, $lt: inicioHoje } }, { projection: { _id: 1 } }).toArray()).map((p) => `Instagram ${p._id}`);
  const saiHoje = (await d.collection('redes_v2').find({ status: 'aprovado-checagem', dataSugerida: { $gte: inicioHoje, $lt: fimHoje } }, { projection: { _id: 1 } }).toArray()).map((p) => `Instagram ${p._id}`);
  return { publicadosOntem, saiHoje };
}

// Alerta do Blob gravado pela rotina mensal (blob-rotina-mensal.js), que roda antes desta conferência (28/10/2026).
const PREFIXO_ALERTA_BLOB = 'PRECISA DO DR. ANTÔNIO: SIM — Blob:';

// Grava o arquivo. Alertas: lista de { texto, acao }. Se o alerta do Blob foi gravado HOJE (mesmo dia do arquivo),
// ele fica no topo: sem isso a regravação das 09:30 o apagaria antes das 17:30.
function gravar(linhas, { arquivo, agora = new Date() } = {}) {
  const destino = arquivo || path.join(path.resolve(__dirname, '../..'), 'relatorios/RESUMO-DO-DIA.md');
  let final = linhas;
  if (fs.existsSync(destino)) {
    const primeira = fs.readFileSync(destino, 'utf8').split('\n')[0];
    const mesmoDia = fs.statSync(destino).mtime.toDateString() === agora.toDateString();
    if (mesmoDia && primeira.startsWith(PREFIXO_ALERTA_BLOB)) {
      final = [primeira, ...linhas.filter((l, i) => !(i === 0 && l.startsWith('PRECISA DO DR.')))];
    }
  }
  fs.writeFileSync(destino, `${final.join('\n')}\n`, 'utf8');
  return destino;
}

module.exports = { montarResumo, coletar, gravar, MAX_LINHAS };
