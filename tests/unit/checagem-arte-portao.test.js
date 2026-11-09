/** Integração da checagem de arte com o portão das redes (08/11/2026): falhas viram grupo 'arte'. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { falhasDeArte } = require('../../backend/lib/redesV2/checagem');

const BOA = { n: 1, tituloPx: 92, corpoPx: 44, palavras: 14, corCorpo: '#1B1B1B', fundo: '#F7F1E3', transbordou: false, fonteOk: true, iconeOk: true, rodape: { crm: true, rqe: true, assinatura3: true } };

test('sem medidas, nada a reportar (compatibilidade com o portão atual)', () => {
  assert.deepEqual(falhasDeArte(undefined), []);
});

test('lâmina boa não gera falha de arte', () => {
  assert.deepEqual(falhasDeArte([BOA]), []);
});

test('modelo escuro antigo gera falha de arte no grupo "arte"', () => {
  const falhas = falhasDeArte([{ ...BOA, fundo: '#1B1B1B', corCorpo: '#FFFFFF' }]);
  assert.ok(falhas.length >= 1);
  assert.ok(falhas.every((f) => f.grupo === 'arte'));
  assert.ok(falhas.some((f) => /fundo escuro/.test(f.msg)));
});

test('título pequeno gera falha de arte', () => {
  assert.ok(falhasDeArte([{ ...BOA, tituloPx: 50 }]).some((f) => /título 50 px/.test(f.msg)));
});
