/**
 * Validade da autorização do YouTube (modo "Testando"), lida de relatorios/youtube/validade.json.
 * Só compara datas. Não lê tokens nem credenciais.
 * alertaValidade: 3 dias ou menos = "PRECISA DE VOCÊ" na primeira linha; vencida = "YouTube: autorização vencida".
 */
const fs = require('node:fs');
const path = require('node:path');

const DIA_MS = 24 * 3600e3;
const ARQUIVO = path.resolve(__dirname, '../../relatorios/youtube/validade.json');

// Dias corridos entre duas datas ISO (AAAA-MM-DD), em horário de Brasília.
function diasEntre(hojeISO, venceISO) {
  return Math.round((Date.parse(`${venceISO}T00:00:00-03:00`) - Date.parse(`${hojeISO}T00:00:00-03:00`)) / DIA_MS);
}

function alertaValidade({ hoje, venceEm }) {
  if (!venceEm) return null;
  const dias = diasEntre(hoje, venceEm);
  if (dias < 0) return { texto: 'YouTube: autorização vencida', acao: true, primeira: true };
  if (dias <= 3) return { texto: `PRECISA DE VOCÊ: reautorizar o YouTube (vence em ${dias} dias)`, acao: true, primeira: true };
  return null;
}

function lerVenceEm(arquivo = ARQUIVO) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8')).autorizacaoVenceEm || null;
  } catch {
    return null;
  }
}

module.exports = { alertaValidade, lerVenceEm, diasEntre, ARQUIVO };
