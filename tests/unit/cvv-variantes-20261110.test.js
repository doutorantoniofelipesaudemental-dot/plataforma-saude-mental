// Ordem de 09/11/2026, 23:35 (item 3): variantes equivalentes a "CVV 188" aceitas pelo checador de tema sensível.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checarEticaCfm } = require('../../backend/lib/checagensAprovacao');

const SENSIVEL = 'Pensamentos de morte e suicídio pedem cuidado imediato, sem julgamento e com apoio.';

test('"ligue 188 (CVV…)" conta como alerta do CVV 188', () => {
  const t = `${SENSIVEL} Em caso de risco imediato, ligue 188 (CVV, gratuito, 24h) ou 192 (SAMU).`;
  const falhas = checarEticaCfm(t, { sensivel: true, contexto: 'portal', exigirIdentificacao: false }).falhas;
  assert.ok(!falhas.some((f) => /CVV 188/.test(f)), falhas.join(' | '));
});

test('"188 (CVV)" conta como alerta do CVV 188', () => {
  const t = `${SENSIVEL} Procure apoio: 188 (CVV) ou 192 (SAMU).`;
  const falhas = checarEticaCfm(t, { sensivel: true, contexto: 'portal', exigirIdentificacao: false }).falhas;
  assert.ok(!falhas.some((f) => /CVV 188/.test(f)), falhas.join(' | '));
});

test('tema sensível sem nenhuma forma de CVV continua reprovado', () => {
  const t = `${SENSIVEL} Procure um profissional de confiança.`;
  const falhas = checarEticaCfm(t, { sensivel: true, contexto: 'portal', exigirIdentificacao: false }).falhas;
  assert.ok(falhas.some((f) => /CVV 188/.test(f)));
});

test('"188" sozinho, sem "(CVV" nem "CVV", não é aceito', () => {
  const t = `${SENSIVEL} Ligue 188 ou 192.`;
  const falhas = checarEticaCfm(t, { sensivel: true, contexto: 'portal', exigirIdentificacao: false }).falhas;
  assert.ok(falhas.some((f) => /CVV 188/.test(f)));
});
