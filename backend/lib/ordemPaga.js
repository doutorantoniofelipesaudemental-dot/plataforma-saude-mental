/**
 * Guarda de voz PAGA (ordem de 22/10/2026). ElevenLabs e OpenAI (TTS) cobram por uso.
 * Só rodam com --provedor=<paga> --ordem=<id> e o id registrado em config/ordens-pagas.json
 * (ordem escrita do Dr. Antônio, com data e autor). Sem isso, recusado antes de qualquer rede.
 */
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, '..', '..', 'config', 'ordens-pagas.json');

function ordensRegistradas(arquivo = ARQUIVO) {
  if (!fs.existsSync(arquivo)) return [];
  const j = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  return Array.isArray(j.ordens) ? j.ordens : [];
}

function ordemValida(ordens, id) {
  return Boolean(id) && ordens.some((o) => o && o.id === id && o.data && o.autorizadoPor);
}

function exigirPagoAutorizado({ provedor, ordem, arquivo = ARQUIVO } = {}) {
  if (!ordemValida(ordensRegistradas(arquivo), ordem)) {
    throw new Error(`Voz paga bloqueada (${provedor}): não há ordem do Dr. Antônio registrada para este uso (config/ordens-pagas.json). Use o padrão, --provedor=edge.`);
  }
}

module.exports = { ARQUIVO, ordensRegistradas, ordemValida, exigirPagoAutorizado };
