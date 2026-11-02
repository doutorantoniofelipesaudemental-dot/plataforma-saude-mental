const test = require('node:test');
const assert = require('node:assert/strict');
const { avaliarProntoParaSexta, PRS_ESPERADOS } = require('../../scripts/conferencias/prontoParaSexta');

const prsOk = { 193: '6da3e51aaaa', 194: '106b895bbbb', 195: '3cd3364cccc', 196: 'cabf32fdddd' };
const filaOk = { 'agendado-linkedin': 23, 'aprovado-checagem': 14, manual: 6 };
const base = { hoje: '2026-10-30', siteCodigo: 200, prs: prsOk, statusFila: filaOk };

test('fora de sexta 30/10 não há linha', () => {
  assert.equal(avaliarProntoParaSexta({ ...base, hoje: '2026-10-29' }), null);
});

test('tudo certo: SIM', () => {
  const r = avaliarProntoParaSexta(base);
  assert.equal(r.pronto, true);
  assert.equal(r.linha, 'PRONTO PARA SEXTA 10:00: SIM');
});

test('site fora do ar: NÃO com o motivo', () => {
  const r = avaliarProntoParaSexta({ ...base, siteCodigo: 500 });
  assert.equal(r.pronto, false);
  assert.match(r.linha, /site responde 500/);
});

test('PR com commit diferente do registrado: NÃO e aponta o número', () => {
  const r = avaliarProntoParaSexta({ ...base, prs: { ...prsOk, 194: 'ffffff1234' } });
  assert.equal(r.pronto, false);
  assert.match(r.linha, /#194 mudou/);
});

test('PR não lido: NÃO', () => {
  const r = avaliarProntoParaSexta({ ...base, prs: { ...prsOk, 196: null } });
  assert.match(r.linha, /#196 não lido/);
});

test('status desconhecido na fila: NÃO', () => {
  const r = avaliarProntoParaSexta({ ...base, statusFila: { ...filaOk, quebrado: 1 } });
  assert.match(r.linha, /status desconhecido na fila: quebrado/);
});

test('fila não lida: NÃO', () => {
  const r = avaliarProntoParaSexta({ ...base, statusFila: null });
  assert.match(r.linha, /fila do LinkedIn não lida/);
});

test('são exatamente os PRs 193 a 196', () => {
  assert.deepEqual(Object.keys(PRS_ESPERADOS), ['193', '194', '195', '196']);
});

test('status reais de publicação não contam como desconhecidos', () => {
  const r = avaliarProntoParaSexta({ ...base, statusFila: { publicado: 3, parado: 1, concluido: 2, 'publicado-manual': 1 } });
  assert.equal(r.pronto, true);
});
