const test = require('node:test');
const assert = require('node:assert/strict');
const { paraData, planejarEnvio, conferirPar } = require('../../backend/lib/redesV2/envioSeguro');

const AGORA = new Date('2026-11-12T03:50:00Z'); // 00:50 de 12/11 em Brasília
const peca = (extra = {}) => ({
  slug: '2026-11-13-insonia-consulta-rotina',
  legenda: 'texto',
  erroImagem: null,
  meta: {
    status: 'aprovado-checagem',
    dataSugerida: '2026-11-13T08:00:00-03:00',
    checagem: { ok: true, hashes: ['a'] },
  },
  ...extra,
});

test('data só com dia vale 00:00 de Brasília', () => {
  assert.equal(paraData('2026-11-12').toISOString(), '2026-11-12T03:00:00.000Z');
  assert.equal(paraData('lixo'), null);
});

test('aceita peça aprovada, checada e com data futura', () => {
  const r = planejarEnvio({ pecas: [peca()], agora: AGORA });
  assert.equal(r.selecionadas.length, 1);
  assert.equal(r.recusadas.length, 0);
});

test('recusa data passada (12/11 idoso marcado só com dia)', () => {
  const p = peca({ slug: 'x', meta: { status: 'aprovado-checagem', dataSugerida: '2026-11-12', checagem: { ok: true, hashes: ['a'] } } });
  const r = planejarEnvio({ pecas: [p], agora: AGORA });
  assert.equal(r.selecionadas.length, 0);
  assert.match(r.recusadas[0].motivo, /data passada/);
});

test('recusa sem checagem.ok e status diferente de aprovado-checagem', () => {
  const sem = peca({ meta: { status: 'aprovado-checagem', dataSugerida: '2026-11-13T08:00:00-03:00', checagem: { ok: false, hashes: ['a'] } } });
  const pend = peca({ meta: { status: 'pendente-rechecagem', dataSugerida: '2026-11-13T08:00:00-03:00', checagem: { ok: true, hashes: ['a'] } } });
  const r = planejarEnvio({ pecas: [sem, pend], agora: AGORA });
  assert.equal(r.selecionadas.length, 0);
  assert.equal(r.recusadas.length, 2);
});

test('recusa imagem diferente da checada', () => {
  const r = planejarEnvio({ pecas: [peca({ erroImagem: 'imagem 2 diferente da checada' })], agora: AGORA });
  assert.equal(r.selecionadas.length, 0);
  assert.match(r.recusadas[0].motivo, /diferente/);
});

test('com --slugs, pedido não encontrado vira recusa', () => {
  const r = planejarEnvio({ pecas: [peca()], slugs: ['nao-existe'], agora: AGORA });
  assert.equal(r.selecionadas.length, 0);
  assert.equal(r.recusadas[0].motivo, 'pasta não encontrada');
});

test('com --slugs, só envia o pedido', () => {
  const outra = peca({ slug: 'outra' });
  const r = planejarEnvio({ pecas: [peca(), outra], slugs: ['outra'], agora: AGORA });
  assert.deepEqual(r.selecionadas.map((p) => p.slug), ['outra']);
});

test('conferirPar aponta legenda, data e hash divergentes', () => {
  const pasta = { status: 'aprovado-checagem', legenda: 'nova', dataSugerida: '2026-11-13T08:00:00-03:00', hashes: ['a', 'b'] };
  const banco = { status: 'aprovado-checagem', legenda: 'velha', dataSugerida: new Date('2026-11-13T12:00:00Z'), hashes: ['a', 'x'] };
  const d = conferirPar({ banco, pasta });
  assert.ok(d.some((x) => /legenda/.test(x)));
  assert.ok(d.some((x) => /data/.test(x)));
  assert.ok(d.some((x) => /imagem 2/.test(x)));
  assert.deepEqual(conferirPar({ banco: { ...banco, legenda: 'nova', dataSugerida: new Date('2026-11-13T11:00:00Z'), hashes: ['a', 'b'] }, pasta }), []);
  assert.deepEqual(conferirPar({ banco: null, pasta }), ['ausente no banco']);
});
