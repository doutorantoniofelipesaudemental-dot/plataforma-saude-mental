const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { alertaValidade, lerVenceEm } = require('../../scripts/youtube/validadeAutorizacao');
const { montarResumo } = require('../../scripts/conferencias/resumoDoDia');
const { contarPendentes } = require('../../scripts/ollamaStatus');

const VENCE = '2026-10-23';

test('faltando mais de 3 dias: sem alerta', () => {
  assert.equal(alertaValidade({ hoje: '2026-10-19', venceEm: VENCE }), null);
});

test('faltando 3 dias: alerta de reautorização na primeira linha', () => {
  const a = alertaValidade({ hoje: '2026-10-20', venceEm: VENCE });
  assert.equal(a.texto, 'PRECISA DE VOCÊ: reautorizar o YouTube (vence em 3 dias)');
  const l = montarResumo({ hoje: '2026-10-20', alertas: [a] });
  assert.equal(l[0], a.texto);
});

test('no dia do vencimento: vence em 0 dias', () => {
  assert.equal(alertaValidade({ hoje: VENCE, venceEm: VENCE }).texto, 'PRECISA DE VOCÊ: reautorizar o YouTube (vence em 0 dias)');
});

test('depois de vencida: "YouTube: autorização vencida"', () => {
  const a = alertaValidade({ hoje: '2026-10-24', venceEm: VENCE });
  assert.equal(a.texto, 'YouTube: autorização vencida');
  assert.equal(montarResumo({ hoje: '2026-10-24', alertas: [a] })[0], 'YouTube: autorização vencida');
});

test('sem data: nenhum alerta', () => {
  assert.equal(alertaValidade({ hoje: '2026-10-24', venceEm: null }), null);
});

test('lerVenceEm: arquivo ausente ou inválido devolve null', () => {
  const tmp = path.join(os.tmpdir(), `validade-${process.pid}.json`);
  assert.equal(lerVenceEm(path.join(os.tmpdir(), 'nao-existe-xyz.json')), null);
  fs.writeFileSync(tmp, '{não é json', 'utf8');
  assert.equal(lerVenceEm(tmp), null);
  fs.writeFileSync(tmp, '{"autorizacaoVenceEm":"2026-10-23"}', 'utf8');
  assert.equal(lerVenceEm(tmp), VENCE);
  fs.unlinkSync(tmp);
});

test('contador de pendentes Ollama: conta só aguardando-ollama e aparece no resumo', () => {
  const tmp = path.join(os.tmpdir(), `regeracao-${process.pid}.json`);
  fs.writeFileSync(tmp, JSON.stringify({ itens: [{ estado: 'aguardando-ollama' }, { estado: 'regerado-T1-ok' }, { estado: 'aguardando-ollama' }] }), 'utf8');
  assert.equal(contarPendentes(tmp), 2);
  fs.unlinkSync(tmp);
  assert.equal(contarPendentes(tmp), 0);
  const l = montarResumo({ hoje: '2026-10-19', pendentesOllama: 2 });
  assert.equal(l[0], 'PRECISA DO DR. ANTÔNIO: NÃO');
  assert.equal(l[1], 'Aguardando Ollama: 2 item(ns), pendentes (não decididos)');
});
