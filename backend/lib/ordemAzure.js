/**
 * Guarda do Azure Speech (ordem de 22/10/2026). O padrão de narração é o Edge-TTS (gratuito).
 * O Azure só roda com --provedor=azure E com o id de uma ordem escrita do Dr. Antônio registrada em
 * config/ordens-azure.json. Sem ordem registrada, a chamada é recusada antes de qualquer rede.
 */
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, '..', '..', 'config', 'ordens-azure.json');

// Lê as ordens registradas. Arquivo ausente = nenhuma ordem. Arquivo ilegível dá erro (nunca "autorizado").
function ordensRegistradas(arquivo = ARQUIVO) {
  if (!fs.existsSync(arquivo)) return [];
  const j = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  return Array.isArray(j.ordens) ? j.ordens : [];
}

// Função pura sobre a lista: a ordem vale só com id, data e autor escritos.
function ordemValida(ordens, id) {
  return Boolean(id) && ordens.some((o) => o && o.id === id && o.data && o.autorizadoPor);
}

function exigirAzureAutorizado({ ordem, arquivo = ARQUIVO } = {}) {
  if (!ordemValida(ordensRegistradas(arquivo), ordem)) {
    throw new Error('Azure Speech bloqueado: não há ordem do Dr. Antônio registrada para este uso (config/ordens-azure.json). Use o padrão, --provedor=edge.');
  }
}

module.exports = { ARQUIVO, ordensRegistradas, ordemValida, exigirAzureAutorizado };
