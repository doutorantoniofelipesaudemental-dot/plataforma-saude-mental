/**
 * Linha "PRONTO PARA SEXTA 10:00: SIM/NÃO" (ordem de 29/10/2026). SÓ LEITURA, e só no dia DATA_ALVO.
 * Confere: site no ar; PRs #193 a #196 no mesmo commit registrado; fila do LinkedIn sem status desconhecido.
 * Chamado pela conferência diária (DrSM-Conferencia-Diaria, 09:30): sem tarefa nova.
 */
const https = require('node:https');
const { spawnSync } = require('node:child_process');

const DATA_ALVO = '2026-10-30';
const PRS_ESPERADOS = { 193: '6da3e51', 194: '106b895', 195: '3cd3364', 196: 'cabf32f' };
const STATUS_CONHECIDOS = ['agendado-linkedin', 'aprovado-checagem', 'manual'];

// Função pura: decide a linha. Fora do dia alvo, não há linha (retorna null).
function avaliarProntoParaSexta({ hoje, siteCodigo, prs, statusFila }) {
  if (hoje !== DATA_ALVO) return null;
  const motivos = [];
  if (siteCodigo !== 200) motivos.push(`site responde ${siteCodigo || 'sem resposta'}`);
  for (const [n, esperado] of Object.entries(PRS_ESPERADOS)) {
    const atual = prs[n];
    if (!atual) motivos.push(`#${n} não lido`);
    else if (!atual.startsWith(esperado)) motivos.push(`#${n} mudou (${atual.slice(0, 7)} em vez de ${esperado})`);
  }
  if (!statusFila) motivos.push('fila do LinkedIn não lida');
  else {
    const estranhos = Object.keys(statusFila).filter((s) => !STATUS_CONHECIDOS.includes(s));
    if (estranhos.length) motivos.push(`status desconhecido na fila: ${estranhos.join(', ')}`);
  }
  const pronto = motivos.length === 0;
  return { pronto, linha: pronto ? 'PRONTO PARA SEXTA 10:00: SIM' : `PRONTO PARA SEXTA 10:00: NÃO (${motivos.join('; ')})` };
}

function lerSite() {
  return new Promise((ok) => {
    https.get('https://www.drantoniofelipemedico.com.br/', (r) => { r.resume(); ok(r.statusCode); })
      .on('error', () => ok(0));
  });
}

function lerPrs() {
  const out = {};
  for (const n of Object.keys(PRS_ESPERADOS)) {
    const r = spawnSync('gh', ['pr', 'view', n, '--json', 'headRefOid', '--jq', '.headRefOid'], { encoding: 'utf8' });
    out[n] = r.status === 0 ? r.stdout.trim() : null;
  }
  return out;
}

async function lerFila(d) {
  const docs = await d.collection('linkedin_fila').find({}, { projection: { status: 1 } }).toArray();
  const c = {};
  for (const x of docs) c[x.status] = (c[x.status] || 0) + 1;
  return c;
}

// Lado real: lê site, PRs e fila e devolve a linha (ou null fora do dia alvo).
async function prontoParaSexta(d, hoje) {
  if (hoje !== DATA_ALVO) return null;
  const siteCodigo = await lerSite();
  const prs = lerPrs();
  let statusFila = null;
  try { statusFila = await lerFila(d); } catch { statusFila = null; }
  return avaliarProntoParaSexta({ hoje, siteCodigo, prs, statusFila });
}

module.exports = { avaliarProntoParaSexta, prontoParaSexta, DATA_ALVO, PRS_ESPERADOS, STATUS_CONHECIDOS };
