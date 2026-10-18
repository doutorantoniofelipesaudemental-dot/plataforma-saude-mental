/**
 * Resumo do dia (relatorios/RESUMO-DO-DIA.md, máx. 15 linhas), gerado pela conferência das 09:30.
 * Script determinístico: sem IA. Só lê o banco (redes_v2) e recebe as falhas/avisos da conferência.
 * Primeira linha: "PRECISA DE VOCÊ: SIM — ação" só se algum alerta exigir ação do Dr. Antônio; senão, NÃO.
 */
const fs = require('node:fs');
const path = require('node:path');

const MAX_LINHAS = 15;
const DIA_MS = 24 * 3600e3;

// Função pura (testável): monta as linhas a partir dos dados já coletados.
function montarResumo({ hoje, publicadosOntem = [], saiHoje = [], alertas = [] }) {
  const acoes = alertas.filter((a) => a.acao);
  const linhas = [
    acoes.length
      ? `PRECISA DE VOCÊ: SIM — ${acoes[0].texto}`
      : 'PRECISA DE VOCÊ: NÃO',
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

// Grava o arquivo. Alertas: lista de { texto, acao }. Não faz nada além disso.
function gravar(linhas) {
  const raiz = path.resolve(__dirname, '../..');
  const arquivo = path.join(raiz, 'relatorios/RESUMO-DO-DIA.md');
  fs.writeFileSync(arquivo, `${linhas.join('\n')}\n`, 'utf8');
  return arquivo;
}

module.exports = { montarResumo, coletar, gravar, MAX_LINHAS };
