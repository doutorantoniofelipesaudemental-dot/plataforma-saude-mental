const test = require('node:test');
const assert = require('node:assert/strict');
const { avaliarTrava, abMudou } = require('../../scripts/blob-rotina-mensal');

const item = (n) => ({ pathname: `artigos/x/narracao-${n}.mp3`, url: `https://blob/${n}`, size: 1000 });
const inv = ({ blobs = 100, a = [], b = [], c = [], d = [] } = {}) => ({
  blobs,
  totalMB: 10,
  grupos: { a: { arquivos: a.length }, b: { arquivos: b.length }, c: { arquivos: c.length }, d: { arquivos: d.length } },
  apagaveis: { arquivos: c.length + d.length },
  listas: { a, b, c, d },
});

test('simulação nunca pode apagar', () => {
  const t = avaliarTrava(inv({ c: [item(1)] }), { aplicar: false });
  assert.equal(t.podeApagar, false);
  assert.ok(t.motivos.some((m) => m.includes('simulação')));
});

test('item em a ou b: NÃO apaga nada, mesmo com c pequeno (ordem do Dr. Antônio, 19/10/2026)', () => {
  const t = avaliarTrava(inv({ blobs: 100, a: [item(1), item(2)], b: [item(3)], c: [item(4)] }), { aplicar: true });
  assert.equal(t.podeApagar, false);
  assert.ok(t.motivos.some((m) => m.includes('a/b')));
});

test('caso limpo: a/b vazios e c pequeno pode apagar', () => {
  const t = avaliarTrava(inv({ blobs: 100, c: [item(4)] }), { aplicar: true });
  assert.equal(t.podeApagar, true);
  assert.equal(t.apagaveis, 1);
});

test('falha de leitura (inventário ausente): não apaga, sem lançar erro', () => {
  const t = avaliarTrava(undefined, { aplicar: true });
  assert.equal(t.podeApagar, false);
  assert.ok(t.motivos.some((m) => m.includes('falha segura')));
});

test('recusa quando c+d passam de 50% dos blobs', () => {
  const c = Array.from({ length: 6 }, (_, i) => item(i + 10));
  const t = avaliarTrava(inv({ blobs: 10, c }), { aplicar: true });
  assert.equal(t.podeApagar, false);
  assert.ok(t.motivos.some((m) => m.includes('50%')));
});

test('recusa acima de 20 arquivos (trava do blob:orfas)', () => {
  const c = Array.from({ length: 21 }, (_, i) => item(i + 100));
  const t = avaliarTrava(inv({ blobs: 1000, c }), { aplicar: true });
  assert.equal(t.podeApagar, false);
  assert.ok(t.motivos.some((m) => m.includes('> 20')));
});

test('alerta se um apagável também aparece em a ou b', () => {
  const dup = item(7);
  const t = avaliarTrava(inv({ blobs: 100, a: [dup], c: [dup] }), { aplicar: true });
  assert.equal(t.podeApagar, false);
  assert.ok(t.motivos.some((m) => m.includes('também aparecem em a/b')));
});

test('nada a apagar: não pode apagar', () => {
  const t = avaliarTrava(inv({ blobs: 100, a: [item(1)] }), { aplicar: true });
  assert.equal(t.podeApagar, false);
  assert.equal(t.apagaveis, 0);
});

test('abMudou detecta mudança em a ou b', () => {
  assert.equal(abMudou(inv({ a: [item(1)] }), inv({ a: [item(1)] })), false);
  assert.equal(abMudou(inv({ a: [item(1)] }), inv({ a: [] })), true);
});
